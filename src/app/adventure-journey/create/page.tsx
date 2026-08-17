'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { AdventureGeneratorForm } from '@/components/adventure/adventure-generator-form';
import type { AdventureFeatures } from '@/types/adventure-journey';

export default function CreateAdventureJourneyPage() {
  const { status } = useSession();
  const router = useRouter();
  const [features, setFeatures] = useState<AdventureFeatures | null>(null);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch('/api/posters/features').then((r) => r.json()),
      fetch('/api/onboarding').then((r) => r.json()),
    ]).then(([f, p]) => {
      setFeatures(f.features);
      setChildName(p.profile?.childNickname ?? '');
      setChildAge(p.profile?.childAge ?? '');
      setInterests(Array.isArray(p.profile?.childInterests) ? p.profile.childInterests : []);
    });
  }, [status, router]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/adventure-journey"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Create adventure</h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tell us about your child</CardTitle>
          </CardHeader>
          <CardContent>
            {features ? (
              <AdventureGeneratorForm
                features={features}
                defaultChildName={childName}
                defaultChildAge={childAge}
                defaultInterests={interests}
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
