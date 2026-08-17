'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Sparkles, ArrowRight } from 'lucide-react';

interface AdventureJourneyPromoCardProps {
  childName?: string | null;
  compact?: boolean;
}

export function AdventureJourneyPromoCard({ childName, compact }: AdventureJourneyPromoCardProps) {
  const name = childName?.trim() || 'your child';

  if (compact) {
    return (
      <Link href="/adventure-journey/create">
        <Card className="rounded-2xl border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 dark:border-violet-800/40 hover:border-violet-300 transition-colors">
          <CardContent className="p-3.5 flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🗺️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">AI Adventure Journey</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Turn {name}&apos;s routine into a story adventure
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="rounded-2xl border-violet-200 bg-gradient-to-br from-violet-50 via-background to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/20 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div>
          <Badge variant="secondary" className="rounded-full text-[10px] mb-2">Flagship</Badge>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Map className="h-4 w-4 text-violet-600" />
            AI Adventure Journey
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Transform {name}&apos;s daily routine into a personalised story. Each step becomes a mission — bedtime feels like an adventure, not a battle.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="rounded-xl" size="sm">
            <Link href="/adventure-journey/create">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Start adventure
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl" size="sm">
            <Link href="/adventure-journey">
              My adventures
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** @deprecated use AdventureJourneyPromoCard */
export const RoutineDesignerPromoCard = AdventureJourneyPromoCard;
