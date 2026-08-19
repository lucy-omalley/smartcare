'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { trackEvent } from '@/lib/analytics';
import {
  loadContinueState,
  type ContinueDetailType,
} from '@/components/today/today-continue-state';
import { loadHeroContinueItems, type HeroContinueItem } from '@/components/home/v3/hero-continue-state';

type Props = {
  onResumePlan: (type: ContinueDetailType) => void;
  className?: string;
};

export function ContinueSectionV3({ onResumePlan, className }: Props) {
  const { t } = useTranslation();
  const [planContinue, setPlanContinue] = useState<ReturnType<typeof loadContinueState>>(null);
  const [heroItems, setHeroItems] = useState<HeroContinueItem[]>([]);

  useEffect(() => {
    setPlanContinue(loadContinueState());
    setHeroItems(loadHeroContinueItems());
  }, []);

  const items: Array<
    | { type: 'plan'; label: string; title: string; emoji: string; onClick: () => void }
    | { type: 'hero'; item: HeroContinueItem }
  > = [];

  if (planContinue) {
    items.push({
      type: 'plan',
      label: planContinue.label,
      title: planContinue.title,
      emoji: planContinue.emoji,
      onClick: () => {
        trackEvent('continue_journey', { source: planContinue.type });
        onResumePlan(planContinue.type);
      },
    });
  }

  for (const hero of heroItems) {
    items.push({ type: 'hero', item: hero });
  }

  if (items.length === 0) return null;

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg font-bold tracking-tight px-0.5">{t('home.continue')}</h2>
      <div className="space-y-2.5">
        {items.map((entry, i) =>
          entry.type === 'plan' ? (
            <ContinueRow
              key={`plan-${i}`}
              emoji={entry.emoji}
              label={entry.label}
              title={entry.title}
              onClick={entry.onClick}
            />
          ) : (
            <Link
              key={`hero-${entry.item.kind}`}
              href={entry.item.href}
              onClick={() => trackEvent('continue_journey', { source: entry.item.kind })}
              className="block"
            >
              <ContinueRow
                emoji={entry.item.emoji}
                label={entry.item.label}
                title={entry.item.title}
              />
            </Link>
          )
        )}
      </div>
    </section>
  );
}

function ContinueRow({
  emoji,
  label,
  title,
  onClick,
}: {
  emoji: string;
  label: string;
  title: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="w-full text-left rounded-2xl border bg-card/80 p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors shadow-sm"
    >
      <span className="text-2xl shrink-0" aria-hidden>
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm truncate">{title}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Comp>
  );
}
