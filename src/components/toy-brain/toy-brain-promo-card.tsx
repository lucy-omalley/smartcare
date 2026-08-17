'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, ArrowRight } from 'lucide-react';

interface ToyBrainPromoCardProps {
  childName?: string | null;
  compact?: boolean;
}

export function ToyBrainPromoCard({ childName, compact }: ToyBrainPromoCardProps) {
  const name = childName?.trim() || 'your child';

  if (compact) {
    return (
      <Link href="/toy-brain/scan">
        <Card className="rounded-2xl border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20 dark:border-sky-800/40 hover:border-sky-300 transition-colors">
          <CardContent className="p-3.5 flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🧠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">AI Toy Brain</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Snap a toy — get play ideas for {name}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="rounded-2xl border-sky-200 bg-gradient-to-br from-sky-50 via-background to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/20 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div>
          <Badge variant="secondary" className="rounded-full text-[10px] mb-2">New</Badge>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Brain className="h-4 w-4 text-sky-600" />
            AI Toy Brain
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Photograph any toy and get personalised play ideas for {name}. Turn toys they already own into learning adventures.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="rounded-xl" size="sm">
            <Link href="/toy-brain/scan">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Scan a toy
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl" size="sm">
            <Link href="/toy-brain">My Toy Box</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
