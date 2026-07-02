'use client';

import { Button } from '@/components/ui/button';
import type { WeatherError, WeatherInfo } from '@/types/daily-brief';
import { weatherIconUrl } from '@/lib/constants';
import Link from 'next/link';
import { EmptyState } from '@/components/visual/empty-state';

interface WeatherCardProps {
  weather: WeatherInfo | null;
  weatherNote?: string;
  hasLocation: boolean;
  weatherError?: WeatherError;
}

const WEATHER_ERROR_MESSAGES: Record<WeatherError, string> = {
  city_not_found: "We couldn't find that city. Try a format like Dublin or Dublin, IE in your profile.",
  invalid_key: "Couldn't load weather for your city right now.",
  missing_key: "Couldn't load weather for your city right now.",
  api_error: "Couldn't load weather right now. Please try again later.",
};

export function WeatherCard({ weather, weatherNote, hasLocation, weatherError }: WeatherCardProps) {
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
    const message = weatherError
      ? WEATHER_ERROR_MESSAGES[weatherError]
      : "Weather unavailable — check your city in profile.";

    return (
      <div className="visual-card p-4 text-sm text-muted-foreground text-center space-y-2">
        <p>{message}</p>
        {weatherError === 'city_not_found' && (
          <Link href="/onboarding">
            <Button variant="link" className="text-primary text-sm h-auto p-0">
              Update city in profile
            </Button>
          </Link>
        )}
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
