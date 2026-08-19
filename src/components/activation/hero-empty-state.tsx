"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  emoji: string;
  title: string;
  message: string;
  cta: string;
  href: string;
  className?: string;
};

/** Activation-focused empty state for hero feature hubs. */
export function HeroEmptyState({ emoji, title, message, cta, href, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-dashed bg-muted/30 p-8 text-center space-y-4",
        className
      )}
    >
      <span className="text-5xl block" aria-hidden>
        {emoji}
      </span>
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{message}</p>
      </div>
      <Button asChild size="lg" className="rounded-2xl h-12 px-8">
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
