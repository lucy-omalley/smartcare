'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyBriefPlay } from '@/types/daily-brief';
import { toast } from 'sonner';

interface PlayCardProps {
  play: DailyBriefPlay;
  onRegenerate: () => Promise<void>;
  loading?: boolean;
}

export function PlayCard({ play, onRegenerate, loading }: PlayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
      toast.success('New activity generated!');
    } catch {
      toast.error('Could not generate a new activity.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card className="rounded-2xl border-violet-200/50 bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-violet-600" />
          <CardTitle className="text-base">Today&apos;s Play</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold text-lg">{play.title}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="rounded-full text-xs">
              {play.durationMinutes} min
            </Badge>
            <Badge variant="outline" className="rounded-full text-xs capitalize">
              {play.indoorOutdoor}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {play.skillsDeveloped.map((skill) => (
            <Badge key={skill} variant="secondary" className="rounded-full text-xs font-normal">
              {skill}
            </Badge>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide details' : 'How to play'}
        </Button>
        {expanded && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Materials</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {play.materials.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Instructions</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                {play.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-xl"
          disabled={!!loading || regenerating}
          onClick={handleRegenerate}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
          Generate Another
        </Button>
      </CardContent>
    </Card>
  );
}
