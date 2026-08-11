"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FunnelStage } from "@/lib/analytics-platform/funnel";
import { LoadingState, ErrorState } from "@/components/founder/founder-ui";
import { ConversionFunnelChart } from "@/components/founder/founder-charts";

export default function FounderFunnelPage() {
  const { status } = useSession();
  const router = useRouter();
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/founder/funnel")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as { funnel: FunnelStage[] };
        setFunnel(data.funnel);
      })
      .catch(() => setError("Could not load funnel."));
  }, [status, router]);

  if (status === "loading" && !funnel.length && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  let worstDrop = 0;
  let worstStage: FunnelStage | null = null;
  for (const stage of funnel) {
    if (stage.conversionFromPrevious == null) continue;
    const drop = 100 - stage.conversionFromPrevious;
    if (drop > worstDrop) {
      worstDrop = drop;
      worstStage = stage;
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold">Product Funnel</h2>
        <p className="text-xs text-muted-foreground">Last 30 days · conversion at each stage</p>
      </header>

      {worstStage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm">
          <p className="font-semibold">Biggest drop-off: {worstStage.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {worstDrop}% of users lost at this step ({worstStage.count} reached)
          </p>
        </div>
      ) : null}

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Funnel visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionFunnelChart stages={funnel} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Stage breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {funnel.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-5 text-xs">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{stage.label}</p>
                <p className="text-xs text-muted-foreground">
                  {stage.conversionFromStart}% of landing ·{" "}
                  {stage.conversionFromPrevious != null
                    ? `${stage.conversionFromPrevious}% from previous`
                    : "entry"}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full tabular-nums shrink-0">
                {stage.count}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
