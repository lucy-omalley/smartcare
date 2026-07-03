'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodayPlanCardProps {
  emoji: string;
  label: string;
  title: string;
  preview: string;
  ctaLabel: string;
  onOpen: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

export function TodayPlanCard({
  emoji,
  label,
  title,
  preview,
  ctaLabel,
  onOpen,
  onRefresh,
  refreshing,
  className,
}: TodayPlanCardProps) {
  return (
    <article className={cn('visual-card p-3.5', className)}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={onOpen}
        >
          <span className="text-xl block mb-1" aria-hidden>{emoji}</span>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-semibold text-sm leading-snug mt-0.5">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{preview}</p>
        </button>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-full h-9 px-3 text-xs touch-target"
            onClick={onOpen}
          >
            {ctaLabel}
          </Button>
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full h-8 px-2 text-[10px] text-muted-foreground"
              disabled={refreshing}
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', refreshing && 'animate-spin')} />
              Try another
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
