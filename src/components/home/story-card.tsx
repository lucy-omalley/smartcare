'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyBriefStory } from '@/types/daily-brief';
import { toast } from 'sonner';

interface StoryCardProps {
  story: DailyBriefStory;
  onSave: () => Promise<void>;
}

export function StoryCard({ story, onSave }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      toast.success('Story saved to favourites!');
    } catch {
      toast.error('Could not save story.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-indigo-200/50 bg-gradient-to-br from-indigo-50/80 to-background dark:from-indigo-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          <CardTitle className="text-base">Bedtime Story Tonight</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold">{story.title}</p>
          <Badge variant="secondary" className="mt-2 rounded-full text-xs">
            ~{story.lengthMinutes} min read
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide story' : 'Read story'}
        </Button>
        {expanded && (
          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line bg-background/60 rounded-xl p-4">
            {story.story}
            {story.moral && (
              <p className="mt-3 text-xs italic text-primary/80">✨ {story.moral}</p>
            )}
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-xl"
          disabled={saving}
          onClick={handleSave}
        >
          <Bookmark className="h-3.5 w-3.5 mr-1" />
          Save Story
        </Button>
      </CardContent>
    </Card>
  );
}
