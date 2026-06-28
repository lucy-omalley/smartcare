'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { EmptyState } from '@/components/visual/empty-state';
import { toast } from 'sonner';

interface JournalPromptProps {
  yesterdayMemory?: { content: string } | null;
  onSubmit: (sentence: string) => Promise<void>;
}

export function JournalPrompt({ yesterdayMemory, onSubmit }: JournalPromptProps) {
  const [sentence, setSentence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hour = new Date().getHours();
  const isEvening = hour >= 17;

  const handleSubmit = async () => {
    if (!sentence.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(sentence.trim());
      setSentence('');
      toast.success('Beautiful memory saved!');
    } catch {
      toast.error('Could not save your memory.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {yesterdayMemory ? (
        <article className="visual-card animate-fade-in-up">
          <VisualCardHero gradientKey="memory" emoji="📷" alt="Yesterday's memory" aspect="square" />
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📷</span>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Yesterday&apos;s Happy Memory</p>
            </div>
            <blockquote className="text-base leading-relaxed italic text-foreground/90">
              &ldquo;{yesterdayMemory.content}&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground">Small moments become lifelong memories ❤️</p>
          </div>
        </article>
      ) : null}

      {isEvening && (
        <article className="visual-card animate-fade-in-up">
          <div className="bg-gradient-to-br from-amber-100 via-rose-50 to-pink-100 px-5 py-6">
            <span className="text-3xl">✨</span>
            <p className="font-semibold mt-2">What made you smile today?</p>
            <p className="text-sm text-muted-foreground mt-1">One sentence is all it takes.</p>
          </div>
          <div className="p-5 space-y-3">
            <Textarea
              placeholder="Jack counted to ten today..."
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              className="min-h-[80px] resize-none rounded-2xl border-0 bg-muted/50"
            />
            <Button className="w-full rounded-full touch-target" disabled={!sentence.trim() || submitting} onClick={handleSubmit}>
              {submitting ? 'Saving...' : 'Save to Family Memory'}
            </Button>
          </div>
        </article>
      )}

      {!yesterdayMemory && !isEvening && (
        <EmptyState
          emoji="📷"
          title="Your memory timeline awaits"
          description="This evening, tell MumBot what made you smile — we'll turn it into a beautiful journal entry."
          gradientKey="memory"
          actionLabel="View memories"
          actionHref="/memory"
        />
      )}
    </>
  );
}
