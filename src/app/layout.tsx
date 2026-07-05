import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://parenfy.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Parenfy Public Beta | AI Parenting Companion",
    template: "%s | Parenfy",
  },
  description:
    "Join Parenfy Public Beta — personalised daily parenting plans, MumBot AI support, activities, stories, meals, and safe parent connection.",
  openGraph: {
    title: "Parenfy Public Beta | AI Parenting Companion",
    description:
      "Join Parenfy Public Beta — personalised daily parenting plans, MumBot AI support, activities, stories, meals, and safe parent connection.",
    url: siteUrl,
    siteName: "Parenfy",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Parenfy Public Beta | AI Parenting Companion",
    description:
      "Join Parenfy Public Beta — personalised daily parenting plans, MumBot AI support, activities, stories, meals, and safe parent connection.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
