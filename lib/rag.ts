/**
 * RAG (Retrieval-Augmented Generation) Module
 *
 * Handles PDF parsing, text chunking, and embedding generation
 * using local transformers.js for zero-cost embeddings.
 */

import { pipeline } from "@xenova/transformers";

const EMBEDDING_CACHE_DIR = process.env.VERCEL
  ? "/tmp/models"
  : "./.cache/models";

// Singleton pattern for the embedding model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null;

/**
 * Initialize the embedding model (all-MiniLM-L6-v2)
 * This runs locally, no API calls needed!
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEmbeddingPipeline(): Promise<any> {
  if (!embeddingPipeline) {
    console.log("🔄 Loading embedding model (first time may take a moment)...");
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      {
        // Cache the model locally
        cache_dir: EMBEDDING_CACHE_DIR,
      },
    );
    console.log("✅ Embedding model loaded!");
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a single text string
 * Returns a 384-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();

  // Truncate very long texts to avoid memory issues
  const truncatedText = text.slice(0, 8000);

  const output = await pipe(truncatedText, {
    pooling: "mean",
    normalize: true,
  });

  // Convert tensor to regular array
  return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();

  const embeddings: number[][] = [];

  // Process in smaller batches to avoid memory issues
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    for (const text of batch) {
      const truncatedText = text.slice(0, 8000);
      const output = await pipe(truncatedText, {
        pooling: "mean",
        normalize: true,
      });
      embeddings.push(Array.from(output.data as Float32Array));
    }
  }

  return embeddings;
}

/**
 * Split text into meaningful chunks
 *
 * Strategy:
 * 1. Split by paragraphs (double newlines)
 * 2. Merge small paragraphs together
 * 3. Split very long paragraphs
 * 4. Aim for chunks of 200-500 words (sweet spot for retrieval)
 */
export function chunkText(
  text: string,
  options: {
    minChunkSize?: number;
    maxChunkSize?: number;
    overlap?: number;
  } = {},
): { content: string; index: number }[] {
  const { minChunkSize = 150, maxChunkSize = 500, overlap = 50 } = options;

  // Clean the text
  const cleanedText = text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
    .replace(/\s+/g, " ") // Normalize whitespace within lines
    .trim();

  // Split into paragraphs
  const paragraphs = cleanedText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20); // Filter out tiny fragments

  const chunks: { content: string; index: number }[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    const wordCount = words.length;

    // If this paragraph alone is too long, split it
    if (wordCount > maxChunkSize) {
      // Save current chunk if exists
      if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
        currentChunk = "";
      }

      // Split long paragraph into smaller chunks with overlap
      for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
        const chunkWords = words.slice(i, i + maxChunkSize);
        chunks.push({ content: chunkWords.join(" "), index: chunkIndex++ });
      }
      continue;
    }

    const currentWords = currentChunk.split(/\s+/).filter(Boolean).length;

    // If adding this paragraph would exceed max, save current and start new
    if (
      currentWords + wordCount > maxChunkSize &&
      currentWords >= minChunkSize
    ) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
      currentChunk = paragraph;
    } else {
      // Add to current chunk
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Don't forget the last chunk
  if (
    currentChunk.trim() &&
    currentChunk.split(/\s+/).length >= minChunkSize / 2
  ) {
    chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
  }

  return chunks;
}

/**
 * Extract meaningful quotes from a chunk of text
 * Looks for sentences that could stand alone as wisdom
 */
export function extractQuotes(text: string): string[] {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  // Filter for sentences that might be meaningful quotes
  const quotes = sentences.filter((sentence) => {
    const cleaned = sentence.trim();
    const wordCount = cleaned.split(/\s+/).length;

    // Good quotes are typically 8-40 words
    if (wordCount < 8 || wordCount > 50) return false;

    // Skip sentences that are too generic
    const genericStarters = [
      "this is",
      "there are",
      "it is",
      "we have",
      "you can",
    ];
    const lowerSentence = cleaned.toLowerCase();
    if (genericStarters.some((starter) => lowerSentence.startsWith(starter))) {
      return false;
    }

    return true;
  });

  return quotes.map((q) => q.trim());
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find the most similar chunks to a query embedding
 */
export function findSimilarChunks(
  queryEmbedding: number[],
  chunks: { embedding: number[]; content: string; id: string }[],
  topK: number = 10,
): { content: string; id: string; similarity: number }[] {
  const similarities = chunks.map((chunk) => ({
    content: chunk.content,
    id: chunk.id,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity (highest first) and return top K
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Generate a summary of the user's life profile for embedding
 */
export function generateLifeSummary(answers: Record<string, string>): string {
  const parts: string[] = [];

  // Extract key themes from answers
  Object.entries(answers).forEach(([key, value]) => {
    if (value && value.trim()) {
      parts.push(value.trim());
    }
  });

  // Join into a coherent summary
  return parts.join(" ");
}

/**
 * Filter chunks to remove low-quality content
 */
export function filterQualityChunks(
  chunks: { content: string; index: number }[],
): { content: string; index: number }[] {
  return chunks.filter((chunk) => {
    const content = chunk.content;

    // Skip chunks that are mostly numbers or special characters
    const alphaRatio =
      (content.match(/[a-zA-Z]/g) || []).length / content.length;
    if (alphaRatio < 0.5) return false;

    // Skip chunks that look like table of contents or indexes
    const numberRatio = (content.match(/\d/g) || []).length / content.length;
    if (numberRatio > 0.3) return false;

    // Skip very repetitive content
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const uniqueRatio = uniqueWords.size / words.length;
    if (uniqueRatio < 0.3) return false;

    return true;
  });
}
