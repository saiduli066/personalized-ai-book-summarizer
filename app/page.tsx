import Link from "next/link";
import { Sparkles, Shield, Heart, ArrowRight, Zap, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="glow" className="shadow-lg shadow-sky-500/25">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.1),transparent)]" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-sky-700 dark:text-sky-300 text-sm font-medium mb-8 animate-fade-in border border-sky-200/50 dark:border-sky-800/50 shadow-lg shadow-sky-500/10 backdrop-blur-sm">
            <Star className="w-4 h-4 fill-sky-400 text-sky-400" />
            Your books, personalized for your life
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-6 animate-fade-up tracking-tight text-balance">
            Find the words that{" "}
            <span className="gradient-text">find you</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up animation-delay-100 text-balance leading-relaxed">
            90% of self-help books are irrelevant to you right now. Introsia reads
            your books and shows you only the wisdom that matches your real
            life — your goals, struggles, and values.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animation-delay-200">
            <Link href="/signup">
              <Button variant="glow" size="xl" className="gap-2 shadow-xl shadow-sky-500/25 w-full sm:w-auto">
                Start your journey
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl" className="w-full sm:w-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/50 dark:to-transparent" />
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">How Introsia works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              A simple, thoughtful process to surface wisdom that actually matters to you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: "1",
                title: "Share your story",
                description:
                  "Answer 14 simple questions about your life — your challenges, goals, joys, and values. This creates your personal life profile.",
                icon: Heart,
                color: "from-rose-400 to-pink-500",
                shadow: "shadow-rose-500/25",
              },
              {
                step: "2",
                title: "Upload your books",
                description:
                  "Add 1-3 PDF books you already own. Self-help, philosophy, personal development — whatever speaks to you.",
                icon: BookOpen,
                color: "from-sky-400 to-blue-500",
                shadow: "shadow-sky-500/25",
              },
              {
                step: "3",
                title: "Discover your wisdom",
                description:
                  "Get 5-10 excerpts that match your life, each with a personal explanation and one tiny action you can try today.",
                icon: Sparkles,
                color: "from-amber-400 to-orange-500",
                shadow: "shadow-amber-500/25",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative p-6 lg:p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 soft-shadow hover:elevated transition-all duration-300 hover:-translate-y-1 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-xl mb-5 shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3 tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight">
                Wisdom that feels written{" "}
                <span className="gradient-text">for you</span>
              </h2>

              <div className="space-y-6">
                {[
                  {
                    title: "Personalized matching",
                    description:
                      "Our AI understands your life context and finds excerpts that genuinely resonate with where you are right now.",
                  },
                  {
                    title: "Actionable insights",
                    description:
                      "Every excerpt comes with a tiny, doable action step — something you can try in under 5 minutes.",
                  },
                  {
                    title: "Your Wisdom Journal",
                    description:
                      "Save your favorite excerpts and build a personal collection of wisdom to revisit anytime.",
                  },
                  {
                    title: "Gets smarter over time",
                    description:
                      "Give feedback on what resonates — Introsia learns and improves its recommendations for you.",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300 border border-sky-200/50 dark:border-sky-800/50">
                      <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1.5 tracking-tight">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-sky-950/80 dark:via-slate-900 dark:to-indigo-950/80 p-6 soft-shadow border border-sky-200/50 dark:border-sky-800/30">
                <div className="h-full rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50 p-5 space-y-4 shadow-inner">
                  <div className="h-3 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-l-4 border-sky-500">
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      <div className="h-3 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 w-1/4 rounded-full bg-sky-200 dark:bg-sky-800" />
                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -right-2 sm:-right-4 -bottom-4 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/50 shadow-xl flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-sm font-medium">Saved to journal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/50 dark:to-transparent" />
        <div className="container mx-auto max-w-3xl text-center relative">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/20">
            <Shield className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Privacy first, always</h2>
          <p className="text-muted-foreground mb-10 text-lg leading-relaxed max-w-xl mx-auto">
            Your books, your answers, your wisdom — all stored securely and
            never shared. Delete your account anytime and everything goes with
            it.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {["End-to-end encryption", "No data selling", "Delete anytime"].map((item) => (
              <span key={item} className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-slate-800/80 border border-emerald-200/50 dark:border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Ready to find wisdom that speaks to you?
          </h2>
          <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
            It takes just a few minutes to get started. Your first personalized
            insights are waiting.
          </p>
          <Link href="/signup">
            <Button variant="glow" size="xl" className="gap-2 shadow-xl shadow-sky-500/25">
              Get started for free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Logo size="sm" showText={false} />
            <span className="text-sm">
              © {new Date().getFullYear()} Introsia. Made with 💙
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
