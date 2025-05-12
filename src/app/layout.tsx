'use client';

import { Inter } from 'next/font/google';
import { useAtom } from 'jotai';
import { themeAtom } from '@/lib/store/theme';
import { themes } from '@/lib/themes';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentTheme] = useAtom(themeAtom);
  const theme = themes[currentTheme];

  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <style>{`
          :root {
            --background: ${theme.background};
            --foreground: ${theme.foreground};
            --primary: ${theme.primary};
            --primary-foreground: ${theme.primaryForeground};
            --secondary: ${theme.secondary};
            --secondary-foreground: ${theme.secondaryForeground};
            --accent: ${theme.accent};
            --accent-foreground: ${theme.accentForeground};
            --muted: ${theme.muted};
            --muted-foreground: ${theme.mutedForeground};
          }
        `}</style>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
