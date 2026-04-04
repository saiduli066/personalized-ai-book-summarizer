"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { createClient, getLifeProfile, getProcessedBooks } from "@/lib/supabase";
import { PdfUploader } from "@/components/PdfUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { getLoadingMessage } from "@/lib/utils";

type ProcessingStatus = "idle" | "uploading" | "processing" | "generating" | "complete";

const MAX_SERVERLESS_PDF_SIZE_BYTES = 4 * 1024 * 1024; // ~4MB safe limit for serverless body size

async function getErrorMessageFromResponse(response: Response, fallbackMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await response.json();
      return body?.error || body?.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  try {
    const text = await response.text();
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      return "PDF processing failed on the server. This is usually a production function timeout or runtime limit. Please try again; if it persists, check deployment logs.";
    }
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [profileComplete, setProfileComplete] = React.useState(false);
  const [existingBooks, setExistingBooks] = React.useState<{ id: string; title: string }[]>([]);
  const [status, setStatus] = React.useState<ProcessingStatus>("idle");
  const [progress, setProgress] = React.useState(0);
  const [loadingMessage, setLoadingMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Check if profile is complete
      const lifeProfile = await getLifeProfile(user.id);
      setProfileComplete(lifeProfile?.completed || false);

      // Load existing processed books
      const books = await getProcessedBooks(user.id);
      setExistingBooks(books.map((b) => ({ id: b.id, title: b.title })));

      setLoading(false);
    }

    loadData();
  }, [router]);

  // Update loading message periodically
  React.useEffect(() => {
    if (status === "idle" || status === "complete") return;

    const stage = status === "uploading" ? "uploadingPdf" : status === "processing" ? "processingPdf" : "generatingMatches";
    setLoadingMessage(getLoadingMessage(stage));

    const interval = setInterval(() => {
      setLoadingMessage(getLoadingMessage(stage));
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  const handleFilesReady = async (files: File[]) => {
    if (!userId) return;

    setStatus("uploading");
    setProgress(10);

    try {
      const supabase = createClient();

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_SERVERLESS_PDF_SIZE_BYTES) {
          throw new Error(`\"${file.name}\" is too large for production processing. Please upload a PDF under 4MB.`);
        }

        setProgress(10 + (i / files.length) * 30);

        // Upload to Supabase Storage
        const filePath = `${userId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("books")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Create book record
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .insert({
            user_id: userId,
            title: file.name.replace(".pdf", ""),
            file_path: filePath,
            file_size: file.size,
            processing_status: "pending",
          })
          .select()
          .single();

        if (bookError) {
          throw new Error(`Failed to save book record: ${bookError.message}`);
        }

        // Process the PDF (call API route)
        setStatus("processing");
        setProgress(40 + (i / files.length) * 30);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("bookId", bookData.id);
        formData.append("userId", userId);

        const processResponse = await fetch("/api/process-pdf", {
          method: "POST",
          body: formData,
        });

        if (!processResponse.ok) {
          const message = await getErrorMessageFromResponse(
            processResponse,
            "Failed to process PDF",
          );
          throw new Error(message);
        }
      }

      // Generate matches
      setStatus("generating");
      setProgress(80);

      const matchResponse = await fetch("/api/generate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!matchResponse.ok) {
        const message = await getErrorMessageFromResponse(
          matchResponse,
          "Failed to generate matches",
        );
        throw new Error(message);
      }

      const { sessionId } = await matchResponse.json();

      setStatus("complete");
      setProgress(100);

      toast({
        variant: "warm",
        title: "Wisdom discovered! ✨",
        description: "We found excerpts that speak to your life.",
      });

      // Navigate to results
      setTimeout(() => {
        router.push(`/dashboard/results/${sessionId}`);
      }, 1000);
    } catch (error) {
      console.error("Error processing books:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setStatus("idle");
      setProgress(0);
    }
  };

  const handleGenerateFromExisting = async () => {
    if (!userId || existingBooks.length === 0) return;

    setStatus("generating");
    setProgress(50);
    setLoadingMessage(getLoadingMessage("generatingMatches"));

    try {
      const response = await fetch("/api/generate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const message = await getErrorMessageFromResponse(
          response,
          "Failed to generate matches",
        );
        throw new Error(message);
      }

      const { sessionId } = await response.json();

      setStatus("complete");
      setProgress(100);

      toast({
        variant: "warm",
        title: "Wisdom discovered! ✨",
        description: "We found new excerpts that speak to your life.",
      });

      setTimeout(() => {
        router.push(`/dashboard/results/${sessionId}`);
      }, 1000);
    } catch (error) {
      console.error("Error generating matches:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setStatus("idle");
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center animate-pulse shadow-lg shadow-sky-500/10">
            <BookOpen className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show prompt to complete profile first
  if (!profileComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Let's get to know you first</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Before we can find wisdom that speaks to your life, we need to
          understand your goals, struggles, and values.
        </p>
        <Button variant="glow" onClick={() => router.push("/dashboard/questions")}>
          Complete your profile
        </Button>
      </div>
    );
  }

  // Processing state
  if (status !== "idle") {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            {status === "complete" ? (
              <Sparkles className="w-10 h-10 text-white" />
            ) : (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              {status === "complete"
                ? "Your wisdom is ready!"
                : loadingMessage}
            </h2>
            <p className="text-muted-foreground">
              {status === "uploading" && "Securely storing your books..."}
              {status === "processing" && "Extracting meaningful passages..."}
              {status === "generating" && "Matching wisdom to your life..."}
              {status === "complete" && "Taking you to your personalized insights..."}
            </p>
          </div>

          <Progress value={progress} className="max-w-xs mx-auto h-3" />
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
        className="text-center mb-12"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Upload your books</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Add PDF books you want to discover wisdom from. Self-help, philosophy,
          personal development — whatever resonates with you.
        </p>
      </motion.div>

      {/* Existing books */}
      {existingBooks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-sky-50/80 via-white to-blue-50/80 dark:from-sky-950/40 dark:via-slate-900/60 dark:to-blue-950/40 border-sky-200/60 dark:border-sky-700/40 shadow-lg shadow-sky-500/5">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 text-slate-800 dark:text-slate-100">
                You have {existingBooks.length} book{existingBooks.length > 1 ? "s" : ""} ready
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {existingBooks.map((book) => (
                  <span
                    key={book.id}
                    className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-sm border border-slate-200 dark:border-slate-600/50 text-slate-700 dark:text-slate-200 font-medium shadow-sm"
                  >
                    {book.title}
                  </span>
                ))}
              </div>
              <Button variant="glow" onClick={handleGenerateFromExisting}>
                <Sparkles className="w-4 h-4 mr-2" />
                Find new wisdom from these books
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Uploader */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PdfUploader onFilesReady={handleFilesReady} maxFiles={3} maxSizeMB={4} />
      </motion.div>
    </div>
  );
}
