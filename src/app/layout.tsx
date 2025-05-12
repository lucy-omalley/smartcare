import { Inter } from 'next/font/google';
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
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className={inter.className}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
