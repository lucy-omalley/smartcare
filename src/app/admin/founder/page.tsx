"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { FounderOverview } from "@/lib/analytics-platform/insights";
import {
  MetricCard,
  AlertBanner,
  LoadingState,
  ErrorState,
} from "@/components/founder/founder-ui";
import {
  DailyBarChart,
  FeatureBarChart,
  ReferralPieList,
} from "@/components/founder/founder-charts";

export default function FounderDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<FounderOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/overview")
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setError("Founder access only.");
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<FounderOverview>;
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setError("Could not load founder overview."));
  }, [status, router]);

  if (status === "loading" || (!data && !error)) {
    return <LoadingState message="Loading founder dashboard…" />;
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">Overview</h2>
          <Badge variant="secondary" className="rounded-full text-[10px]">
            Updated {format(new Date(data.generatedAt), "d MMM HH:mm")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">{data.insights.summary}</p>
      </header>

      {data.insights.alerts.length > 0 ? (
        <section className="grid gap-2 md:grid-cols-2">
          {data.insights.alerts.map((a) => (
            <AlertBanner key={a.title} level={a.level} title={a.title} message={a.message} />
          ))}
        </section>
      ) : null}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="New users today" value={s.newUsersToday} />
        <MetricCard label="Daily active" value={s.dailyActiveUsers} />
        <MetricCard label="Weekly active" value={s.weeklyActiveUsers} />
        <MetricCard label="Monthly active" value={s.monthlyActiveUsers} />
        <MetricCard label="Today's AI cost" value={`$${data.today.aiCost.toFixed(2)}`} />
        <MetricCard label="Today's plans" value={data.today.plansGenerated} />
        <MetricCard label="Today's chats" value={data.today.chats} />
        <MetricCard
          label="Cache hit rate"
          value={`${Math.round(data.ai.today.cacheHitPct * 100)}%`}
        />
        <MetricCard label="Paid users" value={data.revenue.paidUsers} />
        <MetricCard label="Conversion rate" value={`${data.revenue.conversionRate}%`} />
        <MetricCard label="Top feature" value={data.features.mostPopular} />
        <MetricCard label="Top referral" value={data.acquisition.topReferral} />
        <MetricCard label="Onboarding rate" value={`${s.onboardingRate}%`} />
        <MetricCard label="Least used feature" value={data.features.leastUsed} />
        <MetricCard
          label="Growth Journey views (30d)"
          value={data.growthJourney.pageViews30d}
        />
        <MetricCard
          label="Family Adventures views (30d)"
          value={data.familyAdventures.dashboardViews30d}
        />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Growth Journey</CardTitle>
            <p className="text-xs text-muted-foreground">Personal child development coach — last 30 days where noted</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Page views (30d)" value={data.growthJourney.pageViews30d} />
              <MetricCard label="Unique users (30d)" value={data.growthJourney.uniqueUsers30d} />
              <MetricCard label="Missions started (30d)" value={data.growthJourney.missionsStarted30d} />
              <MetricCard label="Activity completions (30d)" value={data.growthJourney.activityCompletions30d} />
              <MetricCard label="Today widget taps (30d)" value={data.growthJourney.todayWidgetViews30d} />
              <MetricCard label="Users completing activities (30d)" value={data.growthJourney.usersWithCompletions30d} />
              <MetricCard label="Roadmap opens (30d)" value={data.growthJourney.roadmapOpens30d} />
              <MetricCard label="Skill views (30d)" value={data.growthJourney.skillViews30d} />
            </div>
            <DailyBarChart
              data={data.growthJourney.dailyViews}
              xKey="day"
              yKey="count"
            />
            {data.growthJourney.topMissions.length > 0 ? (
              <ul className="text-xs space-y-1.5">
                {data.growthJourney.topMissions.map((m) => (
                  <li key={m.title} className="flex justify-between gap-2 border-b py-1">
                    <span className="truncate">{m.title}</span>
                    <span className="text-muted-foreground shrink-0">{m.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No mission starts tracked yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">AI Family Adventures</CardTitle>
            <p className="text-xs text-muted-foreground">Weekend outing recommendations — last 30 days where noted</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Dashboard views (30d)" value={data.familyAdventures.dashboardViews30d} />
              <MetricCard label="Unique users (30d)" value={data.familyAdventures.uniqueUsers30d} />
              <MetricCard label="Today hero clicks (30d)" value={data.familyAdventures.heroClicks30d} />
              <MetricCard label="Detail views (30d)" value={data.familyAdventures.detailViews30d} />
              <MetricCard label="Saved (total)" value={data.familyAdventures.savedTotal} />
              <MetricCard label="Booking clicks (30d)" value={data.familyAdventures.bookingClicks30d} />
              <MetricCard label="Attended (30d)" value={data.familyAdventures.attended30d} />
              <MetricCard label="Map opens (30d)" value={data.familyAdventures.mapOpens30d} />
            </div>
            <DailyBarChart
              data={data.familyAdventures.dailyViews}
              xKey="day"
              yKey="count"
            />
            {data.familyAdventures.topAdventures.length > 0 ? (
              <ul className="text-xs space-y-1.5">
                {data.familyAdventures.topAdventures.map((a) => (
                  <li key={a.title} className="flex justify-between gap-2 border-b py-1">
                    <span className="truncate">{a.title}</span>
                    <span className="text-muted-foreground shrink-0">{a.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No adventure engagement tracked yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {data.insights.recommendations.length > 0 ? (
        <Card className="rounded-2xl border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">AI Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.insights.bullets.map((b) => (
              <p key={b} className="text-xs text-muted-foreground">
                • {b}
              </p>
            ))}
            {data.insights.recommendations.map((r) => (
              <p key={r} className="text-xs font-medium text-foreground">
                → {r}
              </p>
            ))}
            {data.funnelDropOff ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Biggest drop-off: {data.funnelDropOff.label} (
                {100 - (data.funnelDropOff.conversionFromPrevious ?? 0)}% lost)
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily active users (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyBarChart
              data={data.charts.dailyActiveUsers}
              xKey="day"
              yKey="count"
            />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily signups (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyBarChart data={data.charts.weeklySignups} xKey="day" yKey="count" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Feature usage</CardTitle>
          </CardHeader>
          <CardContent>
            <FeatureBarChart
              data={data.charts.featureUsage}
              labelKey="feature"
              valueKey="count"
            />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Referral sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ReferralPieList items={data.acquisition.referralSources} />
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent errors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentErrors.length === 0 ? (
            <p className="text-xs text-muted-foreground">No logged errors</p>
          ) : (
            data.recentErrors.slice(0, 8).map((err) => (
              <div key={err.id} className="text-xs border rounded-lg p-2 space-y-0.5">
                <div className="flex justify-between gap-2">
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {err.source}
                  </Badge>
                  <span className="text-muted-foreground">
                    {format(new Date(err.createdAt), "d MMM HH:mm")}
                  </span>
                </div>
                <p className="text-muted-foreground break-words">{err.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
