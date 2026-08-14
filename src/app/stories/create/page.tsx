'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { StoryGeneratorForm } from '@/components/storytime/story-generator-form';

interface Features {
  isPremium: boolean;
  allowedLengths: number[];
  storiesRemainingThisMonth: number | null;
}

export default function CreateStoryPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [features, setFeatures] = useState<Features | null>(null);
  const [childName, setChildName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/storytime/features').then((r) => r.json()),
        fetch('/api/onboarding').then((r) => r.json()),
      ]).then(([f, p]) => {
        setFeatures(f.features);
        setChildName(p.profile?.childNickname ?? '');
      });
    }
  }, [status, router]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/stories"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Create a story</h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Personalized bedtime story</CardTitle>
          </CardHeader>
          <CardContent>
            {features ? (
              <StoryGeneratorForm
                defaultChildName={childName}
                allowedLengths={features.allowedLengths}
                storiesRemaining={features.storiesRemainingThisMonth}
                isPremium={features.isPremium}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
