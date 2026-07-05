'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ChatInterface } from '@/components/chat/chat-interface';

export default function MumBotPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading MumBot...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 pt-6 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary">Public Beta</p>
          <h1 className="text-lg font-bold">MumBot</h1>
          <p className="text-sm text-muted-foreground">Your AI co-parent for everyday questions.</p>
        </div>
        <ChatInterface />
      </div>
    </AppShell>
  );
}
