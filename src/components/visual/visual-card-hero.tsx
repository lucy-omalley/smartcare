'use client';

import { cn } from '@/lib/utils';
import { CATEGORY_GRADIENTS } from '@/lib/illustration-style';
import { ImageIcon } from 'lucide-react';

interface VisualCardHeroProps {
  imageData?: string | null;
  gradientKey?: keyof typeof CATEGORY_GRADIENTS | string;
  emoji?: string;
  alt: string;
  loading?: boolean;
  className?: string;
  aspect?: 'video' | 'square';
}

export function VisualCardHero({
  imageData,
  gradientKey = 'default',
  emoji,
  alt,
  loading,
  className,
  aspect = 'video',
}: VisualCardHeroProps) {
  const gradient = CATEGORY_GRADIENTS[gradientKey] ?? CATEGORY_GRADIENTS.default;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        aspect === 'video' ? 'aspect-[16/10]' : 'aspect-square',
        className
      )}
    >
      {imageData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageData}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', gradient, loading && 'animate-pulse')}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/60">
            {loading ? (
              <ImageIcon className="h-8 w-8 animate-pulse" />
            ) : (
              emoji && <span className="text-4xl drop-shadow-sm">{emoji}</span>
            )}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
