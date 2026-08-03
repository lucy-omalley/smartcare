'use client';

import { Sun, User } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

interface TabLoadingScreenProps {
  message?: string;
  icon?: 'today' | 'profile';
}

export function TabLoadingScreen({
  message = 'Loading…',
  icon = 'today',
}: TabLoadingScreenProps) {
  const Icon = icon === 'profile' ? User : Sun;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center animate-gentle-bounce">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm text-center">{message}</p>
      </div>
    </AppShell>
  );
}
