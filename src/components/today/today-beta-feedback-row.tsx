'use client';

import Link from 'next/link';
import { Lightbulb, MessageSquare, ThumbsUp } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

interface TodayBetaFeedbackRowProps {
  className?: string;
}

export function TodayBetaFeedbackRow({ className }: TodayBetaFeedbackRowProps) {
  const { t } = useTranslation();
  const openFeedback = () => {
    window.dispatchEvent(new CustomEvent('parenfy:open-feedback'));
  };

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-base font-bold px-0.5">{t('feedback.title')}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/feature-requests?action=suggest"
          className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 hover:bg-muted/40 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
            <Lightbulb className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden />
          </div>
          <span className="text-sm font-medium">{t('feedback.suggestFeature')}</span>
        </Link>
        <Link
          href="/feature-requests"
          className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 hover:bg-muted/40 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ThumbsUp className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <span className="text-sm font-medium">{t('feedback.voteFeature')}</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={openFeedback}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
        {t('feedback.shareQuick')}
      </button>
    </section>
  );
}
