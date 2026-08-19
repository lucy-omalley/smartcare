'use client';

export type HeroContinueKind = 'adventure' | 'story' | 'toy' | 'journey' | 'family-adventures';

export type HeroContinueItem = {
  kind: HeroContinueKind;
  title: string;
  href: string;
  emoji: string;
  label: string;
};

const KEY = 'parenfy_hero_continue';

const META: Record<HeroContinueKind, { emoji: string; label: string }> = {
  adventure: { emoji: '📋', label: 'Continue Adventure' },
  story: { emoji: '🌙', label: 'Continue Story' },
  toy: { emoji: '🧸', label: 'Continue Toy Brain' },
  journey: { emoji: '⭐', label: "Continue Today's Journey" },
  'family-adventures': { emoji: '🌈', label: 'Continue Family Adventures' },
};

export function saveHeroContinue(kind: HeroContinueKind, title: string, href: string) {
  if (typeof window === 'undefined') return;
  const meta = META[kind];
  const items = loadHeroContinueItems();
  const next: HeroContinueItem = { kind, title, href, emoji: meta.emoji, label: meta.label };
  const filtered = items.filter((i) => i.kind !== kind);
  filtered.unshift(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, 4)));
  } catch {
    /* ignore */
  }
}

export function loadHeroContinueItems(): HeroContinueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HeroContinueItem[];
  } catch {
    return [];
  }
}
