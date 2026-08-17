"use client";

export type FamilyNarratorSelection =
  | { type: "standard" }
  | { type: "family"; voiceProfileId: string };

type CachedNarration = {
  blob: Blob;
  voiceEngine: string | null;
};

function cacheKey(storyId: string, narrator: FamilyNarratorSelection): string {
  return narrator.type === "family"
    ? `${storyId}:family:${narrator.voiceProfileId}`
    : `${storyId}:standard`;
}

function audioUrl(storyId: string, narrator: FamilyNarratorSelection): string {
  if (narrator.type === "family") {
    return `/api/storytime/stories/${storyId}/audio?voiceProfileId=${encodeURIComponent(narrator.voiceProfileId)}`;
  }
  return `/api/storytime/stories/${storyId}/audio`;
}

const audioCache = new Map<string, CachedNarration>();
const inflight = new Map<string, Promise<CachedNarration>>();

async function fetchNarration(
  storyId: string,
  narrator: FamilyNarratorSelection,
  signal?: AbortSignal
): Promise<CachedNarration> {
  const res = await fetch(audioUrl(storyId, narrator), { signal, cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Could not load narration");
  }
  const blob = await res.blob();
  if (!blob.size) throw new Error("Empty audio");
  return {
    blob,
    voiceEngine: res.headers.get("X-Parenfy-Voice-Engine"),
  };
}

export function getCachedFamilyStoryAudio(
  storyId: string,
  narrator: FamilyNarratorSelection
): CachedNarration | undefined {
  return audioCache.get(cacheKey(storyId, narrator));
}

export function cacheFamilyStoryAudio(
  storyId: string,
  narrator: FamilyNarratorSelection,
  entry: CachedNarration
) {
  audioCache.set(cacheKey(storyId, narrator), entry);
}

export function invalidateFamilyStoryAudio(storyId: string) {
  for (const key of Array.from(audioCache.keys())) {
    if (key.startsWith(`${storyId}:`)) audioCache.delete(key);
  }
  for (const key of Array.from(inflight.keys())) {
    if (key.startsWith(`${storyId}:`)) inflight.delete(key);
  }
}

/** Warm narration in the background so Listen is instant when cached. */
export function prefetchFamilyStoryAudio(storyId: string, narrator: FamilyNarratorSelection) {
  const key = cacheKey(storyId, narrator);
  if (audioCache.has(key) || inflight.has(key)) {
    return inflight.get(key) ?? Promise.resolve(audioCache.get(key)!);
  }

  const task = fetchNarration(storyId, narrator)
    .then((entry) => {
      cacheFamilyStoryAudio(storyId, narrator, entry);
      return entry;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, task);
  return task;
}

export function getFamilyStoryAudioFetch(
  storyId: string,
  narrator: FamilyNarratorSelection,
  signal?: AbortSignal
): Promise<CachedNarration> {
  const key = cacheKey(storyId, narrator);
  const cached = audioCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(key);
  if (pending && !signal) return pending;

  const task = fetchNarration(storyId, narrator, signal)
    .then((entry) => {
      cacheFamilyStoryAudio(storyId, narrator, entry);
      inflight.set(key, Promise.resolve(entry));
      return entry;
    })
    .catch((err) => {
      if (inflight.get(key) === task) inflight.delete(key);
      throw err;
    });

  inflight.set(key, task);
  return task;
}
