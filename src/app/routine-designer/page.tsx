'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, Printer, Sparkles } from 'lucide-react';
import type { RoutinePosterView, PosterFeatures } from '@/types/routine-poster';
import { POSTER_CATEGORY_OPTIONS } from '@/lib/posters/constants';
import { POSTER_THEMES } from '@/lib/posters/themes';
import { trackEvent } from '@/lib/analytics';

export default function RoutineDesignerHubPage() {
  const { status } = useSession();
  const router = useRouter();
  const [posters, setPosters] = useState<RoutinePosterView[]>([]);
  const [features, setFeatures] = useState<PosterFeatures | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch('/api/posters').then((r) => r.json()),
      fetch('/api/posters/features').then((r) => r.json()),
    ]).then(([listRes, featRes]) => {
      setPosters(listRes.posters ?? []);
      setFeatures(featRes.features);
    });
    trackEvent('feature_used', { feature: 'AI Routine Designer' });
  }, [status, router]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'ALL') return posters;
    return posters.filter((p) => p.category === categoryFilter);
  }, [posters, categoryFilter]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-24">
        <header className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Printer className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">AI Routine Designer</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create beautiful printable routine posters. Print, laminate, and display — so your child knows what comes next.
          </p>
          {features && !features.isPremium && features.postersRemaining !== null && (
            <Badge variant="secondary" className="rounded-full">
              {features.postersRemaining} free poster{features.postersRemaining === 1 ? '' : 's'} left
            </Badge>
          )}
        </header>

        <Button asChild className="rounded-xl h-12 w-full">
          <Link href="/routine-designer/create">
            <Plus className="h-4 w-4 mr-2" /> Design new routine
          </Link>
        </Button>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs border ${categoryFilter === 'ALL' ? 'border-primary bg-primary/10' : ''}`}
          >
            All
          </button>
          {POSTER_CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategoryFilter(c.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs border ${categoryFilter === c.value ? 'border-primary bg-primary/10' : ''}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Saved routines</h2>
          {filtered.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-3">
                <Sparkles className="h-8 w-8 mx-auto text-primary/60" />
                <p>No routines yet. Design a morning or bedtime poster in under a minute.</p>
                <Button asChild className="rounded-xl">
                  <Link href="/routine-designer/create">Create first poster</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((p) => {
              const theme = POSTER_THEMES[p.theme];
              return (
                <Link key={p.id} href={`/routine-designer/${p.id}`}>
                  <Card className="rounded-2xl hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{theme?.emoji ?? '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.steps.length} steps · {p.printCount} prints
                        </p>
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
