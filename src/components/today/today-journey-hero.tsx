'use client';

import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DailyBriefContent } from '@/types/daily-brief';
import { cn } from '@/lib/utils';

type JourneyItem = {
  emoji: string;
  label: string;
  title: string;
};

interface TodayJourneyHeroProps {
  greeting: string;
  firstName: string;
  childName?: string | null;
  highlight?: string | null;
  brief: DailyBriefContent;
  estimatedMinutes?: number;
  onStart: () => void;
  className?: string;
}

function buildJourneyItems(brief: DailyBriefContent): JourneyItem[] {
  return [
    { emoji: '🎨', label: "Today's Activity", title: brief.play.title },
    { emoji: '🍎', label: "Today's Meal", title: brief.recipe.subtitle },
    { emoji: '🌱', label: "Today's Learning", title: brief.milestone?.domain ?? brief.languageSection?.domain ?? 'Language & skills' },
    { emoji: '📖', label: "Tonight's Story", title: brief.bedtimeStory.title },
  ];
}

export function TodayJourneyHero({
  greeting,
  firstName,
  childName,
  highlight,
  brief,
  estimatedMinutes = 45,
  onStart,
  className,
}: TodayJourneyHeroProps) {
  const items = buildJourneyItems(brief);
  const name = childName?.trim() || 'Your child';
  const teaser =
    highlight?.trim() ||
    `${brief.bedtimeStory.title} is ready for tonight.`;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br from-amber-50 via-orange-50/80 to-primary/10',
        'dark:from-amber-950/40 dark:via-orange-950/20 dark:to-primary/15',
        'p-6 shadow-lg shadow-amber-200/30 dark:shadow-none',
        className
      )}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
      <div className="relative space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground capitalize">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {firstName} 👋
          </h1>
          <p className="text-sm text-foreground/80 leading-relaxed pt-1">
            <span className="font-semibold">{name}</span> has{' '}
            <span className="text-primary font-medium">{teaser}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-background/70 dark:bg-background/50 backdrop-blur-sm border border-white/60 dark:border-border/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Today&apos;s Journey
          </p>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5 text-sm">
                <span className="text-base shrink-0" aria-hidden>
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="font-medium truncate">{item.title}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            <span>Estimated time · {estimatedMinutes} mins</span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full rounded-2xl h-12 text-base shadow-md shadow-primary/20"
          onClick={onStart}
        >
          Start Today&apos;s Journey
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
