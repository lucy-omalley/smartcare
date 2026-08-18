'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import { PostHogProvider } from '@/components/providers/posthog-provider';
import { AnalyticsSessionTracker } from '@/components/analytics/session-tracker';
import { ReferralCapture } from '@/components/analytics/referral-capture';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <JotaiProvider>
        <LocaleProvider>
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
        </LocaleProvider>
      </JotaiProvider>
    </SessionProvider>
  );
}
