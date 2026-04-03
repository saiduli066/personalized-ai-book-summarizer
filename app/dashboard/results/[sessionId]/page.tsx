"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { createClient, getMatchesForSession, getMatchSession } from "@/lib/supabase";
import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface MatchData {
  id: string;
  chunk_id: string;
  book_id: string;
  relevance_score: number | null;
  why_relevant: string | null;
  action_step: string | null;
  is_saved: boolean;
  feedback: string | null;
  book_chunks: {
    content: string;
    page_number: number | null;
  } | null;
  books: {
    title: string;
    author: string | null;
  } | null;
}

export default function ResultsPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [matches, setMatches] = React.useState<MatchData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savedCount, setSavedCount] = React.useState(0);

  React.useEffect(() => {
    async function loadResults() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Verify session belongs to user
      const session = await getMatchSession(params.sessionId, user.id);
      if (!session) {
        toast({
          variant: "destructive",
          title: "Session not found",
          description: "This results page doesn't exist or you don't have access.",
        });
        router.push("/dashboard");
        return;
      }

      // Load matches
      const matchesData = await getMatchesForSession(params.sessionId, user.id);
      setMatches(matchesData as MatchData[]);
      setSavedCount(matchesData.filter((m) => m.is_saved).length);

      setLoading(false);
    }

    loadResults();
  }, [params.sessionId, router, toast]);

  const handleSave = async (matchId: string) => {
    if (!userId) return;

    const supabase = createClient();
    const match = matches.find((m) => m.id === matchId);

    if (match?.is_saved) {
      // Unsave
      const { error } = await supabase
        .from("matches")
        .update({ is_saved: false })
        .eq("id", matchId)
        .eq("user_id", userId);

      if (error) throw error;

      // Delete from saved_excerpts
      await supabase
        .from("saved_excerpts")
        .delete()
        .eq("match_id", matchId)
        .eq("user_id", userId);

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, is_saved: false } : m))
      );
      setSavedCount((c) => c - 1);
    } else {
      // Save
      const { error } = await supabase
        .from("matches")
        .update({ is_saved: true })
        .eq("id", matchId)
        .eq("user_id", userId);

      if (error) throw error;

      // Add to saved_excerpts
      await supabase.from("saved_excerpts").insert({
        user_id: userId,
        match_id: matchId,
      });

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, is_saved: true } : m))
      );
      setSavedCount((c) => c + 1);
    }
  };

  const handleFeedback = async (matchId: string, feedback: "up" | "down" | null) => {
    if (!userId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("matches")
      .update({ feedback })
      .eq("id", matchId)
      .eq("user_id", userId);

    if (error) throw error;

    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, feedback } : m))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Loader2 className="w-8 h-8 text-sky-600 dark:text-sky-400 animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your personalized wisdom...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-18 h-18 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 dark:from-sky-900/40 dark:via-sky-800/30 dark:to-blue-900/40 flex items-center justify-center shadow-xl shadow-sky-500/15 border border-sky-200/50 dark:border-sky-700/30">
          <Sparkles className="w-9 h-9 text-sky-600 dark:text-sky-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">No matches found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We couldn't find excerpts that match your life profile. Try uploading
          different books or updating your profile.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard/questions">
            <Button variant="outline">Update profile</Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button variant="glow">Upload more books</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Your Personalized Wisdom</span>
            </h1>
            <p className="text-muted-foreground">
              {matches.length} excerpt{matches.length !== 1 ? "s" : ""} matched to your life
              {savedCount > 0 && ` • ${savedCount} saved`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Helpful tip for first-time users */}
      {savedCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50/80 via-white to-blue-50/80 dark:from-sky-950/40 dark:via-slate-900/60 dark:to-blue-950/40 border border-sky-200/60 dark:border-sky-700/40 shadow-lg shadow-sky-500/5"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-sky-800 dark:text-sky-200">
                Tip: Save your favorites!
              </p>
              <p className="text-sm text-sky-700 dark:text-sky-300 mt-1 leading-relaxed">
                Click the <strong>"Save"</strong> button on any card to add it to your Wisdom Journal. 
                You can revisit saved excerpts anytime from "My Wisdom" in the menu.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Matches */}
      <div className="space-y-6">
        {matches.map((match, index) => (
          <MatchCard
            key={match.id}
            id={match.id}
            quote={match.book_chunks?.content || ""}
            bookTitle={match.books?.title || "Unknown Book"}
            bookAuthor={match.books?.author || undefined}
            pageNumber={match.book_chunks?.page_number || undefined}
            whyRelevant={match.why_relevant || "This excerpt resonates with your life journey."}
            actionStep={match.action_step || "Take a moment to reflect on this wisdom."}
            isSaved={match.is_saved}
            feedback={match.feedback as "up" | "down" | null}
            onSave={handleSave}
            onFeedback={handleFeedback}
            isFirst={savedCount === 0}
            index={index}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-muted-foreground mb-4">
          {savedCount > 0
            ? `You've saved ${savedCount} excerpt${savedCount !== 1 ? "s" : ""} to your Wisdom Journal.`
            : "Save your favorite excerpts to build your Wisdom Journal."}
        </p>
        {savedCount > 0 && (
          <Link href="/dashboard/wisdom">
            <Button variant="glow">View My Wisdom Journal</Button>
          </Link>
        )}
      </motion.div>
    </div>
  );
}
