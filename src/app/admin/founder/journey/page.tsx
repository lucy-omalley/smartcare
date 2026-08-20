"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/founder/founder-ui";
import { Search, PlayCircle } from "lucide-react";

type TimelineUser = { email: string; name: string; lastActive: string | null };
type TimelineStep = { label: string; at: string; feature: string | null };
type TimelineResponse = {
  user: TimelineUser | null;
  timeline: TimelineStep[];
};
type Candidate = { id: string; email: string; name: string };

export default function FounderJourneyPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTimeline = async (lookup: string, userId?: string) => {
    setLoading(true);
    setError(null);
    setCandidates([]);
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      else if (lookup.includes("@")) params.set("email", lookup);
      else params.set("q", lookup);

      const res = await fetch(`/api/admin/founder/growth/timeline?${params}`);
      const json = (await res.json()) as TimelineResponse & {
        error?: string;
        candidates?: Candidate[];
      };

      if (res.status === 409 && json.candidates?.length) {
        setCandidates(json.candidates);
        setData(null);
        setError("Multiple users matched — pick one below.");
        return;
      }

      if (!res.ok) throw new Error(json.error ?? "Failed to load journey");
      setData(json);
      setQuery(lookup);
    } catch {
      setError("Could not load user journey. Try their email from the Users tab.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromEmail = searchParams.get("email")?.trim();
    const fromUserId = searchParams.get("userId")?.trim();
    const fromQuery = searchParams.get("q")?.trim();
    const initial = fromEmail || fromQuery || fromUserId;
    if (initial) {
      setSearch(initial);
      void loadTimeline(initial, fromUserId || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep-link once
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
          Search by email or name — no user ID needed. Or open a parent from{" "}
          <Link href="/admin/founder/users" className="text-primary hover:underline">
            Users
          </Link>{" "}
          /{" "}
          <Link href="/admin/founder/feedback" className="text-primary hover:underline">
            Feedback
          </Link>{" "}
          and click Watch journey.
        </p>
      </header>

      <form
        className="flex gap-2 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          void loadTimeline(search.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Parent email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!search.trim() || loading}>
          {loading ? "Loading…" : "Watch"}
        </Button>
      </form>

      {loading ? <LoadingState message="Loading journey…" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {candidates.length > 0 ? (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pick a user</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left rounded-xl border p-3 hover:bg-muted/50 transition-colors text-sm"
                onClick={() => {
                  setSearch(c.email);
                  void loadTimeline(c.email, c.id);
                }}
              >
                <p className="font-medium">{c.name || "Unnamed"}</p>
                <p className="text-muted-foreground text-xs">{c.email}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

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
