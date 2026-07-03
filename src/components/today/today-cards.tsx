'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodayCompactCardProps {
  emoji: string;
  label: string;
  title: string;
  summary: string;
  ctaLabel: string;
  onCta?: () => void;
  detail?: React.ReactNode;
  className?: string;
}

export function TodayCompactCard({
  emoji,
  label,
  title,
  summary,
  ctaLabel,
  onCta,
  detail,
  className,
}: TodayCompactCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCta = () => {
    if (detail) {
      setExpanded(!expanded);
    }
    onCta?.();
  };

  return (
    <article className={cn('visual-card overflow-hidden', className)}>
      <div className="p-3.5 flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5" aria-hidden>{emoji}</span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-semibold text-sm leading-snug">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{summary}</p>
        </div>
        <Button
          size="sm"
          variant={expanded ? 'secondary' : 'outline'}
          className="rounded-full shrink-0 h-9 px-3 text-xs touch-target"
          onClick={handleCta}
        >
          {expanded && detail ? 'Close' : ctaLabel}
        </Button>
      </div>
      {expanded && detail && (
        <div className="px-3.5 pb-3.5 pt-0 border-t border-border/40 text-sm text-muted-foreground space-y-2">
          {detail}
        </div>
      )}
    </article>
  );
}

interface TodaySectionHeaderProps {
  emoji: string;
  title: string;
}

export function TodaySectionHeader({ emoji, title }: TodaySectionHeaderProps) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold px-0.5 pt-1">
      <span aria-hidden>{emoji}</span>
      {title}
    </h2>
  );
}

interface TodayFocusCardProps {
  type: 'goal' | 'challenge';
  title: string;
  tip: string;
  onAskMumbot: () => void;
}

export function TodayFocusCard({ type, title, tip, onAskMumbot }: TodayFocusCardProps) {
  return (
    <article className="visual-card p-3.5 flex items-start gap-3 bg-primary/5 border-primary/10">
      <span className="text-xl shrink-0" aria-hidden>🎯</span>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-primary/80">
          {type === 'goal' ? 'Focus' : 'Challenge'}
        </p>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
      </div>
      <Button
        size="sm"
        className="rounded-full shrink-0 h-9 px-3 text-xs touch-target"
        onClick={onAskMumbot}
      >
        {type === 'goal' ? 'Ask MumBot' : 'Get help'}
      </Button>
    </article>
  );
}

interface TodayConnectCardProps {
  emoji: string;
  label: string;
  summary: string;
  ctaLabel: string;
  href: string;
}

export function TodayConnectCard({ emoji, label, summary, ctaLabel, href }: TodayConnectCardProps) {
  return (
    <Link href={href} className="visual-card p-3.5 flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.99] block">
      <span className="text-xl shrink-0" aria-hidden>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>
      </div>
      <span className="text-xs font-medium text-primary shrink-0">{ctaLabel} →</span>
    </Link>
  );
}
