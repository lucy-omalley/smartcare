'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { PostHogProvider } from '@/components/providers/posthog-provider';
import { AnalyticsSessionTracker } from '@/components/analytics/session-tracker';
import { ReferralCapture } from '@/components/analytics/referral-capture';
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
          <ReferralCapture />
          <AnalyticsSessionTracker />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </PostHogProvider>
    </SessionProvider>
  );
} 