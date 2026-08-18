"use client";

import { Star } from "lucide-react";
import { SECTIONS, TESTIMONIALS_V2 } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
      ))}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <LandingSection id="testimonials" className="bg-gradient-to-b from-muted/20 to-background">
      <SectionHeader
        eyebrow={SECTIONS.testimonials.eyebrow}
        title={SECTIONS.testimonials.title}
        description={SECTIONS.testimonials.description}
      />
      <ul className="grid md:grid-cols-3 gap-6 md:gap-8">
        {TESTIMONIALS_V2.map((t) => (
          <li
            key={t.name}
            className="rounded-[2rem] border bg-card p-8 md:p-10 shadow-md hover:shadow-lg transition-shadow space-y-5 flex flex-col min-h-[280px]"
          >
            <StarRow count={t.stars} />
            <blockquote className="text-lg md:text-xl leading-relaxed flex-1 font-medium text-foreground/90">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <footer className="pt-4 border-t border-border/60">
              <p className="font-semibold text-base">{t.name}</p>
              <p className="text-muted-foreground text-sm mt-0.5">{t.role}</p>
            </footer>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
