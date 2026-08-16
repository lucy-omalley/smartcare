'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { RoutineGeneratorForm } from '@/components/routines/routine-generator-form';
import type { RoutineFeatures } from '@/types/visual-routine';

export default function CreateRoutinePage() {
  const { status } = useSession();
  const router = useRouter();
  const [features, setFeatures] = useState<RoutineFeatures | null>(null);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;

    Promise.all([
      fetch('/api/routines/features').then((r) => r.json()),
      fetch('/api/onboarding').then((r) => r.json()),
    ]).then(([f, p]) => {
      setFeatures(f.features);
      setChildName(p.profile?.childNickname ?? '');
      setChildAge(p.profile?.childAge ?? '');
    });
  }, [status, router]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/routines"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Create a routine</h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Visual Routine Studio</CardTitle>
          </CardHeader>
          <CardContent>
            {features ? (
              <RoutineGeneratorForm
                features={features}
                defaultChildName={childName}
                defaultChildAge={childAge}
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
