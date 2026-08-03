'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const QUICK_VISIBLE = 4;

interface ExpandableStepListProps {
  steps: string[];
  detailedSteps?: string[];
  quickLabel?: string;
  fullLabel?: string;
  className?: string;
}

export function ExpandableStepList({
  steps,
  detailedSteps,
  quickLabel = 'Quick steps',
  fullLabel = 'Full step-by-step guide',
  className,
}: ExpandableStepListProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetailedGuide = Boolean(detailedSteps?.length);
  const hasOverflow = !hasDetailedGuide && steps.length > QUICK_VISIBLE;
  const showToggle = hasDetailedGuide || hasOverflow;

  const visibleQuickSteps = hasDetailedGuide
    ? steps
    : hasOverflow && !expanded
      ? steps.slice(0, QUICK_VISIBLE)
      : steps;

  const fullSteps = hasDetailedGuide ? detailedSteps! : steps.slice(QUICK_VISIBLE);

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{quickLabel}</p>
      <ol className="list-decimal pl-4 space-y-2 text-muted-foreground">
        {visibleQuickSteps.map((step, i) => (
          <li key={`quick-${i}`}>{step}</li>
        ))}
      </ol>

      {showToggle && (
        <>
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show less' : 'Read full steps'}
          </button>

          {expanded && fullSteps.length > 0 && (
            <div className="rounded-xl bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">{fullLabel}</p>
              <ol className="list-decimal pl-4 space-y-2 text-muted-foreground">
                {fullSteps.map((step, i) => (
                  <li key={`full-${i}`}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
