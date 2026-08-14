'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { VoiceRecordFlow } from '@/components/storytime/voice-record-flow';

export default function VoiceRecordPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/stories/voice"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Record your voice</h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Voice calibration</CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceRecordFlow
              onComplete={() => router.push('/stories/voice')}
              onCancel={() => router.push('/stories/voice')}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
