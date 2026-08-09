'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FactorRow {
  id: string;
  label: string;
  weight: number;
  raw: number;
  weighted: number;
}

interface RankedItem {
  slug: string;
  total: number;
  disqualified: boolean;
  disqualifyReason?: string;
  factors: FactorRow[];
}

interface IntelligenceDebug {
  userId: string;
  email: string | null;
  context: {
    ageMonths: number | null;
    isWeekend: boolean;
    isRainy: boolean;
    isSunny: boolean;
    weather: string | null;
  };
  signals: {
    developmentStage: string;
    interests: string[];
    goals: string[];
    challenges: string[];
    favouriteFoods: string[];
    foodDislikes: string[];
    mood: {
      moodBand: string;
      feeling: string | null;
      todayWin: string | null;
      todayChallenge: string | null;
      checkedInToday: boolean;
    };
    nearby: {
      broadArea: string | null;
      eventTokens: string[];
      hasSocialOpportunity: boolean;
      parentsAvailableToday: number;
      upcomingCount: number;
      highlightEvent: { title: string; activityType: string; date: string } | null;
    };
  };
  todayPlan: {
    picks: {
      recipeSlug?: string;
      activitySlug?: string;
      storySlug?: string;
      tipSlug?: string;
      milestoneSlug?: string;
      reasons: Record<string, string | undefined>;
    };
    poolSizes: Record<string, number>;
    ranked: {
      recipes: RankedItem[];
      activities: RankedItem[];
      stories: RankedItem[];
    };
  };
  weeklyFocus: {
    pick: { themeSlug: string; title: string; reason: string };
    ranked: RankedItem[];
  };
}

function RankedList({ items, selectedSlug }: { items: RankedItem[]; selectedSlug?: string }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No candidates in pool.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item.slug}
          className={cn(
            'rounded-lg border p-3 text-sm',
            item.slug === selectedSlug && 'border-primary bg-primary/5',
            item.disqualified && 'opacity-60'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              #{index + 1} {item.slug}
            </span>
            <span className="text-muted-foreground">score {item.total}</span>
          </div>
          {item.disqualifyReason && (
            <p className="text-destructive text-xs mt-1">{item.disqualifyReason}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {item.factors
              .filter((f) => f.weighted > 0.01)
              .sort((a, b) => b.weighted - a.weighted)
              .slice(0, 5)
              .map((f) => (
                <span
                  key={f.id}
                  className="text-xs bg-muted px-1.5 py-0.5 rounded"
                  title={`raw ${f.raw}, weight ${f.weight}`}
                >
                  {f.label}: {(f.weighted * 100).toFixed(0)}%
                </span>
              ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminIntelligencePage() {
  const [data, setData] = useState<IntelligenceDebug | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/intelligence')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Admin access required. Set isAdmin on your user or ADMIN_EMAIL in env.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">Loading intelligence debug…</div>;
  }

  const { picks, poolSizes, ranked } = data.todayPlan;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Intelligence Engine Debug</h1>
        <p className="text-muted-foreground text-sm">
          Score-first picks for {data.email ?? data.userId} — Today plan, rotate, and weekly focus
        </p>
        <div className="flex gap-3 mt-2 text-sm">
          <Link href="/admin/costs" className="text-primary underline">
            Cost dashboard
          </Link>
          <Link href="/admin/content" className="text-primary underline">
            Content CMS
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {data.context.ageMonths != null ? `${data.context.ageMonths} mo` : 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">{data.signals.developmentStage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weather</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{data.context.weather ?? 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">
              {data.context.isRainy ? 'Rainy' : data.context.isSunny ? 'Sunny' : 'Neutral'}
              {' · '}
              {data.context.isWeekend ? 'Weekend' : 'Weekday'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parent mood</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{data.signals.mood.moodBand.replace(/_/g, ' ')}</p>
            <p className="text-xs text-muted-foreground">
              {data.signals.mood.checkedInToday ? 'Checked in today' : 'No check-in today'}
              {data.signals.mood.feeling ? ` · "${data.signals.mood.feeling}"` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nearby events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{data.signals.nearby.upcomingCount} this week</p>
            <p className="text-xs text-muted-foreground">
              {data.signals.nearby.parentsAvailableToday} parents available today
              {data.signals.nearby.highlightEvent
                ? ` · Next: ${data.signals.nearby.highlightEvent.title}`
                : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.signals.interests.slice(0, 5).join(', ') || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pool sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {Object.entries(poolSizes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly focus pick</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{data.weeklyFocus.pick.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{data.weeklyFocus.pick.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">slug: {data.weeklyFocus.pick.themeSlug}</p>
          </div>
          <RankedList items={data.weeklyFocus.ranked} selectedSlug={data.weeklyFocus.pick.themeSlug} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recipes</CardTitle>
            <p className="text-xs text-muted-foreground">{picks.reasons.recipe}</p>
          </CardHeader>
          <CardContent>
            <RankedList items={ranked.recipes} selectedSlug={picks.recipeSlug} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activities</CardTitle>
            <p className="text-xs text-muted-foreground">{picks.reasons.activity}</p>
          </CardHeader>
          <CardContent>
            <RankedList items={ranked.activities} selectedSlug={picks.activitySlug} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stories</CardTitle>
            <p className="text-xs text-muted-foreground">{picks.reasons.story}</p>
          </CardHeader>
          <CardContent>
            <RankedList items={ranked.stories} selectedSlug={picks.storySlug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
