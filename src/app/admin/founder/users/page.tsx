"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { UserIntelligenceRow } from "@/lib/analytics-platform/user-intelligence";
import { LoadingState, ErrorState } from "@/components/founder/founder-ui";
import { Download, Search } from "lucide-react";

export default function FounderUsersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserIntelligenceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    params.set("limit", "50");
    const res = await fetch(`/api/admin/founder/users?${params}`);
    if (!res.ok) throw new Error("Failed to load");
    const data = (await res.json()) as { users: UserIntelligenceRow[]; total: number };
    setUsers(data.users);
    setTotal(data.total);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;
    load(query).catch(() => setError("Could not load users."));
  }, [status, router, query, load]);

  if (status === "loading" && !users.length && !error) {
    return <LoadingState />;
  }
  if (error) return <ErrorState message={error} />;

  const churnColor = (risk: string) => {
    if (risk === "high") return "destructive";
    if (risk === "medium") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">User Intelligence</h2>
          <p className="text-xs text-muted-foreground">{total} users · retention & churn scoring</p>
        </div>
        <div className="flex gap-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search);
            }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 w-48 h-9 text-sm rounded-full"
                placeholder="Search email or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="rounded-full">
              Search
            </Button>
          </form>
          <Button size="sm" variant="outline" className="rounded-full gap-1" asChild>
            <a href={`/api/admin/founder/export${query ? `?search=${encodeURIComponent(query)}` : ""}`}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </a>
          </Button>
        </div>
      </header>

      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">User profiles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Sessions</th>
                  <th className="p-3 font-medium">AI</th>
                  <th className="p-3 font-medium">Favourite</th>
                  <th className="p-3 font-medium">Retention</th>
                  <th className="p-3 font-medium">Churn</th>
                  <th className="p-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3">
                        <p className="font-medium truncate max-w-[140px]">{u.name}</p>
                        <p className="text-muted-foreground truncate max-w-[140px]">{u.email}</p>
                      </td>
                      <td className="p-3">{u.referralSource}</td>
                      <td className="p-3">{u.planTier}</td>
                      <td className="p-3 tabular-nums">{u.totalSessions}</td>
                      <td className="p-3 tabular-nums">
                        {u.aiCalls} · ${u.aiCostUsd.toFixed(2)}
                      </td>
                      <td className="p-3 truncate max-w-[80px]">{u.favouriteFeature}</td>
                      <td className="p-3 tabular-nums">{u.retentionScore}</td>
                      <td className="p-3">
                        <Badge variant={churnColor(u.churnRisk)} className="rounded-full text-[10px]">
                          {u.churnRisk}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
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
