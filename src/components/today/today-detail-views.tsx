'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bookmark, Loader2, ImageIcon, ChefHat } from 'lucide-react';
import type {
  DailyBriefRecipe,
  DailyBriefPlay,
  DailyBriefStory,
  DailyBriefDevelopment,
} from '@/types/daily-brief';
import { toast } from 'sonner';
import { useStoryAudio } from '@/hooks/use-story-audio';
import { getTodayStoryAudioFetch } from '@/lib/story-audio-prefetch';
import { fetchTodayStoryIllustration, prefetchTodayStoryIllustration, warmTodayStoryIllustration } from '@/lib/story-illustration-prefetch';
import { fetchTodayRecipeIllustration, prefetchTodayRecipeIllustration, warmTodayRecipeIllustration } from '@/lib/recipe-illustration-prefetch';
import { StoryListenButton } from '@/components/story/story-listen-button';

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
  onFridgeRecipe: (ingredients: string[]) => Promise<void>;
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
  onFridgeRecipe: (ingredients: string[]) => Promise<void>;
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

export function MealDetailContent() {
  const {
    recipe,
    childAgeDisplay,
    onFridgeRecipe,
    illustrating,
    imageData,
    coverRef,
    handleIllustrate,
  } = useMealDetailContext();
  const [fridgeInput, setFridgeInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleFridgeRecipe = async () => {
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
      await onFridgeRecipe(ingredients);
      toast.success('New meal plan ready!');
    } catch {
      toast.error('Could not create meal from those ingredients.');
    } finally {
      setGenerating(false);
    }
  };

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

      <div className="bg-amber-50/80 rounded-xl p-3 space-y-2 border border-amber-100">
        <p className="text-xs font-medium text-amber-900 flex items-center gap-1.5">
          <ChefHat className="h-3.5 w-3.5" />
          What&apos;s in your fridge?
        </p>
        <p className="text-xs text-amber-800/80">
          List ingredients you have on hand — we&apos;ll suggest a child-friendly meal.
        </p>
        <Input
          value={fridgeInput}
          onChange={(e) => setFridgeInput(e.target.value)}
          placeholder="e.g. salmon, broccoli, rice"
          className="rounded-xl bg-white border-amber-200"
          disabled={generating}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleFridgeRecipe();
          }}
        />
        <Button
          size="sm"
          className="rounded-full w-full touch-target"
          disabled={generating || !fridgeInput.trim()}
          onClick={() => void handleFridgeRecipe()}
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
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Ingredients</p>
        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
          {recipe.ingredients.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Simple steps</p>
        <ol className="list-decimal pl-4 space-y-2 text-muted-foreground">
          {recipe.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
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
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Steps</p>
        <ol className="list-decimal pl-4 space-y-2 text-muted-foreground">
          {play.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
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

export function StoryDetailContent({ childAgeDisplay }: { childAgeDisplay?: string }) {
  const { story } = useStoryDetailContext();

  return (
    <div className="space-y-4 text-sm pb-2">
      <div>
        <h3 className="text-lg font-bold">{story.title}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="rounded-full">~{story.lengthMinutes} min read</Badge>
          {childAgeDisplay && (
            <Badge variant="outline" className="rounded-full">{childAgeDisplay}</Badge>
          )}
        </div>
      </div>
      {story.moral && (
        <p className="text-xs text-primary/80 bg-primary/5 rounded-xl px-3 py-2">
          Theme: {story.moral}
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
  item,
  childAgeDisplay,
  onBack,
  part = 'content',
}: {
  item: DailyBriefDevelopment;
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
          <span>{item.icon ?? '💬'}</span>
          {item.domain}
        </h3>
        {childAgeDisplay && (
          <p className="text-xs text-muted-foreground mt-1">For {childAgeDisplay}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Target words &amp; phrases</p>
        <p className="leading-relaxed">{item.tryToday}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">How to practice</p>
        <p className="text-muted-foreground leading-relaxed">{item.tryToday}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Example game</p>
        <p className="text-muted-foreground">Repeat words during everyday moments — bath time, meals, or play.</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Skill supported</p>
        <p className="text-muted-foreground">{item.domain} development</p>
      </div>
      <div className="bg-sky-50 rounded-xl p-3 text-sky-900">
        <p className="text-xs font-medium mb-1">Parent tip</p>
        <p className="text-sm leading-relaxed">{item.insight}</p>
      </div>
    </div>
  );
}

export function getLanguageItem(development: DailyBriefDevelopment[]): DailyBriefDevelopment {
  return (
    development.find((d) => /language|speech/i.test(d.domain)) ?? development[0]
  );
}
