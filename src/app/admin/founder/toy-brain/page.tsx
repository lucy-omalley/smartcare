"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";
import type { ToyBrainFounderMetrics } from "@/types/toy-brain";

export default function FounderToyBrainPage() {
  const { status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<ToyBrainFounderMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/toy-brain")
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
      .catch(() => setError("Could not load Toy Brain metrics."));
  }, [status, router]);

  if (status === "loading" || (!metrics && !error)) {
    return <LoadingState message="Loading Toy Brain metrics…" />;
  }
  if (error) return <ErrorState message={error} />;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold">AI Toy Brain</h2>
        <p className="text-sm text-muted-foreground">Toy recognition &amp; play ideas — last 30 days where noted</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Toys scanned (total)" value={metrics.totalToysScanned} />
        <MetricCard label="Confirmed toys" value={metrics.confirmedToys} />
        <MetricCard label="Scans (30d)" value={metrics.scansLast30Days} />
        <MetricCard label="Added to Today" value={metrics.activitiesAddedToToday} />
        <MetricCard label="Favourite toys" value={metrics.favouriteToys} />
        <MetricCard label="Active users (30d)" value={metrics.weeklyActiveToyBrainUsers} />
        <MetricCard label="Premium + toys" value={metrics.premiumConversionSignal} />
      </div>

      {metrics.topCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Top categories</h3>
          <ul className="text-sm space-y-1">
            {metrics.topCategories.map((c) => (
              <li key={c.category} className="flex justify-between border-b py-1">
                <span>{c.category}</span>
                <span className="text-muted-foreground">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {metrics.topActivities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Popular activities (Today adds)</h3>
          <ul className="text-sm space-y-1">
            {metrics.topActivities.map((a) => (
              <li key={a.title} className="flex justify-between border-b py-1">
                <span className="truncate pr-2">{a.title}</span>
                <span className="text-muted-foreground shrink-0">{a.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
