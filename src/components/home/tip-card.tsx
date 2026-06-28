'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import type { DailyBriefTip } from '@/types/daily-brief';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { toast } from 'sonner';

interface TipCardProps {
  tip: DailyBriefTip;
  imagesLoading?: boolean;
}

export function TipCard({ tip, imagesLoading }: TipCardProps) {
  const handleShare = async () => {
    const text = `${tip.topic}: ${tip.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Parenting tip from MumBot', text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Tip copied!');
    }
  };

  return (
    <article className="visual-card animate-fade-in-up">
      <VisualCardHero
        imageData={tip.imageData}
        gradientKey="tip"
        emoji="❤️"
        alt={tip.topic}
        loading={imagesLoading}
        aspect="square"
      />
      <div className="p-5 space-y-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">❤️</span>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Parenting Tip</p>
        </div>
        <Badge variant="secondary" className="rounded-full">{tip.topic}</Badge>
        <blockquote className="text-lg font-medium leading-relaxed text-foreground/90 italic">
          &ldquo;{tip.content}&rdquo;
        </blockquote>
        <Button variant="outline" size="sm" className="rounded-full" onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5 mr-1" /> Share
        </Button>
      </div>
    </article>
  );
}
