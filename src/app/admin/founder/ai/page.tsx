"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";
import { FeatureBarChart } from "@/components/founder/founder-charts";

type AiData = Awaited<
  ReturnType<typeof import("@/lib/analytics-platform/ai-analytics").getFounderAiAnalytics>
>;

export default function FounderAiPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/ai")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<AiData>;
      })
      .then(setData)
      .catch(() => setError("Could not load AI analytics."));
  }, [status, router]);

  if (status === "loading" && !data && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold">AI Analytics</h2>
        <p className="text-xs text-muted-foreground">Cost, tokens, cache performance · no prompts stored</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Today's AI calls" value={data.today.calls} />
        <MetricCard label="Today's cost" value={`$${data.today.cost.toFixed(2)}`} />
        <MetricCard label="Avg cost / user" value={`$${data.today.avgCostPerUser.toFixed(3)}`} />
        <MetricCard
          label="Cache hit rate"
          value={`${Math.round(data.today.cacheHitPct * 100)}%`}
        />
        <MetricCard label="Avg tokens / request" value={data.today.avgTokensPerRequest} />
        <MetricCard label="LLM reach" value={`${Math.round(data.today.llmReachPct * 100)}%`} />
        <MetricCard label="Week cost" value={`$${data.week.cost.toFixed(2)}`} />
        <MetricCard label="Week calls" value={data.week.calls} />
      </section>

      <div className="flex flex-wrap gap-2">
        <Badge variant={data.health.cacheHit ? "secondary" : "destructive"} className="rounded-full">
          Cache: {data.health.cacheHit ? "On target" : "Below target"}
        </Badge>
        <Badge variant={data.health.llmReach ? "secondary" : "destructive"} className="rounded-full">
          LLM reach: {data.health.llmReach ? "On target" : "High"}
        </Badge>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cost by feature (today)</CardTitle>
          </CardHeader>
          <CardContent>
            <FeatureBarChart
              data={data.costByFeature.map((f) => ({
                feature: f.feature,
                count: f.cost,
              }))}
              labelKey="feature"
              valueKey="count"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top expensive users (today)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topExpensiveUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No AI usage today</p>
            ) : (
              data.topExpensiveUsers.map((u) => (
                <div key={u.userId} className="flex justify-between text-xs border rounded-lg p-2">
                  <span className="truncate pr-2">{u.email}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    ${u.cost.toFixed(3)} · {u.calls} calls
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
