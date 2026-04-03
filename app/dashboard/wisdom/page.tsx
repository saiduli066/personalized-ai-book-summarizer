"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, BookOpen, Bookmark, Clock, ArrowRight } from "lucide-react";
import { createClient, getSavedExcerpts } from "@/lib/supabase";
import { WisdomJournal } from "@/components/WisdomJournal";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SavedExcerptData {
  id: string;
  match_id: string;
  notes: string | null;
  created_at: string;
  matches: {
    id: string;
    why_relevant: string | null;
    action_step: string | null;
    book_chunks: {
      content: string;
      page_number: number | null;
    } | null;
    books: {
      title: string;
      author: string | null;
    } | null;
  } | null;
}

interface MatchSession {
  id: string;
  created_at: string;
  matchCount: number;
}

export default function WisdomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [excerpts, setExcerpts] = React.useState<SavedExcerptData[]>([]);
  const [recentSessions, setRecentSessions] = React.useState<MatchSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"saved" | "history">("saved");

  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Load saved excerpts
      const savedExcerpts = await getSavedExcerpts(user.id);
      setExcerpts(savedExcerpts as SavedExcerptData[]);

      // Load recent match sessions
      const { data: sessions } = await supabase
        .from("match_sessions")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (sessions) {
        // Get match counts for each session
        const sessionsWithCounts = await Promise.all(
          sessions.map(async (session) => {
            const { count } = await supabase
              .from("matches")
              .select("*", { count: "exact", head: true })
              .eq("session_id", session.id);
            return {
              ...session,
              matchCount: count || 0,
            };
          })
        );
        setRecentSessions(sessionsWithCounts);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleRemove = async (excerptId: string) => {
    if (!userId) return;

    const supabase = createClient();

    // Get the match ID first
    const excerpt = excerpts.find((e) => e.id === excerptId);
    if (!excerpt) return;

    // Delete from saved_excerpts
    const { error } = await supabase
      .from("saved_excerpts")
      .delete()
      .eq("id", excerptId)
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove",
        description: "Please try again.",
      });
      throw error;
    }

    // Update match is_saved status
    await supabase
      .from("matches")
      .update({ is_saved: false })
      .eq("id", excerpt.match_id)
      .eq("user_id", userId);

    // Update local state
    setExcerpts((prev) => prev.filter((e) => e.id !== excerptId));

    toast({
      title: "Removed from journal",
      description: "The excerpt has been removed.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Loader2 className="w-8 h-8 text-sky-600 dark:text-sky-400 animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your wisdom...</p>
        </div>
      </div>
    );
  }

  // Transform data for WisdomJournal component
  const transformedExcerpts = excerpts.map((e) => ({
    id: e.id,
    matchId: e.match_id,
    quote: e.matches?.book_chunks?.content || "",
    bookTitle: e.matches?.books?.title || "Unknown Book",
    bookAuthor: e.matches?.books?.author || undefined,
    pageNumber: e.matches?.book_chunks?.page_number || undefined,
    whyRelevant: e.matches?.why_relevant || "",
    actionStep: e.matches?.action_step || "",
    savedAt: e.created_at,
    notes: e.notes || undefined,
  }));

  // Empty state when no sessions at all
  const hasNoActivity = recentSessions.length === 0 && excerpts.length === 0;

  if (hasNoActivity) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 dark:from-sky-900/40 dark:via-sky-800/30 dark:to-blue-900/40 flex items-center justify-center shadow-xl shadow-sky-500/15 border border-sky-200/50 dark:border-sky-700/30">
            <Sparkles className="w-10 h-10 text-sky-600 dark:text-sky-400" />
          </div>
          <h2 className="text-2xl font-serif font-semibold mb-3 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            Your wisdom journey begins here
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Upload a book and discover the passages that speak directly to your life. 
            Your personalized insights will appear here.
          </p>
          <Link href="/dashboard/upload">
            <Button size="lg" variant="glow">
              <BookOpen className="w-5 h-5 mr-2" />
              Upload Your First Book
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-serif font-semibold mb-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
          My Wisdom
        </h1>
        <p className="text-muted-foreground">
          Your personal collection of insights and past discoveries
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700/50">
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "saved"
              ? "text-sky-600 dark:text-sky-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Saved ({excerpts.length})
          </div>
          {activeTab === "saved" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "history"
              ? "text-sky-600 dark:text-sky-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            History ({recentSessions.length})
          </div>
          {activeTab === "history" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full"
            />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === "saved" ? (
        excerpts.length > 0 ? (
          <WisdomJournal excerpts={transformedExcerpts} onRemove={handleRemove} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gradient-to-br from-slate-50/80 via-white to-sky-50/50 dark:from-slate-900/60 dark:via-slate-800/40 dark:to-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-lg shadow-slate-500/5"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center">
              <Bookmark className="w-7 h-7 text-sky-500 dark:text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No saved excerpts yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              When you find wisdom that resonates, tap the bookmark icon to save it here for easy access.
            </p>
            {recentSessions.length > 0 && (
              <Link href={`/dashboard/results/${recentSessions[0].id}`}>
                <Button variant="outline">
                  View Your Latest Results
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </motion.div>
        )
      ) : (
        <div className="space-y-3">
          {recentSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/results/${session.id}`}>
                <div className="p-4 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 hover:border-sky-300 dark:hover:border-sky-600/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center shadow-md shadow-sky-500/10">
                        <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {session.matchCount} Personalized Matches
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <Link href="/dashboard/upload">
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Discover More Wisdom
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
