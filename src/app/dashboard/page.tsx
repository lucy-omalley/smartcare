'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { DashboardChat } from '@/components/chat/dashboard-chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-8">
        {session ? (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Welcome, {session.user?.name || 'User'}!</h2>
            <p className="text-muted-foreground">
              You are signed in as {session.user?.email}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
          </div>
        )}

        {/* MumBot Chat Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle>Chat with MumBot</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-3xl">
              <DashboardChat />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 