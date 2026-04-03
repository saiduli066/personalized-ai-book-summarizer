"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { createClient, getLifeProfile, saveLifeProfile } from "@/lib/supabase";
import { QuestionForm } from "@/components/QuestionForm";
import { useToast } from "@/components/ui/use-toast";

export default function QuestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [initialAnswers, setInitialAnswers] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Load existing answers if any
      const lifeProfile = await getLifeProfile(user.id);
      if (lifeProfile?.answers) {
        setInitialAnswers(lifeProfile.answers as Record<string, string>);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSave = async (answers: Record<string, string>, completed: boolean) => {
    if (!userId) return;

    await saveLifeProfile(userId, answers, completed);
  };

  const handleComplete = () => {
    toast({
      variant: "warm",
      title: "Profile complete! 🎉",
      description: "We now understand you better. Time to upload your books!",
    });
    router.push("/dashboard/upload");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center animate-pulse shadow-lg shadow-sky-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your profile...</p>
        </div>
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
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Let's understand your life</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Answer these questions honestly — they help us find book wisdom that
          actually resonates with where you are right now.
        </p>
      </motion.div>

      {/* Question form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <QuestionForm
          initialAnswers={initialAnswers}
          onSave={handleSave}
          onComplete={handleComplete}
        />
      </motion.div>
    </div>
  );
}
