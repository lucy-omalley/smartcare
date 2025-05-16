'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, ArrowRight } from "lucide-react";
import { HomeNav } from "@/components/nav/home-nav";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomeNav />
        <main className="flex-1 container max-w-4xl mx-auto p-4 flex flex-col items-center justify-center">
          <Card className="w-full max-w-2xl p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Welcome to MumBot!</h1>
              <p className="text-muted-foreground">
                You can access MumBot directly from your dashboard. Head over there to start chatting with your AI childcare assistant.
              </p>
              <Link href="/dashboard">
                <Button className="mt-4 group">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1 container max-w-4xl mx-auto p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Try MumBot</h1>
            <p className="text-muted-foreground">
              To access MumBot, our AI childcare assistant, please sign in or create an account.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/auth/signin">
                <Button className="group">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="group">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
} 