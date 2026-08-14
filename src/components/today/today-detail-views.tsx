'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bookmark, Loader2, ImageIcon, ChefHat, ExternalLink, Youtube, FileText, RefreshCw, BookOpen, Sparkles } from 'lucide-react';
import type {
  DailyBriefRecipe,
  DailyBriefPlay,
  DailyBriefStory,
  DailyBriefDevelopment,
  RecipeSampleLink,
} from '@/types/daily-brief';
import { toast } from 'sonner';
import { useStoryAudio } from '@/hooks/use-story-audio';
import { getTodayStoryAudioFetch } from '@/lib/story-audio-prefetch';
import { fetchTodayStoryIllustration, prefetchTodayStoryIllustration, warmTodayStoryIllustration } from '@/lib/story-illustration-prefetch';
import { fetchTodayRecipeIllustration, prefetchTodayRecipeIllustration, warmTodayRecipeIllustration } from '@/lib/recipe-illustration-prefetch';
import { isGenericRecipeLink } from '@/lib/recipe-link-utils';
import { StoryListenButton } from '@/components/story/story-listen-button';
import { ExpandableStepList } from '@/components/today/expandable-step-list';
import Link from 'next/link';
import { hasStoryPreferences, storyPreferenceLabels, type StoryPreferences } from '@/lib/story-preferences';

const MEAL_STYLE_OPTIONS = ['Soup', 'Pasta', 'Rice bowl', 'Salad', 'Stir-fry', 'Sandwich', 'Casserole', 'Smoothie'] as const;

export type FridgeRecipeRequest = {
  ingredients: string[];
  mealPreferences: string[];
  tryAnother?: boolean;
};

type DetailPart = 'content' | 'footer';

function normalizeIllustrationSrc(data?: string | null): string | undefined {
  if (!data?.trim()) return undefined;
  if (data.startsWith('data:') || data.startsWith('http://') || data.startsWith('https://') || data.startsWith('blob:')) {
    return data;
  }
  return `data:image/png;base64,${data}`;
}

export function MealDetailProvider({
  recipe,
  childAgeDisplay,
  onSave,
  onBack,
  onFridgeRecipe,
  children,
}: {
  recipe: DailyBriefRecipe;
  childAgeDisplay?: string;
  onSave: () => Promise<void>;
  onBack: () => void;
  onFridgeRecipe: (params: FridgeRecipeRequest) => Promise<void>;
  children: React.ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const media = useMealDetailMedia(recipe);

  return (
    <MealDetailContext.Provider
      value={{
        ...media,
        recipe,
        childAgeDisplay,
        onSave,
        onBack,
        onFridgeRecipe,
        saving,
        setSaving,
      }}
    >
      {children}
    </MealDetailContext.Provider>
  );
}

type MealDetailContextValue = Omit<ReturnType<typeof useMealDetailMedia>, never> & {
  recipe: DailyBriefRecipe;
  childAgeDisplay?: string;
  onSave: () => Promise<void>;
  onBack: () => void;
  onFridgeRecipe: (params: FridgeRecipeRequest) => Promise<void>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

const MealDetailContext = createContext<MealDetailContextValue | null>(null);

function useMealDetailContext() {
  const ctx = useContext(MealDetailContext);
  if (!ctx) throw new Error('MealDetailProvider required');
  return ctx;
}

function useMealDetailMedia(recipe: DailyBriefRecipe) {
  const [illustrating, setIllustrating] = useState(false);
  const [imageData, setImageData] = useState<string | undefined>(
    normalizeIllustrationSrc(recipe.imageData)
  );
  const coverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setImageData(normalizeIllustrationSrc(recipe.imageData));
  }, [recipe.imageData, recipe.subtitle]);

  useEffect(() => {
    if (recipe.imageData) return;
    void prefetchTodayRecipeIllustration().then((data) => {
      if (data) setImageData(normalizeIllustrationSrc(data));
    });
    void warmTodayRecipeIllustration().then((data) => {
      if (data) setImageData(normalizeIllustrationSrc(data));
    }).catch(() => {});
  }, [recipe.subtitle, recipe.imageData]);

  const handleIllustrate = async () => {
    setIllustrating(true);
    try {
      const data = await fetchTodayRecipeIllustration();
      setImageData(normalizeIllustrationSrc(data));
      toast.success('Recipe photo ready!');
      requestAnimationFrame(() => {
        coverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch {
      toast.error('Could not generate recipe photo.');
    } finally {
      setIllustrating(false);
    }
  };

  return { illustrating, imageData, coverRef, handleIllustrate };
}

function RecipeSampleLinks({ links, loading }: { links: RecipeSampleLink[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">Recipe inspiration</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-xl border bg-muted/20 px-3 py-2.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Finding matching videos and recipes…
        </div>
      </div>
    );
  }

  if (!links.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase text-muted-foreground">Recipe inspiration</p>
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={`${link.type}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
          >
            {link.type === 'youtube' ? (
              <Youtube className="h-4 w-4 text-red-600 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-primary shrink-0" />
            )}
            <span className="flex-1 leading-snug">{link.title}</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function MealDetailContent() {
  const {
    recipe,
    childAgeDisplay,
    onFridgeRecipe,
    onSave,
    saving,
    setSaving,
    illustrating,
    imageData,
    coverRef,
    handleIllustrate,
  } = useMealDetailContext();
  const [fridgeInput, setFridgeInput] = useState('');
  const [preferenceInput, setPreferenceInput] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [hasFridgeResult, setHasFridgeResult] = useState(Boolean(recipe.fromFridge));

  useEffect(() => {
    if (recipe.fromFridge) setHasFridgeResult(true);
  }, [recipe.fromFridge, recipe.subtitle]);

  const mealPreferences = [
    ...selectedPreferences,
    ...preferenceInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => !selectedPreferences.includes(p)),
  ];

  const togglePreference = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const runFridgeRecipe = async (tryAnother = false) => {
    const ingredients = fridgeInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ingredients.length === 0) {
      toast.error('Add at least one ingredient from your fridge.');
      return;
    }
    setGenerating(true);
    try {
      await onFridgeRecipe({ ingredients, mealPreferences, tryAnother });
      setHasFridgeResult(true);
      if (!tryAnother) toast.success('New meal plan ready!');
      else toast.success('Here\'s another idea!');
    } catch {
      toast.error('Could not create meal from those ingredients.');
    } finally {
      setGenerating(false);
    }
  };

  const [sampleLinks, setSampleLinks] = useState<RecipeSampleLink[]>(recipe.sampleLinks ?? []);
  const [linksLoading, setLinksLoading] = useState(false);

  useEffect(() => {
    const existing = recipe.sampleLinks ?? [];
    const needsResolve =
      !existing.length || existing.some((link) => isGenericRecipeLink(link.url));

    if (!needsResolve) {
      setSampleLinks(existing);
      return;
    }

    let cancelled = false;
    setLinksLoading(true);
    void fetch('/api/recipes/resolve-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json() as Promise<{ sampleLinks?: RecipeSampleLink[] }>;
      })
      .then((data) => {
        if (!cancelled && data.sampleLinks?.length) {
          setSampleLinks(data.sampleLinks);
        }
      })
      .catch(() => {
        if (!cancelled && existing.length) setSampleLinks(existing);
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recipe.subtitle, recipe.ingredients, recipe.steps, recipe.sampleLinks]);

  return (
    <div className="space-y-4 text-sm pb-2">
      <div ref={coverRef} className="space-y-2">
        {imageData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageData}
            alt={`Photo of ${recipe.subtitle}`}
            className="w-full rounded-2xl max-h-44 object-cover"
          />
        ) : (
          <div className="w-full rounded-2xl max-h-44 min-h-[8rem] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-muted-foreground text-xs px-4 text-center">
            Tap Recipe photo to generate an appetising picture
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full touch-target w-full"
          disabled={illustrating}
          onClick={handleIllustrate}
        >
          {illustrating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
          )}
          Recipe photo
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-bold">{recipe.subtitle}</h3>
        {childAgeDisplay && (
          <p className="text-xs text-muted-foreground mt-1">Suitable for {childAgeDisplay}</p>
        )}
        {recipe.prepTimeMinutes > 0 && (
          <Badge variant="secondary" className="rounded-full mt-2">
            {recipe.prepTimeMinutes} min
          </Badge>
        )}
      </div>

      <div className="bg-amber-50/80 rounded-xl p-3 space-y-3 border border-amber-100">
        <p className="text-xs font-medium text-amber-900 flex items-center gap-1.5">
          <ChefHat className="h-3.5 w-3.5" />
          What&apos;s in your fridge?
        </p>
        <p className="text-xs text-amber-800/80">
          List ingredients and pick a meal style — we&apos;ll suggest a child-friendly recipe.
        </p>
        <Input
          value={fridgeInput}
          onChange={(e) => setFridgeInput(e.target.value)}
          placeholder="e.g. salmon, broccoli, rice"
          className="rounded-xl bg-white border-amber-200"
          disabled={generating}
        />
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-900">Meal style (optional)</p>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_STYLE_OPTIONS.map((pref) => {
              const active = selectedPreferences.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  disabled={generating}
                  onClick={() => togglePreference(pref)}
                  className={`rounded-full px-2.5 py-1 text-xs border transition-colors ${
                    active
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  {pref}
                </button>
              );
            })}
          </div>
          <Input
            value={preferenceInput}
            onChange={(e) => setPreferenceInput(e.target.value)}
            placeholder="Or type a style, e.g. curry, baked"
            className="rounded-xl bg-white border-amber-200 text-xs"
            disabled={generating}
          />
        </div>
        <Button
          size="sm"
          className="rounded-full w-full touch-target"
          disabled={generating || !fridgeInput.trim()}
          onClick={() => void runFridgeRecipe(false)}
        >
          {generating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              Creating meal plan…
            </>
          ) : (
            'Create meal from fridge'
          )}
        </Button>
        {hasFridgeResult && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full touch-target"
              disabled={generating || !fridgeInput.trim()}
              onClick={() => void runFridgeRecipe(true)}
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
              )}
              Try another
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full touch-target"
              disabled={saving || generating}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave();
                  toast.success('Recipe saved!');
                } catch {
                  toast.error('Could not save recipe.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Bookmark className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Saving…' : 'Save recipe'}
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Why it helps</p>
        <p className="leading-relaxed">{recipe.whyThisMeal}</p>
      </div>
      {recipe.healthyTip && (
        <div className="bg-emerald-50 rounded-xl p-3 text-emerald-900">
          <p className="text-xs font-medium mb-1">Picky eating tip</p>
          <p className="text-sm">{recipe.healthyTip}</p>
        </div>
      )}
      <RecipeSampleLinks links={sampleLinks} loading={linksLoading} />
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Ingredients</p>
        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
          {recipe.ingredients.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      <ExpandableStepList
        steps={recipe.steps}
        detailedSteps={recipe.detailedSteps}
        quickLabel="Quick steps"
        fullLabel="Full step-by-step guide"
      />
    </div>
  );
}

export function MealDetailFooter() {
  const { onSave, onBack, saving, setSaving } = useMealDetailContext();

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1 rounded-full touch-target"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave();
            toast.success('Meal saved!');
          } catch {
            toast.error('Could not save meal.');
          } finally {
            setSaving(false);
          }
        }}
      >
        <Bookmark className="h-4 w-4 mr-1" />
        {saving ? 'Saving...' : 'Save meal'}
      </Button>
      <Button variant="outline" className="rounded-full touch-target shrink-0" onClick={onBack}>
        Back to Today
      </Button>
    </div>
  );
}

export function ActivityDetailView({
  play,
  onSave,
  onBack,
  part = 'content',
}: {
  play: DailyBriefPlay;
  onSave: () => Promise<void>;
  onBack: () => void;
  part?: DetailPart;
}) {
  const [saving, setSaving] = useState(false);

  const footer = (
    <div className="flex gap-2">
      <Button
        className="flex-1 rounded-full touch-target"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave();
            toast.success('Activity saved!');
          } catch {
            toast.error('Could not save activity.');
          } finally {
            setSaving(false);
          }
        }}
      >
        <Bookmark className="h-4 w-4 mr-1" />
        {saving ? 'Saving...' : 'Save activity'}
      </Button>
      <Button variant="outline" className="rounded-full touch-target shrink-0" onClick={onBack}>
        Back to Today
      </Button>
    </div>
  );

  if (part === 'footer') return footer;

  return (
    <div className="space-y-4 text-sm pb-2">
      <div>
        <h3 className="text-lg font-bold">{play.title}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="rounded-full">{play.durationMinutes} min</Badge>
          {play.ageRecommendation && (
            <Badge variant="outline" className="rounded-full">{play.ageRecommendation}</Badge>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Materials</p>
        <ul className="list-disc pl-4 text-muted-foreground">
          {play.materials.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
      <ExpandableStepList
        steps={play.instructions}
        detailedSteps={play.detailedInstructions}
        quickLabel="Quick steps"
        fullLabel="Full activity guide"
      />
      {play.skillsDeveloped?.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Skills supported</p>
          <p className="text-muted-foreground">{play.skillsDeveloped.join(' · ')}</p>
        </div>
      )}
      <p className="text-xs bg-primary/5 rounded-xl p-3 text-muted-foreground">
        Parent tip: Follow your child&apos;s lead — the goal is connection, not perfection.
      </p>
    </div>
  );
}

type StoryDetailContextValue = Omit<ReturnType<typeof useStoryDetailMedia>, never> & {
  story: DailyBriefStory;
  onSave: (extras?: { illustrationData?: string }) => Promise<void>;
  onBack: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

const StoryDetailContext = createContext<StoryDetailContextValue | null>(null);

function useStoryDetailContext() {
  const ctx = useContext(StoryDetailContext);
  if (!ctx) throw new Error('StoryDetailProvider required');
  return ctx;
}

export function StoryDetailProvider({
  story,
  onSave,
  onBack,
  children,
}: {
  story: DailyBriefStory;
  onSave: (extras?: { illustrationData?: string }) => Promise<void>;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const media = useStoryDetailMedia(story);

  return (
    <StoryDetailContext.Provider value={{ ...media, story, onSave, onBack, saving, setSaving }}>
      {children}
    </StoryDetailContext.Provider>
  );
}

function useStoryDetailMedia(story: DailyBriefStory) {
  const [illustrating, setIllustrating] = useState(false);
  const [illustrationData, setIllustrationData] = useState<string | undefined>(
    normalizeIllustrationSrc(story.illustrationData)
  );
  const coverRef = useRef<HTMLDivElement | null>(null);

  const storyAudio = useStoryAudio({
    onError: (message) => toast.error(message),
  });

  useEffect(() => {
    setIllustrationData(normalizeIllustrationSrc(story.illustrationData));
  }, [story.illustrationData]);

  useEffect(() => {
    if (story.illustrationData) return;
    void prefetchTodayStoryIllustration().then((data) => {
      if (data) setIllustrationData(normalizeIllustrationSrc(data));
    });
    void warmTodayStoryIllustration().then((data) => {
      if (data) setIllustrationData(normalizeIllustrationSrc(data));
    }).catch(() => {});
  }, [story.title, story.story, story.illustrationData]);

  const storyKeyRef = useRef(`${story.title}|${story.story}`);
  const stopAudioRef = useRef(storyAudio.stop);
  stopAudioRef.current = storyAudio.stop;

  useEffect(() => {
    const key = `${story.title}|${story.story}`;
    if (storyKeyRef.current === key) return;
    storyKeyRef.current = key;
    stopAudioRef.current();
  }, [story.title, story.story]);

  const handleNarrate = () => {
    if (!story.story?.trim()) {
      toast.error('Story text is missing.');
      return;
    }
    void storyAudio.toggle(async (signal) => getTodayStoryAudioFetch(signal));
  };

  const handleIllustrate = async () => {
    setIllustrating(true);
    try {
      const data = await fetchTodayStoryIllustration();
      setIllustrationData(normalizeIllustrationSrc(data));
      toast.success('Cover ready!');
      requestAnimationFrame(() => {
        coverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch {
      toast.error('Could not generate illustration.');
    } finally {
      setIllustrating(false);
    }
  };

  return {
    illustrating,
    isPlaying: storyAudio.isPlaying,
    isNarrating: storyAudio.isActive,
    illustrationData,
    coverRef,
    handleNarrate,
    handleIllustrate,
    stopAudio: storyAudio.stop,
  };
}

export function StoryDetailContent({
  childAgeDisplay,
  storyPreferences,
}: {
  childAgeDisplay?: string;
  storyPreferences?: StoryPreferences | null;
}) {
  const { story } = useStoryDetailContext();
  const personalized = hasStoryPreferences(storyPreferences);
  const prefLabels = storyPreferences ? storyPreferenceLabels(storyPreferences) : [];
  const childName = storyPreferences?.childNickname?.trim();

  return (
    <div className="space-y-4 text-sm pb-2">
      {personalized && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Personalized for {childName || 'your child'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {prefLabels.map((label) => (
              <Badge key={label} variant="secondary" className="rounded-full text-[10px]">
                {label}
              </Badge>
            ))}
          </div>
          <Link href="/profile?edit=story" className="text-[10px] text-primary underline-offset-2 hover:underline">
            Edit story preferences
          </Link>
        </div>
      )}
      {!personalized && (
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            Make stories feel personal
          </div>
          Add favourite animals, characters, and themes in your profile — tonight&apos;s tale will weave them in.
          <Link href="/profile?edit=story" className="block mt-1.5 text-primary underline-offset-2 hover:underline">
            Set up story preferences
          </Link>
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold">{story.title}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="rounded-full">~{story.lengthMinutes} min read</Badge>
          {childAgeDisplay && (
            <Badge variant="outline" className="rounded-full">{childAgeDisplay}</Badge>
          )}
          {story.theme && (
            <Badge variant="outline" className="rounded-full">Theme: {story.theme}</Badge>
          )}
        </div>
      </div>
      {story.moral && (
        <p className="text-xs text-primary/80 bg-primary/5 rounded-xl px-3 py-2">
          Lesson: {story.moral}
        </p>
      )}
      <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
        Parent tip: Use a calm voice and pause for your child to react — stories build language and connection.
      </p>
      <div className="text-base leading-relaxed text-foreground whitespace-pre-line bg-muted/30 rounded-2xl p-4">
        {story.story}
      </div>
    </div>
  );
}

export function StoryDetailFooter() {
  const {
    story,
    onSave,
    onBack,
    saving,
    setSaving,
    illustrating,
    isNarrating,
    illustrationData,
    coverRef,
    handleNarrate,
    handleIllustrate,
    stopAudio,
  } = useStoryDetailContext();
  const mediaActive = isNarrating;

  return (
    <div className="space-y-3">
      <div ref={coverRef} className="space-y-3">
        {illustrationData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={illustrationData}
            alt={`Cover illustration for ${story.title}`}
            className="w-full rounded-2xl max-h-40 object-cover"
          />
        ) : (
          <div className="w-full rounded-2xl max-h-40 min-h-[7rem] bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center text-muted-foreground text-xs px-4 text-center">
            Tap Cover art to generate an illustration
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full touch-target"
            disabled={illustrating}
            onClick={handleIllustrate}
          >
            {illustrating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
            )}
            Cover art
          </Button>
          <StoryListenButton
            active={mediaActive}
            onToggle={handleNarrate}
            className="rounded-full"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 rounded-full touch-target"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({ illustrationData });
              toast.success('Story saved!');
            } catch {
              toast.error('Could not save story.');
            } finally {
              setSaving(false);
            }
          }}
        >
          <Bookmark className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save story'}
        </Button>
        <Button
          variant="outline"
          className="rounded-full touch-target shrink-0"
          onClick={() => {
            stopAudio();
            onBack();
          }}
        >
          Back to Today
        </Button>
      </div>
    </div>
  );
}

export function LanguageDetailView({
  language,
  childAgeDisplay,
  onBack,
  part = 'content',
}: {
  language: import('@/types/daily-brief').DailyBriefLanguageSection;
  childAgeDisplay?: string;
  onBack: () => void;
  part?: DetailPart;
}) {
  const footer = (
    <Button variant="outline" className="w-full rounded-full touch-target" onClick={onBack}>
      Back to Today
    </Button>
  );

  if (part === 'footer') return footer;

  return (
    <div className="space-y-4 text-sm pb-2">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>{language.icon ?? '💬'}</span>
          {language.domain ?? 'Language & Speech'}
        </h3>
        {childAgeDisplay && (
          <p className="text-xs text-muted-foreground mt-1">For {childAgeDisplay}</p>
        )}
        {language.reason && (
          <p className="text-xs text-muted-foreground mt-2">{language.reason}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Words to try</p>
        <p className="leading-relaxed">{language.words.join(', ')}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Conversation starters</p>
        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
          {language.conversationStarters.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Mini game</p>
        <p className="text-muted-foreground leading-relaxed">{language.miniGame}</p>
      </div>
    </div>
  );
}

export function getLanguageItem(development: DailyBriefDevelopment[]): DailyBriefDevelopment {
  return (
    development.find((d) => /language|speech/i.test(d.domain)) ?? development[0]
  );
}
