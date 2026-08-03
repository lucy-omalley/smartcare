'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TodayFocusBannerProps {
  label: string;
  title: string;
  reason: string;
  variant?: 'weekly' | 'today';
}

const COLLAPSE_THRESHOLD = 100;

export function TodayFocusBanner({ label, title, reason, variant = 'today' }: TodayFocusBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = reason.length > COLLAPSE_THRESHOLD;
  const isWeekly = variant === 'weekly';

  return (
    <div
      className={cn(
        'visual-card p-3',
        isWeekly ? 'bg-amber-50/80 border-amber-100/80' : 'bg-primary/5 border-primary/10'
      )}
    >
      <p
        className={cn(
          'text-[10px] font-medium uppercase tracking-wider',
          isWeekly ? 'text-amber-800/80' : 'text-primary/80'
        )}
      >
        {label}
      </p>
      <p className={cn('font-semibold text-sm mt-0.5', isWeekly ? 'text-amber-950' : undefined)}>{title}</p>
      <p
        className={cn(
          'text-xs mt-1 leading-relaxed',
          isWeekly ? 'text-amber-900/80' : 'text-muted-foreground',
          !expanded && isLong && 'line-clamp-3'
        )}
      >
        {reason}
      </p>
      {isLong && (
        <button
          type="button"
          className={cn(
            'text-xs font-medium mt-1.5 underline-offset-2 hover:underline',
            isWeekly ? 'text-amber-900' : 'text-primary'
          )}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Read full details'}
        </button>
      )}
    </div>
  );
}
