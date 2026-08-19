"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FamilyIllustration } from "@/components/landing/v2/ui/family-illustration";
import { useTranslation } from "@/hooks/use-translation";

type Props = {
  firstName: string;
  loading?: boolean;
  onCreateJourney: () => void;
};

/** Step 2 — first login after onboarding: one CTA only. */
export function FirstJourneyWelcome({ firstName, loading, onCreateJourney }: Props) {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-10 space-y-8">
      <FamilyIllustration className="w-48 h-48 mx-auto opacity-90" />
      <div className="space-y-3 max-w-sm">
        <p className="text-sm text-muted-foreground">{t("activation.welcomeName", { name: firstName })}</p>
        <h1 className="text-2xl font-bold tracking-tight leading-snug">
          {t("activation.firstJourneyTitle")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("activation.firstJourneySubtitle")}</p>
      </div>
      <Button
        size="lg"
        className="rounded-2xl h-14 px-10 text-base w-full max-w-xs shadow-lg shadow-primary/25"
        onClick={onCreateJourney}
        disabled={loading}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {loading ? t("activation.creatingJourney") : t("activation.createJourney")}
      </Button>
    </div>
  );
}
