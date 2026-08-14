'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Sparkles, ArrowRight } from 'lucide-react';

interface StorytimePromoCardProps {
  childName?: string | null;
  compact?: boolean;
}

export function StorytimePromoCard({ childName, compact }: StorytimePromoCardProps) {
  const name = childName?.trim() || 'your child';

  if (compact) {
    return (
      <Link href="/stories">
        <Card className="rounded-2xl border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 dark:border-violet-800/40 hover:border-violet-300 transition-colors">
          <CardContent className="p-3.5 flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🎙️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Family Voice Storytime</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Hear stories in Mum or Dad&apos;s voice — new Premium feature
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
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="secondary" className="rounded-full text-[10px] mb-2">New</Badge>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Mic className="h-4 w-4 text-violet-600" />
              Family Voice Storytime
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Create a personalized bedtime story for {name}, then listen in your own voice — even when you&apos;re not there.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="rounded-xl" size="sm">
            <Link href="/stories/create">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Create story
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl" size="sm">
            <Link href="/stories/voice">
              <Mic className="h-3.5 w-3.5 mr-1" />
              Record voice
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
