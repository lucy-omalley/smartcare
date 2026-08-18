'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useTranslation } from '@/hooks/use-translation';

export default function MumBotPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t('mumbot.loading')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 pt-6 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary">{t('mumbot.badge')}</p>
          <h1 className="text-lg font-bold">{t('mumbot.name')}</h1>
          <p className="text-sm text-muted-foreground">{t('mumbot.subtitle')}</p>
        </div>
        <ChatInterface />
      </div>
    </AppShell>
  );
}
