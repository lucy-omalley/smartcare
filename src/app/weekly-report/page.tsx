"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2 } from "lucide-react";
import type { WeeklyGrowthReportContent } from "@/types/learning-plan";
import { trackEvent } from "@/lib/analytics";

export default function WeeklyReportPage() {
  const { status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyGrowthReportContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/weekly-report")
      .then((r) => r.json())
      .then((d) => {
        if (d.content) {
          setReport(d.content);
          trackEvent("weekly_report_viewed");
          trackEvent("premium_feature_used", { feature: "weekly_report" });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const sections = report
    ? [
        { title: "Wins This Week", body: report.winsThisWeek, emoji: "⭐" },
        { title: "Skills Practiced", body: report.skillsPracticed?.join(" · "), emoji: "🧠" },
        { title: "Development Progress", body: report.developmentProgress, emoji: "📈" },
        { title: "Suggested Focus", body: report.suggestedFocus, emoji: "🎯" },
        {
          title: "Recommended Activities",
          body: report.recommendedActivities?.join("\n"),
          emoji: "🎨",
        },
        {
          title: "Next Week Goals",
          body: report.nextWeekGoals?.join("\n"),
          emoji: "📅",
        },
        { title: "Encouragement", body: report.encouragement, emoji: "💛" },
      ]
    : [];

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-12">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Weekly Growth Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your child&apos;s progress this week — timeline-style insights from your Parenfy journey.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : report ? (
          <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {sections.map((s, i) => (
              <Card key={s.title} className="rounded-2xl ml-6 relative">
                <span className="absolute -left-[1.85rem] top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <CardHeader className="pb-1 p-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{s.emoji}</span>
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm whitespace-pre-line">{s.body}</CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Button className="w-full rounded-xl" onClick={() => window.location.reload()}>
            Generate report
          </Button>
        )}
      </div>
    </AppShell>
  );
}
