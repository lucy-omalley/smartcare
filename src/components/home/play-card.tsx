'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyBriefPlay } from '@/types/daily-brief';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { toast } from 'sonner';

interface PlayCardProps {
  play: DailyBriefPlay;
  onRegenerate: () => Promise<void>;
  loading?: boolean;
  imagesLoading?: boolean;
}

export function PlayCard({ play, onRegenerate, loading, imagesLoading }: PlayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
      toast.success('New adventure ready!');
    } catch {
      toast.error('Could not generate a new activity.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <article className="visual-card animate-fade-in-up">
      <VisualCardHero
        imageData={play.imageData}
        gradientKey="play"
        emoji="🎮"
        alt={play.title}
        loading={imagesLoading}
      />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎮</span>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today&apos;s Adventure</p>
        </div>
        <h2 className="text-xl font-bold leading-tight">{play.title}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-violet-100 text-violet-900 hover:bg-violet-100 border-0">{play.durationMinutes} min</Badge>
          <Badge variant="outline" className="rounded-full capitalize">{play.indoorOutdoor}</Badge>
          {play.ageRecommendation && (
            <Badge variant="secondary" className="rounded-full">{play.ageRecommendation}</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {play.skillsDeveloped.map((skill) => (
            <Badge key={skill} variant="outline" className="rounded-full text-xs font-normal">{skill}</Badge>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full rounded-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide details' : 'How to play'}
        </Button>
        {expanded && (
          <div className="space-y-3 text-sm bg-muted/40 rounded-2xl p-4">
            <div>
              <p className="font-medium mb-1">Materials</p>
              <ul className="text-muted-foreground space-y-0.5">
                {play.materials.map((m) => <li key={m}>• {m}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Steps</p>
              <ol className="text-muted-foreground space-y-1">
                {play.instructions.map((step, i) => <li key={i}>{i + 1}. {step}</li>)}
              </ol>
            </div>
          </div>
        )}
        <Button size="sm" variant="outline" className="w-full rounded-full touch-target" disabled={!!loading || regenerating} onClick={handleRegenerate}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
          Try another adventure
        </Button>
      </div>
    </article>
  );
}
