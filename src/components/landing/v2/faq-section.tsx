"use client";

import Link from "next/link";
import { useLandingContent } from "@/hooks/use-landing-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";

export function FaqSectionV2() {
  const { sections, faq } = useLandingContent();

  return (
    <LandingSection id="faq">
      <SectionHeader eyebrow={sections.faq.eyebrow} title={sections.faq.title} />
      <div className="max-w-2xl mx-auto space-y-3">
        {faq.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border bg-card px-5 py-4 open:shadow-sm transition-shadow"
          >
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center gap-4 text-left">
              {item.question}
              <span
                className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none shrink-0"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-8">
        <Link href="/library/faq" className="text-primary underline underline-offset-4 hover:no-underline">
          Browse all help articles
        </Link>
      </p>
    </LandingSection>
  );
}
