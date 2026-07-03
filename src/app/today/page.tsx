'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, MessageCircle, Users, Sun, UserPlus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/home/recipe-card';
import { PlayCard } from '@/components/home/play-card';
import { TipCard } from '@/components/home/tip-card';
import { StoryCard } from '@/components/home/story-card';
import { JournalPrompt } from '@/components/home/journal-prompt';
import { AnimatedSection } from '@/components/visual/animated-section';
import type { DailyBriefContent } from '@/types/daily-brief';
import { getTimeGreeting } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

interface HomeData {
  brief: DailyBriefContent;
  needsIllustrations?: boolean;
  profile: {
    name: string;
    childNickname?: string | null;
    childAge?: string | null;
    location?: string | null;
    parentingGoals?: string[];
    currentChallenges?: string[];
  };
  connectPreview?: Array<{
    id: string;
    parentFirstName: string;
    broadArea: string;
    timeWindow: string;
    interest: string;
    childAgeRange: string;
  }>;
  yesterdayMemory: { content: string } | null;
}

export default function TodayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const illustrationBriefKey = useRef<string | null>(null);

  const briefIllustrationKey = (brief: DailyBriefContent) =>
    `${brief.recipe.subtitle}|${brief.play.title}|${brief.bedtimeStory.title}`;

  const loadBrief = useCallback(() => {
    return Promise.all([
      fetch('/api/daily-brief', { cache: 'no-store' }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || `Failed to load (${r.status})`);
        return json as HomeData;
      }),
      fetch('/api/connect/status').then((r) => r.ok ? r.json() : { statuses: [] }).catch(() => ({ statuses: [] })),
    ])
      .then(([briefData, connectData]) => {
        setLoadError(null);
        setData({
          ...briefData,
          connectPreview: (connectData.statuses || []).slice(0, 3),
        });
        trackEvent('daily_plan_viewed');
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load today\'s plan');
      });
  }, []);

  const generateIllustrations = useCallback(async (sections?: string[]) => {
    setImagesLoading(true);
    const sectionOrder = sections ?? ['recipe', 'play', 'story', 'tip'];
    try {
      for (const section of sectionOrder) {
        const res = await fetch('/api/daily-brief', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate-illustrations', sections: [section] }),
        });
        if (!res.ok) continue;
        const json = await res.json();
        if (json.brief) {
          setData((prev) =>
            prev ? { ...prev, brief: json.brief, needsIllustrations: json.needsIllustrations ?? false } : prev
          );
        }
      }
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/onboarding')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile?.onboardingComplete) router.push('/onboarding');
      });

    loadBrief().finally(() => setLoading(false));
  }, [status, router, loadBrief]);

  useEffect(() => {
    if (!data?.needsIllustrations || imagesLoading || !data.brief) return;
    const key = briefIllustrationKey(data.brief);
    if (illustrationBriefKey.current === key) return;
    illustrationBriefKey.current = key;
    generateIllustrations();
  }, [data?.needsIllustrations, data?.brief, imagesLoading, generateIllustrations]);

  const patchBrief = async (action: string, extra?: Record<string, unknown>) => {
    setSectionLoading(true);
    try {
      const res = await fetch('/api/daily-brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.brief) {
        setData((prev) => (prev ? { ...prev, brief: json.brief, needsIllustrations: true } : prev));
        if (action === 'regenerate-recipe') {
          illustrationBriefKey.current = null;
          generateIllustrations(['recipe']);
        } else if (action === 'regenerate-play') {
          illustrationBriefKey.current = null;
          generateIllustrations(['play']);
        }
      }
    } finally {
      setSectionLoading(false);
    }
  };

  const submitJournal = async (sentence: string) => {
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });
    trackEvent('parent_checkin_completed');
    loadBrief();
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center animate-gentle-bounce">
            <Sun className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm text-center">Preparing today&apos;s parenting plan...</p>
        </div>
      </AppShell>
    );
  }

  const firstName = data?.profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'there';
  const childName = data?.profile?.childNickname;
  const brief = data?.brief;
  const hasChildProfile = !!(childName || data?.profile?.childAge);
  const greeting = getTimeGreeting();

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-5 pb-10 space-y-5">
        <AnimatedSection>
          <header className="space-y-1 py-2">
            <p className="text-sm text-muted-foreground">{greeting}, {firstName}</p>
            <h1 className="text-2xl font-bold tracking-tight">Today&apos;s Parenting Plan</h1>
            {hasChildProfile && childName && brief?.childAgeDisplay ? (
              <p className="text-muted-foreground text-sm">
                For <span className="font-medium text-foreground">{childName}</span> · {brief.childAgeDisplay}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">What should I do with my child today?</p>
            )}
            {imagesLoading && (
              <p className="text-xs text-primary/70 animate-pulse">Personalising your plan...</p>
            )}
          </header>
        </AnimatedSection>

        {!hasChildProfile && (
          <AnimatedSection delay={60}>
            <div className="visual-card p-5 text-center space-y-3">
              <UserPlus className="h-8 w-8 text-primary mx-auto" />
              <p className="text-sm">Create a child profile to personalise your daily plan.</p>
              <Link href="/profile?edit=child">
                <Button className="rounded-full">Create Profile</Button>
              </Link>
            </div>
          </AnimatedSection>
        )}

        {loadError && !brief && (
          <AnimatedSection delay={100}>
            <div className="visual-card p-5 text-center space-y-3 border border-destructive/20 bg-destructive/5">
              <p className="text-sm text-destructive font-medium">Could not load today&apos;s plan</p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
                setLoading(true);
                loadBrief().finally(() => setLoading(false));
              }}>
                Try again
              </Button>
            </div>
          </AnimatedSection>
        )}

        {brief && (
          <>
            <AnimatedSection delay={100}>
              <TipCard tip={brief.tip} imagesLoading={imagesLoading} />
            </AnimatedSection>

            <AnimatedSection delay={140}>
              <RecipeCard
                recipe={brief.recipe}
                loading={sectionLoading}
                imagesLoading={imagesLoading}
                onRegenerate={() => patchBrief('regenerate-recipe')}
                onSave={async () => {
                  await patchBrief('save-recipe');
                  trackEvent('recipe_clicked');
                }}
              />
            </AnimatedSection>

            <AnimatedSection delay={180}>
              <PlayCard
                play={brief.play}
                loading={sectionLoading}
                imagesLoading={imagesLoading}
                onRegenerate={() => patchBrief('regenerate-play')}
              />
            </AnimatedSection>

            <AnimatedSection delay={220}>
              <StoryCard
                story={brief.bedtimeStory}
                imagesLoading={imagesLoading}
                onSave={async (extras) => {
                  await patchBrief('save-story', extras);
                  trackEvent('story_clicked');
                }}
              />
            </AnimatedSection>
          </>
        )}

        <AnimatedSection delay={260}>
          <JournalPrompt yesterdayMemory={data?.yesterdayMemory} onSubmit={submitJournal} />
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <Link href="/mumbot">
            <div className="visual-card p-5 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Ask MumBot</p>
                  <p className="text-xs text-muted-foreground">Ask anything about parenting</p>
                </div>
              </div>
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </AnimatedSection>

        <AnimatedSection delay={340}>
          <Link href="/connect">
            <div className="visual-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Connect</p>
                </div>
                <span className="text-xs text-primary">See all →</span>
              </div>
              {(data?.connectPreview?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {data!.connectPreview!.map((s) => (
                    <p key={s.id} className="text-xs text-muted-foreground">
                      {s.broadArea} · {s.timeWindow} · {s.interest} · {s.childAgeRange} · Open to connect
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Set broad availability or join parent-led events safely.</p>
              )}
            </div>
          </Link>
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
