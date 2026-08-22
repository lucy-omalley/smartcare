'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { TabLoadingScreen } from '@/components/layout/tab-loading-screen';
import { Button } from '@/components/ui/button';
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
import { languageFromDevelopment, isValidBriefContent, normalizeBriefContent } from '@/lib/today-plan-utils';
import { sectionSnapshot, applyRotatedSection } from '@/lib/services/today-rotate';
import { consumeTodayPlanStale } from '@/lib/today-plan-stale';
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
import { BetaPremiumWelcomeBanner } from '@/components/beta/beta-premium-welcome-banner';
import { FirstJourneyWelcome } from '@/components/activation/first-journey-welcome';
import { ActivationWowMoment } from '@/components/activation/activation-wow-moment';
import { recommendHeroFeature } from '@/lib/activation/recommend-hero-feature';
import { HomeV3Dashboard } from '@/components/home/v3/home-v3-dashboard';
import { saveHeroContinue } from '@/components/home/v3/hero-continue-state';
import { saveContinueState } from '@/components/today/today-continue-state';
import { useTranslation } from '@/hooks/use-translation';

const FIRST_SESSION_KEY = 'parenfy_activation_first_done';

type ActivationPhase = 'first' | 'wow' | 'normal';

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
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activationPhase, setActivationPhase] = useState<ActivationPhase>('normal');
  const [hasToyProfile, setHasToyProfile] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
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
    try {
      if (!sessionStorage.getItem('parenfy_session_start')) {
        sessionStorage.setItem('parenfy_session_start', String(Date.now()));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const first = searchParams.get('first') === '1';
    const welcome = searchParams.get('welcome') === '1';
    if (first) {
      setActivationPhase('first');
    } else if (welcome) {
      setActivationPhase('wow');
    }
    try {
      const hadSession = sessionStorage.getItem(FIRST_SESSION_KEY);
      if (hadSession && !first) {
        setIsReturning(true);
        trackEvent('returning_session_viewed');
      }
    } catch {
      /* ignore */
    }
    if (welcome) {
      trackEvent('first_session_dashboard_viewed');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activationPhase === 'first' && data?.brief && isValidBriefContent(data.brief)) {
      setActivationPhase('wow');
      trackEvent('wow_moment_viewed');
      try {
        sessionStorage.setItem(FIRST_SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [activationPhase, data?.brief]);

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
          const profileRefresh = options?.profileRefresh === true;
          if (options?.silent && !profileRefresh && rotatingRef.current) {
            return prev;
          }
          if (
            options?.silent &&
            !profileRefresh &&
            Date.now() - lastRotateAtRef.current < 20000
          ) {
            return prev;
          }
          if (
            options?.silent &&
            !profileRefresh &&
            briefData.briefUpdatedAt &&
            lastBriefUpdatedAtRef.current &&
            new Date(briefData.briefUpdatedAt).getTime() <
              new Date(lastBriefUpdatedAtRef.current).getTime()
          ) {
            return prev;
          }
          if (
            options?.silent &&
            !profileRefresh &&
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

    fetch('/api/toy-brain')
      .then((r) => r.json())
      .then((json) => setHasToyProfile((json.toys?.length ?? 0) > 0))
      .catch(() => {});

    if (searchParams.get('first') === '1') return;

    loadToday();
    loadConnectData();
  }, [status, router, loadToday, loadConnectData, searchParams]);

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
  }, [status, loadToday]);

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
      trackEvent('activity_saved', { title: json.brief?.play?.title ?? data?.brief?.play?.title });
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

  const openDetail = (type: Exclude<DetailType, null>, title?: string) => {
    if (title) saveContinueState(type, title);
    setActiveDetail(type);
  };

  if (status === 'loading' || (planLoading && !data && !loadError && activationPhase !== 'first')) {
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
  const languageSection = brief ? (brief.languageSection ?? languageFromDevelopment(brief)) : null;
  const milestone = brief?.milestone;
  const parentTip = brief?.parentTip;

  const startTodaysJourney = () => {
    if (!brief) return;
    trackEvent('todays_journey_started');
    trackEvent('activity_opened', { title: brief.play.title, source: 'journey_hero' });
    saveHeroContinue('journey', brief.play.title, '/today');
    openDetail('activity', brief.play.title);
    trackEvent('activity_card_opened', { title: brief.play.title });
    if (activationPhase === 'wow') {
      setActivationPhase('normal');
      router.replace('/today', { scroll: false });
    }
  };

  const createFirstJourney = () => {
    trackEvent('first_journey_started');
    setGeneratingPlan(true);
    setPlanLoading(true);
    void loadToday({ generate: true });
  };

  const heroRecommendation = recommendHeroFeature({
    childAge: data?.profile?.childAge,
    childBirthday: data?.profile?.childBirthday,
    hasToyProfile,
  });

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
        onTryAnother={() => rotate('play')}
        tryingAnother={rotating === 'play'}
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
      <div className="container max-w-lg mx-auto px-4 pt-4 pb-10 space-y-6">
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

        <BetaPremiumWelcomeBanner />

        {activationPhase === 'first' && (
          <FirstJourneyWelcome
            firstName={firstName}
            loading={planLoading || generatingPlan}
            onCreateJourney={createFirstJourney}
          />
        )}

        {activationPhase === 'wow' && brief && isValidBriefContent(brief) && (
          <ActivationWowMoment
            brief={brief}
            childName={childName}
            recommendation={heroRecommendation}
            onStartJourney={startTodaysJourney}
          />
        )}

        {activationPhase === 'normal' && !hasChildProfile && (
          <div className="visual-card p-3.5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm flex-1">{t('home.addChildProfile')}</p>
            <Link href="/profile?edit=child">
              <Button size="sm" className="rounded-full">{t('home.add')}</Button>
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

        {activationPhase === 'normal' && brief && isValidBriefContent(brief) && (
          <HomeV3Dashboard
            greeting={greeting}
            firstName={firstName}
            childName={childName}
            brief={brief}
            isReturning={isReturning}
            profile={data?.profile ?? null}
            languageSection={languageSection}
            connectAvailableCount={data?.connectAvailableCount ?? 0}
            upcomingEvent={data?.upcomingEvent ?? null}
            onStartJourney={startTodaysJourney}
            onOpenMeal={() => {
              trackEvent('meal_card_opened', { title: brief.recipe.subtitle });
              trackEvent('meal_viewed', { title: brief.recipe.subtitle });
              trackEvent('meal_opened', { title: brief.recipe.subtitle });
              openDetail('meal', brief.recipe.subtitle);
            }}
            onOpenActivity={() => {
              trackEvent('activity_card_opened', { title: brief.play.title });
              trackEvent('activity_viewed', { title: brief.play.title });
              trackEvent('activity_opened', { title: brief.play.title });
              openDetail('activity', brief.play.title);
            }}
            onOpenStory={() => {
              trackEvent('story_card_opened', { title: brief.bedtimeStory.title });
              trackEvent('story_viewed', { title: brief.bedtimeStory.title });
              trackEvent('story_opened', { title: brief.bedtimeStory.title });
              openDetail('story', brief.bedtimeStory.title);
            }}
            onOpenLanguage={() => {
              if (!languageSection) return;
              trackEvent('language_card_opened', { domain: languageSection.domain ?? 'Language' });
              trackEvent('language_viewed', { domain: languageSection.domain ?? 'Language' });
              openDetail('language', languageSection.domain ?? 'Language');
            }}
            onOpenMilestone={() => openDetail('milestone', milestone?.milestone)}
            onOpenParentTip={() => openDetail('parentTip')}
            onResumePlan={(type) => openDetail(type)}
            onAskMumbot={askMumbot}
            onCheckIn={submitCheckIn}
            onTryAnother={(section) => rotate(section)}
            rotating={rotating}
          />
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
            footer={<StoryDetailFooter onTryAnother={() => rotate('story')} tryingAnother={rotating === 'story'} />}
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
            footer={<MealDetailFooter onTryAnother={() => rotate('recipe')} tryingAnother={rotating === 'recipe'} />}
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
