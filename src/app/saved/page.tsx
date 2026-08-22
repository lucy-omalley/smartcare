'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ChefHat, BookOpen, Trash2,
  Loader2, ImageIcon, ChevronDown, ChevronUp, Puzzle
} from 'lucide-react';
import type { DailyBriefRecipe, DailyBriefPlay } from '@/types/daily-brief';
import { ExternalLink, Youtube, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useStoryAudio } from '@/hooks/use-story-audio';
import { StoryListenButton } from '@/components/story/story-listen-button';
import {
  getSavedStoryAudioFetch,
  prefetchSavedStoryAudio,
  prefetchSavedStoriesAudio,
} from '@/lib/saved-story-prefetch';
import { StorytimePromoCard } from '@/components/storytime/storytime-promo-card';

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

interface SavedActivityItem {
  id: string;
  title: string;
  content: DailyBriefPlay;
  createdAt: string;
  source: 'saved' | 'memory';
}

type Tab = 'recipes' | 'stories' | 'activities';

function SavedPageContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    if (t === 'stories') return 'stories';
    if (t === 'activities') return 'activities';
    return 'recipes';
  });
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [activities, setActivities] = useState<SavedActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [illustratingId, setIllustratingId] = useState<string | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const activeStoryIdRef = useRef<string | null>(null);

  const storyAudio = useStoryAudio({
    onError: (message) => toast.error(message),
    onIdle: () => {
      activeStoryIdRef.current = null;
      setActiveStoryId(null);
    },
  });

  const load = () => {
    Promise.all([
      fetch('/api/saved/recipes').then((r) => r.json()),
      fetch('/api/saved/stories').then((r) => r.json()),
      fetch('/api/saved/activities').then((r) => r.json()),
    ]).then(([recipesData, storiesData, activitiesData]) => {
      setRecipes(recipesData.recipes || []);
      setStories(storiesData.stories || []);
      setActivities(activitiesData.activities || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') load();
  }, [status, router]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'stories') setTab('stories');
    else if (t === 'activities') setTab('activities');
    else setTab('recipes');
  }, [searchParams]);

  useEffect(() => {
    if (tab !== 'stories' || stories.length === 0) return;
    prefetchSavedStoriesAudio(stories.map((s) => s.id));
  }, [tab, stories]);

  useEffect(() => {
    if (!expandedStory) return;
    prefetchSavedStoryAudio(expandedStory).catch(() => {});
  }, [expandedStory]);

  const stopStoryAudio = () => {
    storyAudio.stop();
    activeStoryIdRef.current = null;
    setActiveStoryId(null);
  };

  const deleteRecipe = async (id: string) => {
    await fetch(`/api/saved/recipes/${id}`, { method: 'DELETE' });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    toast.success('Recipe removed');
  };

  const deleteStory = async (id: string) => {
    if (activeStoryIdRef.current === id) stopStoryAudio();
    await fetch(`/api/saved/stories/${id}`, { method: 'DELETE' });
    setStories((prev) => prev.filter((s) => s.id !== id));
    toast.success('Story removed');
  };

  const deleteActivity = async (item: SavedActivityItem) => {
    const qs = item.source === 'memory' ? '?source=memory' : '';
    await fetch(`/api/saved/activities/${item.id}${qs}`, { method: 'DELETE' });
    setActivities((prev) => prev.filter((a) => a.id !== item.id));
    toast.success('Activity removed');
  };

  const illustrateStory = async (story: SavedStory) => {
    setIllustratingId(story.id);
    const toastId = toast.loading(story.illustrationData ? 'Creating new art…' : 'Creating cover art…');
    try {
      const res = await fetch('/api/stories/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          story: story.story,
          moral: story.moral,
          savedStoryId: story.id,
        }),
      });
      if (!res.ok) throw new Error();
      const { illustrationData } = await res.json();
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, illustrationData, hasAudio: s.hasAudio } : s))
      );
      toast.success('Illustration ready!', { id: toastId });
    } catch {
      toast.error('Could not generate illustration.', { id: toastId });
    } finally {
      setIllustratingId(null);
    }
  };

  const toggleStoryAudio = (story: SavedStory) => {
    if (activeStoryIdRef.current === story.id && storyAudio.isActive) {
      stopStoryAudio();
      return;
    }

    stopStoryAudio();
    activeStoryIdRef.current = story.id;
    setActiveStoryId(story.id);

    void storyAudio.toggle(async (signal) => getSavedStoryAudioFetch(story.id, signal));
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
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/today">
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
            Meals ({recipes.length})
          </Button>
          <Button
            variant={tab === 'activities' ? 'default' : 'ghost'}
            className="flex-1 rounded-lg"
            size="sm"
            onClick={() => setTab('activities')}
          >
            <Puzzle className="h-4 w-4 mr-1" />
            Activities ({activities.length})
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
                        {(recipe.sampleLinks ?? []).map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs hover:bg-muted/40"
                          >
                            {link.type === 'youtube' ? (
                              <Youtube className="h-3.5 w-3.5 text-red-600 shrink-0" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                            <span className="flex-1">{link.title}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )
        )}

        {tab === 'activities' && (
          activities.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No saved activities yet. Save one from today&apos;s activity on Home.
              </CardContent>
            </Card>
          ) : (
            activities.map((item) => {
              const play = item.content;
              const open = expandedActivity === item.id;
              return (
                <Card key={`${item.source}-${item.id}`} className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{play.title || item.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Saved {format(new Date(item.createdAt), 'd MMM yyyy')}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => void deleteActivity(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {play.durationMinutes > 0 ? (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {play.durationMinutes} min
                      </Badge>
                    ) : null}
                    {play.reason ? (
                      <p className="text-sm text-muted-foreground">{play.reason}</p>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setExpandedActivity(open ? null : item.id)}
                    >
                      {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      {open ? 'Hide' : 'View activity'}
                    </Button>
                    {open && (
                      <div className="text-sm space-y-2">
                        {play.materials?.length ? (
                          <ul className="list-disc list-inside text-muted-foreground">
                            {play.materials.map((m) => <li key={m}>{m}</li>)}
                          </ul>
                        ) : null}
                        <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                          {(play.detailedInstructions ?? play.instructions)?.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
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
          <div className="space-y-3">
            <StorytimePromoCard compact />
            {stories.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No saved stories yet. Save tonight&apos;s bedtime story from Home, or try{' '}
                <Link href="/stories/create" className="text-primary underline">Family Voice Storytime</Link>.
              </CardContent>
            </Card>
          ) : (
            stories.map((item) => {
              const open = expandedStory === item.id;
              const isIllustrating = illustratingId === item.id;
              const isAudioActive = activeStoryId === item.id && storyAudio.isActive;
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
                        className="rounded-xl touch-target"
                        type="button"
                        disabled={isIllustrating}
                        onClick={() => illustrateStory(item)}
                      >
                        {isIllustrating ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 mr-1" />
                        )}
                        {item.illustrationData ? 'New Art' : 'Illustrate'}
                      </Button>
                      <StoryListenButton
                        active={isAudioActive}
                        onToggle={() => toggleStoryAudio(item)}
                        className="rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">Loading...</div>
      </AppShell>
    }>
      <SavedPageContent />
    </Suspense>
  );
}
