'use client';

const audioCache = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob>>();

export function getCachedSavedStoryAudio(storyId: string): Blob | undefined {
  return audioCache.get(storyId);
}

export function cacheSavedStoryAudio(storyId: string, blob: Blob) {
  audioCache.set(storyId, blob);
}

/** Warm narration in the background (does not block UI). */
export function prefetchSavedStoryAudio(storyId: string) {
  if (audioCache.has(storyId) || inflight.has(storyId)) {
    return inflight.get(storyId) ?? Promise.resolve(audioCache.get(storyId)!);
  }

  const task = fetch(`/api/saved/stories/${storyId}/audio`)
    .then(async (res) => {
      if (!res.ok) throw new Error('Prefetch failed');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Empty audio');
      cacheSavedStoryAudio(storyId, blob);
      return blob;
    })
    .catch((err) => {
      inflight.delete(storyId);
      throw err;
    });

  inflight.set(storyId, task);
  return task;
}

export function getSavedStoryAudioFetch(storyId: string, signal?: AbortSignal): Promise<Blob> {
  const cached = getCachedSavedStoryAudio(storyId);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(storyId);
  if (pending && !signal) return pending;

  const task = fetch(`/api/saved/stories/${storyId}/audio`, { signal })
    .then(async (res) => {
      if (!res.ok) throw new Error('Audio failed');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Empty audio');
      cacheSavedStoryAudio(storyId, blob);
      inflight.set(storyId, Promise.resolve(blob));
      return blob;
    })
    .catch((err) => {
      if (inflight.get(storyId) === task) inflight.delete(storyId);
      throw err;
    });

  inflight.set(storyId, task);
  return task;
}

export function invalidateSavedStoryAudio(storyId: string) {
  audioCache.delete(storyId);
  inflight.delete(storyId);
}

/** Prefetch audio for visible saved stories (max 3 at a time). */
export function prefetchSavedStoriesAudio(storyIds: string[]) {
  storyIds.slice(0, 3).forEach((id) => {
    prefetchSavedStoryAudio(id).catch(() => {});
  });
}
