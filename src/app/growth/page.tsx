"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TabLoadingScreen } from "@/components/layout/tab-loading-screen";
import { GrowthJourneyDashboard } from "@/components/growth/v2/growth-journey-dashboard";
import type { GrowthJourneyView } from "@/lib/growth-journey/types";
import { Button } from "@/components/ui/button";

export default function GrowthJourneyPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<GrowthJourneyView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/growth/journey", { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Failed to load");
        setData(json.journey);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load Growth Journey");
      });
  }, [status]);

  if (status === "loading" || (status === "authenticated" && !data && !error)) {
    return <TabLoadingScreen message="Loading your child's growth journey…" icon="today" />;
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-5 pb-4">
        {error ? (
          <div className="text-center space-y-3 py-12">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : data ? (
          <GrowthJourneyDashboard data={data} />
        ) : null}
      </div>
    </AppShell>
  );
}
