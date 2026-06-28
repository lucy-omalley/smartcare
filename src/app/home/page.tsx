'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bot, MessageCircle, Heart, Sparkles, Coffee, Calendar, ArrowRight, Sun
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecipeCard } from '@/components/home/recipe-card';
import { PlayCard } from '@/components/home/play-card';
import { DevelopmentCard } from '@/components/home/development-card';
import { StoryCard } from '@/components/home/story-card';
import { JournalPrompt } from '@/components/home/journal-prompt';
import type { DailyBriefContent } from '@/types/daily-brief';
import { format } from 'date-fns';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';

interface Meetup {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  childAgeRange: string;
}

interface WeekendActivity {
  id: string;
  title: string;
  description: string;
  category: keyof typeof ACTIVITY_CATEGORIES;
  date: string;
  location: string;
}

interface HomeData {
  brief: DailyBriefContent;
  profile: { name: string; childNickname?: string | null; childAge?: string | null };
  meetups: Meetup[];
  weekendActivities: WeekendActivity[];
  yesterdayMemory: { content: string } | null;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);

  const loadBrief = useCallback(() => {
    return fetch('/api/daily-brief')
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/onboarding')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile?.onboardingComplete) router.push('/onboarding');
      });

    loadBrief().finally(() => setLoading(false));
  }, [status, router, loadBrief]);

  const patchBrief = async (action: string) => {
    setSectionLoading(true);
    try {
      const res = await fetch('/api/daily-brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.brief) {
        setData((prev) => (prev ? { ...prev, brief: json.brief } : prev));
      }
    } finally {
      setSectionLoading(false);
    }
  };

  const submitJournal = async (sentence: string) => {
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Sun className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">MumBot is preparing today&apos;s plan...</p>
        </div>
      </AppShell>
    );
  }

  const firstName = data?.profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'there';
  const childName = data?.profile?.childNickname;
  const brief = data?.brief;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-8">
        {/* Greeting */}
        <section className="pt-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Good morning, {firstName} 👋</h1>
              {childName && brief?.childAgeDisplay && (
                <p className="text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{childName}</span> is {brief.childAgeDisplay}.
                </p>
              )}
              {brief?.greeting && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{brief.greeting}</p>
              )}
            </div>
          </div>
        </section>

        {/* Encouragement banner */}
        {brief?.encouragement && (
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 px-4 py-3">
            <p className="text-sm font-medium flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {brief.encouragement}
            </p>
          </div>
        )}

        {brief && (
          <>
            <RecipeCard
              recipe={brief.recipe}
              loading={sectionLoading}
              onRegenerate={() => patchBrief('regenerate-recipe')}
              onSave={() => patchBrief('save-recipe')}
            />

            <PlayCard
              play={brief.play}
              loading={sectionLoading}
              onRegenerate={() => patchBrief('regenerate-play')}
            />

            <DevelopmentCard items={brief.development} />

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <CardTitle className="text-base">Today&apos;s Parenting Tip</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="rounded-full text-xs mb-2">{brief.tip.topic}</Badge>
                <p className="text-sm leading-relaxed">{brief.tip.content}</p>
              </CardContent>
            </Card>

            <StoryCard
              story={brief.bedtimeStory}
              onSave={() => patchBrief('save-story')}
            />
          </>
        )}

        <JournalPrompt
          yesterdayMemory={data?.yesterdayMemory}
          onSubmit={submitJournal}
        />

        {/* Meetups */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Nearby Parent Meetups</CardTitle>
              </div>
              <Link href="/community?tab=meetups">
                <Button variant="ghost" size="sm" className="h-8 text-xs">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.meetups && data.meetups.length > 0 ? (
              <div className="space-y-3">
                {data.meetups.map((m) => (
                  <div key={m.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(m.date), 'EEE d MMM')} · {m.time} · {m.location}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming meetups — start one in Community!</p>
            )}
          </CardContent>
        </Card>

        {/* Weekend Activities */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Weekend Activities</CardTitle>
              </div>
              <Link href="/activities">
                <Button variant="ghost" size="sm" className="h-8 text-xs">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.weekendActivities && data.weekendActivities.length > 0 ? (
              <div className="space-y-3">
                {data.weekendActivities.map((a) => (
                  <div key={a.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.title}</p>
                      <Badge variant="outline" className="text-[10px] rounded-full">
                        {ACTIVITY_CATEGORIES[a.category]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(a.date), 'EEE d MMM')} · {a.location}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Discover local family fun — add events in Activities.</p>
            )}
          </CardContent>
        </Card>

        {/* Ask MumBot */}
        <Link href="/mumbot">
          <Card className="rounded-2xl border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Ask MumBot Anything</p>
                  <p className="text-xs text-muted-foreground">Your AI Co-Parent is always here</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <div className="text-center pb-2">
          <Link href="/library">
            <Button variant="link" className="text-muted-foreground text-sm">
              Browse personalised Parenting Library →
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
