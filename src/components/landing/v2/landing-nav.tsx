"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { Button } from "@/components/ui/button";
import { V2_NAV } from "@/lib/landing/v2-content";

export function LandingNavV2() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 md:h-[4.25rem] items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <span className="font-semibold text-lg tracking-tight">Parenfy</span>
        </Link>
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {V2_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl hover:bg-muted/60 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/auth/signin" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="rounded-xl">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="rounded-xl shadow-sm">
              Start free
            </Button>
          </Link>
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
}
