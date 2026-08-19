"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroRecommendation } from "@/lib/activation/recommend-hero-feature";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

type Props = {
  recommendation: HeroRecommendation;
  variant?: "default" | "premium";
  className?: string;
};

export function RecommendedHeroCard({ recommendation, variant = "default", className }: Props) {
  useEffect(() => {
    trackEvent("hero_feature_recommended", {
      feature: recommendation.id,
      reason: recommendation.reason,
    });
  }, [recommendation.id, recommendation.reason]);

  const gradients = {
    toyBrain: "from-sky-50 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/30 border-sky-200/80",
    adventure: "from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30 border-emerald-200/80",
    familyVoice: "from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/30 border-indigo-200/80",
  };

  return (
    <Link
      href={recommendation.href}
      onClick={() =>
        trackEvent("feature_used", { feature: recommendation.label, source: "hero_recommendation" })
      }
      className={cn(
        "block rounded-[1.75rem] border p-6 bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow",
        gradients[recommendation.id],
        variant === "premium" && "p-7",
        className
      )}
    >
      <span className="text-4xl block mb-4" aria-hidden>
        {recommendation.emoji}
      </span>
      <h3 className="text-xl font-bold leading-tight">{recommendation.label}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{recommendation.benefit}</p>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-2xl mt-5 w-full h-12 px-4 text-sm font-semibold",
          "bg-primary text-primary-foreground",
          variant === "premium" && "h-12 text-base"
        )}
      >
        {recommendation.cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </Link>
  );
}
