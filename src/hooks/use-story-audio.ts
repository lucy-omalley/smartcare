'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type StoryAudioStatus = 'idle' | 'loading' | 'playing';

/** Minimal silent MP3 used to unlock mobile audio playback. */
const SILENT_MP3 =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjQ5AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNbtV0AAAAAAAAAAAAAAAAAAAAAP/+1DEAAAGAAGn9AAAIAAANIAAAAQAAAGkAAAAIAAANIAAAARMQU1FMy4xMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQxAAACAAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAIAAGf9AAACAAADSAAAAEAAABpAAAACAAADSAAAAA=';

interface UseStoryAudioOptions {
  onError?: (message: string) => void;
  onIdle?: () => void;
}

export function unlockStoryAudio() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    primeHtmlAudio();
  } catch {
    // Ignore — playback may still work on desktop.
  }
}

function getOrCreateAudioContext(): AudioContext {
  const w = window as Window & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) throw new Error('AudioContext unavailable');
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new Ctx();
  }
  return sharedAudioContext as AudioContext;
}

let sharedAudioContext: AudioContext | null = null;
let primedAudio: HTMLAudioElement | null = null;

function primeHtmlAudio() {
  if (primedAudio) return;
  const audio = new Audio(SILENT_MP3);
  audio.volume = 0.01;
  audio.preload = 'auto';
  primedAudio = audio;
  void audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {
    // Expected on some browsers until a later user gesture.
  });
}

export function useStoryAudio(options: UseStoryAudioOptions = {}) {
  const onErrorRef = useRef(options.onError);
  const onIdleRef = useRef(options.onIdle);
  onErrorRef.current = options.onError;
  onIdleRef.current = options.onIdle;

  const [status, setStatus] = useState<StoryAudioStatus>('idle');
  const statusRef = useRef<StoryAudioStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const loadStartedAtRef = useRef(0);
  const sessionRef = useRef(0);

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
    sessionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped.
      }
      sourceRef.current = null;
    }

    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
      htmlAudioRef.current.currentTime = 0;
    }

    releaseUrl();
    setStatusSafe('idle');
    onIdleRef.current?.();
  }, [releaseUrl, setStatusSafe]);

  useEffect(() => () => stop(), [stop]);

  const playBlob = useCallback(
    async (blob: Blob, session: number): Promise<boolean> => {
      if (session !== sessionRef.current) return false;

      if (!blob.size) {
        onErrorRef.current?.('No audio received.');
        return false;
      }

      unlockStoryAudio();
      const arrayBuffer = await blob.arrayBuffer();
      if (session !== sessionRef.current) return false;

      // Prefer Web Audio — works after async fetch once context was unlocked on tap.
      try {
        const ctx = getOrCreateAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        if (session !== sessionRef.current) return false;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          if (session !== sessionRef.current) return;
          sourceRef.current = null;
          setStatusSafe('idle');
          onIdleRef.current?.();
        };
        sourceRef.current = source;
        source.start(0);
        setStatusSafe('playing');
        return true;
      } catch {
        // Fall back to HTMLAudio below.
      }

      releaseUrl();
      const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mpeg' }));
      urlRef.current = url;

      const audio = htmlAudioRef.current ?? new Audio();
      htmlAudioRef.current = audio;
      audio.src = url;
      audio.onended = () => {
        if (session !== sessionRef.current) return;
        releaseUrl();
        setStatusSafe('idle');
        onIdleRef.current?.();
      };

      try {
        await audio.play();
        if (session !== sessionRef.current) {
          audio.pause();
          return false;
        }
        setStatusSafe('playing');
        return true;
      } catch {
        onErrorRef.current?.('Tap Listen again to start playback.');
        setStatusSafe('idle');
        return false;
      }
    },
    [releaseUrl, setStatusSafe]
  );

  const toggle = useCallback(
    async (loadBlob: (signal: AbortSignal) => Promise<Blob>) => {
      unlockStoryAudio();

      if (statusRef.current === 'playing') {
        stop();
        return;
      }

      if (statusRef.current === 'loading') {
        // Ignore ghost duplicate taps right after starting.
        if (Date.now() - loadStartedAtRef.current < 700) return;
        stop();
        return;
      }

      const session = sessionRef.current + 1;
      sessionRef.current = session;
      loadStartedAtRef.current = Date.now();
      setStatusSafe('loading');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const blob = await loadBlob(controller.signal);
        if (controller.signal.aborted || session !== sessionRef.current) {
          setStatusSafe('idle');
          return;
        }

        await playBlob(blob, session);
      } catch (err) {
        if (session !== sessionRef.current) return;
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStatusSafe('idle');
          return;
        }
        onErrorRef.current?.('Could not play narration.');
        setStatusSafe('idle');
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [playBlob, setStatusSafe, stop]
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
