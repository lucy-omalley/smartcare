'use client';

import type { DailyBriefDevelopment } from '@/types/daily-brief';
import { VisualCardHero } from '@/components/visual/visual-card-hero';

interface DevelopmentCardProps {
  items: DailyBriefDevelopment[];
  developmentImage?: string;
  imagesLoading?: boolean;
}

export function DevelopmentCard({ items, developmentImage, imagesLoading }: DevelopmentCardProps) {
  const featured = items[0];

  return (
    <article className="visual-card animate-fade-in-up">
      <VisualCardHero
        imageData={developmentImage}
        gradientKey="development"
        emoji="🧠"
        alt="Development focus"
        loading={imagesLoading}
      />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today&apos;s Growth Moment</p>
        </div>
        {items.map((item) => (
          <div key={item.domain} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.icon ?? '✨'}</span>
              <p className="font-semibold">{item.domain}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.insight}</p>
            {item === featured && (
              <p className="text-sm bg-sky-50 text-sky-900 rounded-2xl px-4 py-3 leading-relaxed border border-sky-100">
                <span className="font-medium">Try today: </span>{item.tryToday}
              </p>
            )}
          </div>
        ))}
        {items.length > 1 && (
          <div className="pt-2 space-y-3 border-t border-border/50">
            {items.slice(1).map((item) => (
              <div key={item.domain} className="text-sm">
                <p className="font-medium flex items-center gap-1.5">{item.icon} {item.domain}</p>
                <p className="text-muted-foreground mt-0.5">{item.tryToday}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
