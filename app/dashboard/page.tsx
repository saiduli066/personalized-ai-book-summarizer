"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  User,
  Quote,
  BookMarked,
  TrendingUp,
  Zap,
} from "lucide-react";
import { createClient, getLifeProfile, getUserBooks, getSavedExcerpts } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateProfileCompletion, getDailyQuote } from "@/lib/utils";

export default function DashboardPage() {
  const [profileComplete, setProfileComplete] = React.useState(false);
  const [profileProgress, setProfileProgress] = React.useState(0);
  const [booksCount, setBooksCount] = React.useState(0);
  const [savedCount, setSavedCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const dailyQuote = getDailyQuote();

  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Load life profile
      const lifeProfile = await getLifeProfile(user.id);
      if (lifeProfile) {
        const answers = (lifeProfile.answers as Record<string, string>) || {};
        setProfileProgress(calculateProfileCompletion(answers));
        setProfileComplete(lifeProfile.completed || false);
      }

      // Load books count
      const books = await getUserBooks(user.id);
      setBooksCount(books.filter((b) => b.processed).length);

      // Load saved excerpts count
      const saved = await getSavedExcerpts(user.id);
      setSavedCount(saved.length);

      setLoading(false);
    }

    loadData();
  }, []);

  const allStepsDone = profileComplete && booksCount > 0;

  const steps = [
    {
      title: "Complete your profile",
      description: "Tell us about your goals and challenges",
      href: "/dashboard/questions",
      icon: User,
      done: profileComplete,
      progress: profileProgress,
    },
    {
      title: "Upload a book",
      description: "Add a PDF you want wisdom from",
      href: "/dashboard/upload",
      icon: Upload,
      done: booksCount > 0,
    },
    {
      title: "Discover wisdom",
      description: "Get personalized insights",
      href: "/dashboard/upload",
      icon: Sparkles,
      done: savedCount > 0,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Daily Quote Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-2xl shadow-sky-500/30 dark:shadow-sky-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h30v30H0z%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%221%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.1%22%2F%3E%3C%2Fsvg%3E')]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="relative p-8 md:p-10">
            <div className="flex items-start gap-5">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center shrink-0 border border-white/20">
                <Quote className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest text-white/70 mb-4 font-semibold">
                  Today's Inspiration
                </p>
                <blockquote className="text-xl md:text-2xl font-serif leading-relaxed mb-5">
                  "{dailyQuote.quote}"
                </blockquote>
                <p className="text-white/80 font-medium">— {dailyQuote.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Action Card */}
      {allStepsDone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-sky-200/80 dark:border-sky-800/50 bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-indigo-50/80 dark:from-sky-950/40 dark:via-slate-900/50 dark:to-indigo-950/40 shadow-lg shadow-sky-500/5">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Ready for new insights?</p>
                  <p className="text-sm text-muted-foreground">
                    Discover wisdom matched to your life
                  </p>
                </div>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="glow" size="lg" className="gap-2 w-full sm:w-auto shadow-lg shadow-sky-500/25">
                  Find Wisdom
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { icon: BookOpen, value: booksCount, label: "Books", color: "sky" },
          { icon: BookMarked, value: savedCount, label: "Saved", color: "indigo" },
          { icon: TrendingUp, value: `${profileProgress}%`, label: "Profile", color: "blue" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            sky: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",
            indigo: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
            blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
          };
          return (
            <Card key={stat.label} className="stat-gradient shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`w-11 h-11 mx-auto mb-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {loading ? "—" : stat.value}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Setup Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Get Started</h2>
          <span className="text-sm text-muted-foreground">
            {steps.filter(s => s.done).length} of {steps.length} complete
          </span>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link key={step.title} href={step.href} className="block group">
                <Card
                  className={`transition-all duration-300 ${step.done
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20"
                      : "hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg hover:shadow-sky-500/5 bg-white dark:bg-slate-800/50"
                    }`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Step number or check */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${step.done
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-slate-100 dark:bg-slate-800 text-muted-foreground group-hover:bg-sky-100 group-hover:text-sky-600 dark:group-hover:bg-sky-900/40 dark:group-hover:text-sky-400"
                        } transition-all duration-300`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{step.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>

                      {/* Progress for profile */}
                      {step.progress !== undefined && !step.done && step.progress > 0 && (
                        <div className="mt-2">
                          <Progress value={step.progress} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-sky-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Wisdom Journal Link */}
      {savedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link href="/dashboard/wisdom">
            <Card className="group hover:border-sky-300 dark:hover:border-sky-700 transition-all hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer bg-white dark:bg-slate-800/50">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 dark:from-sky-900/40 dark:via-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-sky-200/50 dark:border-sky-800/50">
                    <Sparkles className="w-7 h-7 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="font-semibold">My Wisdom</p>
                    <p className="text-sm text-muted-foreground">
                      {savedCount} saved insight{savedCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
