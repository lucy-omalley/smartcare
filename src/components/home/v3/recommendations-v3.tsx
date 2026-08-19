'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type Card = {
  id: string;
  emoji: string;
  label: string;
  headline: string;
  subtitle: string;
  cta: string;
  onOpen: () => void;
};

type Props = {
  cards: Card[];
  className?: string;
};

export function RecommendationsV3({ cards, className }: Props) {
  const { t } = useTranslation();

  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-lg font-bold tracking-tight px-0.5">{t('home.todaysRecommendations')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onOpen}
            className="text-left rounded-[1.35rem] border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 min-h-[9.5rem] flex flex-col"
          >
            <span className="text-2xl mb-2" aria-hidden>
              {card.emoji}
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
            <p className="text-sm font-bold mt-1 leading-snug line-clamp-2">{card.headline}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{card.subtitle}</p>
            <span className="inline-flex items-center text-xs font-semibold text-primary mt-3">
              {card.cta}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
