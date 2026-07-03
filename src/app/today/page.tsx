'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sun, UserPlus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { TodaySectionHeader, TodayFocusCard, TodayConnectCard } from '@/components/today/today-cards';
import { TodayPlanCard } from '@/components/today/today-plan-card';
import { TodayBottomSheet } from '@/components/today/today-bottom-sheet';
import {
  MealDetailProvider,
  MealDetailContent,
  MealDetailFooter,
  ActivityDetailView,
  StoryDetailProvider,
  StoryDetailContent,
  StoryDetailFooter,
  LanguageDetailView,
  getLanguageItem,
} from '@/components/today/today-detail-views';
import type { DailyBriefContent } from '@/types/daily-brief';
import { getTimeGreeting } from '@/lib/constants';
import { buildFocusCards, truncateWords } from '@/lib/today-focus';
import { trackEvent, trackReturnVisit } from '@/lib/analytics';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { prefetchTodayStoryAudio, invalidateTodayStoryAudioCache } from '@/lib/story-audio-prefetch';
import {
  prefetchTodayStoryIllustration,
  warmTodayStoryIllustration,
  invalidateTodayStoryIllustrationCache,
} from '@/lib/story-illustration-prefetch';
import {
  prefetchTodayRecipeIllustration,
  warmTodayRecipeIllustration,
  invalidateTodayRecipeIllustrationCache,
} from '@/lib/recipe-illustration-prefetch';

async function parseApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) throw new Error(`Empty response (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid response (${response.status})`);
  }
}

type DetailType = 'meal' | 'activity' | 'story' | 'language' | null;
type RotateSection = 'recipe' | 'play' | 'story' | 'language';

interface ConnectEventPreview {
  id: string;
  title: string;
  broadArea: string;
  date: string;
  timeWindow: string;
}

interface TodayData {
  brief: DailyBriefContent;
  profile: {
    name: string;
    childNickname?: string | null;
    childAge?: string | null;
    parentingGoals?: string[];
    priorityGoal?: string | null;
    currentChallenges?: string[];
  };
  connectAvailableCount: number;
  upcomingEvent: ConnectEventPreview | null;
}

export default function TodayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);
  const [rotating, setRotating] = useState<RotateSection | null>(null);

  const loadToday = useCallback(() => {
    return Promise.all([
      fetch('/api/today', { cache: 'no-store' }).then(async (r) => {
        const json = await parseApiJson<{ brief: DailyBriefContent; profile: TodayData['profile']; error?: string }>(r);
        if (!r.ok) throw new Error(json.error || `Failed (${r.status})`);
        return json;
      }),
      fetch('/api/connect/status')
        .then(async (r) => (r.ok ? parseApiJson<{ statuses: unknown[] }>(r) : { statuses: [] }))
        .catch(() => ({ statuses: [] })),
      fetch('/api/connect/events')
        .then(async (r) => (r.ok ? parseApiJson<{ events: ConnectEventPreview[] }>(r) : { events: [] }))
        .catch(() => ({ events: [] })),
    ])
      .then(([briefData, statusData, eventsData]) => {
        setLoadError(null);
        setData({
          brief: briefData.brief,
          profile: briefData.profile,
          connectAvailableCount: statusData.statuses?.length ?? 0,
          upcomingEvent: eventsData.events?.[0] ?? null,
        });
        trackEvent('today_dashboard_viewed');
        trackReturnVisit();
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load today\'s plan');
      });
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

    loadToday().finally(() => setLoading(false));
  }, [status, router, loadToday]);

  useEffect(() => {
    if (!data?.brief?.bedtimeStory?.story) return;
    prefetchTodayStoryAudio().catch(() => {});
    prefetchTodayStoryIllustration().catch(() => {});
  }, [data?.brief?.bedtimeStory?.story]);

  useEffect(() => {
    if (!data?.brief?.recipe?.subtitle) return;
    prefetchTodayRecipeIllustration().catch(() => {});
  }, [data?.brief?.recipe?.subtitle]);

  useEffect(() => {
    if (activeDetail !== 'story' || !data?.brief?.bedtimeStory?.story) return;
    warmTodayStoryIllustration().catch(() => {});
  }, [activeDetail, data?.brief?.bedtimeStory?.story]);

  useEffect(() => {
    if (activeDetail !== 'meal' || !data?.brief?.recipe?.subtitle) return;
    warmTodayRecipeIllustration().catch(() => {});
  }, [activeDetail, data?.brief?.recipe?.subtitle]);

  const patchBrief = async (action: string, extra?: Record<string, unknown>) => {
    const res = await fetch('/api/daily-brief', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) throw new Error('Request failed');
    const json = await res.json();
    if (json.brief) {
      setData((prev) => (prev ? { ...prev, brief: json.brief } : prev));
    }
    return json;
  };

  const rotate = async (section: RotateSection) => {
    setRotating(section);
    const toastId = toast.loading('Finding another idea…');
    try {
      const res = await fetch('/api/today/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      });
      if (!res.ok) throw new Error('Request failed');
      const json = await res.json();
      if (json.brief) {
        setData((prev) => (prev ? { ...prev, brief: json.brief } : prev));
      }
      if (section === 'story') {
        invalidateTodayStoryAudioCache();
        invalidateTodayStoryIllustrationCache();
        prefetchTodayStoryAudio().catch(() => {});
        prefetchTodayStoryIllustration().catch(() => {});
        warmTodayStoryIllustration().catch(() => {});
      }
      if (section === 'recipe') {
        invalidateTodayRecipeIllustrationCache();
        prefetchTodayRecipeIllustration().catch(() => {});
        warmTodayRecipeIllustration().catch(() => {});
      }
      toast.success('Here\'s another idea!', { id: toastId });
    } catch {
      toast.error('Could not rotate suggestion.', { id: toastId });
    } finally {
      setRotating(null);
    }
  };

  const askMumbot = (prompt: string) => {
    sessionStorage.setItem('mumbot_prefill', prompt);
    router.push('/mumbot');
  };

  const createFridgeRecipe = async (ingredients: string[]) => {
    const res = await fetch('/api/today/meal/from-fridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });
    if (!res.ok) throw new Error('Request failed');
    const json = await res.json();
    if (json.brief) {
      setData((prev) => (prev ? { ...prev, brief: json.brief } : prev));
    }
    invalidateTodayRecipeIllustrationCache();
    prefetchTodayRecipeIllustration().catch(() => {});
    warmTodayRecipeIllustration().catch(() => {});
    trackEvent('meal_from_fridge');
  };

  const closeDetail = () => setActiveDetail(null);

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center animate-gentle-bounce">
            <Sun className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm text-center">What can I do with my child today?</p>
        </div>
      </AppShell>
    );
  }

  const firstName = data?.profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'there';
  const childName = data?.profile?.childNickname;
  const brief = data?.brief;
  const hasChildProfile = !!(childName || data?.profile?.childAge);
  const greeting = getTimeGreeting();
  const goals = data?.profile?.parentingGoals ?? [];
  const challenges = data?.profile?.currentChallenges ?? [];
  const focusCards = buildFocusCards(goals, challenges, data?.profile?.priorityGoal);
  const languageItem = brief ? getLanguageItem(brief.development) : null;

  const connectAvailableText =
    data?.connectAvailableCount === 0
      ? 'No parents nearby yet — set your availability.'
      : data?.connectAvailableCount === 1
        ? '1 parent nearby is open to connect.'
        : `${data?.connectAvailableCount} parents nearby are open to connect.`;

  const upcomingText = data?.upcomingEvent
    ? `1 ${data.upcomingEvent.title.toLowerCase()} · ${data.upcomingEvent.broadArea} · ${format(new Date(data.upcomingEvent.date), 'EEE')}.`
    : 'No upcoming events — browse or create one.';

  const detailTitles: Record<Exclude<DetailType, null>, string> = {
    meal: 'Today\'s Meal',
    activity: 'Today\'s Activity',
    story: 'Read Story',
    language: 'Language & Speech',
  };

  const detailFooter =
    activeDetail === 'activity' && brief ? (
      <ActivityDetailView
        part="footer"
        play={brief.play}
        onSave={() => patchBrief('save-activity')}
        onBack={closeDetail}
      />
    ) : activeDetail === 'language' && brief && languageItem ? (
      <LanguageDetailView part="footer" item={languageItem} onBack={closeDetail} />
    ) : null;

  const detailContent =
    activeDetail === 'activity' && brief ? (
      <ActivityDetailView
        play={brief.play}
        onSave={() => patchBrief('save-activity')}
        onBack={closeDetail}
      />
    ) : activeDetail === 'language' && brief && languageItem ? (
      <LanguageDetailView item={languageItem} childAgeDisplay={brief.childAgeDisplay} onBack={closeDetail} />
    ) : null;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-4 pb-10 space-y-5">
        <header className="space-y-1">
          <p className="text-base font-medium">
            {greeting} {firstName} 👋
          </p>
          <h1 className="text-lg font-bold tracking-tight">Today&apos;s Parenting Plan</h1>
          {hasChildProfile && childName && brief?.childAgeDisplay ? (
            <p className="text-sm text-muted-foreground">{childName} is {brief.childAgeDisplay}.</p>
          ) : (
            <p className="text-sm text-muted-foreground">What can I do with my child today?</p>
          )}
        </header>

        {!hasChildProfile && (
          <div className="visual-card p-3.5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm flex-1">Add a child profile for age-based ideas.</p>
            <Link href="/profile?edit=child">
              <Button size="sm" className="rounded-full">Add</Button>
            </Link>
          </div>
        )}

        {loadError && !brief && (
          <div className="visual-card p-4 text-center space-y-2 border border-destructive/20">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
              setLoading(true);
              loadToday().finally(() => setLoading(false));
            }}>
              Try again
            </Button>
          </div>
        )}

        {brief && (
          <>
            <section className="space-y-2.5">
              <TodaySectionHeader emoji="🌟" title="Today's Plan" />
              <TodayPlanCard
                emoji="🍎"
                label="Meal"
                title={brief.recipe.subtitle}
                preview={truncateWords(brief.recipe.whyThisMeal || brief.recipe.title, 15)}
                ctaLabel="View Meal"
                onOpen={() => {
                  trackEvent('meal_clicked');
                  setActiveDetail('meal');
                }}
                onRefresh={() => rotate('recipe')}
                refreshing={rotating === 'recipe'}
              />
              <TodayPlanCard
                emoji="🎨"
                label="Activity"
                title={brief.play.title}
                preview={truncateWords(brief.play.instructions[0] || 'A fun age-appropriate activity.', 15)}
                ctaLabel="Start Activity"
                onOpen={() => {
                  trackEvent('activity_clicked');
                  setActiveDetail('activity');
                }}
                onRefresh={() => rotate('play')}
                refreshing={rotating === 'play'}
              />
              <TodayPlanCard
                emoji="📖"
                label="Story"
                title={brief.bedtimeStory.title}
                preview={truncateWords(brief.bedtimeStory.moral || 'A bedtime tale for tonight.', 15)}
                ctaLabel="Read Story"
                onOpen={() => {
                  trackEvent('story_clicked');
                  setActiveDetail('story');
                }}
                onRefresh={() => rotate('story')}
                refreshing={rotating === 'story'}
              />
              {languageItem && (
                <TodayPlanCard
                  emoji="💬"
                  label="Language"
                  title={languageItem.domain}
                  preview={truncateWords(languageItem.tryToday || languageItem.insight, 15)}
                  ctaLabel="Try Words"
                  onOpen={() => setActiveDetail('language')}
                  onRefresh={() => rotate('language')}
                  refreshing={rotating === 'language'}
                />
              )}
            </section>

            <section className="space-y-2.5">
              <TodaySectionHeader emoji="🎯" title="Your Focus" />
              {focusCards.length > 0 ? (
                focusCards.map((card) => (
                  <TodayFocusCard
                    key={`${card.type}-${card.title}`}
                    type={card.type}
                    title={card.title}
                    tip={card.tip}
                    onAskMumbot={() => askMumbot(card.mumbotPrompt)}
                  />
                ))
              ) : (
                <div className="visual-card p-3.5 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Add parenting goals to personalise your focus.</p>
                  <Link href="/profile?settings=1">
                    <Button size="sm" variant="outline" className="rounded-full shrink-0">Add Goals</Button>
                  </Link>
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <TodaySectionHeader emoji="👥" title="Connect" />
              <TodayConnectCard
                emoji="👥"
                label="Available Today"
                summary={connectAvailableText}
                ctaLabel="View"
                href="/connect"
              />
              <TodayConnectCard
                emoji="📅"
                label="Upcoming"
                summary={upcomingText}
                ctaLabel="Join"
                href="/connect?tab=events"
              />
            </section>
          </>
        )}
      </div>

      {activeDetail === 'story' && brief ? (
        <StoryDetailProvider
          story={brief.bedtimeStory}
          onSave={(extras) => patchBrief('save-story', extras)}
          onBack={closeDetail}
        >
          <TodayBottomSheet
            open={activeDetail !== null}
            title={detailTitles.story}
            onClose={closeDetail}
            footer={<StoryDetailFooter />}
          >
            <StoryDetailContent childAgeDisplay={brief.childAgeDisplay} />
          </TodayBottomSheet>
        </StoryDetailProvider>
      ) : activeDetail === 'meal' && brief ? (
        <MealDetailProvider
          recipe={brief.recipe}
          childAgeDisplay={brief.childAgeDisplay}
          onSave={() => patchBrief('save-recipe')}
          onBack={closeDetail}
          onFridgeRecipe={createFridgeRecipe}
        >
          <TodayBottomSheet
            open={activeDetail !== null}
            title={detailTitles.meal}
            onClose={closeDetail}
            footer={<MealDetailFooter />}
          >
            <MealDetailContent />
          </TodayBottomSheet>
        </MealDetailProvider>
      ) : (
        <TodayBottomSheet
          open={activeDetail !== null}
          title={activeDetail ? detailTitles[activeDetail] : ''}
          onClose={closeDetail}
          footer={detailFooter ?? undefined}
        >
          {detailContent}
        </TodayBottomSheet>
      )}
    </AppShell>
  );
}
