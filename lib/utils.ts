import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date relative to now (e.g., "2 days ago")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Delay execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Encouraging loading messages for different stages
 */
export const loadingMessages = {
  uploadingPdf: [
    "Receiving your book...",
    "Carefully handling your wisdom...",
    "Almost there...",
  ],
  processingPdf: [
    "Reading through the pages...",
    "Finding the meaningful passages...",
    "Understanding the wisdom within...",
    "Preparing the insights...",
  ],
  generatingMatches: [
    "Finding wisdom that matches your life...",
    "Connecting the dots...",
    "Discovering what speaks to you...",
    "Almost ready with your personalized insights...",
  ],
  savingProfile: [
    "Getting to know you better...",
    "Understanding your journey...",
  ],
};

/**
 * Get a random loading message for a stage
 */
export function getLoadingMessage(
  stage: keyof typeof loadingMessages,
  index?: number,
): string {
  const messages = loadingMessages[stage];
  if (index !== undefined) {
    return messages[Math.min(index, messages.length - 1)];
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * The 14 life profile questions
 */
export const lifeProfileQuestions = [
  // Current State (4 questions)
  {
    id: "biggest_challenge",
    question:
      "What's the biggest challenge you're facing in your life right now?",
    placeholder:
      "It could be related to work, relationships, health, or personal growth...",
    category: "current",
  },
  {
    id: "out_of_balance",
    question: "What area of your life feels most out of balance?",
    placeholder:
      "Think about where you're spending too much or too little energy...",
    category: "current",
  },
  {
    id: "weighs_on_mind",
    question: "What keeps you up at night or weighs on your mind?",
    placeholder: "The worries, doubts, or thoughts that linger...",
    category: "current",
  },
  {
    id: "emotional_state",
    question:
      "How would you describe your current emotional state in one sentence?",
    placeholder: "Be honest with yourself - there's no wrong answer...",
    category: "current",
  },
  // Goals & Aspirations (4 questions)
  {
    id: "meaningful_goal",
    question: "What's one meaningful goal you're working toward?",
    placeholder:
      "Something that would make your life better or more fulfilling...",
    category: "goals",
  },
  {
    id: "become_in_year",
    question: "What kind of person do you want to become in the next year?",
    placeholder: "Think about character traits, habits, or ways of being...",
    category: "goals",
  },
  {
    id: "feel_proud",
    question: "What would make you feel truly proud of yourself?",
    placeholder: "An achievement, a change, or a way of living...",
    category: "goals",
  },
  {
    id: "change_one_thing",
    question:
      "If you could change one thing about your life, what would it be?",
    placeholder: "The one thing that would have the biggest positive impact...",
    category: "goals",
  },
  // Values & Meaning (3 questions)
  {
    id: "matters_most",
    question: "What matters most to you in life?",
    placeholder: "Family, freedom, growth, creativity, security, adventure...",
    category: "values",
  },
  {
    id: "genuine_joy",
    question: "What brings you genuine joy or peace?",
    placeholder: "The activities, people, or moments that light you up...",
    category: "values",
  },
  {
    id: "legacy",
    question: "What kind of legacy do you want to leave?",
    placeholder:
      "How you want to be remembered or what impact you want to make...",
    category: "values",
  },
  // Recent Experiences (3 questions)
  {
    id: "recent_win",
    question: "What's a recent win or positive moment you've experienced?",
    placeholder: "Even small victories count...",
    category: "recent",
  },
  {
    id: "lesson_hard_way",
    question: "What's a lesson you've learned the hard way recently?",
    placeholder:
      "Something that was painful but taught you something valuable...",
    category: "recent",
  },
  {
    id: "grateful_for",
    question: "What's something you're grateful for right now?",
    placeholder: "It could be big or small...",
    category: "recent",
  },
];

/**
 * Get question by ID
 */
export function getQuestionById(id: string) {
  return lifeProfileQuestions.find((q) => q.id === id);
}

/**
 * Calculate completion percentage for life profile
 */
export function calculateProfileCompletion(
  answers: Record<string, string>,
): number {
  const totalQuestions = lifeProfileQuestions.length;
  const answeredQuestions = Object.values(answers).filter(
    (a) => a && a.trim().length > 0,
  ).length;
  return Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  return { valid: true, message: "" };
}

/**
 * Motivational messages for first-time actions
 */
export const firstTimeMessages = {
  firstSave: [
    "Your first saved wisdom! 🌟",
    "This is the beginning of your wisdom journal!",
    "You'll always find this gem here.",
  ],
  completedProfile: [
    "We know you a little better now! 💜",
    "Your profile is complete. Time to find your wisdom.",
  ],
  firstMatch: [
    "These words found you for a reason.",
    "Your personalized wisdom awaits.",
  ],
};

/**
 * Get a motivational message for a first-time action
 */
export function getFirstTimeMessage(
  action: keyof typeof firstTimeMessages,
): string {
  const messages = firstTimeMessages[action];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Daily motivational quotes - displayed on dashboard
 */
export const dailyQuotes = [
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
  },
  {
    quote:
      "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
  },
  {
    quote:
      "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    quote: "It is not the mountain we conquer, but ourselves.",
    author: "Edmund Hillary",
  },
  {
    quote:
      "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  {
    quote: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
  },
  {
    quote:
      "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson",
  },
  {
    quote:
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
  },
  {
    quote:
      "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson",
  },
  {
    quote:
      "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
  },
  {
    quote: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
  },
  {
    quote: "The purpose of our lives is to be happy.",
    author: "Dalai Lama",
  },
  {
    quote:
      "You have within you right now, everything you need to deal with whatever the world can throw at you.",
    author: "Brian Tracy",
  },
  {
    quote: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    quote: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    quote: "What we think, we become.",
    author: "Buddha",
  },
  {
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
  },
  {
    quote:
      "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
  },
  {
    quote: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
  {
    quote:
      "Happiness is not something ready-made. It comes from your own actions.",
    author: "Dalai Lama",
  },
  {
    quote: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
  },
  {
    quote: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
  },
  {
    quote: "Do what you can, with what you have, where you are.",
    author: "Theodore Roosevelt",
  },
  {
    quote:
      "In three words I can sum up everything I've learned about life: it goes on.",
    author: "Robert Frost",
  },
  {
    quote:
      "Life isn't about finding yourself. Life is about creating yourself.",
    author: "George Bernard Shaw",
  },
  {
    quote: "The best revenge is massive success.",
    author: "Frank Sinatra",
  },
];

/**
 * Get daily quote based on the current date
 */
export function getDailyQuote(): { quote: string; author: string } {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const quoteIndex = dayOfYear % dailyQuotes.length;
  return dailyQuotes[quoteIndex];
}
