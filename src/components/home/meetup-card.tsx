'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { EmptyState } from '@/components/visual/empty-state';

interface Meetup {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  childAgeRange: string;
}

interface MeetupCardProps {
  meetups: Meetup[];
  weatherDescription?: string;
}

export function MeetupCard({ meetups, weatherDescription }: MeetupCardProps) {
  if (meetups.length === 0) {
    return (
      <EmptyState
        emoji="☕"
        title="No coffee walks yet"
        description="Start a meetup in Community — parents nearby would love to connect."
        gradientKey="meetup"
        actionLabel="Explore Community"
        actionHref="/community?tab=meetups"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">☕</span>
          <h2 className="font-semibold">Nearby Parent Meetups</h2>
        </div>
        <Link href="/community?tab=meetups">
          <Button variant="ghost" size="sm" className="text-xs rounded-full">View all</Button>
        </Link>
      </div>
      {meetups.map((m) => (
        <article key={m.id} className="visual-card animate-fade-in-up">
          <VisualCardHero gradientKey="meetup" emoji="☕" alt={m.title} />
          <div className="p-4 space-y-2">
            <h3 className="font-semibold">{m.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(m.date), 'EEE d MMM')} · {m.time}
            </p>
            <p className="text-sm">{m.location}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full text-xs">{m.childAgeRange}</Badge>
              {weatherDescription && (
                <Badge variant="outline" className="rounded-full text-xs capitalize">{weatherDescription}</Badge>
              )}
            </div>
            <Link href="/community?tab=meetups">
              <Button size="sm" className="w-full rounded-full mt-1">Join</Button>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
