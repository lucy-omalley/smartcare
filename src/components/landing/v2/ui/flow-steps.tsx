import { cn } from "@/lib/utils";
import type { FlowStep } from "@/lib/landing/v2-content";

export function FlowSteps({
  steps,
  className,
  animate = true,
}: {
  steps: FlowStep[];
  className?: string;
  animate?: boolean;
}) {
  return (
    <ol className={cn("space-y-0", className)} aria-label="Feature flow">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex flex-col items-center">
          <div
            className={cn(
              "flex items-center gap-3 w-full max-w-xs rounded-2xl border bg-background/80 backdrop-blur-sm px-4 py-3 shadow-sm",
              animate && "landing-fade-up",
              animate && `landing-delay-${Math.min(i + 1, 5)}`
            )}
          >
            {step.emoji && (
              <span className="text-2xl shrink-0" aria-hidden>
                {step.emoji}
              </span>
            )}
            <span className="text-sm font-medium text-foreground">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn("flex flex-col items-center py-1.5 text-muted-foreground", animate && "landing-pulse-soft")}
              aria-hidden
            >
              <div className="w-px h-4 bg-border" />
              <span className="text-[10px]">↓</span>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
