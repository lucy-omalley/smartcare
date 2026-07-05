"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobile|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export function BetaFeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [enjoyed, setEnjoyed] = useState("");
  const [confused, setConfused] = useState("");
  const [improve, setImprove] = useState("");
  const [recommend, setRecommend] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("parenfy:open-feedback", handler);
    return () => window.removeEventListener("parenfy:open-feedback", handler);
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enjoyed,
          confused,
          improve,
          recommend,
          rating,
          page: pathname,
          deviceType: getDeviceType(),
          appVersion: "public-beta",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      trackEvent("feedback_submitted", {
        rating,
        page: pathname,
        has_recommend: Boolean(recommend.trim()),
      });
      if (rating !== null && rating >= 4) trackEvent("mumbot_feedback_positive", { rating });
      if (rating !== null && rating <= 2) trackEvent("mumbot_feedback_negative", { rating });

      toast.success("Thank you — your feedback helps us improve!");
      setOpen(false);
      setEnjoyed("");
      setConfused("");
      setImprove("");
      setRecommend("");
      setRating(null);
    } catch {
      toast.error("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        aria-label="Beta feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Public Beta Feedback</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                We do not capture child names, private notes, or MumBot conversation text.
              </p>
              <div>
                <Label htmlFor="enjoyed">What did you like?</Label>
                <Textarea
                  id="enjoyed"
                  value={enjoyed}
                  onChange={(e) => setEnjoyed(e.target.value)}
                  placeholder="What felt helpful or delightful..."
                  className="mt-1"
                  data-ph-mask
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="confused">What confused you?</Label>
                <Textarea
                  id="confused"
                  value={confused}
                  onChange={(e) => setConfused(e.target.value)}
                  placeholder="Anything unclear..."
                  className="mt-1"
                  data-ph-mask
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="improve">What should we improve?</Label>
                <Textarea
                  id="improve"
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  placeholder="One thing we could do better..."
                  className="mt-1"
                  data-ph-mask
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="recommend">Would you recommend Parenfy?</Label>
                <Textarea
                  id="recommend"
                  value={recommend}
                  onChange={(e) => setRecommend(e.target.value)}
                  placeholder="Yes / Maybe / Not yet — and why..."
                  className="mt-1"
                  data-ph-mask
                  rows={2}
                />
              </div>
              <div>
                <Label>Rating (1–5)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        rating === n ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Star className={cn("h-6 w-6", rating !== null && n <= rating && "fill-primary")} />
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={handleSubmit}
                disabled={submitting || rating === null}
              >
                {submitting ? "Sending..." : "Send feedback"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
