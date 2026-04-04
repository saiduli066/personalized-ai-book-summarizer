import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Client-Side Supabase Client (for use in React components)
// Using untyped client to avoid strict type inference issues
// ============================================================================

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ============================================================================
// Server-Side Supabase Client (for use in API routes and Server Components)
// Uses the service role key for admin operations
// ============================================================================

export function createServerClient() {
  return createSupabaseClient(
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
// Type Definitions (for reference, not enforced on client)
// ============================================================================

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface LifeProfile {
  id: string;
  user_id: string;
  answers: Record<string, string>;
  life_summary: string | null;
  life_embedding: number[] | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  file_path: string;
  file_size: number | null;
  page_count: number | null;
  processed: boolean;
  processing_status: string;
  created_at: string;
}

export interface BookChunk {
  id: string;
  book_id: string;
  user_id: string;
  content: string;
  page_number: number | null;
  chunk_index: number | null;
  embedding: number[] | null;
  created_at: string;
}

export interface MatchSession {
  id: string;
  user_id: string;
  book_ids: string[];
  created_at: string;
}

export interface Match {
  id: string;
  session_id: string;
  user_id: string;
  chunk_id: string;
  book_id: string;
  relevance_score: number | null;
  why_relevant: string | null;
  action_step: string | null;
  is_saved: boolean;
  feedback: string | null;
  created_at: string;
}

export interface SavedExcerpt {
  id: string;
  user_id: string;
  match_id: string;
  notes: string | null;
  created_at: string;
}

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
