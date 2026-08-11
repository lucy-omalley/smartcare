"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";
import { DailyBarChart } from "@/components/founder/founder-charts";

type RetentionData = {
  retention: {
    cohorts: Array<{
      cohortWeek: string;
      size: number;
      day1: number;
      day3: number;
      day7: number;
      day14: number;
      day30: number;
    }>;
    summary: { day1: number; day3: number; day7: number; day14: number; day30: number };
  };
  dormant: Array<{
    id: string;
    email: string;
    name: string;
    lastActiveAt: string | null;
    planTier: string;
  }>;
  churnRate: number;
};

export default function FounderRetentionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RetentionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/retention")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<RetentionData>;
      })
      .then(setData)
      .catch(() => setError("Could not load retention."));
  }, [status, router]);

  if (status === "loading" && !data && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const summary = data.retention.summary;
  const cohortChart = data.retention.cohorts
    .filter((c) => c.size > 0)
    .map((c) => ({ week: c.cohortWeek.slice(5), day7: c.day7, size: c.size }));

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold">Retention & Churn</h2>
        <p className="text-xs text-muted-foreground">Cohort analysis · dormant user tracking</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Day 1" value={`${summary.day1}%`} />
        <MetricCard label="Day 3" value={`${summary.day3}%`} />
        <MetricCard label="Day 7" value={`${summary.day7}%`} />
        <MetricCard label="Day 14" value={`${summary.day14}%`} />
        <MetricCard label="Day 30" value={`${summary.day30}%`} />
        <MetricCard label="Churn rate (est.)" value={`${data.churnRate}%`} hint="Based on D7 inverse" />
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Day 7 retention by cohort week</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyBarChart data={cohortChart} xKey="week" yKey="day7" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Dormant users (14+ days inactive)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.dormant.length === 0 ? (
            <p className="text-xs text-muted-foreground">No dormant onboarded users</p>
          ) : (
            data.dormant.map((u) => (
              <div key={u.id} className="flex justify-between text-xs border rounded-lg p-2">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right text-muted-foreground">
                  <p>{u.planTier}</p>
                  <p>
                    {u.lastActiveAt
                      ? format(new Date(u.lastActiveAt), "d MMM yyyy")
                      : "Never active"}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
