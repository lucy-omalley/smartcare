import type { CandidateKind, NearbyEventSignals, ParentMoodSignals } from "../types";

export type MoodBand = ParentMoodSignals["moodBand"];

export function classifyMood(feeling: string, challenge?: string | null): MoodBand {
  const text = `${feeling} ${challenge ?? ""}`.toLowerCase();
  if (/tired|exhausted|drained|wiped|burn(?:t|nt)|sleep.?dep/i.test(text)) return "low_energy";
  if (/overwhelm|stress|anxious|hard day|difficult|struggling|chaos|overloaded/i.test(text)) {
    return "stressed";
  }
  if (/energ|excited|great day|happy|playful|motivated|wired/i.test(text)) return "energized";
  if (/hopeful|okay|ok |fine|calm|steady|better|good/i.test(text)) return "positive";
  return "neutral";
}

export function moodFitRaw(
  mood: ParentMoodSignals,
  text: string,
  kind: CandidateKind
): number {
  const band = mood.moodBand;
  if (!mood.checkedInToday && band === "neutral") return 0.5;

  const lowEnergyBoost =
    /quick|simple|calm|indoor|easy|gentle|minimal|soft|comfort|one.?pan|5 min|10 min/i.test(text);
  const highEnergyBoost =
    /active|outdoor|run|dance|obstacle|nature|adventure|parade|balloon|explore/i.test(text);
  const complexPenalty = /obstacle|multi.?step|elaborate|complex|long prep|30 min/i.test(text);

  if (band === "low_energy" || band === "stressed") {
    if (kind === "recipe" && /quick|simple|minimal|comfort|finger/i.test(text)) return 0.95;
    if (kind === "activity" && lowEnergyBoost && !complexPenalty) return 0.92;
    if (kind === "story" && /calm|gentle|bedtime|quiet/i.test(text)) return 0.9;
    if (kind === "tip" && /calm|routine|simple|connection/i.test(text)) return 0.88;
    if (complexPenalty || highEnergyBoost) return 0.2;
    return 0.55;
  }

  if (band === "energized") {
    if (kind === "activity" && highEnergyBoost) return 0.95;
    if (kind === "recipe" && /energy|protein|snack/i.test(text)) return 0.8;
    if (kind === "story" && /adventure|curious|explore/i.test(text)) return 0.85;
    return 0.6;
  }

  if (band === "positive") return 0.72;
  return 0.5;
}

export function nearbyEventRaw(nearby: NearbyEventSignals, text: string): number {
  if (nearby.upcomingCount === 0 && nearby.eventTokens.length === 0) return 0.5;

  let raw = 0.5;
  const lower = text.toLowerCase();

  for (const token of nearby.eventTokens) {
    if (token.length >= 3 && lower.includes(token)) {
      raw = Math.min(1, raw + 0.18);
    }
  }

  if (nearby.hasSocialOpportunity && /social|group|playground|meet|community|share|together/i.test(lower)) {
    raw = Math.max(raw, 0.88);
  }

  if (nearby.parentsAvailableToday > 0 && /short|quick|coffee|walk|park|playdate/i.test(lower)) {
    raw = Math.max(raw, 0.78);
  }

  if (nearby.highlightEvent && nearby.highlightEvent.activityType) {
    const type = nearby.highlightEvent.activityType.toLowerCase();
    if (type.length >= 4 && lower.includes(type)) raw = Math.max(raw, 0.9);
  }

  return Math.min(1, raw);
}
