'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Flame, TrendingUp, Star } from 'lucide-react';
import type { RoutineDashboardStats } from '@/types/visual-routine';

export default function RoutineDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<RoutineDashboardStats | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;
    fetch('/api/routines/dashboard')
      .then((r) => r.json())
      .then((d) => setDashboard(d.dashboard));
  }, [status, router]);

  if (!dashboard) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground text-sm">Loading progress…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/routines"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Routine progress</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold">{dashboard.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{dashboard.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" /> Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Total completions: <strong>{dashboard.totalCompletions}</strong></p>
            <p>Weekly consistency: <strong>{dashboard.weeklyConsistency}%</strong></p>
            {dashboard.mostSuccessfulRoutine && (
              <p>Most successful: <strong>{dashboard.mostSuccessfulRoutine.title}</strong> ({dashboard.mostSuccessfulRoutine.count}×)</p>
            )}
            {dashboard.mostSkippedStep && (
              <p className="text-muted-foreground">Often skipped: {dashboard.mostSkippedStep.title}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              {dashboard.aiRecommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
