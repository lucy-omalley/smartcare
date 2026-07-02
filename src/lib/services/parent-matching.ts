export interface ConnectProfile {
  id: string;
  name: string;
  childNickname?: string | null;
  childAge?: string | null;
  parentingGoal?: string | null;
  location?: string | null;
  bio?: string | null;
  interests: string[];
  openToConnect: boolean;
}

export interface MatchResult {
  profile: ConnectProfile;
  score: number;
  reasons: string[];
  connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" | "declined";
  connectionId?: string;
  threadId?: string;
}

function cityFromLocation(location: string): string {
  return location.split(",")[0]?.trim().toLowerCase() ?? location.trim().toLowerCase();
}

function agesOverlap(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const numA = a.match(/\d+/g)?.map(Number) ?? [];
  const numB = b.match(/\d+/g)?.map(Number) ?? [];
  if (!numA.length || !numB.length) return a.toLowerCase() === b.toLowerCase();
  const minA = Math.min(...numA);
  const maxA = Math.max(...numA);
  const minB = Math.min(...numB);
  const maxB = Math.max(...numB);
  return minA <= maxB && minB <= maxA;
}

export function computeMatchScore(
  viewer: ConnectProfile,
  candidate: ConnectProfile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (viewer.location && candidate.location) {
    const viewerCity = cityFromLocation(viewer.location);
    const candidateCity = cityFromLocation(candidate.location);
    if (viewerCity === candidateCity) {
      score += 40;
      reasons.push("Same area");
    } else if (
      viewer.location.toLowerCase().includes(candidateCity) ||
      candidate.location.toLowerCase().includes(viewerCity)
    ) {
      score += 20;
      reasons.push("Nearby");
    }
  }

  if (viewer.parentingGoal && candidate.parentingGoal && viewer.parentingGoal === candidate.parentingGoal) {
    score += 25;
    reasons.push(`Both focused on ${viewer.parentingGoal.toLowerCase()}`);
  }

  if (agesOverlap(viewer.childAge, candidate.childAge)) {
    score += 20;
    reasons.push("Similar child age");
  }

  const shared = viewer.interests.filter((i) => candidate.interests.includes(i));
  if (shared.length) {
    score += Math.min(shared.length * 12, 36);
    reasons.push(`Shared: ${shared.slice(0, 3).join(", ")}`);
  }

  if (candidate.bio) score += 5;

  return { score, reasons };
}

export function matchesFilters(
  candidate: ConnectProfile,
  filters: { location?: string; interest?: string; childAge?: string }
): boolean {
  if (filters.location?.trim()) {
    const q = filters.location.trim().toLowerCase();
    if (!candidate.location?.toLowerCase().includes(q)) return false;
  }
  if (filters.interest?.trim()) {
    const q = filters.interest.trim().toLowerCase();
    const inInterests = candidate.interests.some((i) => i.toLowerCase().includes(q));
    const inGoal = candidate.parentingGoal?.toLowerCase().includes(q);
    if (!inInterests && !inGoal) return false;
  }
  if (filters.childAge?.trim()) {
    if (!agesOverlap(candidate.childAge, filters.childAge)) return false;
  }
  return true;
}
