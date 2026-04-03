"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface MatchCardProps {
  id: string;
  quote: string;
  bookTitle: string;
  bookAuthor?: string;
  pageNumber?: number;
  whyRelevant: string;
  actionStep: string;
  isSaved?: boolean;
  feedback?: "up" | "down" | null;
  onSave: (id: string) => Promise<void>;
  onFeedback: (id: string, feedback: "up" | "down" | null) => Promise<void>;
  isFirst?: boolean;
  index?: number;
}

export function MatchCard({
  id,
  quote,
  bookTitle,
  bookAuthor,
  pageNumber,
  whyRelevant,
  actionStep,
  isSaved = false,
  feedback = null,
  onSave,
  onFeedback,
  isFirst = false,
  index = 0,
}: MatchCardProps) {
  const [saving, setSaving] = React.useState(false);
  const [localSaved, setLocalSaved] = React.useState(isSaved);
  const [localFeedback, setLocalFeedback] = React.useState(feedback);
  const [showFirstSaveMessage, setShowFirstSaveMessage] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(id);
      const wasFirstSave = !localSaved && isFirst;
      setLocalSaved(!localSaved);

      // Confetti for first save!
      if (wasFirstSave) {
        setShowFirstSaveMessage(true);
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + 50) / window.innerHeight,
            },
            colors: ["#38bdf8", "#0ea5e9", "#3b82f6"],
          });
        }
        setTimeout(() => setShowFirstSaveMessage(false), 3000);
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
    setSaving(false);
  };

  const handleFeedback = async (newFeedback: "up" | "down") => {
    const finalFeedback = localFeedback === newFeedback ? null : newFeedback;
    setLocalFeedback(finalFeedback);
    try {
      await onFeedback(id, finalFeedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      setLocalFeedback(localFeedback); // Revert on error
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className="overflow-hidden card-hover border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-800/80">
        {/* Quote section */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-sky-50 via-blue-50/50 to-indigo-50/50 dark:from-sky-950/50 dark:via-slate-900/30 dark:to-indigo-950/50 border-b border-sky-100/50 dark:border-sky-900/30">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{bookTitle}</span>
              {bookAuthor && <span> by {bookAuthor}</span>}
              {pageNumber && <span className="ml-2 opacity-70">• Page {pageNumber}</span>}
            </div>
          </div>

          <blockquote className="quote-text text-foreground pl-4 border-l-4 border-sky-400 dark:border-sky-500 bg-white/50 dark:bg-slate-800/30 py-3 px-4 rounded-r-xl">
            "{quote}"
          </blockquote>
        </div>

        {/* Why relevant section */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-tight">Why this speaks to you</span>
            </div>
            <p className="text-foreground leading-relaxed">{whyRelevant}</p>
          </div>

          {/* Action step */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50/50 to-indigo-50/50 dark:from-sky-950/40 dark:via-slate-800/30 dark:to-indigo-950/40 border border-sky-100/80 dark:border-sky-800/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
                <ChevronRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300 mb-1 tracking-tight">
                  Try this today
                </p>
                <p className="text-foreground leading-relaxed">{actionStep}</p>
              </div>
            </div>
          </div>

          {/* First save message */}
          {showFirstSaveMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center p-4 rounded-xl bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50"
            >
              🌟 Your first saved wisdom! This is the beginning of your wisdom journal.
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-700/50">
            {/* Feedback buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("up")}
                className={cn(
                  "gap-2 transition-all rounded-xl",
                  localFeedback === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 shadow-sm"
                )}
                aria-label="Helpful"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("down")}
                className={cn(
                  "gap-2 transition-all rounded-xl",
                  localFeedback === "down" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 shadow-sm"
                )}
                aria-label="Not helpful"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Save button */}
            <Button
              variant={localSaved ? "soft" : "outline"}
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "gap-2 transition-all rounded-xl",
                localSaved && "text-sky-700 dark:text-sky-300 shadow-sm"
              )}
            >
              {localSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
