'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, LayoutGrid, BarChart3, Sparkles } from 'lucide-react';
import type { VisualRoutineView } from '@/types/visual-routine';
import type { RoutineFeatures } from '@/types/visual-routine';
import { ROUTINE_TEMPLATE_META } from '@/lib/routines/constants';
import { trackEvent } from '@/lib/analytics';

export default function RoutinesHubPage() {
  const { status } = useSession();
  const router = useRouter();
  const [routines, setRoutines] = useState<VisualRoutineView[]>([]);
  const [features, setFeatures] = useState<RoutineFeatures | null>(null);
  const [suggestion, setSuggestion] = useState<{ routineId: string; title: string; reason: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch('/api/routines').then((r) => r.json()),
      fetch('/api/routines/features').then((r) => r.json()),
      fetch('/api/routines/dashboard').then((r) => r.json()),
    ]).then(([listRes, featRes, dashRes]) => {
      setRoutines(listRes.routines ?? []);
      setFeatures(featRes.features);
      setSuggestion(dashRes.suggestion ?? null);
    });
    trackEvent('feature_used', { feature: 'Visual Routine Studio' });
  }, [status, router]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-24">
        <header className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Visual Routine Studio</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Fun visual routines children can follow — without reading. AI-personalised in under 60 seconds.
          </p>
          {features && !features.isPremium && features.routinesRemaining !== null && (
            <Badge variant="secondary" className="rounded-full">
              {features.routinesRemaining} free routines left
            </Badge>
          )}
        </header>

        {suggestion && (
          <Card className="rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Suggested now</p>
                <p className="text-xs text-muted-foreground truncate">{suggestion.title} — {suggestion.reason}</p>
              </div>
              <Button size="sm" className="rounded-full shrink-0" asChild>
                <Link href={`/routines/${suggestion.routineId}`}>Start</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="rounded-xl h-12">
            <Link href="/routines/create"><Plus className="h-4 w-4 mr-2" /> New routine</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl h-12">
            <Link href="/routines/dashboard"><BarChart3 className="h-4 w-4 mr-2" /> Progress</Link>
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Your routines</h2>
          {routines.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-3">
                <p>No routines yet. Create a morning or bedtime routine in seconds.</p>
                <Button asChild className="rounded-xl">
                  <Link href="/routines/create">Create first routine</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            routines.map((r) => {
              const meta = ROUTINE_TEMPLATE_META[r.templateType];
              return (
                <Link key={r.id} href={`/routines/${r.id}`}>
                  <Card className="rounded-2xl hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{meta?.emoji ?? '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.steps.length} steps · {meta?.label}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
