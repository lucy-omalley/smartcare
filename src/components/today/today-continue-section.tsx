'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getContinueCta,
  loadContinueState,
  type ContinueDetailType,
  type ContinueState,
} from '@/components/today/today-continue-state';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface TodayContinueSectionProps {
  onResume: (type: ContinueDetailType) => void;
  className?: string;
}

export function TodayContinueSection({ onResume, className }: TodayContinueSectionProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<ContinueState | null>(null);

  useEffect(() => {
    setState(loadContinueState());
  }, []);

  if (!state) return null;

  return (
    <section className={cn('space-y-2.5', className)}>
      <h2 className="text-base font-bold px-0.5">{t('home.continue')}</h2>
      <button
        type="button"
        onClick={() => onResume(state.type)}
        className="w-full text-left rounded-2xl border bg-card p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors shadow-sm"
      >
        <span className="text-2xl shrink-0" aria-hidden>
          {state.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {state.label}
          </p>
          <p className="font-semibold text-sm truncate">{state.title}</p>
        </div>
        <Button size="sm" variant="secondary" className="rounded-xl shrink-0 pointer-events-none" tabIndex={-1}>
          {getContinueCta(state.type)}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </button>
    </section>
  );
}
