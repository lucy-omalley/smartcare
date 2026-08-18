"use client";

import Link from "next/link";
import { SECTIONS, SUPPORTING_FEATURES } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";

export function SupportingFeaturesSection() {
  return (
    <LandingSection className="py-12 md:py-16 bg-muted/5">
      <SectionHeader
        eyebrow={SECTIONS.supporting.eyebrow}
        title={SECTIONS.supporting.title}
        description={SECTIONS.supporting.description}
        className="mb-8 md:mb-10"
      />
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 md:gap-3 max-w-3xl mx-auto opacity-90">
        {SUPPORTING_FEATURES.map(({ icon: Icon, label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="group flex items-center gap-2.5 p-3 md:p-3.5 rounded-xl border border-border/60 bg-background/40 hover:bg-background/80 hover:border-border transition-all h-full"
            >
              <Icon
                className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors shrink-0"
                aria-hidden
              />
              <span className="text-xs md:text-sm font-medium leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
