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
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-semibold">SmartCare</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Link href="/home">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link href="/mumbot">
                <Button variant="ghost">MumBot</Button>
              </Link>
              <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="rounded-xl">Get Started</Button>
              </Link>
            </>
          )}
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
}
