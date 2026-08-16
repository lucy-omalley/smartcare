"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { RoutinePosterView } from "@/types/routine-poster";
import { POSTER_LAYOUT_META } from "@/lib/posters/constants";
import type { PosterLayout } from "@prisma/client";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface PosterExportPanelProps {
  poster: RoutinePosterView;
  onLayoutChange: (layout: PosterLayout) => void;
  isPremium: boolean;
}

export function PosterExportPanel({ poster, onLayoutChange, isPremium }: PosterExportPanelProps) {
  const printPoster = () => {
    window.print();
    trackEvent("poster_printed", { posterId: poster.id, layout: poster.layout, method: "browser" });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Paper size</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(POSTER_LAYOUT_META) as PosterLayout[]).map((key) => {
            const meta = POSTER_LAYOUT_META[key];
            const locked = !isPremium && meta.premium;
            return (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => onLayoutChange(key)}
                className={cn(
                  "rounded-xl border p-2 text-left text-xs",
                  poster.layout === key ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                  locked && "opacity-50"
                )}
              >
                <p className="font-medium">{meta.label}</p>
                <p className="text-muted-foreground">{meta.widthMm}×{meta.heightMm}mm</p>
              </button>
            );
          })}
        </div>
      </div>

      <Button className="rounded-xl h-12 w-full" onClick={printPoster}>
        <Printer className="h-4 w-4 mr-2" /> Print now
      </Button>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Prints exactly what you see above — full emoji icons, colours, and QR code.
        Use your browser&apos;s print dialog; choose &quot;Save as PDF&quot; if you want a digital copy.
      </p>
    </div>
  );
}
