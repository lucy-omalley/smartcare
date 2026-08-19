'use client';

import Link from 'next/link';
import type { DailyBriefContent } from '@/types/daily-brief';
import type { ContinueDetailType } from '@/components/today/today-continue-state';
import { WelcomeHeroV3 } from '@/components/home/v3/welcome-hero-v3';
import { HeroExperiencesV3 } from '@/components/home/v3/hero-experiences-v3';
import { RecommendationsV3 } from '@/components/home/v3/recommendations-v3';
import { ContinueSectionV3 } from '@/components/home/v3/continue-section-v3';
import { WeeklyGrowthV3 } from '@/components/home/v3/weekly-growth-v3';
import { MumbotCopilotV3 } from '@/components/home/v3/mumbot-copilot-v3';
import { FeedbackV3 } from '@/components/home/v3/feedback-v3';
import { TodayPlanFeedbackWidget } from '@/components/today/today-plan-feedback';
import { ParentCheckInCard } from '@/components/home/parent-checkin-card';
import { TodayConnectCard, TodaySectionHeader } from '@/components/today/today-cards';
import { TodayQuickAccess } from '@/components/today/today-quick-access';
import { useTranslation } from '@/hooks/use-translation';
import { truncateWords } from '@/lib/today-focus';
import { hasStoryPreferences } from '@/lib/story-preferences';
import { format } from 'date-fns';

export type HomeV3Props = {
  greeting: string;
  firstName: string;
  childName?: string | null;
  brief: DailyBriefContent;
  isReturning?: boolean;
  profile: {
    parentingGoals?: string[];
    childNickname?: string | null;
    favouriteAnimal?: string | null;
    favouriteVehicle?: string | null;
    favouriteCharacter?: string | null;
    storyLearningTheme?: string | null;
    storyMoralPreference?: string | null;
  } | null;
  languageSection: { domain?: string; reason?: string; miniGame?: string } | null;
  connectAvailableCount: number;
  upcomingEvent: { title: string; broadArea: string; date: string } | null;
  onStartJourney: () => void;
  onOpenMeal: () => void;
  onOpenActivity: () => void;
  onOpenStory: () => void;
  onOpenLanguage: () => void;
  onOpenMilestone?: () => void;
  onOpenParentTip?: () => void;
  onResumePlan: (type: ContinueDetailType) => void;
  onAskMumbot: (prompt: string) => void;
  onCheckIn: (payload: { feeling: string; win: string; challenge: string }) => Promise<{ encouragement?: string }>;
  onTryAnother?: (section: 'recipe' | 'play' | 'story' | 'language') => void;
  rotating?: 'recipe' | 'play' | 'story' | 'language' | null;
};

export function HomeV3Dashboard({
  greeting,
  firstName,
  childName,
  brief,
  isReturning,
  profile,
  languageSection,
  connectAvailableCount,
  upcomingEvent,
  onStartJourney,
  onOpenMeal,
  onOpenActivity,
  onOpenStory,
  onOpenLanguage,
  onOpenMilestone,
  onOpenParentTip,
  onResumePlan,
  onAskMumbot,
  onCheckIn,
  onTryAnother,
  rotating,
}: HomeV3Props) {
  const { t } = useTranslation();

  const recommendationCards = [
    {
      id: 'meal',
      emoji: '🍽',
      label: t('homeV3.mealPlan'),
      headline: t('homeV3.tonightsDinner'),
      subtitle: truncateWords(brief.recipe.whyThisMeal || brief.recipe.title, 12),
      cta: t('today.viewMeal'),
      onOpen: onOpenMeal,
      onRefresh: onTryAnother ? () => onTryAnother('recipe') : undefined,
      refreshing: rotating === 'recipe',
    },
    {
      id: 'activity',
      emoji: '🎨',
      label: t('homeV3.activities'),
      headline: t('homeV3.todaysActivities'),
      subtitle: truncateWords(brief.play.reason || t('homeV3.activityWeather'), 12),
      cta: t('homeV3.explore'),
      onOpen: onOpenActivity,
      onRefresh: onTryAnother ? () => onTryAnother('play') : undefined,
      refreshing: rotating === 'play',
    },
    {
      id: 'story',
      emoji: '📖',
      label: t('homeV3.story'),
      headline: t('homeV3.todaysStory'),
      subtitle: truncateWords(
        hasStoryPreferences(profile)
          ? brief.bedtimeStory.reason || brief.bedtimeStory.theme || t('homeV3.storyAge')
          : brief.bedtimeStory.moral || t('homeV3.storyAge'),
        12
      ),
      cta: t('homeV3.read'),
      onOpen: onOpenStory,
      onRefresh: onTryAnother ? () => onTryAnother('story') : undefined,
      refreshing: rotating === 'story',
    },
    {
      id: 'language',
      emoji: '🗣',
      label: t('homeV3.language'),
      headline: t('homeV3.languageChallenge'),
      subtitle: truncateWords(languageSection?.miniGame || languageSection?.reason || '—', 12),
      cta: t('homeV3.start'),
      onOpen: onOpenLanguage,
      onRefresh: onTryAnother ? () => onTryAnother('language') : undefined,
      refreshing: rotating === 'language',
    },
  ];

  const connectAvailableText =
    connectAvailableCount === 0
      ? 'No parents nearby yet — set your availability.'
      : connectAvailableCount === 1
        ? '1 parent nearby is open to connect.'
        : `${connectAvailableCount} parents nearby are open to connect.`;

  const upcomingText = upcomingEvent
    ? `1 ${upcomingEvent.title.toLowerCase()} · ${upcomingEvent.broadArea} · ${format(new Date(upcomingEvent.date), 'EEE')}.`
    : 'No upcoming events — browse or create one.';

  return (
    <div className="space-y-8 pb-4">
      <WelcomeHeroV3
        greeting={greeting}
        firstName={firstName}
        childName={childName}
        brief={brief}
        isReturning={isReturning}
        onStart={onStartJourney}
      />

      <HeroExperiencesV3 />

      <RecommendationsV3 cards={recommendationCards} />

      <ContinueSectionV3 onResumePlan={onResumePlan} />

      <WeeklyGrowthV3
        brief={brief}
        childName={childName}
        onOpenMilestone={onOpenMilestone}
        onOpenParentTip={onOpenParentTip}
        onOpenActivity={onOpenActivity}
      />

      <MumbotCopilotV3 onAsk={onAskMumbot} />

      <FeedbackV3 />

      <details className="group rounded-2xl border bg-muted/20 open:bg-card/50">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          {t('homeV3.moreTools')}
        </summary>
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <TodayQuickAccess />
          <TodayPlanFeedbackWidget />
          <ParentCheckInCard onSubmit={onCheckIn} />
          <section className="space-y-2.5">
            <TodaySectionHeader emoji="👥" title={t('today.connect')} />
            <TodayConnectCard emoji="👥" label="Available Today" summary={connectAvailableText} ctaLabel="View" href="/connect" />
            <TodayConnectCard emoji="📅" label="Upcoming" summary={upcomingText} ctaLabel="Join" href="/connect?tab=events" />
          </section>
          <Link href="/more" className="block text-center text-xs text-primary underline-offset-2 hover:underline">
            {t('nav.more')} →
          </Link>
        </div>
      </details>
    </div>
  );
}
