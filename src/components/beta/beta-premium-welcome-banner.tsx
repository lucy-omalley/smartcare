"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STORAGE_KEY = "parenfy_beta_trial_banner_dismissed";

type TrialInfo = {
  betaTrialActive: boolean;
  daysRemaining: number;
  effectivePlanTier: string;
};

export function BetaPremiumWelcomeBanner() {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    fetch("/api/beta/trial")
      .then((r) => r.json())
      .then((data) => {
        if (data.trial?.betaTrialActive) setTrial(data.trial);
      })
      .catch(() => {});
  }, []);

  if (!trial?.betaTrialActive || dismissed) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="flex gap-3 pr-8">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm">Welcome Beta Tester!</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enjoy all Premium features free for {trial.daysRemaining} more day
            {trial.daysRemaining === 1 ? "" : "s"} — unlimited Today&apos;s Plan, AI chat,
            weekly growth reports, and personalized learning plans.
          </p>
          <p className="text-xs text-muted-foreground">Help us build Parenfy together.</p>
          <Link href="/why-parenfy" className="text-xs font-medium text-primary underline underline-offset-2">
            Why Parenfy vs ChatGPT?
          </Link>
        </div>
      </div>
    </div>
  );
}
