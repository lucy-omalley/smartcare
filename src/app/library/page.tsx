'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookMarked, ArrowLeft, MessageCircle } from 'lucide-react';
import type { LibraryRecommendation } from '@/types/daily-brief';

export default function LibraryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<LibraryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/library')
        .then((r) => r.json())
        .then((data) => setRecommendations(data.recommendations || []))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">
          Curating guidance for your family...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Parenting Library</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground px-1">
          Personalised guidance based on your child&apos;s age, goals, and recent conversations — no searching required.
        </p>

        {recommendations.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Chat with MumBot to unlock tailored recommendations.
            </CardContent>
          </Card>
        ) : (
          recommendations.map((rec, i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{rec.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm leading-relaxed">{rec.summary}</p>
                <p className="text-xs text-primary/80 bg-primary/5 rounded-lg p-2.5">
                  {rec.relevance}
                </p>
                <Link href="/mumbot">
                  <Button variant="outline" size="sm" className="rounded-xl mt-1">
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    Ask MumBot about this
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
