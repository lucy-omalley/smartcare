import type { WeatherError, WeatherInfo } from "@/types/daily-brief";

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

export type WeatherFetchResult = {
  weather: WeatherInfo | null;
  error?: WeatherError;
};

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "heavy rain showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with hail",
};

const RAINY_WMO_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

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

function parseLocation(location: string): { city: string; country?: string } {
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && last.length === 2 && /^[A-Za-z]{2}$/.test(last)) {
    return {
      city: parts.slice(0, -1).join(", "),
      country: last.toUpperCase(),
    };
  }
  return { city: location.trim() };
}

function wmoToOpenWeatherIcon(code: number, isDay = true): string {
  const suffix = isDay ? "d" : "n";
  if (code === 0) return `01${suffix}`;
  if (code === 1) return `02${suffix}`;
  if (code === 2) return `03${suffix}`;
  if (code === 3) return `04${suffix}`;
  if (code === 45 || code === 48) return `50${suffix}`;
  if (code >= 51 && code <= 57) return `09${suffix}`;
  if (code >= 61 && code <= 67) return `10${suffix}`;
  if (code >= 71 && code <= 77) return `13${suffix}`;
  if (code >= 80 && code <= 82) return `09${suffix}`;
  if (code >= 95) return `11${suffix}`;
  return `03${suffix}`;
}

function buildWeatherInfo(
  city: string,
  tempC: number,
  description: string,
  icon: string,
  humidity: number,
  isRainy: boolean
): WeatherInfo {
  return {
    city,
    tempC,
    description,
    icon,
    humidity,
    isRainy,
    playSuggestion: playSuggestion(description, tempC, isRainy),
  };
}

async function fetchWeatherFromOpenMeteo(location: string): Promise<WeatherFetchResult> {
  const { city, country } = parseLocation(location);
  const geoUrl = `${GEOCODING_BASE}?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
  const geoRes = await fetch(geoUrl, { next: { revalidate: 86400 } });
  if (!geoRes.ok) return { weather: null, error: "api_error" };

  const geoData = await geoRes.json();
  let results = geoData.results ?? [];
  if (country) {
    const filtered = results.filter(
      (r: { country_code?: string }) => r.country_code?.toUpperCase() === country
    );
    if (filtered.length) results = filtered;
  }

  const place = results[0];
  if (!place) return { weather: null, error: "city_not_found" };

  const forecastUrl = `${FORECAST_BASE}?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day`;
  const forecastRes = await fetch(forecastUrl, { next: { revalidate: 1800 } });
  if (!forecastRes.ok) return { weather: null, error: "api_error" };

  const forecast = await forecastRes.json();
  const code: number = forecast.current?.weather_code ?? 3;
  const isDay = forecast.current?.is_day === 1;
  const description = WMO_DESCRIPTIONS[code] ?? "variable conditions";
  const isRainy = RAINY_WMO_CODES.has(code);

  return {
    weather: buildWeatherInfo(
      place.name ?? city,
      Math.round(forecast.current?.temperature_2m ?? 15),
      description,
      wmoToOpenWeatherIcon(code, isDay),
      Math.round(forecast.current?.relative_humidity_2m ?? 0),
      isRainy
    ),
  };
}

async function fetchWeatherFromOpenWeather(
  location: string,
  apiKey: string
): Promise<WeatherFetchResult> {
  const url = `${OPENWEATHER_BASE}?q=${encodeURIComponent(location.trim())}&units=metric&appid=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 1800 } });

  if (res.status === 401) return { weather: null, error: "invalid_key" };
  if (res.status === 404) return { weather: null, error: "city_not_found" };
  if (!res.ok) return { weather: null, error: "api_error" };

  const data = await res.json();
  const description: string = data.weather?.[0]?.description ?? "clear";
  const main = data.weather?.[0]?.main?.toLowerCase() ?? "";
  const isRainy = main.includes("rain") || main.includes("drizzle") || main.includes("thunder");
  const tempC = Math.round(data.main?.temp ?? 15);

  return {
    weather: buildWeatherInfo(
      data.name ?? location,
      tempC,
      description,
      data.weather?.[0]?.icon ?? "01d",
      data.main?.humidity ?? 0,
      isRainy
    ),
  };
}

export async function fetchWeatherForLocation(location: string): Promise<WeatherFetchResult> {
  if (!location?.trim()) {
    return { weather: null };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  try {
    if (apiKey) {
      const openWeather = await fetchWeatherFromOpenWeather(location, apiKey);
      if (openWeather.weather) return openWeather;
      if (openWeather.error === "city_not_found") return openWeather;
    }

    return await fetchWeatherFromOpenMeteo(location);
  } catch {
    try {
      return await fetchWeatherFromOpenMeteo(location);
    } catch {
      return { weather: null, error: "api_error" };
    }
  }
}

export function weatherContextLine(weather: WeatherInfo): string {
  return `Today's weather in ${weather.city}: ${weather.tempC}°C, ${weather.description}. ${weather.isRainy ? "Rain expected — prefer indoor activities." : "Suitable for flexible indoor/outdoor play."}`;
}
