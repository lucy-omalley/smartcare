'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sun, UserPlus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
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
import { languageFromDevelopment, isValidBriefContent } from '@/lib/today-plan-utils';
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
  };
  connectAvailableCount: number;
  upcomingEvent: ConnectEventPreview | null;
}

export default function TodayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<TodayData | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);
  const [rotating, setRotating] = useState<RotateSection | null>(null);

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

  const loadToday = useCallback((options?: { silent?: boolean }) => {
    if (!options?.silent) setPlanLoading(true);
    return fetch('/api/today', { cache: 'no-store' })
      .then(async (r) => {
        const json = await parseApiJson<{
          brief: DailyBriefContent;
          profile: TodayData['profile'];
          generating?: boolean;
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
        setData((prev) => ({
          brief: briefData.brief,
          profile: briefData.profile,
          connectAvailableCount: prev?.connectAvailableCount ?? 0,
          upcomingEvent: prev?.upcomingEvent ?? null,
        }));
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

    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(() => {
      attempts += 1;
      if (attempts > maxAttempts) {
        setGeneratingPlan(false);
        return;
      }
      void loadToday({ silent: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [generatingPlan, status, loadToday]);

  const reloadTodayPlan = useCallback(() => {
    setPlanLoading(true);
    loadToday({ silent: true }).finally(() => setPlanLoading(false));
  }, [loadToday]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const refreshIfStale = () => {
      if (!consumeTodayPlanStale()) return;
      reloadTodayPlan();
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
    trackEvent('today_refresh_clicked', { section });
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

  if (status === 'loading') {
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
        </header>

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

        {!loadError && planLoading && !brief && (
          <div className="visual-card p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center mx-auto animate-gentle-bounce">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading your personalised plan…</p>
          </div>
        )}

        {brief && isValidBriefContent(brief) && (
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
                  trackEvent('meal_card_opened', { title: brief.recipe.subtitle });
                  trackEvent('meal_opened', { title: brief.recipe.subtitle });
                  setActiveDetail('meal');
                }}
                onRefresh={() => rotate('recipe')}
                refreshing={rotating === 'recipe'}
              />
              <TodayPlanCard
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
                emoji="📖"
                label="Story"
                title={brief.bedtimeStory.title}
                preview={truncateWords(brief.bedtimeStory.reason || brief.bedtimeStory.moral || 'A bedtime tale for tonight.', 15)}
                ctaLabel="Read Story"
                onOpen={() => {
                  trackEvent('story_card_opened', { title: brief.bedtimeStory.title });
                  trackEvent('story_opened', { title: brief.bedtimeStory.title });
                  setActiveDetail('story');
                }}
                onRefresh={() => rotate('story')}
                refreshing={rotating === 'story'}
              />
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
