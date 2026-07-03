'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Square, Volume2 } from 'lucide-react';
import { unlockStoryAudio } from '@/hooks/use-story-audio';
import { cn } from '@/lib/utils';

interface StoryListenButtonProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'default';
}

/** Listen/Stop control with mobile-safe touch handling (avoids ghost double-tap). */
export function StoryListenButton({ active, onToggle, className, size = 'sm' }: StoryListenButtonProps) {
  const touchHandledRef = useRef(false);

  const handleActivate = () => {
    unlockStoryAudio();
    onToggle();
  };

  return (
    <Button
      size={size}
      variant={active ? 'default' : 'outline'}
      type="button"
      className={cn('touch-target', className)}
      onTouchStart={(e) => {
        e.stopPropagation();
        touchHandledRef.current = true;
        handleActivate();
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (touchHandledRef.current) {
          touchHandledRef.current = false;
          return;
        }
        handleActivate();
      }}
    >
      {active ? (
        <Square className="h-3.5 w-3.5 mr-1" />
      ) : (
        <Volume2 className="h-3.5 w-3.5 mr-1" />
      )}
      {active ? 'Stop' : 'Listen'}
    </Button>
  );
}
