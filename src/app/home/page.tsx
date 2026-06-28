'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bot, MessageCircle, Brain, Users, Calendar, Gift,
  ArrowRight, Sparkles, Coffee
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HomeData {
  todaysFocus: string;
  parentingTip: string;
  memoryCount: number;
  postCount: number;
  upcomingMeetups: number;
  lastConversation: { id: string; title: string; updatedAt: string } | null;
  profile: { name: string; childNickname?: string | null; parentingGoal?: string | null };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/onboarding')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile?.onboardingComplete) {
          router.push('/onboarding');
        }
      });

    fetch('/api/home')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppShell>
    );
  }

  const firstName = data?.profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'there';
  const childName = data?.profile?.childNickname;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-6">
        {/* Hero */}
        <section className="pt-4 pb-2">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hi {firstName} 👋</h1>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                I&apos;m <span className="font-medium text-foreground">MumBot</span>.
                {childName ? ` Here for you and ${childName}.` : ' Here whenever you need me.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Link href="/mumbot" className="flex-1">
              <Button className="w-full rounded-xl" size="lg">
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Chatting
              </Button>
            </Link>
            <Link href="/community" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl" size="lg">
                <Users className="mr-2 h-4 w-4" />
                Community
              </Button>
            </Link>
          </div>
        </section>

        {/* Today's Focus */}
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Today&apos;s Focus</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data?.todaysFocus}</p>
          </CardContent>
        </Card>

        {/* Parenting Tip */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today&apos;s Parenting Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data?.parentingTip}</p>
          </CardContent>
        </Card>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/mumbot">
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Continue Chat</p>
                {data?.lastConversation && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {data.lastConversation.title}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/memory">
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Family Memory</p>
                <p className="text-xs text-muted-foreground">
                  {data?.memoryCount || 0} memories saved
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/community">
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Community</p>
                <p className="text-xs text-muted-foreground">
                  {data?.postCount || 0} posts
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/activities">
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Weekend Activities</p>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/exchange">
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Toy Exchange</p>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/community?tab=meetups">
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <Coffee className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Coffee Walks</p>
                <p className="text-xs text-muted-foreground">
                  {data?.upcomingMeetups || 0} upcoming
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {data?.profile?.parentingGoal && (
          <div className="flex items-center gap-2 justify-center pb-2">
            <span className="text-xs text-muted-foreground">Your goal:</span>
            <Badge variant="secondary" className="rounded-full">
              {data.profile.parentingGoal}
            </Badge>
          </div>
        )}
      </div>
    </AppShell>
  );
}
