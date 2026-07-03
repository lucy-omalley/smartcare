'use client';

const illustrationCache = new Map<string, string>();
let todayGetPrefetch: Promise<string | null> | null = null;
let todayGenPrefetch: Promise<string> | null = null;

export function cacheTodayIllustration(data: string) {
  illustrationCache.set('today', data);
}

export function getCachedTodayIllustration(): string | undefined {
  return illustrationCache.get('today');
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

/** Load cached cover art only — does not generate. */
export function prefetchTodayStoryIllustration(): Promise<string | null> {
  const cached = getCachedTodayIllustration();
  if (cached) return Promise.resolve(cached);

  if (todayGetPrefetch) return todayGetPrefetch;

  todayGetPrefetch = fetch('/api/stories/illustrate/today')
    .then(async (res) => {
      if (!res.ok) return null;
      const { illustrationData } = await res.json();
      const normalized = normalizeIllustration(illustrationData);
      cacheTodayIllustration(normalized);
      return normalized;
    })
    .catch(() => null)
    .finally(() => {
      todayGetPrefetch = null;
    });

  return todayGetPrefetch;
}

/** Start generating cover art in the background (when story detail opens). */
export function warmTodayStoryIllustration(): Promise<string | null> {
  const cached = getCachedTodayIllustration();
  if (cached) return Promise.resolve(cached);

  if (todayGenPrefetch) {
    return todayGenPrefetch.then((v) => v).catch(() => null);
  }

  todayGenPrefetch = fetch('/api/stories/illustrate/today', { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) throw new Error('Generate failed');
      const { illustrationData } = await res.json();
      const normalized = normalizeIllustration(illustrationData);
      cacheTodayIllustration(normalized);
      return normalized;
    })
    .catch((err) => {
      todayGenPrefetch = null;
      throw err;
    });

  return todayGenPrefetch.catch(() => null);
}

export async function fetchTodayStoryIllustration(): Promise<string> {
  const cached = getCachedTodayIllustration();
  if (cached) return cached;

  const fromGet = await prefetchTodayStoryIllustration();
  if (fromGet) return fromGet;

  if (todayGenPrefetch) {
    try {
      return await todayGenPrefetch;
    } catch {
      todayGenPrefetch = null;
    }
  }

  const warmed = await warmTodayStoryIllustration();
  if (warmed) return warmed;

  throw new Error('Illustration failed');
}

export function invalidateTodayStoryIllustrationCache() {
  illustrationCache.delete('today');
  todayGetPrefetch = null;
  todayGenPrefetch = null;
}
