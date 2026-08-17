"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SUPPORTING_FEATURES } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";

export function SupportingFeaturesSection() {
  return (
    <LandingSection className="bg-muted/15">
      <SectionHeader
        eyebrow="And more"
        title="Everything else you need"
        description="Supporting tools that stay out of the way — until you need them."
      />
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
        {SUPPORTING_FEATURES.map(({ icon: Icon, label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="group flex flex-col gap-2 p-4 rounded-2xl border bg-background/60 hover:bg-background hover:border-primary/20 hover:shadow-sm transition-all h-full"
            >
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden />
              <span className="text-sm font-medium leading-snug flex-1">{label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
