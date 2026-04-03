import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { chunkText, generateEmbeddings, filterQualityChunks } from "@/lib/rag";
import pdf from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for PDF processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bookId = formData.get("bookId") as string;
    const userId = formData.get("userId") as string;

    if (!file || !bookId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: file, bookId, userId" },
        { status: 400 },
      );
    }

    // Verify file is PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Update book status to processing
    await supabase
      .from("books")
      .update({ processing_status: "processing" })
      .eq("id", bookId)
      .eq("user_id", userId);

    // Read PDF content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;
    try {
      pdfData = await pdf(buffer);
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      await supabase
        .from("books")
        .update({ processing_status: "failed" })
        .eq("id", bookId);

      return NextResponse.json(
        {
          error:
            "Failed to parse PDF. Make sure it's a valid, non-encrypted PDF.",
        },
        { status: 400 },
      );
    }

    const text = pdfData.text;
    const pageCount = pdfData.numpages;

    // Update book with page count
    await supabase
      .from("books")
      .update({ page_count: pageCount })
      .eq("id", bookId);

    // Chunk the text
    console.log(`📄 Processing ${pageCount} pages of text...`);
    let chunks = chunkText(text, {
      minChunkSize: 100,
      maxChunkSize: 400,
      overlap: 30,
    });

    // Filter out low-quality chunks
    chunks = filterQualityChunks(chunks);
    console.log(`📝 Created ${chunks.length} quality chunks`);

    if (chunks.length === 0) {
      await supabase
        .from("books")
        .update({ processing_status: "failed" })
        .eq("id", bookId);

      return NextResponse.json(
        { error: "Could not extract meaningful text from this PDF." },
        { status: 400 },
      );
    }

    // Limit chunks for performance (max 200 per book)
    const maxChunks = 200;
    if (chunks.length > maxChunks) {
      // Sample evenly throughout the book
      const step = Math.floor(chunks.length / maxChunks);
      chunks = chunks.filter((_, i) => i % step === 0).slice(0, maxChunks);
      console.log(`📊 Sampled down to ${chunks.length} chunks`);
    }

    // Generate embeddings for all chunks
    console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);
    const texts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(texts);
    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Prepare chunk records for database
    const chunkRecords = chunks.map((chunk, i) => ({
      book_id: bookId,
      user_id: userId,
      content: chunk.content,
      chunk_index: chunk.index,
      // Estimate page number based on position
      page_number: Math.ceil((chunk.index / chunks.length) * pageCount),
      embedding: embeddings[i],
    }));

    // Insert chunks in batches (Supabase has limits)
    const batchSize = 50;
    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize);
      const { error } = await supabase.from("book_chunks").insert(batch);

      if (error) {
        console.error("Error inserting chunks:", error);
        throw new Error(`Failed to save chunks: ${error.message}`);
      }
    }

    // Mark book as processed
    await supabase
      .from("books")
      .update({
        processed: true,
        processing_status: "completed",
      })
      .eq("id", bookId);

    console.log(`✅ Book ${bookId} processed successfully!`);

    return NextResponse.json({
      success: true,
      bookId,
      chunksCreated: chunkRecords.length,
      pageCount,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);

    // Try to update book status to failed
    try {
      const formData = await request.formData();
      const bookId = formData.get("bookId") as string;
      if (bookId) {
        const supabase = createServerClient();
        await supabase
          .from("books")
          .update({ processing_status: "failed" })
          .eq("id", bookId);
      }
    } catch {}

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process PDF",
      },
      { status: 500 },
    );
  }
}
