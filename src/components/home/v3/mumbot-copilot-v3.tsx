'use client';

import { Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type Props = {
  onAsk: (prompt: string) => void;
  className?: string;
};

export function MumbotCopilotV3({ onAsk, className }: Props) {
  const { t } = useTranslation();

  const prompts = [
    { key: 'behaviour', label: t('homeV3.promptBehaviour') },
    { key: 'meal', label: t('homeV3.promptMeal') },
    { key: 'sleep', label: t('homeV3.promptSleep') },
    { key: 'play', label: t('homeV3.promptPlay') },
  ];

  return (
    <section
      className={cn(
        'rounded-[1.75rem] border bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/25 p-5 space-y-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold">{t('mumbot.name')}</h2>
          <p className="text-sm text-muted-foreground">{t('homeV3.mumbotCopilot')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('homeV3.mumbotHelp')}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant="secondary"
            className="rounded-full text-xs h-9"
            onClick={() => onAsk(p.label)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <Button variant="outline" className="w-full rounded-2xl h-11" onClick={() => onAsk(t('homeV3.mumbotHelp'))}>
        {t('homeV3.openMumbot')}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
}
