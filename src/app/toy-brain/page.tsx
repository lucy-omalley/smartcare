'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Sparkles, ArrowRight, Trash2, Loader2, Heart } from 'lucide-react';
import type { ToyBrainFeatures, ToyProfileView } from '@/types/toy-brain';
import { TOY_CATEGORY_GROUPS, categoryMeta } from '@/lib/toy-brain/constants';
import { HeroEmptyState } from '@/components/activation/hero-empty-state';
import { useTranslation } from '@/hooks/use-translation';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';

export default function ToyBrainHubPage() {
  const { t } = useTranslation();
  const { status } = useSession();
  const router = useRouter();
  const [toys, setToys] = useState<ToyProfileView[]>([]);
  const [features, setFeatures] = useState<ToyBrainFeatures | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch('/api/toy-brain').then((r) => r.json()),
      fetch('/api/toy-brain/features').then((r) => r.json()),
      fetch('/api/toy-brain/recommendations').then((r) => r.json()),
    ]).then(([listRes, featRes, tipsRes]) => {
      setToys(listRes.toys ?? []);
      setFeatures(featRes.features);
      setTips(tipsRes.tips ?? []);
    });
    trackEvent('feature_used', { feature: 'AI Toy Brain' });
  }, [status, router]);

  const filtered = useMemo(() => {
    if (groupFilter === 'ALL') return toys;
    return toys.filter((t) => categoryMeta(t.category).group === groupFilter);
  }, [toys, groupFilter]);

  const deleteToy = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from your Toy Box?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/toy-brain/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Delete failed');
      }
      setToys((prev) => prev.filter((t) => t.id !== id));
      toast.success('Toy removed from your box');
      trackEvent('toy_brain_deleted', { toyId: id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-24">
        <header className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">AI Toy Brain</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your family&apos;s AI Play Coach. Snap a toy, get personalised play ideas, and unlock learning from toys you already own.
          </p>
          {features && !features.isPremium && features.scansRemaining !== null && (
            <Badge variant="secondary" className="rounded-full">
              {features.scansRemaining} free scan{features.scansRemaining === 1 ? '' : 's'} left this month
            </Badge>
          )}
        </header>

        <Button asChild className="rounded-xl h-12 w-full">
          <Link href="/toy-brain/scan">
            <Plus className="h-4 w-4 mr-2" /> Scan a toy
          </Link>
        </Button>

        {tips.length > 0 && (
          <Card className="rounded-2xl border-sky-200 bg-sky-50/50 dark:bg-sky-950/20">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">💡 Suggestions</p>
              {tips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setGroupFilter('ALL')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs border ${groupFilter === 'ALL' ? 'border-primary bg-primary/10' : ''}`}
          >
            All
          </button>
          {TOY_CATEGORY_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupFilter(g)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs border ${groupFilter === g ? 'border-primary bg-primary/10' : ''}`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">My Toy Box</h2>
          {filtered.length === 0 ? (
            <HeroEmptyState
              emoji="🧸"
              title={t('activation.emptyToyTitle')}
              message={t('activation.emptyToyMessage')}
              cta={t('features.toyBrainCta')}
              href="/toy-brain/scan"
            />
          ) : (
            filtered.map((t) => {
              const meta = categoryMeta(t.category);
              const isDeleting = deletingId === t.id;
              return (
                <Card key={t.id} className="rounded-2xl hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Link href={`/toy-brain/${t.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      {t.photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.photoData}
                          alt={t.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <span className="text-2xl shrink-0">{meta.emoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate flex items-center gap-1">
                          {t.name}
                          {t.isFavourite && <Heart className="h-3 w-3 fill-primary text-primary shrink-0" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meta.label} · {t.activities.length} ideas
                          {t.confidence != null && !t.isConfirmed && ` · ${Math.round(t.confidence * 100)}% match`}
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
                      aria-label={`Delete ${t.name}`}
                      onClick={() => deleteToy(t.id, t.name)}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
