'use client';

import Link from 'next/link';
import { ArrowRight, Target, Brain, Sprout, TrendingUp } from 'lucide-react';
import type { DailyBriefContent } from '@/types/daily-brief';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type Props = {
  brief: DailyBriefContent;
  className?: string;
};

export function WeeklyGrowthV3({ brief, className }: Props) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: Target,
      label: t('homeV3.weeklyGoal'),
      value: brief.weeklyFocus?.title ?? brief.todayFocus?.title ?? t('homeV3.exploreGrowth'),
      href: '/growth',
    },
    {
      icon: Brain,
      label: t('homeV3.skillsPractised'),
      value: brief.development[0]?.domain ?? brief.milestone?.domain ?? '—',
      href: '/growth',
    },
    {
      icon: Sprout,
      label: t('homeV3.milestones'),
      value: brief.milestone?.milestone?.slice(0, 40) ?? t('homeV3.viewProgress'),
      href: '/growth',
    },
    {
      icon: TrendingUp,
      label: t('homeV3.learningProgress'),
      value: brief.todayFocus?.title ?? brief.development[0]?.tryToday?.slice(0, 40) ?? '—',
      href: '/growth',
    },
  ];

  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-lg font-bold tracking-tight px-0.5">{t('homeV3.thisWeeksGrowth')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-[1.35rem] border bg-gradient-to-br from-primary/5 to-background p-4 hover:border-primary/25 transition-colors shadow-sm"
          >
            <card.icon className="h-4 w-4 text-primary mb-2" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
            <p className="text-sm font-semibold mt-1 leading-snug line-clamp-2">{card.value}</p>
            <span className="inline-flex items-center text-[10px] font-medium text-primary mt-2">
              {t('homeV3.view')}
              <ArrowRight className="ml-0.5 h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
