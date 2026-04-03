import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateEmbedding, cosineSimilarity } from "@/lib/rag";
import {
  generateMatchExplanation,
  generateLifeProfileSummary,
} from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for generating matches

interface ChunkWithEmbedding {
  id: string;
  book_id: string;
  content: string;
  page_number: number | null;
  embedding: number[] | string;
}

// Parse embedding from pgvector format (may be string or array)
function parseEmbedding(embedding: number[] | string): number[] {
  if (Array.isArray(embedding)) {
    return embedding;
  }
  if (typeof embedding === "string") {
    // pgvector returns as string like "[0.1,0.2,...]"
    try {
      return JSON.parse(embedding);
    } catch {
      // Try parsing without brackets format
      return embedding
        .replace(/[\[\]]/g, "")
        .split(",")
        .map(Number);
    }
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user's life profile
    const { data: lifeProfile, error: profileError } = await supabase
      .from("life_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (profileError || !lifeProfile) {
      return NextResponse.json(
        { error: "Please complete your life profile first" },
        { status: 400 },
      );
    }

    // Get user's processed books
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id, title, author")
      .eq("user_id", userId)
      .eq("processed", true);

    if (booksError || !books || books.length === 0) {
      return NextResponse.json(
        {
          error:
            "No processed books found. Please upload and process a book first.",
        },
        { status: 400 },
      );
    }

    const bookIds = books.map((b) => b.id);
    const bookMap = new Map(books.map((b) => [b.id, b]));

    // Generate or use existing life summary
    let lifeSummary = lifeProfile.life_summary;
    let lifeEmbedding = lifeProfile.life_embedding;

    if (!lifeSummary) {
      console.log("🔄 Generating life summary...");
      const answers = lifeProfile.answers as Record<string, string>;
      lifeSummary = await generateLifeProfileSummary(answers);

      // Save the summary
      await supabase
        .from("life_profiles")
        .update({ life_summary: lifeSummary })
        .eq("id", lifeProfile.id);
    }

    if (!lifeEmbedding) {
      console.log("🔄 Generating life embedding...");
      lifeEmbedding = await generateEmbedding(lifeSummary);

      // Save the embedding
      await supabase
        .from("life_profiles")
        .update({ life_embedding: lifeEmbedding })
        .eq("id", lifeProfile.id);
    }

    // Get all chunks from user's books
    console.log(`📚 Loading chunks from ${books.length} books...`);
    const { data: chunks, error: chunksError } = await supabase
      .from("book_chunks")
      .select("id, book_id, content, page_number, embedding")
      .in("book_id", bookIds)
      .eq("user_id", userId);

    if (chunksError || !chunks || chunks.length === 0) {
      return NextResponse.json(
        {
          error: "No content found in your books. Please try uploading again.",
        },
        { status: 400 },
      );
    }

    console.log(`📝 Calculating similarity for ${chunks.length} chunks...`);

    // Parse life embedding if needed
    const parsedLifeEmbedding = parseEmbedding(lifeEmbedding as number[] | string);
    
    // Calculate similarity scores
    const scoredChunks = (chunks as ChunkWithEmbedding[])
      .filter((chunk) => chunk.embedding)
      .map((chunk) => {
        const parsedChunkEmbedding = parseEmbedding(chunk.embedding);
        return {
          ...chunk,
          embedding: parsedChunkEmbedding,
          similarity: parsedChunkEmbedding.length === parsedLifeEmbedding.length
            ? cosineSimilarity(parsedLifeEmbedding, parsedChunkEmbedding)
            : 0,
        };
      })
      .filter((chunk) => chunk.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity);

    // Take top 10 most relevant chunks
    const topChunks = scoredChunks.slice(0, 10);
    console.log(`✨ Selected top ${topChunks.length} matches`);

    // Create a match session
    const { data: session, error: sessionError } = await supabase
      .from("match_sessions")
      .insert({
        user_id: userId,
        book_ids: bookIds,
      })
      .select()
      .single();

    if (sessionError || !session) {
      throw new Error("Failed to create match session");
    }

    // Generate explanations and create matches
    console.log("💭 Generating personalized explanations...");
    const matches = [];

    for (const chunk of topChunks) {
      const book = bookMap.get(chunk.book_id);

      // Generate personalized explanation
      const explanation = await generateMatchExplanation(
        chunk.content,
        lifeSummary,
        book?.title || "Unknown Book",
      );

      matches.push({
        session_id: session.id,
        user_id: userId,
        chunk_id: chunk.id,
        book_id: chunk.book_id,
        relevance_score: chunk.similarity,
        why_relevant: explanation.whyRelevant,
        action_step: explanation.actionStep,
      });
    }

    // Insert matches
    const { error: matchError } = await supabase
      .from("matches")
      .insert(matches);

    if (matchError) {
      throw new Error(`Failed to save matches: ${matchError.message}`);
    }

    console.log(
      `✅ Created ${matches.length} matches for session ${session.id}`,
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      matchCount: matches.length,
    });
  } catch (error) {
    console.error("Error generating matches:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate matches",
      },
      { status: 500 },
    );
  }
}
