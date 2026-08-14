'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sun, UserPlus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { TabLoadingScreen } from '@/components/layout/tab-loading-screen';
import { Button } from '@/components/ui/button';
import { TodaySectionHeader, TodayConnectCard } from '@/components/today/today-cards';
import { TodayFocusBanner } from '@/components/today/today-focus-banner';
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
} from '@/components/today/today-detail-views';
import type { DailyBriefContent } from '@/types/daily-brief';
import { getTimeGreeting } from '@/lib/constants';
import { truncateWords } from '@/lib/today-focus';
import { languageFromDevelopment, isValidBriefContent, normalizeBriefContent } from '@/lib/today-plan-utils';
import { sectionSnapshot, applyRotatedSection } from '@/lib/services/today-rotate';
import { consumeTodayPlanStale } from '@/lib/today-plan-stale';
import { hasStoryPreferences } from '@/lib/story-preferences';
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
import { ParentCheckInCard } from '@/components/home/parent-checkin-card';
import { BetaPremiumWelcomeBanner } from '@/components/beta/beta-premium-welcome-banner';
import { TodayWowDashboard } from '@/components/today/today-wow-dashboard';
import { TodayPlanFeedbackWidget } from '@/components/today/today-plan-feedback';
import { StorytimePromoCard } from '@/components/storytime/storytime-promo-card';

const WOW_DISMISS_KEY = 'parenfy_today_wow_dismissed';

async function parseApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) throw new Error(`Empty response (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid response (${response.status})`);
  }
}

type DetailType = 'meal' | 'activity' | 'story' | 'language' | 'milestone' | 'parentTip' | null;
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
    childBirthday?: string | null;
    parentingGoals?: string[];
    priorityGoal?: string | null;
    currentChallenges?: string[];
    favouriteAnimal?: string | null;
    favouriteVehicle?: string | null;
    favouriteCharacter?: string | null;
    storyLearningTheme?: string | null;
    storyMoralPreference?: string | null;
  };
  connectAvailableCount: number;
  upcomingEvent: ConnectEventPreview | null;
}

export default function TodayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWow, setShowWow] = useState(false);
  const [data, setData] = useState<TodayData | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planRefreshSlow, setPlanRefreshSlow] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);
  const [rotating, setRotating] = useState<RotateSection | null>(null);
  const rotatingRef = useRef(false);
  const lastRotateAtRef = useRef(0);
  const lastBriefUpdatedAtRef = useRef<string | null>(null);
  const profileRefreshPollRef = useRef(false);

  useEffect(() => {
    const welcome = searchParams.get('welcome') === '1';
    setShowWow(welcome);
    if (welcome) {
      trackEvent('first_session_dashboard_viewed');
    }
  }, [searchParams]);

  const dismissWow = useCallback(() => {
    localStorage.setItem(WOW_DISMISS_KEY, '1');
    setShowWow(false);
  }, []);

  const submitCheckIn = useCallback(
    async (payload: { feeling: string; win: string; challenge: string }) => {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Check-in failed');
      }
      return parseApiJson<{ encouragement?: string }>(res);
    },
    []
  );

  const loadConnectData = useCallback(() => {
    return Promise.all([
      fetch('/api/connect/status')
        .then(async (r) => (r.ok ? parseApiJson<{ statuses: unknown[] }>(r) : { statuses: [] }))
        .catch(() => ({ statuses: [] })),
      fetch('/api/connect/events')
        .then(async (r) => (r.ok ? parseApiJson<{ events: ConnectEventPreview[] }>(r) : { events: [] }))
        .catch(() => ({ events: [] })),
    ])
      .then(([statusData, eventsData]) => {
        setData((prev) =>
          prev
            ? {
                ...prev,
                connectAvailableCount: statusData.statuses?.length ?? 0,
                upcomingEvent: eventsData.events?.[0] ?? null,
              }
            : prev
        );
      });
  }, []);

  const loadToday = useCallback((options?: { silent?: boolean; generate?: boolean; profileRefresh?: boolean }) => {
    if (!options?.silent) setPlanLoading(true);
    const params = new URLSearchParams();
    if (options?.generate) params.set('generate', '1');
    if (options?.profileRefresh) params.set('profileRefresh', '1');
    const query = params.toString();
    const url = query ? `/api/today?${query}` : '/api/today';
    return fetch(url, { cache: 'no-store' })
      .then(async (r) => {
        const json = await parseApiJson<{
          brief: DailyBriefContent;
          profile: TodayData['profile'];
          generating?: boolean;
          briefUpdatedAt?: string | null;
          error?: string;
        }>(r);
        if (!r.ok) throw new Error(json.error || `Failed (${r.status})`);
        return json;
      })
      .then((briefData) => {
        if (!briefData.brief || !isValidBriefContent(briefData.brief)) {
          throw new Error('Today\'s plan could not be loaded. Please try again.');
        }
        setLoadError(null);
        setGeneratingPlan(Boolean(briefData.generating));
        if (!briefData.generating) setPlanRefreshSlow(false);
        setData((prev) => {
          if (options?.silent && rotatingRef.current) {
            return prev;
          }
          if (
            options?.silent &&
            Date.now() - lastRotateAtRef.current < 20000
          ) {
            return prev;
          }
          if (
            options?.silent &&
            briefData.briefUpdatedAt &&
            lastBriefUpdatedAtRef.current &&
            new Date(briefData.briefUpdatedAt).getTime() <
              new Date(lastBriefUpdatedAtRef.current).getTime()
          ) {
            return prev;
          }
          if (
            options?.silent &&
            prev?.brief &&
            isValidBriefContent(prev.brief) &&
            !isValidBriefContent(briefData.brief)
          ) {
            return prev;
          }
          if (briefData.briefUpdatedAt) {
            lastBriefUpdatedAtRef.current = briefData.briefUpdatedAt;
          }
          return {
            brief: briefData.brief,
            profile: briefData.profile,
            connectAvailableCount: prev?.connectAvailableCount ?? 0,
            upcomingEvent: prev?.upcomingEvent ?? null,
          };
        });
        if (!options?.silent) {
          trackEvent('today_dashboard_viewed');
          trackEvent('today_plan_viewed');
          trackReturnVisit();
        }
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load today\'s plan');
      })
      .finally(() => setPlanLoading(false));
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

    loadToday();
    loadConnectData();
  }, [status, router, loadToday, loadConnectData]);

  useEffect(() => {
    if (!generatingPlan || status !== 'authenticated') return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 5;

    const runGeneration = async () => {
      attempts += 1;
      try {
        await loadToday({
          silent: true,
          generate: true,
          profileRefresh: profileRefreshPollRef.current,
        });
        profileRefreshPollRef.current = false;
      } catch {
        /* loadToday sets loadError */
      }
      if (cancelled) return;
      if (attempts >= maxAttempts) {
        setGeneratingPlan(false);
        setPlanRefreshSlow(true);
      }
    };

    void runGeneration();
    const interval = setInterval(() => {
      if (attempts >= maxAttempts) return;
      void runGeneration();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [generatingPlan, status, loadToday]);

  const reloadTodayPlan = useCallback(() => {
    setPlanLoading(true);
    loadToday({ silent: true }).finally(() => setPlanLoading(false));
  }, [loadToday]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const refreshIfStale = () => {
      if (!consumeTodayPlanStale()) return;
      lastBriefUpdatedAtRef.current = null;
      profileRefreshPollRef.current = true;
      setGeneratingPlan(true);
      setPlanRefreshSlow(false);
      invalidateTodayStoryAudioCache();
      invalidateTodayStoryIllustrationCache();
      invalidateTodayRecipeIllustrationCache();
      toast.info('Updating Today\'s Plan with your profile changes…');
      void loadToday({ silent: true, generate: true, profileRefresh: true });
    };

    refreshIfStale();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshIfStale();
    };

    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, reloadTodayPlan]);

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
    if (action === 'save-recipe') {
      trackEvent('meal_saved', { title: json.brief?.recipe?.subtitle ?? data?.brief?.recipe?.subtitle });
    }
    if (action === 'save-story') {
      trackEvent('story_saved', { title: json.brief?.bedtimeStory?.title ?? data?.brief?.bedtimeStory?.title });
    }
    if (action === 'save-activity') {
      trackEvent('activity_completed', { title: json.brief?.play?.title ?? data?.brief?.play?.title });
    }
    return json;
  };

  useEffect(() => {
    const brief = data?.brief;
    if (!brief || !activeDetail) return;
    if (activeDetail === 'meal') {
      trackEvent('meal_viewed', { title: brief.recipe.subtitle });
    }
    if (activeDetail === 'story') {
      trackEvent('story_started', { title: brief.bedtimeStory.title });
    }
    if (activeDetail === 'activity') {
      trackEvent('activity_started', { title: brief.play.title });
    }
    if (activeDetail === 'language' && brief) {
      const lang = brief.languageSection ?? languageFromDevelopment(brief);
      if (lang) trackEvent('language_activity_started', { domain: lang.domain ?? 'Language' });
    }
    if (activeDetail === 'milestone' && brief?.milestone) {
      trackEvent('milestone_card_opened', { domain: brief.milestone.domain });
    }
    if (activeDetail === 'parentTip') {
      trackEvent('parent_tip_opened');
    }
  }, [activeDetail, data?.brief]);

  const rotate = async (section: RotateSection) => {
    setRotating(section);
    rotatingRef.current = true;
    trackEvent('today_refresh_clicked', { section });
    const toastId = toast.loading('Finding another idea…');
    const beforeSnapshot = data?.brief ? sectionSnapshot(data.brief, section) : '';
    try {
      const res = await fetch('/api/today/rotate', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      });
      const json = await parseApiJson<{
        brief?: DailyBriefContent;
        changed?: boolean;
        updatedAt?: string;
        error?: string;
      }>(res);

      if (!res.ok) {
        throw new Error(json.error || 'Could not load another suggestion.');
      }

      const afterSnapshot = json.brief ? sectionSnapshot(json.brief, section) : '';
      const changed = json.changed ?? beforeSnapshot !== afterSnapshot;

      const mergedBrief =
        data?.brief && json.brief
          ? normalizeBriefContent(applyRotatedSection(data.brief, json.brief, section))
          : json.brief;

      if (!mergedBrief || !changed || !isValidBriefContent(mergedBrief)) {
        toast.error('Could not find a different suggestion. Please try again.', { id: toastId });
        return;
      }

      lastRotateAtRef.current = Date.now();
      if (json.updatedAt) {
        lastBriefUpdatedAtRef.current = json.updatedAt;
      }
      setData((prev) => (prev ? { ...prev, brief: mergedBrief } : prev));
      setGeneratingPlan(false);
      if (section === 'recipe') {
        trackEvent('meal_rotated', { title: json.brief?.recipe?.subtitle });
        invalidateTodayRecipeIllustrationCache();
        prefetchTodayRecipeIllustration().catch(() => {});
        warmTodayRecipeIllustration().catch(() => {});
      }
      if (section === 'play') {
        trackEvent('activity_rotated', { title: json.brief?.play?.title });
      }
      if (section === 'story') {
        trackEvent('story_rotated', { title: json.brief?.bedtimeStory?.title });
        invalidateTodayStoryAudioCache();
        invalidateTodayStoryIllustrationCache();
        prefetchTodayStoryAudio().catch(() => {});
        prefetchTodayStoryIllustration().catch(() => {});
        warmTodayStoryIllustration().catch(() => {});
      }
      if (section === 'language') {
        trackEvent('language_activity_started');
      }
      toast.success('Here\'s another idea!', { id: toastId });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not load another suggestion.';
      toast.error(message, { id: toastId });
    } finally {
      rotatingRef.current = false;
      setRotating(null);
    }
  };

  const askMumbot = (prompt: string) => {
    sessionStorage.setItem('mumbot_prefill', prompt);
    router.push('/mumbot');
  };

  const createFridgeRecipe = async ({
    ingredients,
    mealPreferences,
    tryAnother,
  }: {
    ingredients: string[];
    mealPreferences: string[];
    tryAnother?: boolean;
  }) => {
    const res = await fetch('/api/today/meal/from-fridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, mealPreferences, tryAnother }),
    });
    if (!res.ok) throw new Error('Request failed');
    const json = await res.json();
    if (json.brief) {
      setData((prev) => (prev ? { ...prev, brief: json.brief } : prev));
    }
    invalidateTodayRecipeIllustrationCache();
    prefetchTodayRecipeIllustration().catch(() => {});
    warmTodayRecipeIllustration().catch(() => {});
    trackEvent(tryAnother ? 'meal_from_fridge_retry' : 'meal_from_fridge');
  };

  const closeDetail = () => {
    const brief = data?.brief;
    if (activeDetail === 'story' && brief) {
      trackEvent('story_completed', { title: brief.bedtimeStory.title });
    }
    if (activeDetail === 'language' && brief) {
      const lang = brief.languageSection ?? languageFromDevelopment(brief);
      trackEvent('language_activity_completed', { domain: lang?.domain ?? 'Language' });
    }
    setActiveDetail(null);
  };

  if (status === 'loading' || (planLoading && !data && !loadError)) {
    return (
      <TabLoadingScreen
        message="What can I do with my child today?"
        icon="today"
      />
    );
  }

  const firstName = data?.profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'there';
  const childName = data?.profile?.childNickname;
  const brief = data?.brief;
  const hasChildProfile = !!(childName || data?.profile?.childAge || data?.profile?.childBirthday);
  const greeting = getTimeGreeting();
  const goals = data?.profile?.parentingGoals ?? [];
  const languageSection = brief ? (brief.languageSection ?? languageFromDevelopment(brief)) : null;
  const todayFocus = brief?.todayFocus;
  const weeklyFocus = brief?.weeklyFocus;
  const milestone = brief?.milestone;
  const parentTip = brief?.parentTip;

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
    milestone: 'Today\'s Milestone',
    parentTip: 'Parent Tip',
  };

  const detailFooter =
    activeDetail === 'activity' && brief ? (
      <ActivityDetailView
        part="footer"
        play={brief.play}
        onSave={() => patchBrief('save-activity')}
        onBack={closeDetail}
      />
    ) : activeDetail === 'language' && brief && languageSection ? (
      <LanguageDetailView part="footer" language={languageSection} onBack={closeDetail} />
    ) : activeDetail === 'milestone' || activeDetail === 'parentTip' ? (
      <Button variant="outline" className="w-full rounded-full touch-target" onClick={closeDetail}>
        Back to Today
      </Button>
    ) : null;

  const detailContent =
    activeDetail === 'activity' && brief ? (
      <ActivityDetailView
        play={brief.play}
        onSave={() => patchBrief('save-activity')}
        onBack={closeDetail}
      />
    ) : activeDetail === 'language' && brief && languageSection ? (
      <LanguageDetailView language={languageSection} childAgeDisplay={brief.childAgeDisplay} onBack={closeDetail} />
    ) : activeDetail === 'milestone' && brief && milestone ? (
      <div className="space-y-4 text-sm pb-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{milestone.domain}</p>
          <h3 className="text-lg font-bold mt-1">{milestone.milestone}</h3>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Why it matters</p>
          <p className="leading-relaxed">{milestone.whyItMatters}</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-3">
          <p className="text-xs font-medium mb-1">Today&apos;s tip</p>
          <p className="leading-relaxed">{milestone.tip}</p>
        </div>
      </div>
    ) : activeDetail === 'parentTip' && brief && parentTip ? (
      <div className="space-y-4 text-sm pb-2">
        <p className="leading-relaxed">{parentTip.content}</p>
        <p className="text-xs text-muted-foreground">{parentTip.reason}</p>
      </div>
    ) : null;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-4 pb-10 space-y-5">
        <header className="space-y-2">
          <p className="text-base font-medium">
            {greeting} {firstName} 👋
          </p>
          {hasChildProfile && childName && brief?.childAgeDisplay ? (
            <p className="text-sm text-muted-foreground">Today for {childName} ({brief.childAgeDisplay})</p>
          ) : (
            <p className="text-sm text-muted-foreground">What can I do with my child today?</p>
          )}
          {weeklyFocus && (
            <TodayFocusBanner
              label="This week's focus"
              title={weeklyFocus.title}
              reason={weeklyFocus.reason}
              variant="weekly"
            />
          )}
          {todayFocus && (
            <TodayFocusBanner
              label="Today's focus"
              title={todayFocus.title}
              reason={todayFocus.reason}
              variant="today"
            />
          )}
          {generatingPlan && (
            <p className="text-xs text-muted-foreground px-0.5 animate-pulse">
              Personalising your full plan…
            </p>
          )}
          {planRefreshSlow && !generatingPlan && (
            <p className="text-xs text-muted-foreground px-0.5">
              Plan update is taking longer than usual. Showing the latest available plan —{' '}
              <button
                type="button"
                className="underline text-primary"
                onClick={() => {
                  setPlanRefreshSlow(false);
                  setGeneratingPlan(true);
                  void loadToday({ silent: true, generate: true, profileRefresh: profileRefreshPollRef.current });
                }}
              >
                retry
              </button>
            </p>
          )}
        </header>

        <BetaPremiumWelcomeBanner />

        {brief && isValidBriefContent(brief) && showWow && (
          <TodayWowDashboard brief={brief} childName={childName} onDismiss={dismissWow} />
        )}

        {!hasChildProfile && (
          <div className="visual-card p-3.5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm flex-1">Create a child profile to personalise your Today Plan.</p>
            <Link href="/profile?edit=child">
              <Button size="sm" className="rounded-full">Add</Button>
            </Link>
          </div>
        )}

        {loadError && (
          <div className="visual-card p-4 text-center space-y-2 border border-destructive/20">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
              setPlanLoading(true);
              loadToday().finally(() => setPlanLoading(false));
            }}>
              Try again
            </Button>
          </div>
        )}

        {brief && isValidBriefContent(brief) && (
          <>
            <section className="space-y-2.5">
              <TodaySectionHeader emoji="🌟" title="Today's Plan" />
              <TodayPlanCard
                key={`meal-${brief.recipe.subtitle}`}
                emoji="🍎"
                label="Meal"
                title={brief.recipe.subtitle}
                preview={truncateWords(brief.recipe.whyThisMeal || brief.recipe.title, 15)}
                ctaLabel="View Meal"
                onOpen={() => {
                  trackEvent('meal_card_opened', { title: brief.recipe.subtitle });
                  trackEvent('meal_opened', { title: brief.recipe.subtitle });
                  setActiveDetail('meal');
                }}
                onRefresh={() => rotate('recipe')}
                refreshing={rotating === 'recipe'}
              />
              <TodayPlanCard
                key={`activity-${brief.play.title}`}
                emoji="🎨"
                label="Activity"
                title={brief.play.title}
                preview={truncateWords(brief.play.reason || brief.play.instructions[0] || 'A fun age-appropriate activity.', 15)}
                ctaLabel="Start Activity"
                onOpen={() => {
                  trackEvent('activity_card_opened', { title: brief.play.title });
                  trackEvent('activity_opened', { title: brief.play.title });
                  setActiveDetail('activity');
                }}
                onRefresh={() => rotate('play')}
                refreshing={rotating === 'play'}
              />
              <TodayPlanCard
                key={`story-${brief.bedtimeStory.title}`}
                emoji="📖"
                label="Story"
                title={brief.bedtimeStory.title}
                preview={truncateWords(
                  hasStoryPreferences(data?.profile)
                    ? `Personalized for ${childName || 'your child'}. ${brief.bedtimeStory.reason || brief.bedtimeStory.theme || brief.bedtimeStory.moral || 'A bedtime tale woven with their favourites.'}`
                    : brief.bedtimeStory.reason || brief.bedtimeStory.moral || 'A bedtime tale for tonight.',
                  15
                )}
                ctaLabel="Read Story"
                onOpen={() => {
                  trackEvent('story_card_opened', { title: brief.bedtimeStory.title });
                  trackEvent('story_opened', { title: brief.bedtimeStory.title });
                  setActiveDetail('story');
                }}
                onRefresh={() => rotate('story')}
                refreshing={rotating === 'story'}
              />
              <StorytimePromoCard childName={childName} compact />
              {languageSection && (
                <TodayPlanCard
                  emoji="💬"
                  label="Language"
                  title={languageSection.domain ?? 'Language & Speech'}
                  preview={truncateWords(languageSection.reason || languageSection.miniGame, 15)}
                  ctaLabel="Try Words"
                  onOpen={() => {
                    trackEvent('language_card_opened', { domain: languageSection.domain ?? 'Language' });
                    setActiveDetail('language');
                  }}
                  onRefresh={() => rotate('language')}
                  refreshing={rotating === 'language'}
                />
              )}
              {milestone && (
                <TodayPlanCard
                  emoji="🌱"
                  label="Milestone"
                  title={milestone.domain}
                  preview={truncateWords(milestone.tip || milestone.milestone, 15)}
                  ctaLabel="View Tip"
                  onOpen={() => {
                    trackEvent('milestone_card_opened', { domain: milestone.domain });
                    setActiveDetail('milestone');
                  }}
                />
              )}
              {parentTip && (
                <TodayPlanCard
                  emoji="💡"
                  label="Parent Tip"
                  title="Coaching tip"
                  preview={truncateWords(parentTip.content, 15)}
                  ctaLabel="Read Tip"
                  onOpen={() => {
                    trackEvent('parent_tip_opened');
                    setActiveDetail('parentTip');
                  }}
                />
              )}
            </section>

            <section className="space-y-2.5">
              <TodaySectionHeader emoji="🤖" title="Ask MumBot" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => askMumbot('Tell me more about today\'s activity.')}>
                  About today&apos;s activity
                </Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => askMumbot('Suggest another meal for today.')}>
                  Another meal idea
                </Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => askMumbot('Can you adapt today\'s story?')}>
                  Adapt today&apos;s story
                </Button>
                {goals[0] && (
                  <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => askMumbot(`Help me with ${goals[0]} based on today's plan.`)}>
                    Help with {goals[0]}
                  </Button>
                )}
              </div>
            </section>

            <TodayPlanFeedbackWidget />

            <section className="space-y-2.5">
              <ParentCheckInCard onSubmit={submitCheckIn} />
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
            <StoryDetailContent
              childAgeDisplay={brief.childAgeDisplay}
              storyPreferences={data?.profile ?? null}
            />
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
