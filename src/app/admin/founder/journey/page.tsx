"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/founder/founder-ui";
import { Search, PlayCircle } from "lucide-react";

type TimelineResponse = {
  user: { email: string; name: string; lastActive: string | null } | null;
  timeline: Array<{ label: string; at: string; feature: string | null }>;
};

export default function FounderJourneyPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTimeline = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/founder/growth/timeline?userId=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to load journey");
      setData((await res.json()) as TimelineResponse);
    } catch {
      setError("Could not load user journey.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromQuery = searchParams.get("userId")?.trim();
    if (fromQuery) {
      setUserId(fromQuery);
      setQuery(fromQuery);
      void loadTimeline(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when deep-linking
  }, [searchParams]);

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Watch User Journey</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Interview mode — paste a user ID to replay their activation path from signup through hero
          features. Find IDs on the Users tab.
        </p>
      </header>

      <form
        className="flex gap-2 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(userId);
          void loadTimeline(userId);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="User ID (cuid)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!userId.trim() || loading}>
          {loading ? "Loading…" : "Watch"}
        </Button>
      </form>

      {loading ? <LoadingState message="Loading journey…" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data && !loading ? (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {data.user?.name ?? "User"} · {data.user?.email ?? query}
            </CardTitle>
            {data.user?.lastActive ? (
              <p className="text-xs text-muted-foreground">
                Last active {format(new Date(data.user.lastActive), "d MMM yyyy HH:mm")}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            {data.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tracked events yet.</p>
            ) : (
              <ol className="relative border-l border-border ml-3 space-y-4">
                {data.timeline.map((step, i) => (
                  <li key={`${step.at}-${i}`} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(step.at), "d MMM yyyy HH:mm")}
                      {step.feature ? ` · ${step.feature}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
