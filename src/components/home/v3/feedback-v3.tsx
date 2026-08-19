'use client';

import Link from 'next/link';
import { Bug, Lightbulb, ThumbsUp, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type Props = {
  className?: string;
};

export function FeedbackV3({ className }: Props) {
  const { t } = useTranslation();

  const openFeedback = () => {
    window.dispatchEvent(new CustomEvent('parenfy:open-feedback'));
  };

  return (
    <section className={cn('rounded-2xl border bg-card/60 p-4 space-y-3', className)}>
      <p className="text-sm font-semibold flex items-center gap-1.5">
        {t('homeV3.helpImprove')}
        <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/30" aria-hidden />
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={openFeedback}
          className="flex flex-col items-center gap-1.5 rounded-xl border bg-background p-3 text-[10px] font-medium hover:bg-muted/40 transition-colors"
        >
          <Bug className="h-4 w-4 text-muted-foreground" />
          {t('homeV3.reportBug')}
        </button>
        <Link
          href="/feature-requests?action=suggest"
          className="flex flex-col items-center gap-1.5 rounded-xl border bg-background p-3 text-[10px] font-medium hover:bg-muted/40 transition-colors text-center"
        >
          <Lightbulb className="h-4 w-4 text-amber-600" />
          {t('feedback.suggestFeature')}
        </Link>
        <Link
          href="/feature-requests"
          className="flex flex-col items-center gap-1.5 rounded-xl border bg-background p-3 text-[10px] font-medium hover:bg-muted/40 transition-colors text-center"
        >
          <ThumbsUp className="h-4 w-4 text-primary" />
          {t('feedback.voteFeature')}
        </Link>
      </div>
    </section>
  );
}
