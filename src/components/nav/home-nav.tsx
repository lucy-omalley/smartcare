"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeSelector } from "@/components/theme/theme-selector";

export function HomeNav() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-semibold">MumBot SmartCare</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#chat"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Try MumBot
            </Link>
          </nav>
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
} 