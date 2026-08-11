"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingState, ErrorState, MetricCard } from "@/components/founder/founder-ui";
import { DailyBarChart } from "@/components/founder/founder-charts";

type ErrorData = Awaited<
  ReturnType<typeof import("@/lib/analytics-platform/errors-dashboard").getErrorDashboard>
>;

export default function FounderErrorsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ErrorData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/errors")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<ErrorData>;
      })
      .then(setData)
      .catch(() => setError("Could not load errors."));
  }, [status, router]);

  if (status === "loading" && !data && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold">Error Dashboard</h2>
        <p className="text-xs text-muted-foreground">API, auth, AI, frontend · last 14 days</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Errors (24h)" value={data.totals.last24h} />
        <MetricCard label="Errors (7d)" value={data.totals.last7d} />
        <MetricCard label="Sources tracked" value={data.bySource.length} />
        <MetricCard label="Crash pages" value={data.topCrashPages.length} />
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Daily error volume</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyBarChart data={data.daily} xKey="day" yKey="count" />
        </CardContent>
      </Card>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.bySource.map((s) => (
              <div key={s.source} className="flex justify-between text-xs">
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {s.source}
                </Badge>
                <span className="tabular-nums">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top crash pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topCrashPages.length === 0 ? (
              <p className="text-xs text-muted-foreground">No crash page data</p>
            ) : (
              data.topCrashPages.map((p) => (
                <div key={p.page} className="flex justify-between text-xs">
                  <span className="truncate pr-2">{p.page}</span>
                  <span className="tabular-nums text-muted-foreground">{p.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent errors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {data.recent.map((err) => (
            <div key={err.id} className="text-xs border rounded-lg p-2">
              <div className="flex justify-between gap-2 mb-0.5">
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {err.source}
                </Badge>
                <span className="text-muted-foreground">
                  {format(new Date(err.createdAt), "d MMM HH:mm")}
                </span>
              </div>
              <p className="text-muted-foreground break-words">{err.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
