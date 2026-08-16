'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Sparkles, ArrowRight } from 'lucide-react';

interface RoutineDesignerPromoCardProps {
  childName?: string | null;
  compact?: boolean;
}

export function RoutineDesignerPromoCard({ childName, compact }: RoutineDesignerPromoCardProps) {
  const name = childName?.trim() || 'your child';

  if (compact) {
    return (
      <Link href="/routine-designer/create">
        <Card className="rounded-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/40 hover:border-amber-300 transition-colors">
          <CardContent className="p-3.5 flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🖨️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">AI Routine Designer</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Printable routine poster for {name} — ready in 60 seconds
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="rounded-2xl border-amber-200 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div>
          <Badge variant="secondary" className="rounded-full text-[10px] mb-2">New</Badge>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Printer className="h-4 w-4 text-amber-600" />
            AI Routine Designer
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Create a beautiful printable routine poster for {name}. Print it, laminate it, and help them know what comes next — without nagging.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="rounded-xl" size="sm">
            <Link href="/routine-designer/create">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Design routine
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl" size="sm">
            <Link href="/routine-designer">
              My posters
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
