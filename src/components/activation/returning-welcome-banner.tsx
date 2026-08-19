"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

type Props = {
  firstName: string;
  childName?: string | null;
  yesterdayCount?: number;
  onStartToday: () => void;
};

/** Step 7 — returning parent welcome. */
export function ReturningWelcomeBanner({
  firstName,
  childName,
  yesterdayCount = 0,
  onStartToday,
}: Props) {
  const { t, locale } = useTranslation();
  const child = childName?.trim() || (locale === "zh-CN" ? "孩子" : "your child");

  return (
    <section className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{t("activation.welcomeBack", { name: firstName })}</h2>
        {yesterdayCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("activation.yesterdayProgress", { name: child, count: yesterdayCount })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("activation.readyForToday")}</p>
        )}
      </div>
      <Button size="lg" className="w-full rounded-2xl h-12" onClick={onStartToday}>
        {t("activation.startToday")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
}
