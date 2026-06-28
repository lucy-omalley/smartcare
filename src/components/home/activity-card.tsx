'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { EmptyState } from '@/components/visual/empty-state';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';

interface WeekendActivity {
  id: string;
  title: string;
  description: string;
  category: keyof typeof ACTIVITY_CATEGORIES;
  date: string;
  location: string;
}

interface ActivityCardProps {
  activities: WeekendActivity[];
}

export function ActivityCard({ activities }: ActivityCardProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        emoji="🎉"
        title="Weekend plans coming soon"
        description="We'll recommend family fun near you. Add events in Activities to get started."
        gradientKey="activity"
        actionLabel="Browse Activities"
        actionHref="/activities"
      />
    );
  }

  const bookmark = (title: string) => {
    toast.success(`Saved "${title}" to your list!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <h2 className="font-semibold">Weekend Activities</h2>
        </div>
        <Link href="/activities">
          <Button variant="ghost" size="sm" className="text-xs rounded-full">View all</Button>
        </Link>
      </div>
      {activities.map((a) => (
        <article key={a.id} className="visual-card animate-fade-in-up">
          <VisualCardHero gradientKey="activity" emoji="🎉" alt={a.title} />
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{a.title}</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full" onClick={() => bookmark(a.title)}>
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-0">Free</Badge>
              <Badge variant="outline" className="rounded-full text-xs">{ACTIVITY_CATEGORIES[a.category]}</Badge>
              <Badge variant="secondary" className="rounded-full text-xs">All ages</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(a.date), 'EEE d MMM')} · {a.location}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
