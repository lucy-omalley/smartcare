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
import type { RoutinePosterView, PosterFeatures, PosterStepView } from '@/types/routine-poster';
import { PosterPreviewWithQr } from '@/components/posters/poster-flow-chart';
import { PosterEditor } from '@/components/posters/poster-editor';
import { PosterExportPanel } from '@/components/posters/poster-export-panel';
import type { PosterLayout } from '@prisma/client';

export default function PosterEditorPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const [poster, setPoster] = useState<RoutinePosterView | null>(null);
  const [draft, setDraft] = useState<RoutinePosterView | null>(null);
  const [features, setFeatures] = useState<PosterFeatures | null>(null);
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
        setPoster(pRes.poster);
        setDraft(pRes.poster);
      }
      setFeatures(fRes.features);
    });
  }, [status, router, params.id]);

  const handleEditorChange = useCallback(
    (steps: PosterStepView[], meta?: Partial<RoutinePosterView>) => {
      setDraft((prev) => (prev ? { ...prev, ...meta, steps } : prev));
    },
    []
  );

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posters/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          celebrationText: draft.celebrationText,
          layout: draft.layout,
          steps: draft.steps.map((s) => ({
            title: s.title,
            iconEmoji: s.iconEmoji,
            isStoryTimeStep: s.isStoryTimeStep,
            isSongStep: s.isSongStep,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setPoster(data.poster);
      setDraft(data.poster);
      toast.success('Poster saved');
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
        setPoster(data.poster);
        setDraft(data.poster);
      }
    } catch {
      /* layout revert on error handled by next fetch */
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

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24 print:p-0">
        <div className="flex items-center gap-2 pt-2 print:hidden">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/posters"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold flex-1 truncate">Edit poster</h1>
          <Button size="sm" className="rounded-full" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>

        <div className="flex justify-center print:block">
          <PosterPreviewWithQr poster={draft} />
        </div>

        <div className="flex gap-2 print:hidden">
          <Button
            variant={tab === 'edit' ? 'default' : 'outline'}
            className="rounded-xl flex-1"
            onClick={() => setTab('edit')}
          >
            Edit steps
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
              <CardTitle className="text-base">Customise your poster</CardTitle>
            </CardHeader>
            <CardContent>
              <PosterEditor poster={draft} onChange={handleEditorChange} />
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl print:hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Print your poster</CardTitle>
            </CardHeader>
            <CardContent>
              <PosterExportPanel
                poster={draft}
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
          #poster-print-root,
          #poster-print-root * {
            visibility: visible;
          }
          #poster-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </AppShell>
  );
}
