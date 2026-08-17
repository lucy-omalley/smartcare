'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { AdventureJourneyView, AdventureFeatures, AdventurePageView } from '@/types/adventure-journey';
import { AdventurePreview } from '@/components/adventure/adventure-preview';
import { AdventureEditor } from '@/components/adventure/adventure-editor';
import { AdventureExportPanel } from '@/components/adventure/adventure-export-panel';
import type { PosterLayout } from '@prisma/client';
import { trackEvent } from '@/lib/analytics';

export default function AdventureEditorPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const [adventure, setAdventure] = useState<AdventureJourneyView | null>(null);
  const [draft, setDraft] = useState<AdventureJourneyView | null>(null);
  const [features, setFeatures] = useState<AdventureFeatures | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'edit' | 'export'>('edit');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch(`/api/posters/${params.id}`).then((r) => r.json()),
      fetch('/api/posters/features').then((r) => r.json()),
    ]).then(([pRes, fRes]) => {
      if (pRes.poster) {
        setAdventure(pRes.poster);
        setDraft(pRes.poster);
      }
      setFeatures(fRes.features);
    });
  }, [status, router, params.id]);

  const handleEditorChange = useCallback(
    (pages: AdventurePageView[], meta?: Partial<AdventureJourneyView>) => {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              ...meta,
              pages,
              steps: pages,
            }
          : prev
      );
    },
    []
  );

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const pages = draft.pages.length ? draft.pages : draft.steps;
      const res = await fetch(`/api/posters/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          routineGoal: draft.routineGoal,
          characterName: draft.characterName,
          storyIntro: draft.storyIntro,
          storyEnding: draft.storyEnding,
          storyTheme: draft.storyTheme,
          adventureFormat: draft.adventureFormat,
          theme: draft.theme,
          favouriteColours: draft.favouriteColours,
          celebrationText: draft.celebrationText,
          layout: draft.layout,
          pages: pages.map((p) => ({
            title: p.missionLabel ?? p.title,
            missionLabel: p.missionLabel ?? p.title,
            storyText: p.storyText ?? '',
            iconEmoji: p.iconEmoji,
            rewardStars: p.rewardStars,
            isStoryTimeStep: p.isStoryTimeStep,
            isSongStep: p.isSongStep,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setAdventure(data.poster);
      setDraft(data.poster);
      trackEvent('adventure_edited', { adventureId: params.id });
      toast.success('Adventure saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const updateLayout = async (layout: PosterLayout) => {
    if (!draft) return;
    const next = { ...draft, layout };
    setDraft(next);
    try {
      const res = await fetch(`/api/posters/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdventure(data.poster);
        setDraft(data.poster);
      }
    } catch {
      /* revert on next fetch */
    }
  };

  if (!draft) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const printRootId = draft.adventureFormat === 'STORY_BOOK' ? 'adventure-print-root' : 'adventure-print-root';

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24 print:p-0">
        <div className="flex items-center gap-2 pt-2 print:hidden">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/adventure-journey"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold flex-1 truncate">{draft.title}</h1>
          <Button size="sm" className="rounded-full" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>

        <div className="flex justify-center print:block">
          <AdventurePreview adventure={draft} />
        </div>

        <div className="flex gap-2 print:hidden">
          <Button
            variant={tab === 'edit' ? 'default' : 'outline'}
            className="rounded-xl flex-1"
            onClick={() => setTab('edit')}
          >
            Edit story
          </Button>
          <Button
            variant={tab === 'export' ? 'default' : 'outline'}
            className="rounded-xl flex-1"
            onClick={() => setTab('export')}
          >
            Print
          </Button>
        </div>

        {tab === 'edit' ? (
          <Card className="rounded-2xl print:hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Edit your adventure</CardTitle>
            </CardHeader>
            <CardContent>
              {features && (
                <AdventureEditor adventure={draft} features={features} onChange={handleEditorChange} />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl print:hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Print your adventure</CardTitle>
            </CardHeader>
            <CardContent>
              <AdventureExportPanel
                adventure={draft}
                onLayoutChange={updateLayout}
                isPremium={features?.isPremium ?? false}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body * {
            visibility: hidden;
          }
          #${printRootId},
          #${printRootId} * {
            visibility: visible;
          }
          #${printRootId} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #${printRootId} * {
            overflow: visible !important;
            max-height: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
