'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import type { DailyBriefDevelopment } from '@/types/daily-brief';

interface DevelopmentCardProps {
  items: DailyBriefDevelopment[];
}

export function DevelopmentCard({ items }: DevelopmentCardProps) {
  return (
    <Card className="rounded-2xl border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-background dark:from-blue-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base">Development Focus</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.domain} className="space-y-1.5">
            <p className="text-sm font-semibold">{item.domain}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.insight}</p>
            <p className="text-sm bg-primary/5 rounded-lg p-2.5 leading-relaxed">
              <span className="font-medium text-primary">Try today: </span>
              {item.tryToday}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
