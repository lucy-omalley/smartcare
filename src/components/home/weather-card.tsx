'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CloudSun, MapPin } from 'lucide-react';
import type { WeatherInfo } from '@/types/daily-brief';
import { weatherIconUrl } from '@/lib/constants';
import Link from 'next/link';
import { EmptyState } from '@/components/visual/empty-state';

interface WeatherCardProps {
  weather: WeatherInfo | null;
  weatherNote?: string;
  hasLocation: boolean;
}

export function WeatherCard({ weather, weatherNote, hasLocation }: WeatherCardProps) {
  if (!hasLocation) {
    return (
      <EmptyState
        emoji="🌤️"
        title="Add your city"
        description="Get local weather and smarter play recommendations for today."
        gradientKey="default"
        actionLabel="Add location"
        actionHref="/onboarding"
      />
    );
  }

  if (!weather) {
    return (
      <div className="visual-card p-4 text-sm text-muted-foreground text-center">
        Weather unavailable — check your city in profile.
      </div>
    );
  }

  return (
    <article className="visual-card overflow-hidden">
      <div className="bg-gradient-to-r from-sky-100 via-blue-50 to-emerald-50 p-5 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={weatherIconUrl(weather.icon)} alt="" className="w-14 h-14 drop-shadow-sm" />
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-sky-800/60">Today&apos;s weather</p>
          <p className="text-xl font-bold">{weather.city} · {weather.tempC}°C</p>
          <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
        </div>
      </div>
      <div className="px-5 py-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{weatherNote || weather.playSuggestion}</p>
      </div>
    </article>
  );
}
