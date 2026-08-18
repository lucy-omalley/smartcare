'use client';

import Link from 'next/link';
import { BookOpen, ChefHat, LineChart, Puzzle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_ITEMS = [
  { href: '/activities', label: 'Activities', icon: Puzzle },
  { href: '/stories', label: 'Stories', icon: BookOpen },
  { href: '/saved', label: 'Recipes', icon: ChefHat },
  { href: '/weekly-report', label: 'Growth', icon: LineChart },
  { href: '/profile?settings=1', label: 'Settings', icon: Settings },
] as const;

interface TodayQuickAccessProps {
  className?: string;
}

export function TodayQuickAccess({ className }: TodayQuickAccessProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-base font-bold px-0.5">Quick Access</h2>
      <div className="grid grid-cols-5 gap-2">
        {QUICK_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border bg-card/60 hover:bg-card transition-colors text-center"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <span className="text-[10px] font-medium leading-tight text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
