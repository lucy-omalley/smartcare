'use client';

const illustrationCache = new Map<string, string>();
let todayGetPrefetch: Promise<string | null> | null = null;
let todayGenPrefetch: Promise<string> | null = null;

export function cacheTodayRecipeIllustration(data: string) {
  illustrationCache.set('today-recipe', data);
}

export function getCachedTodayRecipeIllustration(): string | undefined {
  return illustrationCache.get('today-recipe');
}

function normalizeIllustration(data: string): string {
  if (!data?.trim()) return data;
  if (
    data.startsWith('data:') ||
    data.startsWith('http://') ||
    data.startsWith('https://')
  ) {
    return data;
  }
  return `data:image/png;base64,${data}`;
}

/** Load cached recipe photo only — does not generate. */
export function prefetchTodayRecipeIllustration(): Promise<string | null> {
  const cached = getCachedTodayRecipeIllustration();
  if (cached) return Promise.resolve(cached);

  if (todayGetPrefetch) return todayGetPrefetch;

  todayGetPrefetch = fetch('/api/recipes/illustrate/today')
    .then(async (res) => {
      if (!res.ok) return null;
      const { imageData } = await res.json();
      const normalized = normalizeIllustration(imageData);
      cacheTodayRecipeIllustration(normalized);
      return normalized;
    })
    .catch(() => null)
    .finally(() => {
      todayGetPrefetch = null;
    });

  return todayGetPrefetch;
}

/** Start generating recipe photo in the background (when meal detail opens). */
export function warmTodayRecipeIllustration(): Promise<string | null> {
  const cached = getCachedTodayRecipeIllustration();
  if (cached) return Promise.resolve(cached);

  if (todayGenPrefetch) {
    return todayGenPrefetch.then((v) => v).catch(() => null);
  }

  todayGenPrefetch = fetch('/api/recipes/illustrate/today', { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) throw new Error('Generate failed');
      const { imageData } = await res.json();
      const normalized = normalizeIllustration(imageData);
      cacheTodayRecipeIllustration(normalized);
      return normalized;
    })
    .catch((err) => {
      todayGenPrefetch = null;
      throw err;
    });

  return todayGenPrefetch.catch(() => null);
}

export async function fetchTodayRecipeIllustration(): Promise<string> {
  const cached = getCachedTodayRecipeIllustration();
  if (cached) return cached;

  const fromGet = await prefetchTodayRecipeIllustration();
  if (fromGet) return fromGet;

  if (todayGenPrefetch) {
    try {
      return await todayGenPrefetch;
    } catch {
      todayGenPrefetch = null;
    }
  }

  const warmed = await warmTodayRecipeIllustration();
  if (warmed) return warmed;

  throw new Error('Illustration failed');
}

export function invalidateTodayRecipeIllustrationCache() {
  illustrationCache.delete('today-recipe');
  todayGetPrefetch = null;
  todayGenPrefetch = null;
}
