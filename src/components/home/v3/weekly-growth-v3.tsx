'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import type { DailyBriefContent } from '@/types/daily-brief';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { trackEvent } from '@/lib/analytics';

type Props = {
  brief: DailyBriefContent;
  childName?: string | null;
  onOpenMilestone?: () => void;
  onOpenParentTip?: () => void;
  onOpenActivity?: () => void;
  className?: string;
};

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 rounded-full bg-background/60 dark:bg-muted overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function skillEmoji(domain: string): string {
  const key = domain.toLowerCase();
  if (key.includes('emotion')) return '😊';
  if (key.includes('language') || key.includes('speech') || key.includes('communication')) return '🗣';
  if (key.includes('social')) return '🤝';
  if (key.includes('motor') || key.includes('fine')) return '✍';
  if (key.includes('math') || key.includes('number')) return '🔢';
  if (key.includes('creat')) return '🎨';
  return '🌱';
}

export function WeeklyGrowthV3({
  brief,
  childName,
  onOpenMilestone,
  onOpenParentTip,
  onOpenActivity,
  className,
}: Props) {
  const { t } = useTranslation();

  const weeklyTheme =
    brief.weeklyFocus?.title ?? brief.todayFocus?.title ?? brief.development[0]?.domain ?? t('homeV3.exploreGrowth');
  const weeklyReason =
    brief.weeklyFocus?.reason ?? brief.todayFocus?.reason ?? brief.development[0]?.reason ?? '';
  const practisingSkill = brief.development[0]?.domain ?? brief.milestone?.domain ?? weeklyTheme;
  const milestoneText = brief.milestone?.milestone ?? t('homeV3.viewProgress');
  const parentTipText = brief.parentTip?.content ?? brief.tip.content;
  const activityTitle = brief.play.title;
  const activitySkills = brief.play.skillsDeveloped.slice(0, 2);
  const activityMinutes = brief.play.durationMinutes;

  const weeklyProgress = Math.min(
    85,
    Math.max(
      35,
      40 +
        (brief.development.length > 0 ? 10 : 0) +
        (brief.milestone ? 10 : 0) +
        (brief.parentTip ? 5 : 0) +
        activitySkills.length * 5
    )
  );

  const openGrowthJourney = () => {
    trackEvent('growth_journey_viewed', { source: 'today_weekly_growth' });
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-3 px-0.5">
        <h2 className="text-lg font-bold tracking-tight">{t('homeV3.thisWeeksGrowth')}</h2>
        <Link
          href="/growth"
          onClick={openGrowthJourney}
          className="text-xs font-medium text-primary inline-flex items-center shrink-0 hover:underline underline-offset-2"
        >
          {t('homeV3.fullJourney')}
          <ArrowRight className="ml-0.5 h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Weekly mission — gateway to Growth Journey */}
      <Link
        href="/growth"
        onClick={openGrowthJourney}
        className="block rounded-[1.5rem] border bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-background dark:from-emerald-950/35 dark:via-background p-5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden>
            🎯
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('homeV3.weeklyMission')}
              </p>
              <p className="text-base font-bold mt-1 leading-snug">{weeklyTheme}</p>
              {weeklyReason ? (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{weeklyReason}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>{t('homeV3.weeklyProgress')}</span>
                <span>{weeklyProgress}%</span>
              </div>
              <ProgressBar value={weeklyProgress} />
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-primary">
              {t('homeV3.continueMission')}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>

      {/* Quick coaching cards — stay on Today with actionable detail sheets */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            trackEvent('milestone_card_opened', { source: 'weekly_growth', domain: brief.milestone?.domain });
            onOpenMilestone?.();
          }}
          className="rounded-[1.35rem] border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all min-h-[8.5rem] flex flex-col"
        >
          <span className="text-xl mb-2" aria-hidden>
            🌱
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('homeV3.nextMilestone')}
          </p>
          <p className="text-sm font-semibold mt-1 leading-snug line-clamp-2 flex-1">{milestoneText}</p>
          <span className="inline-flex items-center text-[10px] font-medium text-primary mt-2">
            {t('homeV3.learnMore')}
            <ArrowRight className="ml-0.5 h-3 w-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            trackEvent('parent_tip_opened', { source: 'weekly_growth' });
            onOpenParentTip?.();
          }}
          className="rounded-[1.35rem] border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all min-h-[8.5rem] flex flex-col"
        >
          <span className="text-xl mb-2" aria-hidden>
            💡
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('homeV3.parentCoaching')}
          </p>
          <p className="text-sm font-semibold mt-1 leading-snug line-clamp-3 flex-1">{parentTipText}</p>
          <span className="inline-flex items-center text-[10px] font-medium text-primary mt-2">
            {t('homeV3.readTip')}
            <ArrowRight className="ml-0.5 h-3 w-3" />
          </span>
        </button>
      </div>

      {/* Today's growth activity — start play, not another report link */}
      <article className="rounded-[1.5rem] border bg-gradient-to-br from-primary/5 to-background p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden>
            {skillEmoji(practisingSkill)}
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('homeV3.todaysGrowthActivity')}
              </p>
              <p className="text-sm font-bold mt-1 leading-snug">{activityTitle}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {activitySkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {activityMinutes} min
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-full h-9 px-4"
              onClick={() => {
                trackEvent('activity_card_opened', { source: 'weekly_growth', title: activityTitle });
                onOpenActivity?.();
              }}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {t('homeV3.startMission')}
            </Button>
          </div>
        </div>
      </article>

      {childName ? (
        <p className="text-xs text-center text-muted-foreground px-2">
          {t('homeV3.growthEncouragement', { name: childName })}
        </p>
      ) : null}
    </section>
  );
}
