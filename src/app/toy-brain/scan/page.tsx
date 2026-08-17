'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ToyScanFlow } from '@/components/toy-brain/toy-scan-flow';
import type { ToyBrainFeatures } from '@/types/toy-brain';

export default function ToyBrainScanPage() {
  const { status } = useSession();
  const router = useRouter();
  const [features, setFeatures] = useState<ToyBrainFeatures | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status !== 'authenticated') return;
    fetch('/api/toy-brain/features').then((r) => r.json()).then((f) => setFeatures(f.features));
  }, [status, router]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/toy-brain"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Scan a toy</h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Photograph any toy</CardTitle>
            <p className="text-sm text-muted-foreground">
              We&apos;ll identify it and generate personalised play ideas for your child.
            </p>
          </CardHeader>
          <CardContent>
            {features ? (
              <ToyScanFlow features={features} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
