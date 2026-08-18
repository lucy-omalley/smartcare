"use client";

import { Star } from "lucide-react";
import { TESTIMONIAL_HIGHLIGHT_STYLES } from "@/lib/landing/v2-content";
import { useLandingContent } from "@/hooks/use-landing-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";

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
  const { sections, testimonials } = useLandingContent();

  return (
    <LandingSection id="testimonials" className="bg-gradient-to-b from-muted/20 to-background">
      <SectionHeader
        eyebrow={sections.testimonials.eyebrow}
        title={sections.testimonials.title}
        description={sections.testimonials.description}
      />
      <ul className="grid md:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((item, i) => (
          <li
            key={item.name}
            className={cn(
              "rounded-[1.75rem] border bg-card p-8 md:p-9 shadow-md hover:shadow-lg transition-shadow space-y-5 flex flex-col min-h-[300px] landing-fade-up",
              `landing-delay-${Math.min(i + 1, 3)}`
            )}
          >
            <span
              className={cn(
                "self-start text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full",
                TESTIMONIAL_HIGHLIGHT_STYLES[item.highlight]
              )}
            >
              {"highlightLabel" in item && typeof item.highlightLabel === "string"
                ? item.highlightLabel
                : item.highlight}
            </span>
            <StarRow count={item.stars} />
            <blockquote className="text-lg leading-relaxed flex-1 font-medium text-foreground/90">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <footer className="pt-4 border-t border-border/60">
              <p className="font-semibold">{item.name}</p>
              <p className="text-muted-foreground text-sm mt-0.5">{item.role}</p>
            </footer>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
