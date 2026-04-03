/**
 * LLM Integration Module
 *
 * Supports Groq (primary) and Ollama (fallback) for generating
 * personalized explanations and action steps.
 */

// ============================================================================
// Types
// ============================================================================

interface LLMResponse {
  content: string;
  model: string;
  provider: "groq" | "ollama";
}

interface MatchExplanation {
  whyRelevant: string;
  actionStep: string;
}

// ============================================================================
// Configuration
// ============================================================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

function getProvider(): "groq" | "ollama" {
  return (process.env.LLM_PROVIDER as "groq" | "ollama") || "groq";
}

function getModel(): string {
  const provider = getProvider();
  if (provider === "groq") {
    return process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }
  return process.env.OLLAMA_MODEL || "llama3.1:8b";
}

// ============================================================================
// Groq API Integration
// ============================================================================

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens: number = 500,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Please add it to your .env.local file.",
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// ============================================================================
// Ollama API Integration
// ============================================================================

async function callOllama(
  messages: { role: string; content: string }[],
  maxTokens: number = 500,
): Promise<string> {
  // Convert to Ollama format
  const prompt = messages
    .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      prompt: prompt + "\n\nAssistant:",
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.response || "";
}

// ============================================================================
// Unified LLM Call
// ============================================================================

async function callLLM(
  messages: { role: string; content: string }[],
  maxTokens: number = 500,
): Promise<LLMResponse> {
  const provider = getProvider();
  const model = getModel();

  try {
    if (provider === "groq") {
      const content = await callGroq(messages, maxTokens);
      return { content, model, provider: "groq" };
    } else {
      const content = await callOllama(messages, maxTokens);
      return { content, model, provider: "ollama" };
    }
  } catch (error) {
    // If primary fails and we're using Groq, try Ollama as fallback
    if (provider === "groq") {
      console.warn("Groq failed, trying Ollama fallback...", error);
      try {
        const content = await callOllama(messages, maxTokens);
        return {
          content,
          model: process.env.OLLAMA_MODEL || "llama3.1:8b",
          provider: "ollama",
        };
      } catch (ollamaError) {
        console.error("Both Groq and Ollama failed:", ollamaError);
        throw error; // Throw original error
      }
    }
    throw error;
  }
}

// ============================================================================
// Generate Match Explanation
// ============================================================================

export async function generateMatchExplanation(
  bookExcerpt: string,
  userLifeSummary: string,
  bookTitle: string,
): Promise<MatchExplanation> {
  const systemPrompt = `You are a warm, empathetic life coach who helps people connect book wisdom to their real lives.

Your job is to explain WHY a specific book excerpt is relevant to someone's current life situation, and suggest ONE tiny, actionable step they can take today.

Guidelines:
- Be warm and personal, like a caring friend
- Keep explanations brief (2-3 sentences max)
- Make the action step TINY and doable in under 5 minutes
- Use "you" language, not "one" or "the reader"
- Never be preachy or condescending
- If the connection is weak, still find something meaningful`;

  const userPrompt = `Here's what I know about this person's life:
"${userLifeSummary}"

Here's an excerpt from "${bookTitle}":
"${bookExcerpt}"

Please provide:
1. WHY_RELEVANT: A warm, 2-3 sentence explanation of why this excerpt speaks to their current life situation. Start with "This speaks to..." or "This connects to..." or similar.

2. ACTION_STEP: One tiny, specific action they could try today (under 5 minutes). Start with "Try this:" or "Today, try:" or similar.

Format your response exactly like this:
WHY_RELEVANT: [your explanation]
ACTION_STEP: [your suggestion]`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      400,
    );

    // Parse the response
    const whyMatch = response.content.match(
      /WHY_RELEVANT:\s*(.+?)(?=ACTION_STEP:|$)/s,
    );
    const actionMatch = response.content.match(/ACTION_STEP:\s*(.+?)$/s);

    return {
      whyRelevant: whyMatch
        ? whyMatch[1].trim()
        : "This excerpt resonates with where you are in life right now.",
      actionStep: actionMatch
        ? actionMatch[1].trim()
        : "Try reflecting on this quote for a moment today.",
    };
  } catch (error) {
    console.error("Error generating explanation:", error);
    // Return graceful fallbacks
    return {
      whyRelevant:
        "This passage offers wisdom that may resonate with your current journey.",
      actionStep:
        "Try sitting with this thought for a few quiet moments today.",
    };
  }
}

// ============================================================================
// Generate Life Profile Summary
// ============================================================================

export async function generateLifeProfileSummary(
  answers: Record<string, string>,
): Promise<string> {
  const answersText = Object.entries(answers)
    .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
    .join("\n\n");

  const systemPrompt = `You are creating a concise summary of someone's current life situation based on their answers to reflective questions.

Guidelines:
- Write in third person
- Focus on key themes: challenges, goals, values, emotional state
- Keep it to 3-4 sentences
- Be respectful and non-judgmental
- Highlight what matters most to them`;

  const userPrompt = `Based on these answers, create a brief life summary:

${answersText}

Write a 3-4 sentence summary of this person's current life situation, focusing on their main challenges, goals, and values.`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      300,
    );

    return response.content.trim();
  } catch (error) {
    console.error("Error generating life summary:", error);
    // Return a basic summary from the answers
    const values = Object.values(answers).filter(Boolean).slice(0, 3);
    return values.join(" ");
  }
}

// ============================================================================
// Batch Generate Explanations
// ============================================================================

export async function batchGenerateExplanations(
  excerpts: { id: string; content: string; bookTitle: string }[],
  userLifeSummary: string,
): Promise<Map<string, MatchExplanation>> {
  const results = new Map<string, MatchExplanation>();

  // Process in parallel with concurrency limit
  const concurrencyLimit = 3;
  for (let i = 0; i < excerpts.length; i += concurrencyLimit) {
    const batch = excerpts.slice(i, i + concurrencyLimit);
    const promises = batch.map(async (excerpt) => {
      const explanation = await generateMatchExplanation(
        excerpt.content,
        userLifeSummary,
        excerpt.bookTitle,
      );
      results.set(excerpt.id, explanation);
    });

    await Promise.all(promises);
  }

  return results;
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkLLMHealth(): Promise<{
  provider: string;
  model: string;
  healthy: boolean;
  error?: string;
}> {
  const provider = getProvider();
  const model = getModel();

  try {
    await callLLM(
      [{ role: "user", content: "Say 'ok' if you're working." }],
      10,
    );
    return { provider, model, healthy: true };
  } catch (error) {
    return {
      provider,
      model,
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
