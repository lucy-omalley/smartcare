"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Baby,
  Bookmark,
  Car,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Sparkles,
  Accessibility,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TabLoadingScreen } from "@/components/layout/tab-loading-screen";
import { Button } from "@/components/ui/button";
import type { RecommendedAdventure } from "@/lib/family-adventures/types";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

type DetailResponse = {
  adventure: RecommendedAdventure;
  isSaved: boolean;
  childName: string;
};

export function FamilyAdventureDetail({ adventureId }: { adventureId: string }) {
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/family-adventures/${adventureId}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Not found");
        setData(json as DetailResponse);
        setIsSaved(json.isSaved);
      })
      .catch(() => router.replace("/family-adventures"))
      .finally(() => setLoading(false));
  }, [adventureId, router]);

  const action = async (actionName: string, extra?: Record<string, unknown>) => {
    const res = await fetch(`/api/family-adventures/${adventureId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName, ...extra }),
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  if (loading || !data) {
    return <TabLoadingScreen message="Loading adventure details…" icon="today" />;
  }

  const { adventure, childName } = data;
  const mapsUrl = adventure.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adventure.mapQuery)}`
    : null;

  return (
    <div className="container max-w-lg mx-auto px-4 pt-4 pb-20 space-y-6">
      <Button variant="ghost" size="sm" className="rounded-full -ml-2" asChild>
        <Link href="/family-adventures">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      <div className="rounded-[2rem] overflow-hidden border shadow-lg">
        <div className="h-48 bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-100 dark:from-violet-950/50 flex items-center justify-center text-7xl">
          {adventure.imageEmoji}
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{adventure.title}</h1>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              {adventure.location}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border px-3 py-1">{adventure.ageLabel}</span>
            <span className="rounded-full border px-3 py-1">{adventure.distanceKm} km</span>
            <span className="rounded-full border px-3 py-1">{adventure.travelMinutes} min travel</span>
            <span className="rounded-full border px-3 py-1">{adventure.priceLabel}</span>
            <span className="rounded-full border px-3 py-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {adventure.durationMinutes} min
            </span>
            {adventure.eventDateLabel && (
              <span className="rounded-full border px-3 py-1 bg-primary/5">{adventure.eventDateLabel}</span>
            )}
          </div>

          <div className="rounded-2xl bg-primary/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Why AI recommends it</p>
            <ul className="space-y-1.5">
              {adventure.whyRecommended.map((reason) => (
                <li key={reason} className="text-sm flex gap-2">
                  <span className="text-primary">✓</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{adventure.description}</p>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border bg-muted/30 p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
              onClick={() => trackEvent("family_adventure_map_opened", { adventureId })}
            >
              <MapPin className="h-4 w-4 text-primary" />
              Open in Maps
              <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            </a>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {adventure.openingHours && (
              <div className="rounded-xl border p-3 col-span-2">
                <p className="font-medium mb-1">Opening hours</p>
                <p className="text-muted-foreground">{adventure.openingHours}</p>
              </div>
            )}
            {adventure.parking && (
              <div className="rounded-xl border p-3">
                <Car className="h-4 w-4 mb-1 text-muted-foreground" />
                <p className="font-medium">Parking</p>
                <p className="text-muted-foreground mt-0.5">{adventure.parking}</p>
              </div>
            )}
            <div className="rounded-xl border p-3 flex gap-2 flex-wrap items-center">
              {adventure.wheelchairAccess && (
                <span className="inline-flex items-center gap-1">
                  <Accessibility className="h-3.5 w-3.5" /> Accessible
                </span>
              )}
              {adventure.babyFacilities && (
                <span className="inline-flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5" /> Baby facilities
                </span>
              )}
            </div>
          </div>

          {adventure.whatToBring.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">What to bring</p>
              <div className="flex flex-wrap gap-1.5">
                {adventure.whatToBring.map((item) => (
                  <span key={item} className="text-xs rounded-full bg-muted px-2.5 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Learning connection for {childName}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {adventure.learningSkills.map((skill) => (
                <span key={skill} className="text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 px-2.5 py-1">
                  {skill}
                </span>
              ))}
            </div>
            {adventure.followUpActivity && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">Follow-up: </span>
                {adventure.followUpActivity}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 sticky bottom-4">
        {adventure.bookingUrl && (
          <Button className="w-full rounded-2xl h-12 flex-col gap-0.5 py-2" asChild>
            <a
              href={adventure.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void action("booking")}
            >
              <span className="inline-flex items-center">
                {adventure.bookingLabel ?? "Book / Learn More"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </span>
              {adventure.eventDateLabel && (
                <span className="text-[11px] font-normal opacity-80">{adventure.eventDateLabel}</span>
              )}
            </a>
          </Button>
        )}
        <Button
          className="w-full rounded-2xl h-12"
          variant="secondary"
          onClick={async () => {
            try {
              await action("attend");
              trackEvent("family_adventure_attend_clicked", { adventureId });
              toast.success("Added to your family adventure timeline!");
            } catch {
              toast.error("Could not save — try again");
            }
          }}
        >
          <Heart className="h-4 w-4 mr-2" />
          Attend Event — Update Today&apos;s Journey
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-2xl h-11"
          onClick={async () => {
            try {
              await action(isSaved ? "unsave" : "save");
              setIsSaved(!isSaved);
              toast.success(isSaved ? "Removed from wishlist" : "Saved for later");
            } catch {
              toast.error("Could not update wishlist");
            }
          }}
        >
          <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved" : "Save for Later"}
        </Button>
      </div>
    </div>
  );
}
