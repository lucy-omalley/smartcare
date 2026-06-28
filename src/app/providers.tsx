'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </SessionProvider>
  );
} 