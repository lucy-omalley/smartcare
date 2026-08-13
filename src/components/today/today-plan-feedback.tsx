"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "parenfy_today_feedback_submitted";

type Props = {
  onSubmitted?: () => void;
};

export function TodayPlanFeedbackWidget({ onSubmitted }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (hidden) return null;

  if (done) {
    return (
      <Card className="rounded-2xl bg-muted/40">
        <CardContent className="p-4 text-sm text-center text-muted-foreground">
          Thanks — your feedback helps shape Parenfy.
        </CardContent>
      </Card>
    );
  }

  async function submit(selectedRating: number) {
    setRating(selectedRating);
    if (selectedRating === 1 && !comment.trim()) {
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/today/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      localStorage.setItem(STORAGE_KEY, "1");
      trackEvent("today_plan_feedback", { rating: selectedRating });
      setDone(true);
      onSubmitted?.();
    } catch {
      setSending(false);
    }
  }

  return (
    <Card className="rounded-2xl border-dashed">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium text-center">Was today&apos;s plan useful?</p>
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant={rating === 3 ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            disabled={sending}
            onClick={() => submit(3)}
          >
            😀 Very Helpful
          </Button>
          <Button
            type="button"
            variant={rating === 2 ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            disabled={sending}
            onClick={() => submit(2)}
          >
            😐 Okay
          </Button>
          <Button
            type="button"
            variant={rating === 1 ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            disabled={sending}
            onClick={() => setRating(1)}
          >
            🙁 Not Helpful
          </Button>
        </div>
        {rating === 1 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">What could make this better?</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you needed..."
              className="min-h-[72px] text-sm"
            />
            <Button className="w-full rounded-xl" disabled={sending || !comment.trim()} onClick={() => submit(1)}>
              Send feedback
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
