'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { PostHogProvider } from '@/components/providers/posthog-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </PostHogProvider>
    </SessionProvider>
  );
} 