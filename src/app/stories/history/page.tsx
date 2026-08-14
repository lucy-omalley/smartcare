'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { categoryEmoji, categoryLabel } from '@/lib/storytime/constants';
import type { StoryCategory } from '@prisma/client';

interface StoryItem {
  id: string;
  title: string;
  category: StoryCategory;
  lengthMinutes: number;
  isFavorite: boolean;
  playCount: number;
  lastPlayedAt?: string | null;
  createdAt: string;
}

export default function StoryHistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [collections, setCollections] = useState<Array<{ id: string; title: string; stories: StoryItem[] }>>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorite'>('all');

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter === 'favorite') params.set('favorite', '1');
    Promise.all([
      fetch(`/api/storytime/stories?${params}`).then((r) => r.json()),
      fetch('/api/storytime/weekly').then((r) => r.json()),
    ]).then(([s, w]) => {
      setStories(s.stories ?? []);
      setCollections(w.collections ?? []);
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status === 'authenticated') load();
  }, [status, router, filter]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/stories"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Story library</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Search stories…"
              className="pl-9 rounded-xl"
            />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={load}>Search</Button>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} className="rounded-full" onClick={() => setFilter('all')}>All</Button>
          <Button size="sm" variant={filter === 'favorite' ? 'default' : 'outline'} className="rounded-full" onClick={() => setFilter('favorite')}>
            <Heart className="h-3 w-3 mr-1" /> Favourites
          </Button>
        </div>

        {collections.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Weekly story book</h2>
            {collections.slice(0, 2).map((col) => (
              <Card key={col.id} className="rounded-2xl border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{col.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{col.stories.length} stories</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <section className="space-y-2">
          {stories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No stories yet. Create your first tale!</p>
          ) : (
            stories.map((s) => (
              <Link key={s.id} href={`/stories/${s.id}`}>
                <Card className="rounded-2xl mb-2 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-xl">{categoryEmoji(s.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] rounded-full">{categoryLabel(s.category)}</Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full">{s.lengthMinutes} min</Badge>
                        {s.isFavorite && <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />}
                      </div>
                      {s.playCount > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">Played {s.playCount}×</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
