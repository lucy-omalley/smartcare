'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface TodayHeroExperiencesRowProps {
  childName?: string | null;
  className?: string;
}

export function TodayHeroExperiencesRow({ childName, className }: TodayHeroExperiencesRowProps) {
  const { t } = useTranslation();

  const experiences = [
    {
      id: 'toy-brain',
      emoji: '🧸',
      title: t('features.toyBrain'),
      subtitle: t('features.toyBrainSubtitle'),
      href: '/toy-brain/scan',
      cta: t('features.toyBrainCta'),
      gradient: 'from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/30',
      border: 'border-sky-200/80 dark:border-sky-800/40',
    },
    {
      id: 'adventure',
      emoji: '📋',
      title: t('features.adventurePlanner'),
      subtitle: t('features.adventureSubtitle'),
      href: '/adventure-journey/create',
      cta: t('features.adventureCta'),
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30',
      border: 'border-emerald-200/80 dark:border-emerald-800/40',
    },
    {
      id: 'storytime',
      emoji: '🌙',
      title: t('features.familyVoice'),
      subtitle: t('features.familyVoiceSubtitle'),
      href: '/stories',
      cta: t('features.familyVoiceCta'),
      gradient: 'from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30',
      border: 'border-indigo-200/80 dark:border-indigo-800/40',
    },
  ] as const;

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-base font-bold px-0.5">{t('home.heroExperiences')}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {experiences.map((exp) => (
          <Link
            key={exp.id}
            href={exp.href}
            className={cn(
              'snap-center shrink-0 w-[78vw] max-w-[280px] rounded-[1.5rem] border p-5',
              'bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow',
              exp.gradient,
              exp.border
            )}
          >
            <span className="text-3xl block mb-3" aria-hidden>
              {exp.emoji}
            </span>
            <h3 className="text-lg font-bold leading-tight">{exp.title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
              {exp.subtitle}
            </p>
            <span className="inline-flex items-center justify-center rounded-xl mt-4 w-full h-9 px-3 text-sm font-medium bg-primary text-primary-foreground">
              {exp.cta}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
