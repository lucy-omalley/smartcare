import type { WeatherInfo } from "@/types/daily-brief";

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather";

function playSuggestion(description: string, tempC: number, isRainy: boolean): string {
  if (isRainy) {
    return "Rainy day — today's play activity is perfect for staying cosy indoors.";
  }
  if (tempC >= 18 && !isRainy) {
    return "Lovely weather — consider an outdoor twist on today's play if you have a garden or park nearby.";
  }
  if (tempC < 8) {
    return "Chilly outside — indoor play is ideal today. Wrap up warm if you venture out.";
  }
  return `It's ${description.toLowerCase()} today — MumBot has matched play to suit the day.`;
}

export async function fetchWeatherForLocation(location: string): Promise<WeatherInfo | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey?.trim() || !location?.trim()) {
    return null;
  }

  try {
    const url = `${OPENWEATHER_BASE}?q=${encodeURIComponent(location.trim())}&units=metric&appid=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = await res.json();
    const description: string = data.weather?.[0]?.description ?? "clear";
    const main = data.weather?.[0]?.main?.toLowerCase() ?? "";
    const isRainy = main.includes("rain") || main.includes("drizzle") || main.includes("thunder");
    const tempC = Math.round(data.main?.temp ?? 15);

    return {
      city: data.name ?? location,
      tempC,
      description,
      icon: data.weather?.[0]?.icon ?? "01d",
      humidity: data.main?.humidity ?? 0,
      isRainy,
      playSuggestion: playSuggestion(description, tempC, isRainy),
    };
  } catch {
    return null;
  }
}

export function weatherContextLine(weather: WeatherInfo): string {
  return `Today's weather in ${weather.city}: ${weather.tempC}°C, ${weather.description}. ${weather.isRainy ? "Rain expected — prefer indoor activities." : "Suitable for flexible indoor/outdoor play."}`;
}
