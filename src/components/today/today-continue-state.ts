'use client';

export type ContinueDetailType = 'meal' | 'activity' | 'story' | 'language' | 'milestone' | 'parentTip';

export type ContinueState = {
  type: ContinueDetailType;
  title: string;
  label: string;
  emoji: string;
  savedAt: string;
};

const STORAGE_KEY = 'parenfy_continue_state';

const DETAIL_META: Record<
  ContinueDetailType,
  { label: string; emoji: string; cta: string }
> = {
  meal: { label: 'Meal', emoji: '🍎', cta: 'Continue meal' },
  activity: { label: 'Activity', emoji: '🎨', cta: 'Continue activity' },
  story: { label: 'Story', emoji: '📖', cta: 'Continue story' },
  language: { label: 'Language', emoji: '💬', cta: 'Continue learning' },
  milestone: { label: 'Milestone', emoji: '🌱', cta: 'View milestone' },
  parentTip: { label: 'Parent tip', emoji: '💡', cta: 'Read tip' },
};

export function saveContinueState(type: ContinueDetailType, title: string) {
  if (typeof window === 'undefined') return;
  const meta = DETAIL_META[type];
  const state: ContinueState = {
    type,
    title,
    label: meta.label,
    emoji: meta.emoji,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function loadContinueState(): ContinueState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as ContinueState;
    const saved = new Date(state.savedAt);
    const now = new Date();
    if (
      saved.getFullYear() !== now.getFullYear() ||
      saved.getMonth() !== now.getMonth() ||
      saved.getDate() !== now.getDate()
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function getContinueCta(type: ContinueDetailType): string {
  return DETAIL_META[type].cta;
}
