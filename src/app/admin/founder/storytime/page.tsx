"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";

interface StorytimeMetrics {
  totalStoriesGenerated: number;
  totalVoiceProfiles: number;
  readyVoiceProfiles: number;
  averageStoryDurationMinutes: number;
  storyCompletionPercent: number;
  averageListeningSeconds: number;
  narratorUsage: { familyVoice: number; standard: number };
  mostPopularThemes: Array<{ category: string; count: number }>;
  premiumStoryUsage: number;
}

export default function FounderStorytimePage() {
  const { status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<StorytimeMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/storytime")
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setError("Founder access only.");
          return null;
        }
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (data?.metrics) setMetrics(data.metrics);
      })
      .catch(() => setError("Could not load storytime metrics."));
  }, [status, router]);

  if (status === "loading" || (!metrics && !error)) {
    return <LoadingState message="Loading storytime metrics…" />;
  }
  if (error) return <ErrorState message={error} />;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold">Family Voice Storytime</h2>
        <p className="text-sm text-muted-foreground">Premium signature feature — last 30 days where noted</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Stories generated" value={metrics.totalStoriesGenerated} />
        <MetricCard label="Voice profiles" value={metrics.totalVoiceProfiles} />
        <MetricCard label="Ready voices" value={metrics.readyVoiceProfiles} />
        <MetricCard label="Avg story length" value={`${metrics.averageStoryDurationMinutes} min`} />
        <MetricCard label="Completion rate" value={`${metrics.storyCompletionPercent}%`} />
        <MetricCard label="Avg listen time" value={`${metrics.averageListeningSeconds}s`} />
        <MetricCard label="Family voice plays" value={metrics.narratorUsage.familyVoice} />
        <MetricCard label="Premium story usage" value={metrics.premiumStoryUsage} />
      </section>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Most popular story themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.mostPopularThemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stories yet.</p>
          ) : (
            metrics.mostPopularThemes.map((t) => (
              <div key={t.category} className="flex justify-between text-sm">
                <span>{t.category}</span>
                <span className="text-muted-foreground">{t.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
