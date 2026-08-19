'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { trackEvent } from '@/lib/analytics';
import { saveHeroContinue } from '@/components/home/v3/hero-continue-state';

type ExperienceId = 'toy-brain' | 'adventure' | 'storytime';

type Experience = {
  id: ExperienceId;
  emoji: string;
  headline: string;
  headlineLine2?: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
  border: string;
  decor: string;
  badge?: string;
  continueKind: 'toy' | 'adventure' | 'story';
};

export function HeroExperiencesV3({ className }: { className?: string }) {
  const { t } = useTranslation();

  const experiences: Experience[] = [
    {
      id: 'toy-brain',
      emoji: '🧸',
      headline: t('homeV3.toyHeadline1'),
      headlineLine2: t('homeV3.toyHeadline2'),
      subtitle: t('homeV3.toySubtitle'),
      cta: t('homeV3.scanToy'),
      href: '/toy-brain/scan',
      gradient: 'from-sky-100/90 via-cyan-50/80 to-white dark:from-sky-950/60 dark:to-cyan-950/30',
      border: 'border-sky-200/70 dark:border-sky-800/40',
      decor: '📱✨',
      badge: 'NEW',
      continueKind: 'toy',
    },
    {
      id: 'adventure',
      emoji: '📋',
      headline: t('homeV3.adventureHeadline'),
      subtitle: t('homeV3.adventureSubtitle'),
      cta: t('homeV3.createAdventure'),
      href: '/adventure-journey/create',
      gradient: 'from-emerald-100/90 via-teal-50/80 to-white dark:from-emerald-950/60 dark:to-teal-950/30',
      border: 'border-emerald-200/70 dark:border-emerald-800/40',
      decor: '🗺️📄',
      continueKind: 'adventure',
    },
    {
      id: 'storytime',
      emoji: '🌙',
      headline: t('homeV3.storyHeadline1'),
      headlineLine2: t('homeV3.storyHeadline2'),
      subtitle: t('homeV3.storySubtitle'),
      cta: t('homeV3.createStory'),
      href: '/stories/create',
      gradient: 'from-indigo-100/90 via-violet-50/80 to-white dark:from-indigo-950/60 dark:to-violet-950/30',
      border: 'border-indigo-200/70 dark:border-indigo-800/40',
      decor: '🎧📖',
      continueKind: 'story',
    },
  ];

  const onHeroClick = (exp: Experience) => {
    trackEvent('hero_feature_clicked', { feature: exp.id });
    trackEvent('feature_used', { feature: exp.id, source: 'home_v3' });
    saveHeroContinue(exp.continueKind, exp.headline, exp.href);
    const start = sessionStorage.getItem('parenfy_session_start');
    if (!sessionStorage.getItem('parenfy_first_hero_tracked') && start) {
      const sec = Math.round((Date.now() - parseInt(start, 10)) / 1000);
      trackEvent('time_to_first_hero', { seconds: sec, feature: exp.id });
      sessionStorage.setItem('parenfy_first_hero_tracked', '1');
    }
  };

  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-lg font-bold tracking-tight px-0.5">{t('homeV3.chooseExperience')}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {experiences.map((exp) => (
          <Link
            key={exp.id}
            href={exp.href}
            onClick={() => onHeroClick(exp)}
            className={cn(
              'snap-center shrink-0 w-[82vw] max-w-[300px] rounded-[1.75rem] border p-6',
              'bg-gradient-to-br shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
              exp.gradient,
              exp.border
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <span className="text-4xl" aria-hidden>
                {exp.emoji}
              </span>
              <div className="flex flex-col items-end gap-2">
                {exp.badge ? (
                  <Badge className="rounded-full text-[10px] px-2 py-0">{exp.badge}</Badge>
                ) : null}
                <span className="text-lg opacity-60" aria-hidden>
                  {exp.decor}
                </span>
              </div>
            </div>
            <h3 className="text-xl font-bold leading-tight tracking-tight">
              {exp.headline}
              {exp.headlineLine2 ? (
                <>
                  <br />
                  <span className="text-primary/90">{exp.headlineLine2}</span>
                </>
              ) : null}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{exp.subtitle}</p>
            <span className="inline-flex items-center justify-center rounded-2xl mt-5 w-full h-11 px-4 text-sm font-semibold bg-primary text-primary-foreground shadow-sm">
              {exp.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
