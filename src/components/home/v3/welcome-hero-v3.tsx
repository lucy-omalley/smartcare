'use client';

import { ArrowRight, Clock, CloudSun, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DailyBriefContent } from '@/types/daily-brief';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type Props = {
  greeting: string;
  firstName: string;
  childName?: string | null;
  brief: DailyBriefContent;
  isReturning?: boolean;
  estimatedMinutes?: number;
  onStart: () => void;
  className?: string;
};

export function WelcomeHeroV3({
  greeting,
  firstName,
  childName,
  brief,
  isReturning,
  estimatedMinutes = 45,
  onStart,
  className,
}: Props) {
  const { t, locale } = useTranslation();
  const name = childName?.trim() || (locale === 'zh-CN' ? '孩子' : 'your child');
  const learningFocus = brief.todayFocus?.title ?? brief.weeklyFocus?.title ?? brief.development[0]?.domain ?? t('home.todaysLearning');
  const weather =
    brief.weatherNote ??
    (brief.play.indoorOutdoor === 'outdoor'
      ? t('homeV3.weatherOutdoor')
      : brief.play.indoorOutdoor === 'indoor'
        ? t('homeV3.weatherIndoor')
        : t('homeV3.weatherFlexible'));
  const mood = brief.encouragement?.split('.')[0]?.slice(0, 48) ?? t('homeV3.defaultMood');

  const headline = isReturning
    ? t('activation.welcomeBack', { name: firstName })
    : `${greeting} ${firstName} 👋`;

  const subline =
    locale === 'zh-CN'
      ? t('homeV3.childReadyZh', { name })
      : t('homeV3.childReady', { name });

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border-0',
        'bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50/80',
        'dark:from-amber-950/50 dark:via-orange-950/30 dark:to-rose-950/20',
        'p-7 shadow-xl shadow-amber-200/25 dark:shadow-none',
        className
      )}
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-200/30 blur-2xl dark:bg-orange-900/20" aria-hidden />

      <div className="relative space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground capitalize tracking-wide">{headline}</p>
          <h1 className="text-[1.65rem] font-bold tracking-tight leading-tight text-balance">{subline}</h1>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <InfoPill icon={CloudSun} label={t('homeV3.weather')} value={weather} />
          <InfoPill icon={Sparkles} label={t('homeV3.learningFocus')} value={learningFocus} />
          <InfoPill icon={Heart} label={t('homeV3.todaysMood')} value={mood} />
          <InfoPill
            icon={Clock}
            label={t('homeV3.journeyTime')}
            value={t('home.estimatedTime', { minutes: estimatedMinutes })}
          />
        </div>

        <Button
          size="lg"
          className="w-full rounded-2xl h-14 text-base font-semibold shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-orange-500 hover:opacity-95 border-0"
          onClick={onStart}
        >
          <span aria-hidden>⭐</span>
          <span className="ml-2">{t('homeV3.startJourney')}</span>
          <ArrowRight className="ml-auto h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CloudSun;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-background/75 dark:bg-background/40 backdrop-blur-sm border border-white/70 dark:border-border/50 p-3 min-h-[4.5rem]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        {label}
      </p>
      <p className="text-xs font-medium mt-1.5 leading-snug line-clamp-2">{value}</p>
    </div>
  );
}
