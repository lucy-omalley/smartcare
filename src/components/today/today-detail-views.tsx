'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Volume2, Square, Loader2, ImageIcon } from 'lucide-react';
import type {
  DailyBriefRecipe,
  DailyBriefPlay,
  DailyBriefStory,
  DailyBriefDevelopment,
} from '@/types/daily-brief';
import { toast } from 'sonner';

interface DetailActionsProps {
  onBack: () => void;
}

export function MealDetailView({
  recipe,
  childAgeDisplay,
  onSave,
  onBack,
}: {
  recipe: DailyBriefRecipe;
  childAgeDisplay?: string;
  onSave: () => Promise<void>;
  onBack: () => void;
} & DetailActionsProps) {
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-lg font-bold">{recipe.subtitle}</h3>
        {childAgeDisplay && (
          <p className="text-xs text-muted-foreground mt-1">Suitable for {childAgeDisplay}</p>
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
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1 rounded-full"
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
        <Button variant="outline" className="rounded-full" onClick={onBack}>
          Back to Today
        </Button>
      </div>
    </div>
  );
}

export function ActivityDetailView({
  play,
  onSave,
  onBack,
}: {
  play: DailyBriefPlay;
  onSave: () => Promise<void>;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4 text-sm">
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
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1 rounded-full"
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
        <Button variant="outline" className="rounded-full" onClick={onBack}>
          Back to Today
        </Button>
      </div>
    </div>
  );
}

export function StoryDetailView({
  story,
  childAgeDisplay,
  onSave,
  onBack,
}: {
  story: DailyBriefStory;
  childAgeDisplay?: string;
  onSave: (extras?: { illustrationData?: string }) => Promise<void>;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [illustrating, setIllustrating] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [illustrationData, setIllustrationData] = useState<string | undefined>(story.illustrationData);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIllustrationData(story.illustrationData);
  }, [story.illustrationData]);

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  };

  const handleNarrate = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    setNarrating(true);
    try {
      const res = await fetch('/api/stories/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: story.story, cache: false }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setIsPlaying(true);
    } catch {
      toast.error('Could not generate narration.');
    } finally {
      setNarrating(false);
    }
  };

  const handleIllustrate = async () => {
    setIllustrating(true);
    try {
      const res = await fetch('/api/stories/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: story.title, story: story.story, moral: story.moral }),
      });
      if (!res.ok) throw new Error();
      const { illustrationData: data } = await res.json();
      setIllustrationData(data);
      toast.success('Cover ready!');
    } catch {
      toast.error('Could not generate illustration.');
    } finally {
      setIllustrating(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-lg font-bold">{story.title}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="rounded-full">~{story.lengthMinutes} min read</Badge>
          {childAgeDisplay && (
            <Badge variant="outline" className="rounded-full">{childAgeDisplay}</Badge>
          )}
        </div>
      </div>
      {illustrationData && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={illustrationData} alt="" className="w-full rounded-2xl max-h-48 object-cover" />
      )}
      {story.moral && (
        <p className="text-xs text-primary/80 bg-primary/5 rounded-xl px-3 py-2">
          Theme: {story.moral}
        </p>
      )}
      <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
        Parent tip: Use a calm voice and pause for your child to react — stories build language and connection.
      </p>
      <div className="text-base leading-relaxed text-foreground whitespace-pre-line bg-muted/30 rounded-2xl p-4 max-h-[40vh] overflow-y-auto">
        {story.story}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="rounded-full" disabled={illustrating} onClick={handleIllustrate}>
          {illustrating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5 mr-1" />}
          Cover art
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" disabled={narrating && !isPlaying} onClick={handleNarrate}>
          {isPlaying ? <Square className="h-3.5 w-3.5 mr-1" /> : narrating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Volume2 className="h-3.5 w-3.5 mr-1" />}
          {isPlaying ? 'Stop' : 'Listen'}
        </Button>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1 rounded-full"
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
        <Button variant="outline" className="rounded-full" onClick={onBack}>
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
}: {
  item: DailyBriefDevelopment;
  childAgeDisplay?: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
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
      <Button variant="outline" className="w-full rounded-full" onClick={onBack}>
        Back to Today
      </Button>
    </div>
  );
}

export function getLanguageItem(development: DailyBriefDevelopment[]): DailyBriefDevelopment {
  return (
    development.find((d) => /language|speech/i.test(d.domain)) ?? development[0]
  );
}
