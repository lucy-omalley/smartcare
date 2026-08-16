"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
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
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);

  const downloadPdf = async () => {
    setExporting("pdf");
    try {
      const res = await fetch(`/api/posters/${poster.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${poster.title.replace(/[^a-z0-9]+/gi, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      trackEvent("poster_printed", { posterId: poster.id, layout: poster.layout });
      toast.success("PDF downloaded — ready to print!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export PDF");
    } finally {
      setExporting(null);
    }
  };

  const downloadPng = async () => {
    setExporting("png");
    try {
      const el = document.getElementById("poster-print-root");
      if (!el) throw new Error("Preview not found");
      const { toPng } = await import("html-to-image");
      const layout = POSTER_LAYOUT_META[poster.layout];
      const scale = 3;
      const dataUrl = await toPng(el, {
        pixelRatio: scale,
        cacheBust: true,
        width: layout.widthMm * 3.78 * scale,
        height: layout.heightMm * 3.78 * scale,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${poster.title.replace(/[^a-z0-9]+/gi, "-")}.png`;
      a.click();
      trackEvent("poster_downloaded", { posterId: poster.id, layout: poster.layout });
      toast.success("PNG downloaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export PNG");
    } finally {
      setExporting(null);
    }
  };

  const printPoster = () => {
    window.print();
    trackEvent("poster_printed", { posterId: poster.id, layout: poster.layout, method: "browser" });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Print layout</p>
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

      <div className="grid grid-cols-1 gap-2">
        <Button className="rounded-xl" onClick={downloadPdf} disabled={!!exporting}>
          {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Download PDF (print-ready)
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={downloadPng} disabled={!!exporting}>
          {exporting === "png" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Download PNG (high-res)
        </Button>
        <Button variant="secondary" className="rounded-xl" onClick={printPoster}>
          <Printer className="h-4 w-4 mr-2" /> Print now
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        PDF includes printer margins &amp; QR code. PNG exports at ~300 DPI equivalent.
      </p>
    </div>
  );
}
