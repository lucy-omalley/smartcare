'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import {
  UtensilsCrossed,
  BookOpen,
  Puzzle,
  Trophy,
  Brain,
  HeartHandshake,
  Settings,
  Bookmark,
  Library,
  ArrowRight,
} from 'lucide-react';

const MORE_ITEMS = [
  { href: '/learning-plan', label: 'Learning Plan', desc: 'Structured activities for your child', icon: Brain },
  { href: '/weekly-report', label: 'Weekly Growth Report', desc: 'Wins, progress, and next steps', icon: Trophy },
  { href: '/why-parenfy', label: 'Why Parenfy?', desc: 'How we differ from ChatGPT', icon: BookOpen },
  { href: '/feature-requests', label: 'Suggest a Feature', desc: 'Vote on ideas for Parenfy', icon: Puzzle },
  { href: '/saved', label: 'Recipes & Meal Ideas', desc: 'Saved favourites and meal inspiration', icon: UtensilsCrossed },
  { href: '/saved?tab=stories', label: 'Stories', desc: 'Bedtime stories and saved tales', icon: BookOpen },
  { href: '/activities', label: 'Activities', desc: 'Local events and play ideas', icon: Puzzle },
  { href: '/memory?filter=milestone', label: 'Milestones', desc: 'Track development milestones', icon: Trophy },
  { href: '/memory', label: 'Memories', desc: 'Family memory timeline', icon: Brain },
  { href: '/profile?edit=story', label: 'Story Preferences', desc: 'Personalize bedtime stories for your child', icon: BookOpen },
  { href: '/profile?checkin=1', label: 'Parent Check-in', desc: 'Reflect on your parenting week', icon: HeartHandshake },
  { href: '/library', label: 'Parenting Library', desc: 'AI topic recommendations', icon: Library },
  { href: '/profile?settings=1', label: 'Settings', desc: 'Goals, profile, and preferences', icon: Settings },
] as const;

export default function MorePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-xl font-bold">More</h1>
          <p className="text-sm text-muted-foreground">Everything to support your parenting journey.</p>
        </div>

        <div className="space-y-2">
          {MORE_ITEMS.map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Link href="/saved">
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <Bookmark className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">View all saved recipes &amp; stories</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </AppShell>
  );
}
