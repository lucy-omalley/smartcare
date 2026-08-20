"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GrowthIntelligenceDashboard } from "@/lib/analytics-platform/growth-intelligence";
import {
  MetricCard,
  AlertBanner,
  LoadingState,
  ErrorState,
} from "@/components/founder/founder-ui";
import {
  ConversionFunnelChart,
  FeatureBarChart,
  ReferralPieList,
} from "@/components/founder/founder-charts";
import { Download, Mail } from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "follow-up";

const SEGMENT_LABELS: Record<string, string> = {
  explorer: "Explorer — registered only",
  trying: "Trying — completed onboarding",
  activated: "Activated — uses hero features",
  engaged: "Engaged — returns weekly",
  champion: "Champion — 3+ hero features",
};

function healthDot(health: "green" | "yellow" | "red") {
  const colors = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500" };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[health]}`} />;
}

export default function GrowthIntelligencePage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<GrowthIntelligenceDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/growth")
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setError("Founder access only.");
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<GrowthIntelligenceDashboard>;
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setError("Could not load growth intelligence."));
  }, [status, router]);

  if (status === "loading" || (!data && !error)) {
    return <LoadingState message="Loading growth intelligence…" />;
  }
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const ns = data.northStar;
  const heroChartData = data.hero.features.map((f) => ({
    label: f.label,
    completed: f.completed,
  }));

  const sourceChartData = data.referral.sources.slice(0, 8).map((s) => ({
    source: s.source,
    count: s.signups,
  }));

  const followUpRows = [
    ...data.followUp.unverifiedEmail,
    ...data.followUp.registeredInactive,
    ...data.followUp.activatedDisappeared,
    ...data.followUp.powerUsers,
    ...data.followUp.sentFeedback,
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">Growth Intelligence</h2>
          <Badge variant="secondary" className="rounded-full text-[10px]">
            Updated {format(new Date(data.generatedAt), "d MMM HH:mm")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Who came, what they did, why they left — your 5-minute morning briefing. GDPR-safe: no
          child content in analytics.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={tab === "overview" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTab("overview")}
          >
            Overview
          </Button>
          <Button
            size="sm"
            variant={tab === "follow-up" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTab("follow-up")}
          >
            Follow-up ({followUpRows.length})
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" asChild>
            <a href="/admin/founder/journey">Watch User Journey</a>
          </Button>
          <Button size="sm" variant="outline" className="rounded-full gap-1" asChild>
            <a href="/api/admin/founder/growth/report-export">
              <Download className="h-3.5 w-3.5" />
              Full report
            </a>
          </Button>
          <Button size="sm" variant="outline" className="rounded-full gap-1" asChild>
            <a href="/api/admin/founder/growth/follow-up-export">
              <Download className="h-3.5 w-3.5" />
              Follow-up CSV
            </a>
          </Button>
        </div>
      </header>

      {data.alerts.length > 0 ? (
        <section className="grid gap-2 md:grid-cols-2">
          {data.alerts.map((a) => (
            <AlertBanner key={a.title} level={a.level} title={a.title} message={a.message} />
          ))}
        </section>
      ) : null}

      {tab === "follow-up" ? (
        <FollowUpTab followUp={data.followUp} />
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard
              label="Today's activation rate"
              value={`${data.activationPulse.activationRateToday}%`}
              hint={`${data.activationPulse.activatedToday} activated / ${data.activationPulse.signupsToday} signups`}
            />
            <MetricCard label="Returning today" value={data.activationPulse.returningUsersToday} />
            <MetricCard label="Best hero feature" value={data.hero.bestPerforming} />
            <MetricCard label="Top acquisition" value={data.referral.topSource} />
            <MetricCard
              label="Avg time to WOW"
              value={
                data.activationPulse.avgTimeToWowMinutes != null
                  ? `${data.activationPulse.avgTimeToWowMinutes}m`
                  : "—"
              }
              hint={`Target < ${data.activationPulse.wowTargetMinutes}m`}
            />
          </section>

          {data.funnelDropOff ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm">
              <p className="font-semibold">Biggest drop-off: {data.funnelDropOff.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {100 - (data.funnelDropOff.conversionFromPrevious ?? 0)}% lost at this step
              </p>
            </div>
          ) : null}

          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Activated today"
              value={ns.activatedToday}
              hint="Onboarding + Journey + hero feature"
            />
            <MetricCard label="Activated this week" value={ns.activatedThisWeek} />
            <MetricCard label="Activation rate" value={`${ns.activationRate}%`} hint={`${ns.totalActivated} / ${ns.signupsTotal} users`} />
            <MetricCard label="Signups this week" value={ns.signupsThisWeek} />
          </section>

          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{data.weeklyInsights.headline}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {data.weeklyInsights.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Growth funnel · 30 days</CardTitle>
                {data.funnelDropOff ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Biggest drop-off: {data.funnelDropOff.label} (
                    {100 - (data.funnelDropOff.conversionFromPrevious ?? 0)}% lost)
                  </p>
                ) : null}
              </CardHeader>
              <CardContent>
                <ConversionFunnelChart stages={data.funnel} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">User sources</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Top: {data.referral.topSource}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReferralPieList items={sourceChartData} />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left py-2 font-medium">Source</th>
                        <th className="text-right py-2 font-medium">Conv.</th>
                        <th className="text-right py-2 font-medium">Retain</th>
                        <th className="text-right py-2 font-medium">Activated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referral.sources.map((s) => (
                        <tr key={s.sourceKey} className="border-b last:border-0">
                          <td className="py-2">{s.source}</td>
                          <td className="py-2 text-right tabular-nums">{s.conversionRate}%</td>
                          <td className="py-2 text-right tabular-nums">{s.retentionRate}%</td>
                          <td className="py-2 text-right tabular-nums">{s.activated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Hero feature analytics</CardTitle>
              <p className="text-xs text-muted-foreground">
                Best performing: {data.hero.bestPerforming}
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <FeatureBarChart data={heroChartData} labelKey="label" valueKey="completed" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="text-left py-2 font-medium">Feature</th>
                      <th className="text-right py-2 font-medium">Views</th>
                      <th className="text-right py-2 font-medium">Started</th>
                      <th className="text-right py-2 font-medium">Done</th>
                      <th className="text-right py-2 font-medium">Saved</th>
                      <th className="text-right py-2 font-medium">7d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hero.features.map((f) => (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{f.label}</td>
                        <td className="py-2 text-right tabular-nums">{f.views}</td>
                        <td className="py-2 text-right tabular-nums">{f.started}</td>
                        <td className="py-2 text-right tabular-nums">{f.completed}</td>
                        <td className="py-2 text-right tabular-nums">{f.saved}</td>
                        <td className="py-2 text-right tabular-nums">{f.weeklyTrend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Day 1 retention" value={`${data.retention.summary.day1}%`} />
            <MetricCard label="Day 7 retention" value={`${data.retention.summary.day7}%`} />
            <MetricCard label="Day 30 retention" value={`${data.retention.summary.day30}%`} />
            <MetricCard label="Weekly returning" value={`${data.retention.weeklyReturning}%`} />
            <MetricCard label="Monthly returning" value={`${data.retention.monthlyReturning}%`} />
          </section>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Power user segments</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(data.powerUsers).map(([key, count]) => (
                <div key={key} className="rounded-xl border p-3">
                  <p className="text-2xl font-bold tabular-nums">{count}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                    {SEGMENT_LABELS[key] ?? key}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Exit analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  Avg session:{" "}
                  {data.exit.avgSessionSec != null
                    ? `${Math.round(data.exit.avgSessionSec / 60)}m ${data.exit.avgSessionSec % 60}s`
                    : "—"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Abandoned onboarding</p>
                    <p className="font-semibold tabular-nums">{data.exit.abandonedOnboarding}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Abandoned Toy Brain</p>
                    <p className="font-semibold tabular-nums">{data.exit.abandonedToyBrain}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Abandoned story</p>
                    <p className="font-semibold tabular-nums">{data.exit.abandonedStory}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Abandoned adventure</p>
                    <p className="font-semibold tabular-nums">{data.exit.abandonedHero}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Top exit pages</p>
                  {data.exit.topExitPages.map((e) => (
                    <div key={e.path} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="truncate max-w-[70%]">{e.path}</span>
                      <span className="text-muted-foreground tabular-nums">{e.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Onboarding analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard label="Started" value={data.onboarding.started} />
                  <MetricCard label="Completed" value={data.onboarding.completed} />
                  <MetricCard label="Completion" value={`${data.onboarding.completionRate}%`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.onboarding.dropOff} users dropped off · {data.onboarding.skipped} skipped a
                  step
                </p>
                <p className="text-xs text-muted-foreground">{data.onboarding.avgCompletionNote}</p>
              </CardContent>
            </Card>
          </div>

          <FeatureDeepDive hero={data.hero} />

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Founder signals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">AI cost today</p>
                <p className="font-semibold tabular-nums">${data.ai.todayCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cache hit rate</p>
                <p className="font-semibold tabular-nums">{data.ai.cacheHitPct}%</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">{healthDot("green")} Health 80+</span>
                <span className="flex items-center gap-1">{healthDot("yellow")} 40–79</span>
                <span className="flex items-center gap-1">{healthDot("red")} &lt;40</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function FeatureDeepDive({
  hero,
}: {
  hero: GrowthIntelligenceDashboard["hero"];
}) {
  const toy = hero.features.find((f) => f.id === "toyBrain");
  const voice = hero.features.find((f) => f.id === "familyVoice");
  const adventure = hero.features.find((f) => f.id === "adventure");
  const journey = hero.features.find((f) => f.id === "todaysJourney");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MiniFeatureCard
        title="Toy Brain"
        rows={[
          ["Scanned / started", toy?.started ?? 0],
          ["Added to today", toy?.completed ?? 0],
          ["Saved / favourited", toy?.saved ?? 0],
          ["Printed", toy?.printed ?? 0],
        ]}
      />
      <MiniFeatureCard
        title="Family Voice Story"
        rows={[
          ["Stories generated", voice?.started ?? 0],
          ["Completed", voice?.completed ?? 0],
          ["Played / shared", voice?.shared ?? 0],
          ["Favourited", voice?.saved ?? 0],
        ]}
      />
      <MiniFeatureCard
        title="Adventure Routine"
        rows={[
          ["Posters created", adventure?.saved ?? 0],
          ["Completed missions", adventure?.completed ?? 0],
          ["Printed", adventure?.printed ?? 0],
          ["QR scanned", adventure?.shared ?? 0],
        ]}
      />
      <MiniFeatureCard
        title="Today's Journey"
        rows={[
          ["Plans viewed", journey?.views ?? 0],
          ["Activities opened", journey?.started ?? 0],
          ["Completed", journey?.completed ?? 0],
          ["Stories saved", journey?.saved ?? 0],
        ]}
      />
    </div>
  );
}

function MiniFeatureCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, number][];
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatLastActive(u: Record<string, unknown>) {
  const raw = u.lastActiveAt;
  if (!raw || (typeof raw !== "string" && !(raw instanceof Date))) return "—";
  return format(new Date(raw), "d MMM yyyy");
}

function FollowUpTab({
  followUp,
}: {
  followUp: GrowthIntelligenceDashboard["followUp"];
}) {
  const [sendingReminders, setSendingReminders] = useState(false);

  const sendVerificationReminders = async (dryRun: boolean) => {
    setSendingReminders(true);
    try {
      const res = await fetch("/api/admin/founder/growth/send-verification-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          userIds: followUp.unverifiedEmail.map((u) => u.id),
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        sent?: number;
        total?: number;
        results?: Array<{ email: string; status: string }>;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed");

      if (dryRun) {
        const wouldSend = json.results?.filter((r) => r.status === "would_send").length ?? 0;
        toast.message(`Preview: ${wouldSend} of ${json.total ?? 0} would receive a reminder`);
      } else {
        toast.success(`Sent ${json.sent ?? 0} verification reminder${json.sent === 1 ? "" : "s"}`);
      }
    } catch {
      toast.error("Could not send verification reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  const sections = [
    {
      title: "Email not verified",
      rows: followUp.unverifiedEmail,
      actions: followUp.unverifiedEmail.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full h-8 text-xs"
            disabled={sendingReminders}
            onClick={() => void sendVerificationReminders(true)}
          >
            Preview reminders
          </Button>
          <Button
            size="sm"
            className="rounded-full h-8 text-xs gap-1"
            disabled={sendingReminders}
            onClick={() => void sendVerificationReminders(false)}
          >
            <Mail className="h-3.5 w-3.5" />
            {sendingReminders ? "Sending…" : "Send verification reminders"}
          </Button>
        </div>
      ),
    },
    { title: "Registered but inactive", rows: followUp.registeredInactive },
    { title: "Activated but disappeared", rows: followUp.activatedDisappeared },
    { title: "Power users — recommend Premium", rows: followUp.powerUsers },
    { title: "Sent feedback", rows: followUp.sentFeedback },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Verification reminders include a fresh link, deliverability tips (spam folder), and run
        automatically at 1h and 24h after signup via hourly cron.
      </p>
      {sections.map((section) => (
        <Card key={section.title} className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {section.title}{" "}
              <Badge variant="secondary" className="rounded-full ml-1 text-[10px]">
                {section.rows.length}
              </Badge>
            </CardTitle>
            {"actions" in section ? section.actions : null}
          </CardHeader>
          <CardContent className="p-0">
            {section.rows.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4">None right now</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="p-3 font-medium">User</th>
                      <th className="p-3 font-medium">Source</th>
                      <th className="p-3 font-medium">Reason</th>
                      <th className="p-3 font-medium">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((u) => (
                      <tr key={`${section.title}-${u.email}`} className="border-b last:border-0">
                        <td className="p-3">
                          <p className="font-medium">{u.name ?? "—"}</p>
                          <p className="text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="p-3">{u.referralSource}</td>
                        <td className="p-3">{u.reason}</td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {formatLastActive(u)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
