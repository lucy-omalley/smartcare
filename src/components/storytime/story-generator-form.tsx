"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STORY_CATEGORIES, BEDTIME_MOODS, STORY_LENGTH_OPTIONS } from "@/lib/storytime/constants";
import type { BedtimeMood, StoryCategory } from "@prisma/client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface StoryGeneratorFormProps {
  defaultChildName?: string;
  allowedLengths: readonly number[];
  storiesRemaining: number | null;
  isPremium: boolean;
}

export function StoryGeneratorForm({
  defaultChildName,
  allowedLengths,
  storiesRemaining,
  isPremium,
}: StoryGeneratorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [childName, setChildName] = useState(defaultChildName ?? "");
  const [category, setCategory] = useState<StoryCategory>("ADVENTURE");
  const [lengthMinutes, setLengthMinutes] = useState<number>(allowedLengths.includes(5) ? 5 : allowedLengths[0] ?? 2);
  const [bedtimeMood, setBedtimeMood] = useState<BedtimeMood>("CALM");
  const [moralTheme, setMoralTheme] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/storytime/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          category,
          lengthMinutes,
          bedtimeMood,
          moralTheme: moralTheme || undefined,
          learningGoal: learningGoal || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          toast.error(data.error ?? "Verify your email to create stories.", {
            action: {
              label: "Verify email",
              onClick: () => router.push("/auth/verify-email"),
            },
          });
          return;
        }
        throw new Error(data.error ?? "Story creation failed");
      }

      trackEvent("family_story_generated", { category, lengthMinutes });
      if (isPremium) trackEvent("premium_feature_used", { feature: "family_voice_storytime" });

      if (data.usedFallback) {
        toast.message("Your story is ready!", {
          description: "We used a personalized template tonight — AI will craft unique tales again soon.",
        });
      }

      router.push(`/stories/${data.story.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Story creation failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isPremium && storiesRemaining !== null && (
        <p className="text-xs text-muted-foreground rounded-xl bg-muted/50 px-3 py-2">
          {storiesRemaining} of 3 free AI stories left this month. Premium unlocks unlimited stories & family voices.
        </p>
      )}

      <div className="space-y-2">
        <Label>Child&apos;s name</Label>
        <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Emma" />
      </div>

      <div className="space-y-2">
        <Label>Story category</Label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {STORY_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`text-xs px-2.5 py-1 rounded-full border ${category === cat.value ? "bg-primary text-primary-foreground border-primary" : ""}`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Story length</Label>
        <div className="flex flex-wrap gap-2">
          {STORY_LENGTH_OPTIONS.filter((o) => allowedLengths.includes(o.value)).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLengthMinutes(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border ${lengthMinutes === opt.value ? "bg-primary text-primary-foreground border-primary" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bedtime mood</Label>
        <div className="flex flex-wrap gap-2">
          {BEDTIME_MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setBedtimeMood(m.value)}
              className={`text-xs px-3 py-1.5 rounded-full border ${bedtimeMood === m.value ? "bg-primary text-primary-foreground border-primary" : ""}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Input value={moralTheme} onChange={(e) => setMoralTheme(e.target.value)} placeholder="Moral theme (e.g. kindness)" />
        <Input value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} placeholder="Learning goal (e.g. sharing)" />
      </div>

      <Button className="w-full rounded-xl" size="lg" disabled={loading || !childName.trim()} onClick={generate}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Generate bedtime story
      </Button>
    </div>
  );
}
