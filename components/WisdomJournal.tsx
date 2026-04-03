"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatRelativeDate } from "@/lib/utils";

interface SavedExcerpt {
  id: string;
  matchId: string;
  quote: string;
  bookTitle: string;
  bookAuthor?: string;
  pageNumber?: number;
  whyRelevant: string;
  actionStep: string;
  savedAt: string;
  notes?: string;
}

interface WisdomJournalProps {
  excerpts: SavedExcerpt[];
  onRemove: (id: string) => Promise<void>;
}

export function WisdomJournal({ excerpts, onRemove }: WisdomJournalProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [removing, setRemoving] = React.useState<string | null>(null);

  const filteredExcerpts = React.useMemo(() => {
    if (!searchQuery.trim()) return excerpts;

    const query = searchQuery.toLowerCase();
    return excerpts.filter(
      (excerpt) =>
        excerpt.quote.toLowerCase().includes(query) ||
        excerpt.bookTitle.toLowerCase().includes(query) ||
        excerpt.whyRelevant.toLowerCase().includes(query) ||
        excerpt.actionStep.toLowerCase().includes(query)
    );
  }, [excerpts, searchQuery]);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await onRemove(id);
    } catch (error) {
      console.error("Error removing excerpt:", error);
    }
    setRemoving(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (excerpts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 dark:from-sky-900/40 dark:via-sky-800/30 dark:to-blue-900/40 flex items-center justify-center shadow-xl shadow-sky-500/15 border border-sky-200/50 dark:border-sky-700/30">
          <BookOpen className="w-10 h-10 text-sky-600 dark:text-sky-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Your Wisdom Journal is Empty</h3>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          When you find excerpts that resonate with you, save them here to build
          your personal collection of wisdom.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center shadow-md shadow-sky-500/10">
              <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">My Wisdom Journal</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            {excerpts.length} saved excerpt{excerpts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your wisdom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Excerpts list */}
      <AnimatePresence mode="popLayout">
        {filteredExcerpts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            No excerpts match your search.
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredExcerpts.map((excerpt, index) => (
              <motion.div
                key={excerpt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-slate-200/60 dark:border-slate-700/40 shadow-lg shadow-slate-500/5 hover:shadow-xl hover:shadow-sky-500/5 transition-all">
                  {/* Collapsed view */}
                  <button
                    onClick={() => toggleExpand(excerpt.id)}
                    className="w-full p-4 md:p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Book icon */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10">
                        <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold truncate text-slate-800 dark:text-slate-100">
                            {excerpt.bookTitle}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            {formatRelativeDate(excerpt.savedAt)}
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-sm font-serif italic">
                          "{excerpt.quote}"
                        </p>
                      </div>

                      {/* Expand indicator */}
                      <div className="shrink-0">
                        {expandedId === excerpt.id ? (
                          <ChevronUp className="w-5 h-5 text-sky-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded view */}
                  <AnimatePresence>
                    {expandedId === excerpt.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 space-y-4">
                          {/* Full quote */}
                          <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50/80 via-white to-blue-50/80 dark:from-sky-950/40 dark:via-slate-900/60 dark:to-blue-950/40 border-l-4 border-sky-400">
                            <p className="font-serif text-lg italic leading-relaxed text-slate-700 dark:text-slate-200">
                              "{excerpt.quote}"
                            </p>
                            {excerpt.pageNumber && (
                              <p className="text-sm text-muted-foreground mt-2">
                                — Page {excerpt.pageNumber}
                              </p>
                            )}
                          </div>

                          {/* Why relevant */}
                          <div>
                            <p className="text-sm font-semibold text-sky-600 dark:text-sky-400 mb-1.5">
                              Why this speaks to you
                            </p>
                            <p className="text-foreground leading-relaxed">{excerpt.whyRelevant}</p>
                          </div>

                          {/* Action step */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80 dark:from-emerald-950/30 dark:via-slate-900/40 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-700/30">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                              ✨ Action step
                            </p>
                            <p className="text-foreground text-sm leading-relaxed">{excerpt.actionStep}</p>
                          </div>

                          {/* Remove button */}
                          <div className="flex justify-end pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(excerpt.id)}
                              disabled={removing === excerpt.id}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {removing === excerpt.id ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
