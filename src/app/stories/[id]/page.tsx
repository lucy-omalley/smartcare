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
import { toast } from 'sonner';

interface Story {
  id: string;
  title: string;
  story: string;
  moralTheme?: string | null;
  isFavorite: boolean;
}

export default function StoryPlayerPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  const [story, setStory] = useState<Story | null>(null);
  const [voices, setVoices] = useState<VoiceProfileOption[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [initialNarrator, setInitialNarrator] = useState<
    { type: 'standard' } | { type: 'family'; voiceProfileId: string }
  >({ type: 'standard' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch(`/api/storytime/stories/${storyId}`).then((r) => r.json()),
      fetch('/api/voice/profiles').then((r) => r.json()),
      fetch('/api/storytime/features').then((r) => r.json()),
      fetch('/api/storytime/narrator').then((r) => r.json()),
    ]).then(([storyRes, voiceRes, featRes, narrRes]) => {
      if (storyRes.story) setStory(storyRes.story);
      setVoices(voiceRes.profiles ?? []);
      setIsPremium(featRes.features?.isPremium ?? false);
      const settings = narrRes.settings;
      if (settings?.lastNarratorType === 'FAMILY_VOICE' && settings.lastNarratorVoiceId) {
        setInitialNarrator({ type: 'family', voiceProfileId: settings.lastNarratorVoiceId });
      }
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

  if (!story) {
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
          storyId={story.id}
          title={story.title}
          storyText={story.story}
          moralTheme={story.moralTheme}
          voices={voices}
          isPremium={isPremium}
          isFavorite={story.isFavorite}
          initialNarrator={initialNarrator}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    </AppShell>
  );
}
