'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type StoryAudioStatus = 'idle' | 'loading' | 'playing';

let sharedAudioContext: AudioContext | null = null;

/** Resume audio context synchronously inside a user gesture (required on iOS). */
export function unlockStoryAudio() {
  if (typeof window === 'undefined') return;
  try {
    sharedAudioContext ??= new AudioContext();
    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume();
    }
  } catch {
    // Ignore — HTMLAudio fallback may still work.
  }
}

interface UseStoryAudioOptions {
  onError?: (message: string) => void;
  onIdle?: () => void;
}

export function useStoryAudio(options: UseStoryAudioOptions = {}) {
  const { onError, onIdle } = options;
  const [status, setStatus] = useState<StoryAudioStatus>('idle');
  const statusRef = useRef<StoryAudioStatus>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const guardRef = useRef(false);

  const setStatusSafe = useCallback((next: StoryAudioStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    releaseUrl();
    pendingUrlRef.current = null;
    setStatusSafe('idle');
    onIdle?.();
  }, [releaseUrl, setStatusSafe, onIdle]);

  useEffect(() => () => stop(), [stop]);

  const playUrl = useCallback(
    async (url: string): Promise<boolean> => {
      releaseUrl();
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        releaseUrl();
        audioRef.current = null;
        setStatusSafe('idle');
        onIdle?.();
      };

      try {
        await audio.play();
        setStatusSafe('playing');
        return true;
      } catch {
        pendingUrlRef.current = url;
        audioRef.current = null;
        setStatusSafe('idle');
        return false;
      }
    },
    [releaseUrl, setStatusSafe]
  );

  const toggle = useCallback(
    async (loadBlob: (signal: AbortSignal) => Promise<Blob>) => {
      unlockStoryAudio();

      if (guardRef.current) return;
      guardRef.current = true;
      requestAnimationFrame(() => {
        guardRef.current = false;
      });

      if (statusRef.current === 'playing' || statusRef.current === 'loading') {
        stop();
        return;
      }

      if (pendingUrlRef.current) {
        const ok = await playUrl(pendingUrlRef.current);
        pendingUrlRef.current = null;
        if (!ok) onError?.('Tap Listen again to start playback.');
        return;
      }

      setStatusSafe('loading');
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const blob = await loadBlob(controller.signal);
        if (controller.signal.aborted) {
          setStatusSafe('idle');
          return;
        }

        const url = URL.createObjectURL(blob);
        const ok = await playUrl(url);
        if (!ok) {
          onError?.('Tap Listen again to start playback.');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        onError?.('Could not play narration.');
        setStatusSafe('idle');
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [onError, playUrl, setStatusSafe, stop]
  );

  const isActive = status === 'loading' || status === 'playing';

  return {
    status,
    isActive,
    isLoading: status === 'loading',
    isPlaying: status === 'playing',
    toggle,
    stop,
    unlock: unlockStoryAudio,
  };
}
