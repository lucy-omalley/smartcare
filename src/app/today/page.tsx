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
import { ParentCheckInCard } from '@/components/home/parent-checkin-card';
import { AnimatedSection } from '@/components/visual/animated-section';
import type { DailyBriefContent } from '@/types/daily-brief';
import { getTimeGreeting } from '@/lib/constants';
import { trackEvent, trackReturnVisit } from '@/lib/analytics';

interface HomeData {
  brief: DailyBriefContent;
  needsIllustrations?: boolean;
  profile: {
    name: string;
    childNickname?: string | null;
    childAge?: string | null;
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
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-1">
      {children}
    </p>
  );
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
          connectPreview: (connectData.statuses || []).slice(0, 2),
        });
        trackEvent('today_dashboard_viewed');
        trackReturnVisit();
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

  const submitCheckIn = async (checkIn: { feeling: string; win: string; challenge: string }) => {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkIn),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    trackEvent('parent_checkin_completed');
    return { encouragement: json.encouragement as string | undefined };
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center animate-gentle-bounce">
            <Sun className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm text-center">What should I do with my child today?</p>
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
      <div className="container max-w-lg mx-auto px-4 pt-4 pb-10 space-y-4">
        {/* Greeting */}
        <header className="space-y-0.5 py-1">
          <p className="text-sm text-muted-foreground">{greeting}, {firstName}</p>
          <h1 className="text-xl font-bold tracking-tight">Today&apos;s Parenting Plan</h1>
          {hasChildProfile && childName && brief?.childAgeDisplay ? (
            <p className="text-muted-foreground text-sm">
              For {childName} · {brief.childAgeDisplay}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Personalised ideas for your day together</p>
          )}
        </header>

        {!hasChildProfile && (
          <div className="visual-card p-4 flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Add a child profile</p>
              <p className="text-xs text-muted-foreground">Personalise meals, stories &amp; activities</p>
            </div>
            <Link href="/profile?edit=child">
              <Button size="sm" className="rounded-full shrink-0">Add</Button>
            </Link>
          </div>
        )}

        {loadError && !brief && (
          <div className="visual-card p-4 text-center space-y-2 border border-destructive/20 bg-destructive/5">
            <p className="text-sm text-destructive font-medium">Could not load today&apos;s plan</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
              setLoading(true);
              loadBrief().finally(() => setLoading(false));
            }}>
              Try again
            </Button>
          </div>
        )}

        {/* Quick MumBot */}
        <Link href="/mumbot">
          <div className="visual-card p-3.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] bg-primary/5 border-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Ask MumBot anything</p>
              <p className="text-xs text-muted-foreground truncate">Meals, stories, activities &amp; more</p>
            </div>
            <MessageCircle className="h-4 w-4 text-primary shrink-0" />
          </div>
        </Link>

        {brief && (
          <div className="space-y-4">
            <AnimatedSection delay={40}>
              <div className="space-y-2">
                <SectionLabel>Today&apos;s Meal</SectionLabel>
                <RecipeCard
                  recipe={brief.recipe}
                  loading={sectionLoading}
                  imagesLoading={imagesLoading}
                  onRegenerate={() => patchBrief('regenerate-recipe')}
                  onSave={async () => {
                    await patchBrief('save-recipe');
                    trackEvent('meal_clicked');
                  }}
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={80}>
              <div className="space-y-2">
                <SectionLabel>Today&apos;s Activity</SectionLabel>
                <PlayCard
                  play={brief.play}
                  loading={sectionLoading}
                  imagesLoading={imagesLoading}
                  onRegenerate={async () => {
                    await patchBrief('regenerate-play');
                    trackEvent('activity_clicked');
                  }}
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={120}>
              <div className="space-y-2">
                <SectionLabel>Today&apos;s Story</SectionLabel>
                <StoryCard
                  story={brief.bedtimeStory}
                  imagesLoading={imagesLoading}
                  onSave={async (extras) => {
                    await patchBrief('save-story', extras);
                    trackEvent('story_clicked');
                  }}
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={160}>
              <div className="space-y-2">
                <SectionLabel>Today&apos;s Parenting Tip</SectionLabel>
                <TipCard tip={brief.tip} imagesLoading={imagesLoading} />
              </div>
            </AnimatedSection>
          </div>
        )}

        {/* Connect suggestion */}
        <AnimatedSection delay={200}>
          <div className="space-y-2">
            <SectionLabel>Today&apos;s Connect</SectionLabel>
            <Link href="/connect">
              <div className="visual-card p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">Meet a parent nearby</p>
                  </div>
                  <span className="text-xs text-primary">Connect →</span>
                </div>
                {(data?.connectPreview?.length ?? 0) > 0 ? (
                  data!.connectPreview!.map((s) => (
                    <p key={s.id} className="text-xs text-muted-foreground">
                      {s.broadArea} · {s.timeWindow} · {s.interest} · {s.childAgeRange}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Set broad availability or join a parent-led event — privacy-first.
                  </p>
                )}
              </div>
            </Link>
          </div>
        </AnimatedSection>

        {/* Parent Check-in */}
        <AnimatedSection delay={240}>
          <ParentCheckInCard onSubmit={submitCheckIn} />
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
