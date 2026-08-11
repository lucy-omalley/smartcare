"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";
import type { BetaUserRow } from "@/lib/analytics-platform/beta-dashboard";

type BetaData = {
  users: BetaUserRow[];
  totals: { feedback: number; featureRequests: number; bugReports: number };
};

export default function FounderBetaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<BetaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/beta")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<BetaData>;
      })
      .then(setData)
      .catch(() => setError("Could not load beta dashboard."));
  }, [status, router]);

  if (status === "loading" && !data && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const statusVariant = (s: BetaUserRow["inviteStatus"]) => {
    if (s === "active") return "secondary";
    if (s === "new") return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold">Beta Users</h2>
        <p className="text-xs text-muted-foreground">Top 20 most active parents · feedback & engagement</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="Total feedback" value={data.totals.feedback} />
        <MetricCard label="Feature requests (30d)" value={data.totals.featureRequests} />
        <MetricCard label="Bug reports (30d)" value={data.totals.bugReports} />
      </section>

      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Most active beta users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="p-3 font-medium">Parent</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Sessions</th>
                  <th className="p-3 font-medium">Events</th>
                  <th className="p-3 font-medium">Feedback</th>
                  <th className="p-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {data.users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No beta activity yet
                    </td>
                  </tr>
                ) : (
                  data.users.map((u) => (
                    <tr key={u.userId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant(u.inviteStatus)} className="rounded-full text-[10px]">
                          {u.inviteStatus}
                        </Badge>
                      </td>
                      <td className="p-3 tabular-nums">{u.sessions}</td>
                      <td className="p-3 tabular-nums">{u.events}</td>
                      <td className="p-3 tabular-nums">{u.feedbackCount}</td>
                      <td className="p-3 text-muted-foreground">
                        {u.lastActive ? format(new Date(u.lastActive), "d MMM") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
