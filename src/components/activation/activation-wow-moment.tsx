"use client";

import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DailyBriefContent } from "@/types/daily-brief";
import type { HeroRecommendation } from "@/lib/activation/recommend-hero-feature";
import { RecommendedHeroCard } from "@/components/activation/recommended-hero-card";
import { useTranslation } from "@/hooks/use-translation";

type Props = {
  brief: DailyBriefContent;
  childName?: string | null;
  estimatedMinutes?: number;
  recommendation: HeroRecommendation;
  onStartJourney: () => void;
};

/** Step 3 — WOW moment: journey preview + one guided hero feature. */
export function ActivationWowMoment({
  brief,
  childName,
  estimatedMinutes = 45,
  recommendation,
  onStartJourney,
}: Props) {
  const { t, locale } = useTranslation();
  const name = childName?.trim() || (locale === "zh-CN" ? "孩子" : "your child");

  const items = [
    { emoji: "🎨", label: t("home.todaysActivity"), title: brief.play.title },
    { emoji: "📖", label: t("home.tonightsStory"), title: brief.bedtimeStory.title },
    { emoji: "🍎", label: t("home.todaysMeal"), title: brief.recipe.subtitle },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br from-amber-50 via-orange-50/90 to-primary/10 dark:from-amber-950/40 dark:to-primary/15 p-6 shadow-lg">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.todaysJourney")}
          </p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.label} className="flex items-start gap-3 text-sm">
                <span className="text-lg shrink-0">{item.emoji}</span>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="font-semibold">{item.title}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <Clock className="h-3.5 w-3.5" />
            {t("home.estimatedTime", { minutes: estimatedMinutes })}
          </div>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-base bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30"
            onClick={onStartJourney}
          >
            {t("home.startJourney")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground px-0.5">
          {t("activation.nextFor", { name })}
        </p>
        <RecommendedHeroCard recommendation={recommendation} variant="premium" />
      </div>
    </div>
  );
}
