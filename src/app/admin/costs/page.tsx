'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CostDashboard {
  today: {
    totalCost: number;
    aiCalls: number;
    cacheHits: number;
    cacheSavingPct: number;
    avgCostPerUser: number;
    uniqueUsers: number;
    topFeatures: Array<{ feature: string; calls: number; cost: number }>;
    estimatedMonthlySpend: number;
  };
  cache: { hits: number; misses: number; hitRate: number };
  dailyActiveUsers: number;
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

  const { today, cache, dailyActiveUsers } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Cost Dashboard</h1>
        <p className="text-muted-foreground text-sm">Database-first architecture metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s AI calls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{today.aiCalls}</p>
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
            <CardTitle className="text-sm font-medium">Avg cost / user</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${today.avgCostPerUser.toFixed(4)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache saving</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(today.cacheSavingPct * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{cache.hits} hits / {cache.misses} misses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. monthly spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${today.estimatedMonthlySpend.toFixed(2)}</p>
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
