"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { LANDING_NAV } from "@/lib/landing/content";

export function HomeNav() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-semibold">Parenfy</span>
        </Link>
        <div className="hidden lg:flex items-center gap-1 ml-6">
          {LANDING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Link href="/today">
                <Button variant="ghost" size="sm">
                  Today
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="rounded-xl">
                  Get started
                </Button>
              </Link>
            </>
          )}
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
}
