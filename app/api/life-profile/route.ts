import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/rag";
import { generateLifeProfileSummary } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const { userId, answers, completed } = await request.json();

    if (!userId || !answers) {
      return NextResponse.json(
        { error: "Missing userId or answers" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Check if profile exists
    const { data: existing } = await supabase
      .from("life_profiles")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let profileData: {
      answers: Record<string, string>;
      completed: boolean;
      life_summary?: string;
      life_embedding?: number[];
      updated_at: string;
    } = {
      answers,
      completed: completed || false,
      updated_at: new Date().toISOString(),
    };

    // If completing the profile, generate summary and embedding
    if (completed) {
      console.log("🔄 Generating life summary for completed profile...");
      const summary = await generateLifeProfileSummary(answers);
      const embedding = await generateEmbedding(summary);

      profileData = {
        ...profileData,
        life_summary: summary,
        life_embedding: embedding,
      };
    }

    let result;

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from("life_profiles")
        .update(profileData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("life_profiles")
        .insert({
          user_id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      profile: result,
    });
  } catch (error) {
    console.error("Error saving life profile:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save profile",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("life_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      profile: data || null,
    });
  } catch (error) {
    console.error("Error fetching life profile:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch profile",
      },
      { status: 500 },
    );
  }
}
