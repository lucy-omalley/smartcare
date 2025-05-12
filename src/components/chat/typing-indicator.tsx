'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
}

export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match this with the transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "flex items-center space-x-2 p-2 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex space-x-1">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground">MumBot is typing...</span>
    </div>
  );
} 