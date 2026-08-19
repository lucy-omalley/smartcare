"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, CloudRain, MapPin, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TabLoadingScreen } from "@/components/layout/tab-loading-screen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FamilyAdventuresView, RecommendedAdventure } from "@/lib/family-adventures/types";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/use-translation";

function Stars({ count }: { count: number }) {
  return (
    <span className="text-amber-500 text-sm tracking-wider" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < count ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function AdventureCard({ adventure }: { adventure: RecommendedAdventure }) {
  return (
    <Link
      href={`/family-adventures/${adventure.id}`}
      onClick={() =>
        trackEvent("family_adventure_card_opened", {
          adventureId: adventure.id,
          title: adventure.title,
        })
      }
      className="block rounded-[1.75rem] border bg-card overflow-hidden shadow-md hover:shadow-lg hover:border-primary/25 transition-all"
    >
      <div className="h-36 bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50 dark:from-violet-950/40 dark:via-background flex items-center justify-center text-6xl">
        {adventure.imageEmoji}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg leading-snug">{adventure.title}</h3>
          <Stars count={adventure.matchStars} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{adventure.ageLabel}</span>
          <span>·</span>
          <span>{adventure.distanceKm} km</span>
          <span>·</span>
          <span>{adventure.travelMinutes} min</span>
          <span>·</span>
          <span>{adventure.priceLabel}</span>
          <span>·</span>
          <span>{adventure.durationMinutes} min visit</span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Why AI recommends it
          </p>
          <ul className="space-y-1">
            {adventure.whyRecommended.slice(0, 3).map((reason) => (
              <li key={reason} className="text-sm flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <span className="inline-flex items-center text-sm font-semibold text-primary">
          View Details
          <ArrowRight className="ml-1 h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function FamilyAdventuresDashboard() {
  const { t } = useTranslation();
  const [view, setView] = useState<FamilyAdventuresView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((collectionId?: string | null) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (collectionId) params.set("collection", collectionId);
    const query = params.toString();
    fetch(`/api/family-adventures${query ? `?${query}` : ""}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        setView(json.view as FamilyAdventuresView);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load adventures");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(activeCollection);
  }, [load, activeCollection]);

  if (loading && !view) {
    return <TabLoadingScreen message="Finding the best adventures near you…" icon="today" />;
  }

  if (error || !view) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-10 text-center space-y-4">
        <p className="text-destructive">{error ?? "Could not load adventures"}</p>
        <Button onClick={() => load(activeCollection)}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 pt-4 pb-16 space-y-8">
      <section className="rounded-[2rem] border bg-gradient-to-br from-violet-50 via-sky-50/80 to-emerald-50/60 dark:from-violet-950/30 dark:via-background p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          🌈 {t("familyAdventures.title")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{view.heroMessage}</h1>
        <p className="text-sm text-muted-foreground mb-4">{view.subtitle}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {view.isRainy ? <CloudRain className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
          <span>{view.weatherNote}</span>
        </div>
        <p className="text-sm font-medium">
          {view.recommendationCount} personalised recommendations waiting
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold px-0.5">{t("familyAdventures.topPicks")}</h2>
        <div className="space-y-4">
          {view.recommendations.map((adventure) => (
            <AdventureCard key={adventure.id} adventure={adventure} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">{t("familyAdventures.collections")}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
          {view.collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => {
                trackEvent("family_adventure_collection_selected", { collectionId: collection.id });
                setActiveCollection(activeCollection === collection.id ? null : collection.id);
              }}
              className={cn(
                "shrink-0 rounded-2xl border px-4 py-3 text-left min-w-[140px] transition-colors",
                activeCollection === collection.id
                  ? "border-primary bg-primary/10"
                  : "bg-card hover:border-primary/30"
              )}
            >
              <span className="text-xl">{collection.emoji}</span>
              <p className="text-sm font-semibold mt-1">{collection.label}</p>
              <p className="text-[10px] text-muted-foreground">{collection.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-dashed p-5 text-center space-y-2">
        <MapPin className="h-5 w-5 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("familyAdventures.moreComing")}
        </p>
      </section>
    </div>
  );
}
