'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, ChevronDown, ChevronUp, ImageIcon, Volume2, Square, Loader2 } from 'lucide-react';
import type { DailyBriefStory } from '@/types/daily-brief';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { toast } from 'sonner';

interface StoryCardProps {
  story: DailyBriefStory;
  onSave: (extras?: { illustrationData?: string }) => Promise<void>;
  imagesLoading?: boolean;
}

export function StoryCard({ story, onSave, imagesLoading }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [illustrating, setIllustrating] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [illustrationData, setIllustrationData] = useState<string | undefined>(story.illustrationData);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ illustrationData });
      toast.success('Story saved to favourites!');
    } catch {
      toast.error('Could not save story.');
    } finally {
      setSaving(false);
    }
  };

  const handleIllustrate = async () => {
    setIllustrating(true);
    try {
      const res = await fetch('/api/stories/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: story.title, story: story.story }),
      });
      if (!res.ok) throw new Error();
      const { illustrationData: data } = await res.json();
      setIllustrationData(data);
      toast.success('Cover illustration ready!');
    } catch {
      toast.error('Could not generate illustration.');
    } finally {
      setIllustrating(false);
    }
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  };

  const handleNarrate = async () => {
    if (isPlaying) { stopAudio(); return; }
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
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url); };
      await audio.play();
      setIsPlaying(true);
    } catch {
      toast.error('Could not generate narration.');
    } finally {
      setNarrating(false);
    }
  };

  return (
    <article className="visual-card animate-fade-in-up">
      <VisualCardHero
        imageData={illustrationData}
        gradientKey="story"
        emoji="📚"
        alt={story.title}
        loading={imagesLoading && !illustrationData}
      />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📚</span>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tonight&apos;s Story</p>
        </div>
        <h2 className="text-xl font-bold leading-tight">{story.title}</h2>
        <Badge variant="secondary" className="rounded-full">~{story.lengthMinutes} min read</Badge>
        <Button variant="ghost" size="sm" className="w-full rounded-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide story' : 'Read story'}
        </Button>
        {expanded && (
          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line bg-muted/40 rounded-2xl p-4">
            {story.story}
            {story.moral && <p className="mt-3 text-xs italic text-primary/80">✨ {story.moral}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="rounded-full touch-target" disabled={illustrating} onClick={handleIllustrate}>
            {illustrating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5 mr-1" />}
            {illustrationData ? 'New cover' : 'Illustrate'}
          </Button>
          <Button size="sm" variant="outline" className="rounded-full touch-target" disabled={narrating && !isPlaying} onClick={handleNarrate}>
            {isPlaying ? <Square className="h-3.5 w-3.5 mr-1" /> : narrating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Volume2 className="h-3.5 w-3.5 mr-1" />}
            {isPlaying ? 'Stop' : 'Listen'}
          </Button>
        </div>
        <Button size="sm" className="w-full rounded-full touch-target" disabled={saving} onClick={handleSave}>
          <Bookmark className="h-3.5 w-3.5 mr-1" /> Save favourite
        </Button>
      </div>
    </article>
  );
}
