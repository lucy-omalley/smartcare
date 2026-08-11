"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANNER_PATHS = ["/today", "/mumbot", "/connect", "/profile"];
const STORAGE_KEY = "parenfy_beta_banner_dismissed";

export function PublicBetaBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const showBanner = BANNER_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!showBanner || dismissed) return null;

  return (
    <div className="sticky top-0 z-30 border-b bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/5">
      <div className="container max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-foreground leading-snug">
          <span className="font-medium">Public Beta:</span> Parenfy is evolving with parent feedback.{" "}
          <button
            type="button"
            className="underline underline-offset-2 font-medium hover:text-primary"
            onClick={() => window.dispatchEvent(new CustomEvent("parenfy:open-feedback"))}
          >
            Send Feedback
          </button>
          {" · "}
          <a
            href="mailto:hello@parenfy.com"
            className="underline underline-offset-2 font-medium hover:text-primary"
          >
            hello@parenfy.com
          </a>
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Dismiss beta banner"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
