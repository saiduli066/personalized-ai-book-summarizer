# 🌟 Introsia - Personal Motivation Engine

> **"Find the words that find you"**

A calm, beautiful, privacy-first web app that transforms your own PDF books into highly personalized wisdom — showing only the paragraphs that match your real life right now.

![Introsia](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green?style=flat-square)

---

## ✨ What Introsia Does

**The Problem:** 90% of self-help book content is irrelevant to you _right now_. You buy a book, read 300 pages, and only 10 paragraphs actually apply to your life.

**The Solution:** Introsia reads your books for you and surfaces only the 5-10 excerpts that genuinely match your current struggles, goals, and values.

### How It Works

1. **Sign up** with email & password
2. **Answer 14 questions** about your life (goals, struggles, joys, values)
3. **Upload 1-3 PDF books** you already own
4. **Get 5-10 personalized excerpts** with:
   - The exact quote from the book
   - Why this matches your life: _"This speaks to your goal of rebuilding confidence because..."_
   - One tiny action: _"Try this today: ..."_
5. **Save favorites**, give feedback, and watch the system get smarter

---

## 🚀 Zero-Cost Local Setup

### Prerequisites

- Node.js 18+ installed
- A free [Supabase](https://supabase.com) account
- A free [Groq](https://console.groq.com) API key (or Ollama installed locally)

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd alora

# Install dependencies
npm install
```

### Step 2: Set Up Supabase (Free Tier)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your database to finish setting up (~2 minutes)
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

4. Go to **Authentication → Providers** and ensure **Email** is enabled

5. Go to **SQL Editor** and run the database schema (see [Database Setup](#database-setup) below)

6. Go to **Storage** and create a bucket called `books` with:
   - Click "New bucket"
   - Name: `books`
   - Toggle **Private bucket** ON
   - Click "Create bucket"

### Step 3: Get Your Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Create an account
3. Go to **API Keys** and create a new key
4. Copy the key

**Alternative: Use Ollama (100% local, no API key needed)**

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the Llama 3.1 model
ollama pull llama3.1:8b

# Start Ollama (runs on localhost:11434)
ollama serve
```

### Step 4: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://personalized-ai-book-summarizer.vercel.app

# LLM Configuration (choose one or both)
GROQ_API_KEY=your-groq-api-key
OLLAMA_BASE_URL=http://localhost:11434

# Which LLM to use: "groq" or "ollama"
LLM_PROVIDER=groq
```

### Step 5: Run the Database Schema

Go to your Supabase dashboard → **SQL Editor** → Click **New query** and paste:

```sql
-- Enable the pgvector extension for embeddings
create extension if not exists vector;

-- User profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Life profile answers (the 14 questions)
create table public.life_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  answers jsonb not null default '{}',
  life_summary text, -- AI-generated summary of their life context
  life_embedding vector(384), -- Embedding of their life summary
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Uploaded books
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  author text,
  file_path text not null, -- Path in Supabase Storage
  file_size integer,
  page_count integer,
  processed boolean default false,
  processing_status text default 'pending', -- pending, processing, completed, failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Book chunks (paragraphs with embeddings)
create table public.book_chunks (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  content text not null,
  page_number integer,
  chunk_index integer,
  embedding vector(384), -- all-MiniLM-L6-v2 produces 384-dim vectors
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Match sessions (each time user generates matches)
create table public.match_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  book_ids uuid[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Individual matches (the relevant excerpts)
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.match_sessions on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  chunk_id uuid references public.book_chunks on delete cascade not null,
  book_id uuid references public.books on delete cascade not null,
  relevance_score float,
  why_relevant text, -- AI explanation: "This matches your goal of..."
  action_step text, -- AI suggestion: "Try this today: ..."
  is_saved boolean default false,
  feedback text, -- 'up', 'down', or null
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved excerpts (user's "Wisdom Journal")
create table public.saved_excerpts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  match_id uuid references public.matches on delete cascade not null,
  notes text, -- User's personal notes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for fast vector similarity search
create index on public.book_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on public.life_profiles using ivfflat (life_embedding vector_cosine_ops) with (lists = 100);

-- Indexes for common queries
create index idx_books_user_id on public.books(user_id);
create index idx_book_chunks_book_id on public.book_chunks(book_id);
create index idx_matches_session_id on public.matches(session_id);
create index idx_matches_user_id on public.matches(user_id);
create index idx_saved_excerpts_user_id on public.saved_excerpts(user_id);

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.life_profiles enable row level security;
alter table public.books enable row level security;
alter table public.book_chunks enable row level security;
alter table public.match_sessions enable row level security;
alter table public.matches enable row level security;
alter table public.saved_excerpts enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Life profiles: users can only access their own
create policy "Users can view own life profile" on public.life_profiles for select using (auth.uid() = user_id);
create policy "Users can insert own life profile" on public.life_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own life profile" on public.life_profiles for update using (auth.uid() = user_id);

-- Books: users can only access their own
create policy "Users can view own books" on public.books for select using (auth.uid() = user_id);
create policy "Users can insert own books" on public.books for insert with check (auth.uid() = user_id);
create policy "Users can update own books" on public.books for update using (auth.uid() = user_id);
create policy "Users can delete own books" on public.books for delete using (auth.uid() = user_id);

-- Book chunks: users can only access their own
create policy "Users can view own chunks" on public.book_chunks for select using (auth.uid() = user_id);
create policy "Users can insert own chunks" on public.book_chunks for insert with check (auth.uid() = user_id);

-- Match sessions: users can only access their own
create policy "Users can view own sessions" on public.match_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.match_sessions for insert with check (auth.uid() = user_id);

-- Matches: users can only access their own
create policy "Users can view own matches" on public.matches for select using (auth.uid() = user_id);
create policy "Users can insert own matches" on public.matches for insert with check (auth.uid() = user_id);
create policy "Users can update own matches" on public.matches for update using (auth.uid() = user_id);

-- Saved excerpts: users can only access their own
create policy "Users can view own saved" on public.saved_excerpts for select using (auth.uid() = user_id);
create policy "Users can insert own saved" on public.saved_excerpts for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved" on public.saved_excerpts for delete using (auth.uid() = user_id);

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage policies for the 'books' bucket
-- Note: Create the bucket manually in Supabase Dashboard first!
```

Click **Run** to execute the schema.

### Step 6: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see Introsia! 🎉

---

## 📁 Project Structure

```
alora/
├── app/
│   ├── (auth)/                 # Auth pages (login, signup)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── dashboard/              # Main app (protected)
│   │   ├── page.tsx            # Dashboard home
│   │   ├── questions/page.tsx  # Life profile questionnaire
│   │   ├── upload/page.tsx     # PDF uploader
│   │   ├── results/[sessionId]/page.tsx  # Match results
│   │   ├── wisdom/page.tsx     # Saved excerpts journal
│   │   └── layout.tsx          # Dashboard layout with sidebar
│   ├── api/
│   │   ├── process-pdf/route.ts      # PDF → chunks → embeddings
│   │   ├── generate-matches/route.ts # Vector search + LLM explanations
│   │   └── feedback/route.ts         # Thumbs up/down handling
│   ├── layout.tsx              # Root layout with theme provider
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── QuestionForm.tsx        # Multi-step life profile form
│   ├── PdfUploader.tsx         # Drag & drop PDF uploader
│   ├── MatchCard.tsx           # Individual result card
│   ├── WisdomJournal.tsx       # Saved excerpts display
│   └── ...
├── lib/
│   ├── supabase.ts             # Supabase client utilities
│   ├── rag.ts                  # PDF parsing & embeddings
│   ├── llm.ts                  # Groq/Ollama integration
│   └── utils.ts                # Helper functions
├── middleware.ts               # Auth protection
└── tailwind.config.ts          # Custom Introsia theme
```

---

## 🎨 Design System

### Color Palette

| Name    | Hex       | Usage                 |
| ------- | --------- | --------------------- |
| Cream   | `#FDF8F3` | Light mode background |
| Navy    | `#1A1B26` | Dark mode background  |
| Slate   | `#4A5568` | Primary text          |
| Sage    | `#718096` | Secondary elements    |
| Amber   | `#ED8936` | Highlights, CTAs      |
| Success | `#48BB78` | Positive feedback     |

### Typography

- **Headings:** Inter (bold, warm)
- **Body:** Inter (regular, readable)
- **Quotes:** Merriweather (serif, bookish)

---

## 🚢 Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

- `NEXT_PUBLIC_SITE_URL`
- `GROQ_API_KEY`
- `LLM_PROVIDER`

4. Deploy!

---

## 🔒 Privacy First

- **Your books stay yours:** PDFs are stored in your private Supabase bucket
- **Your data is yours:** All processing happens on secure servers, never shared
- **No tracking:** Zero analytics, zero telemetry
- **Delete anytime:** Remove your account and all data is gone

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## 📄 License

MIT © 2024 Introsia

---

<p align="center">
  <strong>Built with 💜 for everyone who wants their books to understand them better.</strong>
</p>
