"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TabLoadingScreen } from "@/components/layout/tab-loading-screen";
import { GrowthJourneyDashboard } from "@/components/growth/v2/growth-journey-dashboard";
import type { GrowthJourneyView } from "@/lib/growth-journey/types";
import { Button } from "@/components/ui/button";
import { consumeGrowthJourneyStale } from "@/lib/today-plan-stale";
import { toast } from "sonner";

export default function GrowthJourneyPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<GrowthJourneyView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJourney = useCallback(async (opts?: { profileRefresh?: boolean; silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (opts?.profileRefresh) params.set("refresh", "1");
      const query = params.toString();
      const res = await fetch(`/api/growth/journey${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json.journey);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load Growth Journey");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const refreshIfStale = () => {
      const profileRefresh = consumeGrowthJourneyStale();
      if (profileRefresh) {
        toast.info("Updating Growth Journey with your profile changes…");
      }
      void loadJourney({ profileRefresh, silent: profileRefresh });
    };

    refreshIfStale();

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIfStale();
    };

    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, loadJourney]);

  if (status === "loading" || (loading && !data && !error)) {
    return <TabLoadingScreen message="Loading your child's growth journey…" icon="today" />;
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-5 pb-4">
        {refreshing ? (
          <p className="text-xs text-muted-foreground mb-3">Refreshing with your latest profile…</p>
        ) : null}
        {error ? (
          <div className="text-center space-y-3 py-12">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void loadJourney({ profileRefresh: true })}
            >
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
