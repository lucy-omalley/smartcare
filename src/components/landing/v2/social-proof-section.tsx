"use client";

import { Star } from "lucide-react";
import { TESTIMONIALS_V2 } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      ))}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <LandingSection className="bg-muted/20">
      <SectionHeader
        eyebrow="Social proof"
        title="Loved by beta parents"
        description="Real feedback from families shaping Parenfy with us."
      />
      <ul className="grid md:grid-cols-3 gap-5 md:gap-6">
        {TESTIMONIALS_V2.map((t) => (
          <li
            key={t.name}
            className="rounded-3xl border bg-card p-6 md:p-8 shadow-sm space-y-4 flex flex-col"
          >
            <StarRow count={t.stars} />
            <blockquote className="text-base leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</blockquote>
            <footer className="text-sm">
              <p className="font-semibold">{t.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{t.role}</p>
            </footer>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
