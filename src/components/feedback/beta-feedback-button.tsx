"use client";

import { useState } from "react";
import { MessageSquare, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function BetaFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState("");
  const [confused, setConfused] = useState("");
  const [comeback, setComeback] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // TODO: Persist feedback via Supabase, Formspree, or Resend in Vercel production
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Thank you for your feedback!");
      setOpen(false);
      setLiked("");
      setConfused("");
      setComeback("");
      setRating(null);
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
              <h2 className="font-semibold">Beta Feedback</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="liked">What did you like?</Label>
                <Textarea
                  id="liked"
                  value={liked}
                  onChange={(e) => setLiked(e.target.value)}
                  placeholder="Tell us what worked well..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="confused">What confused you?</Label>
                <Textarea
                  id="confused"
                  value={confused}
                  onChange={(e) => setConfused(e.target.value)}
                  placeholder="Anything unclear or frustrating..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="comeback">What would make you come back tomorrow?</Label>
                <Textarea
                  id="comeback"
                  value={comeback}
                  onChange={(e) => setComeback(e.target.value)}
                  placeholder="One thing that would help..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Rating</Label>
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
