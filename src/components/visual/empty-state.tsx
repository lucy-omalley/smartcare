'use client';

import { cn } from '@/lib/utils';
import { CATEGORY_GRADIENTS } from '@/lib/illustration-style';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  gradientKey?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  emoji,
  title,
  description,
  gradientKey = 'default',
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const gradient = CATEGORY_GRADIENTS[gradientKey] ?? CATEGORY_GRADIENTS.default;

  return (
    <div
      className={cn(
        'rounded-3xl border border-white/60 shadow-sm overflow-hidden animate-fade-in-up',
        className
      )}
    >
      <div className={cn('bg-gradient-to-br px-6 py-10 text-center', gradient)}>
        <span className="text-5xl block mb-4 animate-gentle-bounce">{emoji}</span>
        <h3 className="font-semibold text-lg text-foreground/90">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="inline-block mt-5">
            <Button className="rounded-full px-6 shadow-sm">{actionLabel}</Button>
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button className="rounded-full px-6 mt-5 shadow-sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
