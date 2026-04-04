import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for PDF processing

const SHOULD_USE_LOCAL_EMBEDDINGS =
  process.env.USE_LOCAL_EMBEDDINGS === "true" || !process.env.VERCEL;

function chunkText(
  text: string,
  options: {
    minChunkSize?: number;
    maxChunkSize?: number;
    overlap?: number;
  } = {},
): { content: string; index: number }[] {
  const { minChunkSize = 150, maxChunkSize = 500, overlap = 50 } = options;

  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();

  const paragraphs = cleanedText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const chunks: { content: string; index: number }[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    const wordCount = words.length;

    if (wordCount > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
        currentChunk = "";
      }

      for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
        const chunkWords = words.slice(i, i + maxChunkSize);
        chunks.push({ content: chunkWords.join(" "), index: chunkIndex++ });
      }
      continue;
    }

    const currentWords = currentChunk.split(/\s+/).filter(Boolean).length;

    if (
      currentWords + wordCount > maxChunkSize &&
      currentWords >= minChunkSize
    ) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (
    currentChunk.trim() &&
    currentChunk.split(/\s+/).length >= minChunkSize / 2
  ) {
    chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
  }

  return chunks;
}

function filterQualityChunks(
  chunks: { content: string; index: number }[],
): { content: string; index: number }[] {
  return chunks.filter((chunk) => {
    const content = chunk.content;
    const alphaRatio =
      (content.match(/[a-zA-Z]/g) || []).length / content.length;
    if (alphaRatio < 0.5) return false;

    const numberRatio = (content.match(/\d/g) || []).length / content.length;
    if (numberRatio > 0.3) return false;

    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const uniqueRatio = uniqueWords.size / words.length;
    if (uniqueRatio < 0.3) return false;

    return true;
  });
}

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

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
      const { default: pdf } = await import("pdf-parse");
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

    let embeddings: number[][] = [];
    if (SHOULD_USE_LOCAL_EMBEDDINGS) {
      // Generate embeddings for all chunks
      console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);
      const texts = chunks.map((c) => c.content);
      const { generateEmbeddings } = await import("@/lib/rag");
      embeddings = await generateEmbeddings(texts);
      console.log(`✅ Generated ${embeddings.length} embeddings`);
    } else {
      console.log(
        "⚡ Skipping local embeddings in Vercel; lexical fallback will be used for matching.",
      );
    }

    // Prepare chunk records for database
    const chunkRecords = chunks.map((chunk, i) => ({
      book_id: bookId,
      user_id: userId,
      content: chunk.content,
      chunk_index: chunk.index,
      // Estimate page number based on position
      page_number: Math.ceil((chunk.index / chunks.length) * pageCount),
      embedding: SHOULD_USE_LOCAL_EMBEDDINGS ? embeddings[i] : null,
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
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        await supabase
          .from("books")
          .update({ processing_status: "failed" })
          .eq("id", bookId);
      }
    } catch {
      // Ignore errors in cleanup
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process PDF",
      },
      { status: 500 },
    );
  }
}
