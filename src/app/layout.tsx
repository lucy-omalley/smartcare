import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeSelector } from '@/components/theme/theme-selector';
import './globals.css';
import { RootProvider } from "@/components/providers/root-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "SmartCare",
  description: "Your AI-powered healthcare assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="absolute top-4 right-4 z-50">
            <ThemeSelector />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
