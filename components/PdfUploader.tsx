"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  Check,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatFileSize } from "@/lib/utils";

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  error?: string;
}

interface PdfUploaderProps {
  onFilesReady: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function PdfUploader({
  onFilesReady,
  maxFiles = 3,
  maxSizeMB = 20,
}: PdfUploaderProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = React.useState(false);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles
        .filter((file) => {
          // Check file type
          if (file.type !== "application/pdf") {
            return false;
          }
          // Check file size
          if (file.size > maxSizeMB * 1024 * 1024) {
            return false;
          }
          // Check if already added
          if (files.some((f) => f.file.name === file.name)) {
            return false;
          }
          return true;
        })
        .slice(0, maxFiles - files.length)
        .map((file) => ({
          file,
          id: Math.random().toString(36).substring(7),
          status: "pending" as const,
          progress: 0,
        }));

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files, maxFiles, maxSizeMB]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleContinue = () => {
    const pendingFiles = files.filter((f) => f.status === "pending").map((f) => f.file);
    onFilesReady(pendingFiles);
  };

  const canContinue = files.length > 0 && files.some((f) => f.status === "pending");

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-sky-400 bg-gradient-to-br from-sky-50/80 to-blue-50/80 dark:from-sky-950/40 dark:to-blue-950/40 shadow-lg shadow-sky-500/10"
            : "border-slate-200 dark:border-slate-700/50 hover:border-sky-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{
            scale: isDragActive ? 1.05 : 1,
            y: isDragActive ? -5 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-3 sm:gap-4"
        >
          <div
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg",
              isDragActive
                ? "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sky-500/30"
                : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 text-sky-600 dark:text-sky-400 shadow-sky-500/10"
            )}
          >
            {isDragActive ? (
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <Upload className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
          </div>

          <div className="space-y-1 sm:space-y-2">
            <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
              {isDragActive
                ? "Drop your books here..."
                : "Drag & drop your PDF books"}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              or tap to browse • Up to {maxFiles} PDFs • Max {maxSizeMB}MB each
            </p>
          </div>
        </motion.div>

        {/* Decorative book icons - hidden on mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl hidden sm:block">
          <BookOpen className="absolute top-4 left-4 w-6 h-6 text-sky-500/10 dark:text-sky-400/10" />
          <BookOpen className="absolute top-4 right-4 w-6 h-6 text-sky-500/10 dark:text-sky-400/10" />
          <BookOpen className="absolute bottom-4 left-4 w-6 h-6 text-sky-500/10 dark:text-sky-400/10" />
          <BookOpen className="absolute bottom-4 right-4 w-6 h-6 text-sky-500/10 dark:text-sky-400/10" />
        </div>
      </div>

      {/* File list */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              Selected books ({files.length}/{maxFiles})
            </p>

            {files.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-white/80 dark:bg-slate-800/60 shadow-sm",
                  uploadedFile.status === "error"
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-slate-200/60 dark:border-slate-700/40"
                )}
              >
                {/* File icon */}
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0",
                    uploadedFile.status === "complete"
                      ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-600 dark:text-green-400 shadow-green-500/10"
                      : uploadedFile.status === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 text-sky-600 dark:text-sky-400 shadow-sky-500/10"
                  )}
                >
                  {uploadedFile.status === "complete" ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : uploadedFile.status === "error" ? (
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : uploadedFile.status === "uploading" ||
                    uploadedFile.status === "processing" ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-semibold text-sm sm:text-base truncate text-slate-800 dark:text-slate-100" title={uploadedFile.file.name}>
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {formatFileSize(uploadedFile.file.size)}
                    {uploadedFile.status === "uploading" && " • Uploading..."}
                    {uploadedFile.status === "processing" && " • Processing..."}
                    {uploadedFile.status === "complete" && " • Ready"}
                    {uploadedFile.status === "error" && ` • ${uploadedFile.error || "Error"}`}
                  </p>

                  {/* Progress bar for uploading/processing */}
                  {(uploadedFile.status === "uploading" ||
                    uploadedFile.status === "processing") && (
                      <Progress
                        value={uploadedFile.progress}
                        className="h-1.5 mt-2"
                      />
                    )}
                </div>

                {/* Remove button */}
                {uploadedFile.status !== "uploading" &&
                  uploadedFile.status !== "processing" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(uploadedFile.id)}
                      className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 hover:bg-slate-100 dark:hover:bg-slate-700"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue button */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-4"
        >
          <Button
            variant="glow"
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue}
            className="min-w-[200px]"
          >
            Continue with {files.length} book{files.length > 1 ? "s" : ""}
          </Button>
        </motion.div>
      )}

      {/* Tips */}
      <div className="text-center text-sm text-muted-foreground px-4 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40">
        <p>💡 Tip: Self-help, philosophy, and personal development books work best!</p>
      </div>
    </div>
  );
}
