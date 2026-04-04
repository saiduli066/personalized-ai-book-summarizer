import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { matchId, userId, feedback } = await request.json();

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: "Missing matchId or userId" },
        { status: 400 },
      );
    }

    // Validate feedback value
    if (feedback !== null && feedback !== "up" && feedback !== "down") {
      return NextResponse.json(
        { error: "Feedback must be 'up', 'down', or null" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Update the match feedback
    const { data, error } = await supabase
      .from("matches")
      .update({ feedback })
      .eq("id", matchId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update feedback: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      match: data,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update feedback",
      },
      { status: 500 },
    );
  }
}
