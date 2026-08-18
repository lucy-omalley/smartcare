"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HERO_EXPERIENCES_V2, SECTIONS, THEME_STYLES } from "@/lib/landing/v2-content";
import { LANDING_MARKETING } from "@/lib/landing/marketing-images";
import { MarketingImage } from "@/components/landing/v2/ui/marketing-image";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const IMAGE_MAP = {
  toyBrain: LANDING_MARKETING.toyBrain,
  adventure: LANDING_MARKETING.adventure,
  story: LANDING_MARKETING.story,
} as const;

export function HeroExperiencesSection() {
  return (
    <LandingSection id="experiences" className="py-0 md:py-0">
      <SectionHeader
        eyebrow={SECTIONS.experiences.eyebrow}
        title={SECTIONS.experiences.title}
        description={SECTIONS.experiences.description}
        className="pt-16 md:pt-20 pb-8 md:pb-12"
      />
      <div className="space-y-0">
        {HERO_EXPERIENCES_V2.map((exp, index) => {
          const theme = THEME_STYLES[exp.theme];
          const reversed = index % 2 === 1;
          const imageSrc = IMAGE_MAP[exp.imageKey];

          return (
            <article
              key={exp.id}
              className={cn(
                "min-h-[85dvh] md:min-h-[90dvh] flex items-center py-14 md:py-20",
                "border-y md:border-x-0 md:rounded-[2.5rem] md:mb-10 last:md:mb-0",
                "bg-gradient-to-br shadow-lg ring-1",
                theme.bg,
                theme.ring,
                theme.glow
              )}
            >
              <div className="container px-4 md:px-6 max-w-6xl mx-auto w-full">
                <div
                  className={cn(
                    "grid lg:grid-cols-2 gap-10 lg:gap-16 items-center",
                    reversed && "lg:[direction:rtl]"
                  )}
                >
                  <div className={cn("space-y-6 md:space-y-8", reversed && "lg:[direction:ltr]")}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-4xl" aria-hidden>
                        {exp.emoji}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full",
                          theme.accent
                        )}
                      >
                        {exp.title}
                      </span>
                      {exp.badge && (
                        <Badge variant="secondary" className="rounded-full">
                          {exp.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight whitespace-pre-line leading-[1.1]">
                      {exp.headline}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-lg">
                      {exp.description}
                    </p>
                    <Link
                      href="/auth/register"
                      onClick={() => trackEvent("beta_cta_clicked", { location: `v2_${exp.id}` })}
                    >
                      <Button size="lg" className="rounded-2xl h-12 px-8 text-base shadow-md">
                        {exp.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className={cn("flex justify-center", reversed && "lg:[direction:ltr]")}>
                    <div className="w-full max-w-md lg:max-w-lg rounded-[1.75rem] overflow-hidden border bg-background/50 shadow-xl">
                      <MarketingImage
                        src={imageSrc}
                        alt={exp.imageAlt}
                        sizes="(max-width: 1024px) 90vw, 40vw"
                        className="landing-fade-up"
                        imageClassName="rounded-none object-cover w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </LandingSection>
  );
}
