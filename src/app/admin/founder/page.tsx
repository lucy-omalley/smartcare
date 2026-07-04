"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FounderMetrics } from "@/lib/services/founder-metrics";
import { format } from "date-fns";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function BarChart({
  title,
  data,
  labelKey,
  valueKey,
}: {
  title: string;
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet</p>
        ) : (
          data.map((row) => {
            const label = String(row[labelKey]);
            const value = Number(row[valueKey]) || 0;
            return (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate pr-2">{label}</span>
                  <span className="text-muted-foreground shrink-0">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.round((value / max) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function InsightList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet</p>
        ) : (
          items.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm gap-2">
              <span className="truncate">{item.name}</span>
              <Badge variant="secondary" className="rounded-full shrink-0">{item.count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function FounderDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<FounderMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/metrics")
      .then(async (res) => {
        if (res.status === 403) {
          setError("Admin access only. Set FOUNDER_ADMIN_EMAILS in Vercel.");
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<FounderMetrics>;
      })
      .then((data) => {
        if (data) setMetrics(data);
      })
      .catch(() => setError("Could not load founder metrics."));
  }, [status, router]);

  if (status === "loading" || (!metrics && !error)) {
    return (
      <AppShell>
        <div className="container max-w-5xl mx-auto p-6 text-sm text-muted-foreground">Loading founder dashboard…</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center space-y-2">
          <p className="text-destructive text-sm">{error}</p>
          <p className="text-xs text-muted-foreground">Signed in as {session?.user?.email}</p>
        </div>
      </AppShell>
    );
  }

  if (!metrics) return null;

  const s = metrics.summary;

  return (
    <AppShell>
      <div className="container max-w-5xl mx-auto p-4 pb-10 space-y-6">
        <header className="space-y-1 pt-2">
          <h1 className="text-xl font-bold">Founder Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Internal beta metrics · Updated {format(new Date(metrics.generatedAt), "d MMM yyyy HH:mm")}
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total users" value={s.totalUsers} />
          <MetricCard label="New today" value={s.newUsersToday} />
          <MetricCard label="Daily active" value={s.dailyActiveUsers} />
          <MetricCard label="Weekly active" value={s.weeklyActiveUsers} />
          <MetricCard label="Monthly active" value={s.monthlyActiveUsers} />
          <MetricCard label="Onboarding done" value={`${s.onboardingRate}%`} />
          <MetricCard label="Returning users" value={s.returningUsers} />
          <MetricCard label="Most used feature" value={s.mostUsedFeature} />
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="MumBot questions" value={metrics.events.mumbot_question_asked ?? 0} />
          <MetricCard label="Stories read" value={s.storiesRead} />
          <MetricCard label="Meals viewed" value={s.mealsViewed} />
          <MetricCard label="Activities started" value={s.activitiesStarted} />
          <MetricCard label="Connect requests" value={s.connectRequests} />
          <MetricCard label="Events created" value={s.eventsCreated} />
          <MetricCard label="Parent check-ins" value={s.parentCheckins} />
          <MetricCard label="Feedback" value={s.feedbackSubmitted} />
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <BarChart
            title="Daily active users (14 days)"
            data={metrics.charts.dailyActiveUsers}
            labelKey="day"
            valueKey="count"
          />
          <BarChart
            title="Daily signups (14 days)"
            data={metrics.charts.weeklySignups}
            labelKey="day"
            valueKey="count"
          />
          <BarChart
            title="Feature usage"
            data={metrics.charts.featureUsage}
            labelKey="feature"
            valueKey="count"
          />
          <BarChart
            title="Retention"
            data={metrics.charts.retention}
            labelKey="label"
            valueKey="count"
          />
          <BarChart
            title="MumBot usage"
            data={metrics.charts.mumbotUsage}
            labelKey="label"
            valueKey="count"
          />
          <BarChart
            title="Connect usage"
            data={metrics.charts.connectUsage}
            labelKey="label"
            valueKey="count"
          />
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <InsightList title="Most popular parenting goals" items={metrics.insights.topParentingGoals} />
          <InsightList title="Most common challenges" items={metrics.insights.topChallenges} />
          <InsightList title="Most popular child age" items={metrics.insights.topChildAges} />
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <InsightList title="Most opened stories" items={metrics.insights.topStories} />
          <InsightList title="Most viewed meals" items={metrics.insights.topMeals} />
          <InsightList title="Most viewed activities" items={metrics.insights.topActivities} />
        </section>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.recentErrors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No logged errors</p>
            ) : (
              metrics.recentErrors.map((err) => (
                <div key={err.id} className="text-xs border rounded-lg p-2 space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <Badge variant="outline" className="rounded-full text-[10px]">{err.source}</Badge>
                    <span className="text-muted-foreground">{format(new Date(err.createdAt), "d MMM HH:mm")}</span>
                  </div>
                  <p className="text-muted-foreground break-words">{err.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
