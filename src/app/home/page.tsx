'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, MessageCircle, Sun } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/home/recipe-card';
import { PlayCard } from '@/components/home/play-card';
import { DevelopmentCard } from '@/components/home/development-card';
import { TipCard } from '@/components/home/tip-card';
import { EncouragementCard } from '@/components/home/encouragement-card';
import { StoryCard } from '@/components/home/story-card';
import { JournalPrompt } from '@/components/home/journal-prompt';
import { MeetupCard } from '@/components/home/meetup-card';
import { ActivityCard } from '@/components/home/activity-card';
import { WeatherCard } from '@/components/home/weather-card';
import { AnimatedSection } from '@/components/visual/animated-section';
import type { DailyBriefContent, WeatherInfo } from '@/types/daily-brief';
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
  needsIllustrations?: boolean;
  profile: { name: string; childNickname?: string | null; childAge?: string | null; location?: string | null };
  meetups: Meetup[];
  weekendActivities: WeekendActivity[];
  yesterdayMemory: { content: string } | null;
  weather: WeatherInfo | null;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);

  const loadBrief = useCallback(() => {
    return fetch('/api/daily-brief').then((r) => r.json()).then(setData);
  }, []);

  const generateIllustrations = useCallback(async () => {
    setImagesLoading(true);
    try {
      const res = await fetch('/api/daily-brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-illustrations' }),
      });
      const json = await res.json();
      if (json.brief) {
        setData((prev) => (prev ? { ...prev, brief: json.brief, needsIllustrations: false } : prev));
      }
    } finally {
      setImagesLoading(false);
    }
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

  useEffect(() => {
    if (data?.needsIllustrations && !imagesLoading) {
      generateIllustrations();
    }
  }, [data?.needsIllustrations, imagesLoading, generateIllustrations]);

  const patchBrief = async (action: string, extra?: Record<string, unknown>) => {
    setSectionLoading(true);
    try {
      const res = await fetch('/api/daily-brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (json.brief) {
        setData((prev) => (prev ? { ...prev, brief: json.brief, needsIllustrations: true } : prev));
        if (action === 'regenerate-recipe' || action === 'regenerate-play') {
          generateIllustrations();
        }
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
    loadBrief();
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center animate-gentle-bounce">
            <Sun className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm text-center">MumBot is preparing today&apos;s beautiful plan...</p>
        </div>
      </AppShell>
    );
  }

  const firstName = data?.profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'there';
  const childName = data?.profile?.childNickname;
  const brief = data?.brief;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-5 pb-10 space-y-6">
        <AnimatedSection>
          <header className="text-center space-y-2 py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/80 shadow-sm mb-1">
              <span className="text-2xl">🌞</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Good morning, {firstName}</h1>
            {childName && brief?.childAgeDisplay && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{childName}</span> is {brief.childAgeDisplay}
              </p>
            )}
            {imagesLoading && (
              <p className="text-xs text-primary/70 animate-pulse">Painting today&apos;s illustrations...</p>
            )}
          </header>
        </AnimatedSection>

        <AnimatedSection delay={80}>
          <WeatherCard
            weather={data?.weather ?? null}
            weatherNote={brief?.weatherNote}
            hasLocation={!!data?.profile?.location}
          />
        </AnimatedSection>

        {brief && (
          <>
            <AnimatedSection delay={120}>
              <RecipeCard
                recipe={brief.recipe}
                loading={sectionLoading}
                imagesLoading={imagesLoading}
                onRegenerate={() => patchBrief('regenerate-recipe')}
                onSave={() => patchBrief('save-recipe')}
              />
            </AnimatedSection>

            <AnimatedSection delay={160}>
              <PlayCard
                play={brief.play}
                loading={sectionLoading}
                imagesLoading={imagesLoading}
                onRegenerate={() => patchBrief('regenerate-play')}
              />
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <DevelopmentCard
                items={brief.development}
                developmentImage={brief.developmentImage}
                imagesLoading={imagesLoading}
              />
            </AnimatedSection>

            <AnimatedSection delay={240}>
              <EncouragementCard message={brief.encouragement} />
            </AnimatedSection>

            <AnimatedSection delay={280}>
              <TipCard tip={brief.tip} imagesLoading={imagesLoading} />
            </AnimatedSection>

            <AnimatedSection delay={320}>
              <StoryCard
                story={brief.bedtimeStory}
                imagesLoading={imagesLoading}
                onSave={(extras) => patchBrief('save-story', extras)}
              />
            </AnimatedSection>
          </>
        )}

        <AnimatedSection delay={360}>
          <JournalPrompt yesterdayMemory={data?.yesterdayMemory} onSubmit={submitJournal} />
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <MeetupCard meetups={data?.meetups ?? []} weatherDescription={data?.weather?.description} />
        </AnimatedSection>

        <AnimatedSection delay={440}>
          <ActivityCard activities={data?.weekendActivities ?? []} />
        </AnimatedSection>

        <AnimatedSection delay={480}>
          <Link href="/mumbot">
            <div className="visual-card p-5 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Chat with MumBot</p>
                  <p className="text-xs text-muted-foreground">Ask anything — I&apos;m here for you</p>
                </div>
              </div>
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </AnimatedSection>

        <div className="text-center space-y-1 pt-2">
          <Link href="/saved">
            <Button variant="link" className="text-muted-foreground text-sm rounded-full">Saved favourites →</Button>
          </Link>
          <Link href="/library">
            <Button variant="link" className="text-muted-foreground text-sm rounded-full">Parenting library →</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
