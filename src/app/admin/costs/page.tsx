'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CostDashboard {
  today: {
    totalCost: number;
    aiCalls: number;
    cacheHits: number;
    cacheHitPct: number;
    cacheMissPct: number;
    cacheSavingPct: number;
    avgTokensPerRequest: number;
    avgCostPerUser: number;
    uniqueUsers: number;
    topFeatures: Array<{ feature: string; calls: number; cost: number }>;
    estimatedMonthlySpend: number;
    totalRequests: number;
    llmRequests: number;
    dbOnlyRequests: number;
    requestCacheHits: number;
    llmReachPct: number;
    targets: {
      cacheHitRateMin: number;
      cacheHitRateMax: number;
      llmReachRateMax: number;
    };
    health: {
      cacheHit: boolean;
      llmReach: boolean;
    };
  };
  cache: { hits: number; misses: number; hitRate: number; redisEnabled?: boolean };
  dailyActiveUsers: number;
  costPerActiveUser: number;
}

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full',
        ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      )}
    >
      {label}: {ok ? 'On target' : 'Needs attention'}
    </span>
  );
}

export default function AdminCostDashboardPage() {
  const [data, setData] = useState<CostDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/costs')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Admin access required. Set isAdmin on your user or ADMIN_EMAIL in env.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">Loading cost dashboard…</div>;
  }

  const { today, cache, dailyActiveUsers, costPerActiveUser } = data;
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Cost Dashboard</h1>
        <p className="text-muted-foreground text-sm">Database-first architecture metrics</p>
        <p className="text-sm mt-2">
          <Link href="/admin/intelligence" className="text-primary underline">
            Intelligence engine debug
          </Link>
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <HealthBadge ok={today.health.cacheHit} label="Cache hit rate" />
          <HealthBadge ok={today.health.llmReach} label="LLM reach" />
          {cache.redisEnabled && (
            <span className="text-xs text-muted-foreground px-2 py-0.5">Redis enabled</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Targets: {pct(today.targets.cacheHitRateMin)}–{pct(today.targets.cacheHitRateMax)} cache hit (AI-eligible),
          {' '}≤{pct(today.targets.llmReachRateMax)} of all requests reaching LLM
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI calls / day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{today.aiCalls}</p>
            <p className="text-xs text-muted-foreground">Real LLM calls (excludes cache hits)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache hit %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pct(today.cacheHitPct)}</p>
            <p className="text-xs text-muted-foreground">{today.cacheHits} hits of {today.cacheHits + today.aiCalls} AI-eligible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache miss %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pct(today.cacheMissPct)}</p>
            <p className="text-xs text-muted-foreground">LLM calls ÷ AI-eligible requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg tokens / request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(today.avgTokensPerRequest)}</p>
            <p className="text-xs text-muted-foreground">Prompt + completion per LLM call</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LLM reach %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pct(today.llmReachPct)}</p>
            <p className="text-xs text-muted-foreground">
              {today.llmRequests} LLM / {today.totalRequests} total requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">DB-only requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{today.dbOnlyRequests}</p>
            <p className="text-xs text-muted-foreground">Served from knowledge DB / cache</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s cost (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${today.totalCost.toFixed(4)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost / AI user</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${today.avgCostPerUser.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">{today.uniqueUsers} users with AI activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost / active user (DAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${costPerActiveUser.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">{dailyActiveUsers} daily active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. monthly spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${today.estimatedMonthlySpend.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Today × 30 projection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily active users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dailyActiveUsers}</p>
          </CardContent>
        </Card>
      </div>

      {today.topFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top expensive features (today)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {today.topFeatures.map((f) => (
                <li key={f.feature} className="flex justify-between">
                  <span>{f.feature}</span>
                  <span className="text-muted-foreground">{f.calls} calls · ${f.cost.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
