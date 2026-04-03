import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// ============================================================================
// Client-Side Supabase Client (for use in React components)
// ============================================================================

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ============================================================================
// Server-Side Supabase Client (for use in API routes and Server Components)
// Uses the service role key for admin operations
// ============================================================================

export function createServerClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

// ============================================================================
// Type-Safe Database Helpers
// ============================================================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LifeProfile = Database["public"]["Tables"]["life_profiles"]["Row"];
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type BookChunk = Database["public"]["Tables"]["book_chunks"]["Row"];
export type MatchSession =
  Database["public"]["Tables"]["match_sessions"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type SavedExcerpt =
  Database["public"]["Tables"]["saved_excerpts"]["Row"];

// ============================================================================
// Auth Helpers
// ============================================================================

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// ============================================================================
// Profile Helpers
// ============================================================================

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function getLifeProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("life_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching life profile:", error);
    return null;
  }

  return data;
}

export async function saveLifeProfile(
  userId: string,
  answers: Record<string, string>,
  completed: boolean = false,
) {
  const supabase = createClient();

  // Check if profile exists
  const existing = await getLifeProfile(userId);

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("life_profiles")
      .update({ answers, completed, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("life_profiles")
      .insert({ user_id: userId, answers, completed })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ============================================================================
// Book Helpers
// ============================================================================

export async function getUserBooks(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching books:", error);
    return [];
  }

  return data;
}

export async function getProcessedBooks(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", userId)
    .eq("processed", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching processed books:", error);
    return [];
  }

  return data;
}

// ============================================================================
// Match Helpers
// ============================================================================

export async function getMatchSession(sessionId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("match_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching match session:", error);
    return null;
  }

  return data;
}

export async function getMatchesForSession(sessionId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      book_chunks (
        content,
        page_number
      ),
      books (
        title,
        author
      )
    `,
    )
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("relevance_score", { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  return data;
}

// ============================================================================
// Saved Excerpts Helpers
// ============================================================================

export async function getSavedExcerpts(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_excerpts")
    .select(
      `
      *,
      matches (
        *,
        book_chunks (
          content,
          page_number
        ),
        books (
          title,
          author
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved excerpts:", error);
    return [];
  }

  return data;
}

export async function saveExcerpt(
  userId: string,
  matchId: string,
  notes?: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_excerpts")
    .insert({ user_id: userId, match_id: matchId, notes })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unsaveExcerpt(excerptId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("saved_excerpts")
    .delete()
    .eq("id", excerptId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ============================================================================
// Feedback Helpers
// ============================================================================

export async function updateMatchFeedback(
  matchId: string,
  userId: string,
  feedback: "up" | "down" | null,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("matches")
    .update({ feedback })
    .eq("id", matchId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
