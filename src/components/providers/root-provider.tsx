"use client";

import { ThemeProvider } from "next-themes";
import { Provider as JotaiProvider } from "jotai";
import { LocaleProvider } from "@/components/i18n/locale-provider";

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <JotaiProvider>
      <LocaleProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </LocaleProvider>
    </JotaiProvider>
  );
} 