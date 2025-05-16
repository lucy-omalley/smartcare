"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function HomeNav() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-semibold">MumBot SmartCare</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Features
            </Link>
            {!session && (
              <Link
                href="/register"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Register as Provider
              </Link>
            )}
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
} 