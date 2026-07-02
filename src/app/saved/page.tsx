'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ChefHat, BookOpen, Trash2, Volume2, Square,
  Loader2, ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import type { DailyBriefRecipe } from '@/types/daily-brief';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SavedRecipe {
  id: string;
  title: string;
  content: DailyBriefRecipe;
  createdAt: string;
}

interface SavedStory {
  id: string;
  title: string;
  story: string;
  moral?: string | null;
  illustrationData?: string | null;
  hasAudio: boolean;
  createdAt: string;
}

type Tab = 'recipes' | 'stories';

export default function SavedPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('recipes');
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      fetch('/api/saved/recipes').then((r) => r.json()),
      fetch('/api/saved/stories').then((r) => r.json()),
    ]).then(([recipesData, storiesData]) => {
      setRecipes(recipesData.recipes || []);
      setStories(storiesData.stories || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') load();
  }, [status, router]);

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  };

  const deleteRecipe = async (id: string) => {
    await fetch(`/api/saved/recipes/${id}`, { method: 'DELETE' });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    toast.success('Recipe removed');
  };

  const deleteStory = async (id: string) => {
    if (playingId === id) stopAudio();
    await fetch(`/api/saved/stories/${id}`, { method: 'DELETE' });
    setStories((prev) => prev.filter((s) => s.id !== id));
    toast.success('Story removed');
  };

  const illustrateStory = async (story: SavedStory) => {
    setBusyId(story.id);
    try {
      const res = await fetch('/api/stories/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: story.title, story: story.story, moral: story.moral, savedStoryId: story.id }),
      });
      if (!res.ok) throw new Error();
      const { illustrationData } = await res.json();
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, illustrationData } : s))
      );
      toast.success('Illustration added!');
    } catch {
      toast.error('Could not generate illustration.');
    } finally {
      setBusyId(null);
    }
  };

  const playStory = async (story: SavedStory) => {
    if (playingId === story.id) {
      stopAudio();
      return;
    }
    stopAudio();
    setBusyId(story.id);
    try {
      const res = await fetch(`/api/saved/stories/${story.id}/audio`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setPlayingId(story.id);
    } catch {
      toast.error('Could not play narration.');
    } finally {
      setBusyId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Saved Favourites</h1>
        </div>

        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button
            variant={tab === 'recipes' ? 'default' : 'ghost'}
            className="flex-1 rounded-lg"
            size="sm"
            onClick={() => setTab('recipes')}
          >
            <ChefHat className="h-4 w-4 mr-1" />
            Recipes ({recipes.length})
          </Button>
          <Button
            variant={tab === 'stories' ? 'default' : 'ghost'}
            className="flex-1 rounded-lg"
            size="sm"
            onClick={() => setTab('stories')}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Stories ({stories.length})
          </Button>
        </div>

        {tab === 'recipes' && (
          recipes.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No saved recipes yet. Save one from today&apos;s meal on Home.
              </CardContent>
            </Card>
          ) : (
            recipes.map((item) => {
              const recipe = item.content;
              const open = expandedRecipe === item.id;
              return (
                <Card key={item.id} className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{recipe.subtitle || item.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Saved {format(new Date(item.createdAt), 'd MMM yyyy')}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => deleteRecipe(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {recipe.prepTimeMinutes} min
                    </Badge>
                    <p className="text-sm text-muted-foreground">{recipe.whyThisMeal}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setExpandedRecipe(open ? null : item.id)}
                    >
                      {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      {open ? 'Hide' : 'View recipe'}
                    </Button>
                    {open && (
                      <div className="text-sm space-y-2">
                        <ul className="list-disc list-inside text-muted-foreground">
                          {recipe.ingredients?.map((i) => <li key={i}>{i}</li>)}
                        </ul>
                        <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                          {recipe.steps?.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )
        )}

        {tab === 'stories' && (
          stories.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No saved stories yet. Save tonight&apos;s bedtime story from Home.
              </CardContent>
            </Card>
          ) : (
            stories.map((item) => {
              const open = expandedStory === item.id;
              const isBusy = busyId === item.id;
              return (
                <Card key={item.id} className="rounded-2xl">
                  {item.illustrationData && (
                    <div className="p-4 pb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.illustrationData}
                        alt={item.title}
                        className="w-full rounded-xl aspect-video object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Saved {format(new Date(item.createdAt), 'd MMM yyyy')}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => deleteStory(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setExpandedStory(open ? null : item.id)}
                    >
                      {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      {open ? 'Hide story' : 'Read story'}
                    </Button>
                    {open && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {item.story}
                        {item.moral && (
                          <span className="block mt-2 text-xs italic text-primary/80">✨ {item.moral}</span>
                        )}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={isBusy}
                        onClick={() => illustrateStory(item)}
                      >
                        {isBusy && !playingId ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 mr-1" />
                        )}
                        {item.illustrationData ? 'New Art' : 'Illustrate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={isBusy && playingId !== item.id}
                        onClick={() => playStory(item)}
                      >
                        {playingId === item.id ? (
                          <Square className="h-3.5 w-3.5 mr-1" />
                        ) : isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        {playingId === item.id ? 'Stop' : 'Listen'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        )}
      </div>
    </AppShell>
  );
}
