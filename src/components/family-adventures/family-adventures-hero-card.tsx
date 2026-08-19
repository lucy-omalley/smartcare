"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CloudRain, Sparkles } from "lucide-react";
import type { FamilyAdventuresView } from "@/lib/family-adventures/types";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export function FamilyAdventuresHeroCard({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Pick<
    FamilyAdventuresView,
    "heroMessage" | "recommendationCount" | "isRainy"
  > | null>(null);

  useEffect(() => {
    fetch("/api/family-adventures", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.view) {
          setSummary({
            heroMessage: json.view.heroMessage,
            recommendationCount: json.view.recommendationCount,
            isRainy: json.view.isRainy,
          });
        }
      })
      .catch(() => {});
  }, []);

  const message = summary?.heroMessage ?? t("familyAdventures.heroDefault");
  const count = summary?.recommendationCount ?? 3;

  return (
    <Link
      href="/family-adventures"
      onClick={() => trackEvent("family_adventures_hero_clicked", { source: "today" })}
      className={cn(
        "block rounded-[2rem] border overflow-hidden shadow-lg hover:shadow-xl transition-all",
        "bg-gradient-to-br from-violet-100/90 via-fuchsia-50/70 to-amber-50/80",
        "dark:from-violet-950/50 dark:via-fuchsia-950/20 dark:to-amber-950/20",
        "hover:border-primary/30",
        className
      )}
    >
      <div className="p-6 md:p-7 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              🌈 {t("familyAdventures.title")}
            </p>
            <h2 className="text-xl font-bold leading-snug">{message}</h2>
          </div>
          <span className="text-3xl" aria-hidden>
            {summary?.isRainy ? "🌧" : "✨"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {summary?.isRainy ? (
            <CloudRain className="h-4 w-4 shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          )}
          {t("familyAdventures.waiting", { count })}
        </p>
        <span className="inline-flex items-center justify-center w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-md">
          {t("familyAdventures.exploreToday")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
