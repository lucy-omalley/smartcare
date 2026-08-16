'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RoutinePlayer } from '@/components/routines/routine-player';
import type { VisualRoutineView } from '@/types/visual-routine';
import { getOfflineRoutine } from '@/lib/routines/offline-cache';

export default function RoutinePlayPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const routineId = params.id as string;
  const [routine, setRoutine] = useState<VisualRoutineView | null>(null);
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch(`/api/routines/${routineId}`).then((r) => r.json()),
      fetch('/api/voice/profiles').then((r) => r.json()),
      fetch('/api/routines/features').then((r) => r.json()),
    ]).then(([routineRes, voiceRes, featRes]) => {
      if (routineRes.routine) {
        setRoutine(routineRes.routine);
      } else {
        const offline = getOfflineRoutine(routineId);
        if (offline) setRoutine(offline);
      }
      const ready = (voiceRes.profiles ?? []).find((p: { status: string }) => p.status === 'READY');
      if (featRes.features?.familyVoiceEnabled && ready) {
        setVoiceProfileId(ready.id);
      }
    }).catch(() => {
      const offline = getOfflineRoutine(routineId);
      if (offline) setRoutine(offline);
    });
  }, [status, router, routineId]);

  if (!routine) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground text-sm">Loading routine…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <Button variant="ghost" size="sm" className="rounded-full -ml-2" asChild>
          <Link href="/routines"><ArrowLeft className="h-4 w-4 mr-1" /> All routines</Link>
        </Button>
        <RoutinePlayer routine={routine} voiceProfileId={voiceProfileId} />
      </div>
    </AppShell>
  );
}
