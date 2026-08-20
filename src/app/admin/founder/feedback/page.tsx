"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/founder/founder-ui";
import type { FeedbackSubmissionRow } from "@/lib/analytics-platform/feedback-insights";

type Insights = {
  todayPlanRatings: { helpful: number; okay: number; notHelpful: number; total: number };
  avgBetaRating: number | null;
  topFeatureRequests: Array<{
    id: string;
    title: string;
    voteCount: number;
    status: string;
    submittedAt: string;
    submitterName: string | null;
    submitterEmail: string | null;
  }>;
  recentComplaints: string[];
  positiveThemes: string[];
  legacyFeatureIdeas: string[];
  featureUsage: { event: string; count: number }[];
  weeklyTrend: { feedbackSubmitted: number; notHelpfulRate: number };
  submissions: FeedbackSubmissionRow[];
};

function kindLabel(kind: FeedbackSubmissionRow["kind"]) {
  return kind === "beta" ? "Beta feedback" : "Today's Plan";
}

export default function FounderFeedbackPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/feedback")
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setError("Founder access only.");
          return null;
        }
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<Insights>;
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setError("Could not load feedback."));
  }, [status, router]);

  if (status === "loading" || (!data && !error)) {
    return <LoadingState message="Loading feedback…" />;
  }
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Feedback Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Last 30 days — who submitted, when, and what they said
        </p>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All submissions</CardTitle>
          <p className="text-xs text-muted-foreground">
            {data.submissions.length} items · bug/confusion reports highlighted
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="p-3 font-medium">When</th>
                  <th className="p-3 font-medium">Who</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Rating</th>
                  <th className="p-3 font-medium min-w-[240px]">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {data.submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No feedback submitted yet
                    </td>
                  </tr>
                ) : (
                  data.submissions.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 align-top hover:bg-muted/20">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.submittedAt), "d MMM yyyy HH:mm")}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{row.userName ?? "Unknown user"}</p>
                        {row.userEmail ? (
                          <p className="text-muted-foreground">{row.userEmail}</p>
                        ) : null}
                        {row.userId ? (
                          <Link
                            href={`/admin/founder/journey?userId=${row.userId}`}
                            className="text-primary hover:underline"
                          >
                            View journey
                          </Link>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            {kindLabel(row.kind)}
                          </Badge>
                          {row.isBugReport ? (
                            <Badge variant="destructive" className="rounded-full text-[10px]">
                              Bug / confusion
                            </Badge>
                          ) : null}
                        </div>
                        {row.page ? (
                          <p className="text-muted-foreground mt-1 truncate max-w-[120px]">{row.page}</p>
                        ) : null}
                      </td>
                      <td className="p-3 whitespace-nowrap">{row.ratingLabel ?? "—"}</td>
                      <td className="p-3 space-y-1">
                        <p className="text-muted-foreground">{row.summary}</p>
                        {row.confused ? (
                          <p>
                            <span className="font-medium text-destructive">Confused: </span>
                            {row.confused}
                          </p>
                        ) : null}
                        {row.improve ? (
                          <p>
                            <span className="font-medium">Improve: </span>
                            {row.improve}
                          </p>
                        ) : null}
                        {row.enjoyed ? (
                          <p>
                            <span className="font-medium text-primary">Liked: </span>
                            {row.enjoyed}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today plan — Very helpful</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.todayPlanRatings.helpful}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today plan — Not helpful</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">
            {data.todayPlanRatings.notHelpful}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Not helpful rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.weeklyTrend.notHelpfulRate}%</CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Feature requests (votes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {data.topFeatureRequests.map((f) => (
            <div key={f.id} className="border-b last:border-0 pb-2">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{f.title}</span>
                <span className="text-muted-foreground shrink-0">
                  {f.voteCount} votes · {f.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {f.submitterName ?? "Anonymous"} ·{" "}
                {format(new Date(f.submittedAt), "d MMM yyyy HH:mm")}
                {f.submitterEmail ? ` · ${f.submitterEmail}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
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
        <Card className="rounded-2xl">
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
    </div>
  );
}
