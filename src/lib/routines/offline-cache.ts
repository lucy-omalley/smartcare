import type { VisualRoutineView } from "@/types/visual-routine";

const STORAGE_KEY = "parenfy_routines_offline_v1";

export function cacheRoutineOffline(routine: VisualRoutineView): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, VisualRoutineView> = raw ? JSON.parse(raw) : {};
    map[routine.id] = routine;
    const ids = Object.keys(map).slice(-20);
    const trimmed: Record<string, VisualRoutineView> = {};
    for (const id of ids) trimmed[id] = map[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore quota errors
  }
}

export function getOfflineRoutine(id: string): VisualRoutineView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, VisualRoutineView>;
    return map[id] ?? null;
  } catch {
    return null;
  }
}

export function listOfflineRoutines(): VisualRoutineView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, VisualRoutineView>);
  } catch {
    return [];
  }
}
