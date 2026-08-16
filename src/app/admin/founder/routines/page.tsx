"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";

interface RoutineMetrics {
  totalRoutinesCreated: number;
  aiGeneratedRoutines: number;
  completionsLast30Days: number;
  averageCompletionRate: number;
  averageDurationSeconds: number;
  dailyActiveRoutineUsers: number;
  mostPopularTemplates: Array<{ template: string; count: number }>;
  retentionSignal: number;
}

export default function FounderRoutinesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<RoutineMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/routines")
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
      .catch(() => setError("Could not load routine metrics."));
  }, [status, router]);

  if (status === "loading" || (!metrics && !error)) {
    return <LoadingState message="Loading routine metrics…" />;
  }
  if (error) return <ErrorState message={error} />;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold">Visual Routine Studio</h2>
        <p className="text-sm text-muted-foreground">Last 30 days where noted</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Routines created" value={metrics.totalRoutinesCreated} />
        <MetricCard label="AI-generated" value={metrics.aiGeneratedRoutines} />
        <MetricCard label="Completions (30d)" value={metrics.completionsLast30Days} />
        <MetricCard label="Avg completion %" value={`${metrics.averageCompletionRate}%`} />
        <MetricCard label="Active users (30d)" value={metrics.dailyActiveRoutineUsers} />
        <MetricCard label="Avg duration (sec)" value={metrics.averageDurationSeconds} />
        <MetricCard label="3+ completions" value={metrics.retentionSignal} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Popular templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {metrics.mostPopularTemplates.map((t) => (
            <div key={t.template} className="flex justify-between">
              <span>{t.template}</span>
              <span className="text-muted-foreground">{t.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
