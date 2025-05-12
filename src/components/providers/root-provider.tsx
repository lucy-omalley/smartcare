"use client";

import { ThemeProvider } from "next-themes";
import { Provider as JotaiProvider } from "jotai";

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <JotaiProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </JotaiProvider>
  );
} 