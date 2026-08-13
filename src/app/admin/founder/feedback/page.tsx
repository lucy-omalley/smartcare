"use client";

import { useEffect, useState } from "react";
import { FounderShell } from "@/components/founder/founder-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Insights = {
  todayPlanRatings: { helpful: number; okay: number; notHelpful: number; total: number };
  avgBetaRating: number | null;
  topFeatureRequests: { id: string; title: string; voteCount: number; status: string }[];
  recentComplaints: string[];
  positiveThemes: string[];
  legacyFeatureIdeas: string[];
  featureUsage: { event: string; count: number }[];
  weeklyTrend: { feedbackSubmitted: number; notHelpfulRate: number };
};

export default function FounderFeedbackPage() {
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    fetch("/api/admin/founder/feedback")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <FounderShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Feedback Intelligence</h2>
          <p className="text-sm text-muted-foreground">Last 30 days — themes from beta testers</p>
        </div>

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Today plan — Very helpful</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{data.todayPlanRatings.helpful}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Today plan — Not helpful</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold text-destructive">
                  {data.todayPlanRatings.notHelpful}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Not helpful rate</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{data.weeklyTrend.notHelpfulRate}%</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Most requested features (votes)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.topFeatureRequests.map((f) => (
                  <div key={f.id} className="flex justify-between gap-2">
                    <span>{f.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {f.voteCount} · {f.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Common complaints</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {data.recentComplaints.length ? (
                    data.recentComplaints.map((c, i) => (
                      <p key={i} className="text-muted-foreground border-l-2 pl-2">
                        {c.slice(0, 200)}
                      </p>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No complaints yet.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Positive themes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {data.positiveThemes.map((t, i) => (
                    <p key={i} className="text-muted-foreground border-l-2 border-primary pl-2">
                      {t.slice(0, 200)}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Premium feature usage (events)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {data.featureUsage.map((f) => (
                  <div key={f.event} className="flex justify-between">
                    <span>{f.event}</span>
                    <span>{f.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Loading…</p>
        )}
      </div>
    </FounderShell>
  );
}
