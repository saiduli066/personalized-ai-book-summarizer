"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { lifeProfileQuestions, calculateProfileCompletion } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
  initialAnswers?: Record<string, string>;
  onSave: (answers: Record<string, string>, completed: boolean) => Promise<void>;
  onComplete: () => void;
}

export function QuestionForm({
  initialAnswers = {},
  onSave,
  onComplete,
}: QuestionFormProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>(initialAnswers);
  const [isSaving, setIsSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const currentQuestion = lifeProfileQuestions[currentIndex];
  const totalQuestions = lifeProfileQuestions.length;
  const progress = calculateProfileCompletion(answers);
  const currentAnswer = answers[currentQuestion.id] || "";

  // Focus textarea on question change
  React.useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  }, [currentIndex]);

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = async () => {
    // Auto-save on navigation
    setIsSaving(true);
    try {
      await onSave(answers, false);
    } catch (error) {
      console.error("Error saving:", error);
    }
    setIsSaving(false);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await onSave(answers, true);
      onComplete();
    } catch (error) {
      console.error("Error completing:", error);
    }
    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      if (currentIndex < totalQuestions - 1) {
        handleNext();
      } else {
        handleComplete();
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "current":
        return "Understanding Your Present";
      case "goals":
        return "Exploring Your Aspirations";
      case "values":
        return "Discovering What Matters";
      case "recent":
        return "Reflecting on Recent Experiences";
      default:
        return "";
    }
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canProceed = currentAnswer.trim().length >= 10;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
            {progress}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {/* Category label */}
      <motion.div
        key={currentQuestion.category}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 text-sky-700 dark:text-sky-300 text-sm font-semibold border border-sky-200/50 dark:border-sky-700/30 shadow-sm shadow-sky-500/5">
          <Sparkles className="w-3.5 h-3.5" />
          {getCategoryLabel(currentQuestion.category)}
        </span>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl md:text-3xl font-semibold leading-relaxed text-balance bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            {currentQuestion.question}
          </h2>

          <Textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentQuestion.placeholder}
            className="min-h-[180px] text-lg leading-relaxed resize-none border-slate-200/60 dark:border-slate-700/50 focus-visible:ring-4 focus-visible:ring-sky-500/15 focus-visible:border-sky-400"
            aria-label={currentQuestion.question}
          />

          <p className="text-sm text-muted-foreground">
            Press <kbd className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs border border-slate-200/60 dark:border-slate-700/50">⌘ Enter</kbd> to continue
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/50">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {/* Question dots */}
          <div className="hidden sm:flex items-center gap-1.5 mr-4">
            {lifeProfileQuestions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  idx === currentIndex
                    ? "bg-gradient-to-r from-sky-400 to-blue-600 w-5 shadow-sm shadow-sky-500/30"
                    : answers[lifeProfileQuestions[idx].id]
                      ? "bg-sky-300 dark:bg-sky-600"
                      : "bg-slate-200 dark:bg-slate-700"
                )}
                aria-label={`Go to question ${idx + 1}`}
              />
            ))}
          </div>

          {isLastQuestion ? (
            <Button
              variant="glow"
              onClick={handleComplete}
              disabled={!canProceed || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  Complete
                  <Check className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleNext}
              disabled={!canProceed || isSaving}
              className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/20"
            >
              {isSaving ? "Saving..." : "Next"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
