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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 pt-6">
        <ChatInterface />
      </div>
    </AppShell>
  );
}
