'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BedtimePlayer } from '@/components/storytime/bedtime-player';
import type { VoiceProfileOption } from '@/components/storytime/narrator-picker';
import type { VoiceUsageSnapshot } from '@/types/voice-usage';
import { toast } from 'sonner';

interface Story {
  id: string;
  title: string;
  story: string;
  moralTheme?: string | null;
  isFavorite: boolean;
}

type NarratorSelection =
  | { type: 'standard' }
  | { type: 'family'; voiceProfileId: string };

function resolveInitialNarrator(
  profileList: VoiceProfileOption[],
  familyVoiceEnabled: boolean,
  settings: { lastNarratorType?: string; lastNarratorVoiceId?: string | null } | null | undefined
): NarratorSelection {
  const readyVoices = profileList.filter((v) => v.status === 'READY');

  if (
    settings?.lastNarratorType === 'FAMILY_VOICE' &&
    settings.lastNarratorVoiceId &&
    readyVoices.some((v) => v.id === settings.lastNarratorVoiceId)
  ) {
    return { type: 'family', voiceProfileId: settings.lastNarratorVoiceId };
  }

  if (readyVoices.length === 1 && familyVoiceEnabled) {
    return { type: 'family', voiceProfileId: readyVoices[0].id };
  }

  return { type: 'standard' };
}

export default function StoryPlayerPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  const [story, setStory] = useState<Story | null>(null);
  const [voices, setVoices] = useState<VoiceProfileOption[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [familyVoiceEnabled, setFamilyVoiceEnabled] = useState(false);
  const [voiceUsage, setVoiceUsage] = useState<VoiceUsageSnapshot | null>(null);
  const [voiceProviderConfigured, setVoiceProviderConfigured] = useState<'openai' | 'elevenlabs'>('openai');
  const [initialNarrator, setInitialNarrator] = useState<NarratorSelection>({ type: 'standard' });
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    setPlayerReady(false);
    setStory(null);

    Promise.all([
      fetch(`/api/storytime/stories/${storyId}`).then((r) => r.json()),
      fetch('/api/voice/profiles').then((r) => r.json()),
      fetch('/api/storytime/features').then((r) => r.json()),
      fetch('/api/storytime/narrator').then((r) => r.json()),
    ])
      .then(([storyRes, voiceRes, featRes, narrRes]) => {
        if (!storyRes.story) {
          toast.error(storyRes.error ?? 'Story not found');
          router.push('/stories/history');
          return;
        }

        const profileList: VoiceProfileOption[] = voiceRes.profiles ?? [];
        const voiceEnabled = featRes.features?.familyVoiceEnabled ?? featRes.features?.isPremium ?? false;

        setStory(storyRes.story);
        setVoices(profileList);
        setIsPremium(featRes.features?.isPremium ?? false);
        setFamilyVoiceEnabled(voiceEnabled);
        setVoiceUsage(featRes.features?.voiceUsage ?? null);
        setVoiceProviderConfigured(featRes.features?.voiceProviderConfigured ?? 'openai');
        setInitialNarrator(resolveInitialNarrator(profileList, voiceEnabled, narrRes.settings));
        setPlayerReady(true);
      })
      .catch(() => {
        toast.error('Could not load story');
        router.push('/stories/history');
      });
  }, [status, router, storyId]);

  const toggleFavorite = useCallback(async (next: boolean) => {
    const res = await fetch(`/api/storytime/stories/${storyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: next }),
    });
    const data = await res.json();
    if (data.story) {
      setStory(data.story);
      toast.success(next ? 'Added to favourites' : 'Removed from favourites');
    }
  }, [storyId]);

  const deleteStory = useCallback(async () => {
    if (!confirm('Delete this story permanently? This cannot be undone.')) return;
    const res = await fetch(`/api/storytime/stories/${storyId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not delete story');
      return;
    }
    toast.success('Story deleted');
    router.push('/stories/history');
  }, [storyId, router]);

  if (!story || !playerReady) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground text-sm">Loading story…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <Button variant="ghost" size="sm" className="rounded-full -ml-2" asChild>
          <Link href="/stories/history"><ArrowLeft className="h-4 w-4 mr-1" /> Story library</Link>
        </Button>

        <BedtimePlayer
          key={storyId}
          storyId={story.id}
          title={story.title}
          storyText={story.story}
          moralTheme={story.moralTheme}
          voices={voices}
          isPremium={isPremium}
          familyVoiceEnabled={familyVoiceEnabled}
          voiceProviderConfigured={voiceProviderConfigured}
          voiceUsage={voiceUsage}
          isFavorite={story.isFavorite}
          initialNarrator={initialNarrator}
          onToggleFavorite={toggleFavorite}
          onDelete={deleteStory}
        />
      </div>
    </AppShell>
  );
}
