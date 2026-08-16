"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";
import type { PosterFounderMetrics } from "@/types/routine-poster";

export default function FounderPostersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<PosterFounderMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/posters")
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
      .catch(() => setError("Could not load poster metrics."));
  }, [status, router]);

  if (status === "loading" || (!metrics && !error)) {
    return <LoadingState message="Loading poster metrics…" />;
  }
  if (error) return <ErrorState message={error} />;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold">AI Routine Designer</h2>
        <p className="text-sm text-muted-foreground">Printable routine posters — last 30 days where noted</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Posters created" value={metrics.totalPostersCreated} />
        <MetricCard label="AI-generated" value={metrics.aiGeneratedPosters} />
        <MetricCard label="Prints (30d)" value={metrics.printsLast30Days} />
        <MetricCard label="QR scans (30d)" value={metrics.qrScansLast30Days} />
        <MetricCard label="Downloads (30d)" value={metrics.posterDownloadsLast30Days} />
        <MetricCard label="Avg QR scan rate" value={metrics.averageQrScanRate} />
        <MetricCard label="Active users (30d)" value={metrics.weeklyActivePosterUsers} />
        <MetricCard label="Premium + posters" value={metrics.premiumConversionSignal} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top routine types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {metrics.topRoutineTypes.map((t) => (
              <div key={t.template} className="flex justify-between">
                <span>{t.template}</span>
                <span className="text-muted-foreground">{t.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top themes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {metrics.topThemes.map((t) => (
              <div key={t.theme} className="flex justify-between">
                <span>{t.theme}</span>
                <span className="text-muted-foreground">{t.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most printed posters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {metrics.mostPrintedPosters.length === 0 ? (
            <p className="text-muted-foreground">No prints yet</p>
          ) : (
            metrics.mostPrintedPosters.map((p) => (
              <div key={p.posterId} className="flex justify-between gap-4">
                <span className="truncate">{p.title}</span>
                <span className="text-muted-foreground shrink-0">{p.printCount} prints</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
