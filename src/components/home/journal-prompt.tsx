'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookHeart, Sparkles } from 'lucide-react';
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
      {yesterdayMemory && (
        <Card className="rounded-2xl border-rose-200/50 bg-gradient-to-br from-rose-50/80 to-background dark:from-rose-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookHeart className="h-4 w-4 text-rose-600" />
              <CardTitle className="text-base">Yesterday&apos;s Memory</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed italic">&ldquo;{yesterdayMemory.content}&rdquo;</p>
          </CardContent>
        </Card>
      )}

      {isEvening && (
        <Card className="rounded-2xl border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-background dark:from-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-base">What made you smile today?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Jack counted to ten today..."
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button
              className="w-full rounded-xl"
              disabled={!sentence.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Saving...' : 'Save to Family Memory'}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
