"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import type { LearningPlanContent } from "@/types/learning-plan";
import { trackEvent } from "@/lib/analytics";

export default function LearningPlanPage() {
  const { status } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<LearningPlanContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/learning-plan")
      .then((r) => r.json())
      .then((d) => setPlan(d.plan))
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: 25 }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        trackEvent("learning_plan_generated");
        trackEvent("premium_feature_used", { feature: "learning_plan" });
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-12">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Personalized Learning Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured activities with parent guidance — more practical than a generic chat answer.
          </p>
        </div>

        <Button className="w-full rounded-xl" onClick={generate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating…
            </>
          ) : plan ? (
            "Generate a fresh plan"
          ) : (
            "Generate my learning plan"
          )}
        </Button>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center">Loading…</p>
        ) : plan ? (
          <div className="space-y-3">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Learning objective</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{plan.learningObjective}</CardContent>
            </Card>
            {plan.activities?.map((act, i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{act.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-xs text-muted-foreground">{act.durationMinutes} min</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {act.steps?.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Parent guidance</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{plan.parentGuidance}</CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Questions to ask</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc pl-4">
                  {plan.questionsToAsk?.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
