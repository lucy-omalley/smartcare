'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityFilter, ToyBrainFeatures, ToyProfileView } from '@/types/toy-brain';
import { ACTIVITY_FILTER_OPTIONS, TOY_CATEGORY_OPTIONS, categoryMeta } from '@/lib/toy-brain/constants';
import { filterActivities } from '@/lib/toy-brain/filters';
import { ToyActivityCard } from '@/components/toy-brain/toy-activity-card';
import type { ToyCategory } from '@prisma/client';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

function ToyDetailContent({ id }: { id: string }) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showConfirm = searchParams.get('confirm') === '1';

  const [toy, setToy] = useState<ToyProfileView | null>(null);
  const [features, setFeatures] = useState<ToyBrainFeatures | null>(null);
  const [filters, setFilters] = useState<ActivityFilter[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(showConfirm);
  const [editCategory, setEditCategory] = useState<ToyCategory>('UNKNOWN');
  const [editName, setEditName] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch(`/api/toy-brain/${id}`).then((r) => r.json()),
      fetch('/api/toy-brain/features').then((r) => r.json()),
    ]).then(([tRes, fRes]) => {
      if (tRes.toy) {
        setToy(tRes.toy);
        setEditName(tRes.toy.name);
        setEditCategory(tRes.toy.category);
      }
      setFeatures(fRes.features);
    });
  }, [status, router, id]);

  const filteredActivities = useMemo(() => {
    if (!toy) return [];
    return filterActivities(toy.activities, filters);
  }, [toy, filters]);

  const toggleFilter = (f: ActivityFilter) => {
    setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const confirmToy = async (confirmed: boolean) => {
    if (!toy) return;
    try {
      const res = await fetch(`/api/toy-brain/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: confirmed,
          name: editName.trim() || toy.name,
          category: editCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      setToy(data.toy);
      setConfirmOpen(false);
      toast.success(confirmed ? 'Toy confirmed — play ideas updated!' : 'Thanks for the feedback');
      setSavedBanner(true);
      window.setTimeout(() => setSavedBanner(false), 4000);
      trackEvent('toy_brain_confirmed', { toyId: id, confirmed });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  };

  const toggleFavourite = async () => {
    if (!toy) return;
    const res = await fetch(`/api/toy-brain/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavourite: !toy.isFavourite }),
    });
    const data = await res.json();
    if (res.ok) {
      setToy(data.toy);
      trackEvent('toy_brain_favourited', { toyId: id, favourite: data.toy.isFavourite });
    }
  };

  const addToToday = async (activityId: string) => {
    if (!features?.isPremium) {
      toast.error("Upgrade to Premium to add Toy Brain activities to Today's Plan");
      router.push('/billing');
      return;
    }
    setAddingId(activityId);
    try {
      const res = await fetch(`/api/toy-brain/${id}/today`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not add to Today');
      toast.success("Added to Today's Plan!");
      trackEvent('toy_brain_added_to_today', { toyId: id, activityId });
      router.push('/today');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add');
    } finally {
      setAddingId(null);
    }
  };

  const printActivity = (activityId: string) => {
    trackEvent('toy_brain_activity_printed', { toyId: id, activityId });
    window.print();
  };

  const deleteToy = async () => {
    if (!window.confirm('Remove this toy from your Toy Box?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/toy-brain/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Toy removed');
      router.push('/toy-brain');
    } catch {
      toast.error('Could not delete toy');
    } finally {
      setDeleting(false);
    }
  };

  if (!toy) {
    return (
      <div className="container max-w-lg mx-auto p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const meta = categoryMeta(toy.category);

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24 print:p-0">
      <div className="flex items-center gap-2 pt-2 print:hidden">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/toy-brain"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 truncate">{toy.name}</h1>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-destructive"
          onClick={deleteToy}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      {savedBanner && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm print:hidden">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Updated successfully
        </div>
      )}

      {confirmOpen && !toy.isConfirmed && (
        <Card className="rounded-2xl border-primary/30 print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">We think this is {toy.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {Math.round((toy.confidence ?? 0.8) * 100)}% confidence · {meta.label}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {TOY_CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditCategory(opt.value)}
                  className={cn(
                    'rounded-full px-2 py-1 text-[10px] border',
                    editCategory === opt.value ? 'border-primary bg-primary/10' : ''
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button className="rounded-xl" onClick={() => confirmToy(true)}>✓ Correct</Button>
              <Button variant="outline" className="rounded-xl" onClick={() => confirmToy(false)}>
                Choose another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {toy.photoData && (
        <div className="rounded-2xl overflow-hidden border print:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={toy.photoData} alt={toy.name} className="w-full max-h-48 object-cover" />
        </div>
      )}

      <div className="space-y-1 print:hidden">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full">{meta.emoji} {meta.label}</Badge>
          <Badge variant="outline" className="rounded-full">{toy.activities.length} play ideas</Badge>
        </div>
        {toy.description && (
          <p className="text-sm text-muted-foreground">{toy.description}</p>
        )}
      </div>

      <div className="space-y-2 print:hidden">
        <p className="text-sm font-medium">Filter activities</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleFilter(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs border',
                filters.includes(opt.value) ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4" id="toy-activities-print">
        <h2 className="text-sm font-semibold print:hidden">
          Play ideas ({filteredActivities.length})
        </h2>
        {filteredActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities match these filters.</p>
        ) : (
          filteredActivities.map((activity) => (
            <ToyActivityCard
              key={activity.id}
              activity={activity}
              isPremium={features?.isPremium}
              isFavourite={toy.isFavourite}
              onFavourite={toggleFavourite}
              onAddToToday={() => addToToday(activity.id)}
              onPrint={() => printActivity(activity.id)}
              addingToToday={addingId === activity.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function ToyDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="container max-w-lg mx-auto p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ToyDetailContent id={params.id} />
      </Suspense>
    </AppShell>
  );
}
