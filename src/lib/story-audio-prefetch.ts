'use client';

const blobCache = new Map<string, Blob>();
let todayPrefetch: Promise<Blob> | null = null;

export function cacheStoryBlob(key: string, blob: Blob) {
  blobCache.set(key, blob);
}

export function getCachedStoryBlob(key: string): Blob | undefined {
  return blobCache.get(key);
}

/** Start generating today's narration in the background while the user browses Today. */
export function prefetchTodayStoryAudio() {
  if (todayPrefetch) return todayPrefetch;

  todayPrefetch = fetch('/api/stories/narrate/today')
    .then(async (res) => {
      if (!res.ok) throw new Error('Prefetch failed');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Empty audio');
      cacheStoryBlob('today', blob);
      return blob;
    })
    .catch((err) => {
      todayPrefetch = null;
      throw err;
    });

  return todayPrefetch;
}

export function getTodayStoryAudioFetch(signal?: AbortSignal): Promise<Blob> {
  const cached = getCachedStoryBlob('today');
  if (cached) return Promise.resolve(cached);

  if (todayPrefetch && !signal) {
    return todayPrefetch;
  }

  return fetch('/api/stories/narrate/today', { signal })
    .then(async (res) => {
      if (!res.ok) throw new Error('Narration failed');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Empty audio');
      cacheStoryBlob('today', blob);
      todayPrefetch = Promise.resolve(blob);
      return blob;
    });
}

export function invalidateTodayStoryAudioCache() {
  blobCache.delete('today');
  todayPrefetch = null;
}
