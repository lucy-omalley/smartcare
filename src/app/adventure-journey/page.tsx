'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, Sparkles, Map, Trash2, Loader2 } from 'lucide-react';
import type { AdventureJourneyView, AdventureFeatures } from '@/types/adventure-journey';
import { POSTER_CATEGORY_OPTIONS } from '@/lib/posters/constants';
import { POSTER_THEMES } from '@/lib/posters/themes';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';

export default function AdventureJourneyHubPage() {
  const { status } = useSession();
  const router = useRouter();
  const [adventures, setAdventures] = useState<AdventureJourneyView[]>([]);
  const [features, setFeatures] = useState<AdventureFeatures | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAdventures = () =>
    fetch('/api/posters')
      .then((r) => r.json())
      .then((listRes) => setAdventures(listRes.posters ?? []));

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([loadAdventures(), fetch('/api/posters/features').then((r) => r.json())]).then(
      ([, featRes]) => {
        setFeatures(featRes.features);
      }
    );
    trackEvent('feature_used', { feature: 'AI Adventure Journey' });
  }, [status, router]);

  const deleteAdventure = async (id: string, title: string) => {
    if (
      !window.confirm(`Delete "${title}"? This cannot be undone, but you can create a new adventure anytime.`)
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/posters/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Could not delete adventure');
      setAdventures((prev) => prev.filter((a) => a.id !== id));
      trackEvent('adventure_deleted', { adventureId: id });
      toast.success('Adventure deleted');
      if (features && !features.isPremium) {
        const featRes = await fetch('/api/posters/features').then((r) => r.json());
        setFeatures(featRes.features);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete adventure');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (categoryFilter === 'ALL') return adventures;
    return adventures.filter((a) => a.category === categoryFilter);
  }, [adventures, categoryFilter]);

  const remaining = features?.adventuresRemaining ?? features?.postersRemaining;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-24">
        <header className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">AI Adventure Journey</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Turn daily routines into personalised story adventures. Your child completes missions — not checklists.
          </p>
          {features && !features.isPremium && remaining !== null && (
            <Badge variant="secondary" className="rounded-full">
              {remaining} free adventure{remaining === 1 ? '' : 's'} left
            </Badge>
          )}
        </header>

        <Button asChild className="rounded-xl h-12 w-full">
          <Link href="/adventure-journey/create">
            <Plus className="h-4 w-4 mr-2" /> Start new adventure
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
          <h2 className="text-sm font-semibold">Your adventures</h2>
          {filtered.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-3">
                <Sparkles className="h-8 w-8 mx-auto text-primary/60" />
                <p>No adventures yet. Create a bedtime or morning story journey in under a minute.</p>
                <Button asChild className="rounded-xl">
                  <Link href="/adventure-journey/create">Create first adventure</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((a) => {
              const theme = POSTER_THEMES[a.theme];
              const pageCount = a.pages?.length ?? a.steps?.length ?? 0;
              const isDeleting = deletingId === a.id;
              return (
                <Card key={a.id} className="rounded-2xl hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Link href={`/adventure-journey/${a.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{theme?.emoji ?? '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {pageCount} missions · {a.totalRewardStars} ⭐ · {a.printCount} prints
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                      disabled={isDeleting}
                      aria-label={`Delete ${a.title}`}
                      onClick={() => deleteAdventure(a.id, a.title)}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
