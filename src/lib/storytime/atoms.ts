import { atom } from "jotai";

export type NarratorSelection =
  | { type: "standard" }
  | { type: "family"; voiceProfileId: string };

export const narratorSelectionAtom = atom<NarratorSelection>({ type: "standard" });
export const bedtimeModeAtom = atom(false);
export const sleepTimerMinutesAtom = atom<number | null>(null);
