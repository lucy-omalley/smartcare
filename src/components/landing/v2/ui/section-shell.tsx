import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function LandingSection({
  id,
  children,
  className,
  containerClassName,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28 md:scroll-mt-24 lg:scroll-mt-20 py-16 md:py-24 lg:py-28", className)}>
      <div className={cn("container px-4 md:px-6 max-w-6xl mx-auto", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("text-center max-w-3xl mx-auto space-y-4 mb-12 md:mb-16", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed text-balance">
          {description}
        </p>
      )}
    </header>
  );
}
