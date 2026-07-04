'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HeartHandshake, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface ParentCheckInCardProps {
  onSubmit: (data: { feeling: string; win: string; challenge: string }) => Promise<{ encouragement?: string }>;
}

export function ParentCheckInCard({ onSubmit }: ParentCheckInCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [feeling, setFeeling] = useState('');
  const [win, setWin] = useState('');
  const [challenge, setChallenge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [encouragement, setEncouragement] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!feeling.trim()) {
      toast.error('How are you feeling today?');
      return;
    }
    trackEvent('parent_checkin_started');
    setSubmitting(true);
    try {
      const result = await onSubmit({
        feeling: feeling.trim(),
        win: win.trim(),
        challenge: challenge.trim(),
      });
      trackEvent('parent_checkin_completed');
      setEncouragement(result.encouragement ?? "You're doing a wonderful job. Small steps count.");
      setFeeling('');
      setWin('');
      setChallenge('');
      toast.success('Check-in saved');
    } catch {
      toast.error('Could not save check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="visual-card overflow-hidden">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <HeartHandshake className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Parent Check-in</p>
            <p className="text-xs text-muted-foreground">How are you feeling today?</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          <div>
            <Label htmlFor="feeling" className="text-xs">How are you feeling today?</Label>
            <Input
              id="feeling"
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder="Tired but hopeful..."
              className="mt-1 rounded-xl"
              data-ph-mask
            />
          </div>
          <div>
            <Label htmlFor="win" className="text-xs">Today&apos;s win <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="win"
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder="We got out for a walk..."
              className="mt-1 rounded-xl"
              data-ph-mask
            />
          </div>
          <div>
            <Label htmlFor="challenge" className="text-xs">Today&apos;s challenge <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="challenge"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="Bedtime was tough..."
              className="mt-1 rounded-xl resize-none"
              rows={2}
              data-ph-mask
            />
          </div>
          <Button
            className="w-full rounded-full"
            disabled={submitting || !feeling.trim()}
            onClick={handleSubmit}
          >
            {submitting ? 'Saving...' : 'Complete check-in'}
          </Button>
          {encouragement && (
            <p className="text-sm text-muted-foreground bg-primary/5 rounded-xl p-3 leading-relaxed">
              💛 {encouragement}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
