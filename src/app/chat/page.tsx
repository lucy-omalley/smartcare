'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ChatInterface } from '@/components/chat/chat-interface';

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/mumbot');
    }
  }, [status, router]);

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container max-w-lg mx-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="text-2xl font-bold">Chat with MumBot</h1>
          <p className="text-muted-foreground">
            Sign in to start chatting with your AI Co-Parent.
          </p>
          <a href="/auth/signin" className="text-primary underline">Sign in</a>
        </main>
      </div>
    );
  }

  return null;
}
