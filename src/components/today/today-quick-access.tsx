'use client';

import Link from 'next/link';
import { BookOpen, ChefHat, LineChart, Puzzle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

const QUICK_ITEMS = [
  { href: '/activities', labelKey: 'home.activities', icon: Puzzle },
  { href: '/stories', labelKey: 'home.stories', icon: BookOpen },
  { href: '/saved', labelKey: 'home.recipes', icon: ChefHat },
  { href: '/weekly-report', labelKey: 'home.growth', icon: LineChart },
  { href: '/profile?settings=1', labelKey: 'home.settings', icon: Settings },
] as const;

interface TodayQuickAccessProps {
  className?: string;
}

export function TodayQuickAccess({ className }: TodayQuickAccessProps) {
  const { t } = useTranslation();

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-base font-bold px-0.5">{t('home.quickAccess')}</h2>
      <div className="grid grid-cols-5 gap-2">
        {QUICK_ITEMS.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border bg-card/60 hover:bg-card transition-colors text-center"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <span className="text-[10px] font-medium leading-tight text-muted-foreground">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
