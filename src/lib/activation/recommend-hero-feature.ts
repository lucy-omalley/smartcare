export type HeroFeatureId = "adventure" | "toyBrain" | "familyVoice";

export type HeroRecommendation = {
  id: HeroFeatureId;
  label: string;
  benefit: string;
  href: string;
  cta: string;
  emoji: string;
  reason: string;
};

export type TimePeriod = "morning" | "afternoon" | "evening" | "night";

export function getTimePeriod(date = new Date()): TimePeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function isBedtime(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 18 || hour < 6;
}

function parseChildAgeYears(childAge?: string | null, childBirthday?: string | null): number | null {
  if (childBirthday) {
    const birth = new Date(childBirthday);
    if (!Number.isNaN(birth.getTime())) {
      const years = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return Math.floor(years);
    }
  }
  if (!childAge) return null;
  const match = childAge.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

const HERO_CATALOG: Record<
  HeroFeatureId,
  Omit<HeroRecommendation, "reason">
> = {
  adventure: {
    id: "adventure",
    label: "Adventure Routine",
    benefit: "Turn today's routine into a mini adventure your child will love.",
    href: "/adventure-journey/create",
    cta: "Create Adventure",
    emoji: "📋",
  },
  toyBrain: {
    id: "toyBrain",
    label: "Toy Brain",
    benefit: "Discover 5 new ways to play with toys you already own.",
    href: "/toy-brain/scan",
    cta: "Scan Toy",
    emoji: "🧸",
  },
  familyVoice: {
    id: "familyVoice",
    label: "Family Voice Story",
    benefit: "Generate tonight's bedtime story in a voice they know and love.",
    href: "/stories/create",
    cta: "Create Story",
    emoji: "🌙",
  },
};

/** Recommend exactly ONE hero feature — never ask the user to choose. */
export function recommendHeroFeature(input: {
  childAge?: string | null;
  childBirthday?: string | null;
  hasToyProfile?: boolean;
  now?: Date;
}): HeroRecommendation {
  const now = input.now ?? new Date();
  const age = parseChildAgeYears(input.childAge, input.childBirthday);

  if (isBedtime(now)) {
    return { ...HERO_CATALOG.familyVoice, reason: "bedtime" };
  }
  if (input.hasToyProfile) {
    return { ...HERO_CATALOG.toyBrain, reason: "toy_profile" };
  }
  if (age != null && age >= 2 && age <= 6) {
    return { ...HERO_CATALOG.adventure, reason: "age_2_6" };
  }

  const period = getTimePeriod(now);
  if (period === "afternoon") {
    return { ...HERO_CATALOG.toyBrain, reason: "time_afternoon" };
  }
  if (period === "evening") {
    return { ...HERO_CATALOG.adventure, reason: "time_evening" };
  }
  if (period === "night") {
    return { ...HERO_CATALOG.familyVoice, reason: "time_night" };
  }

  return { ...HERO_CATALOG.adventure, reason: "default_morning" };
}

/** Time-of-day primary focus for home (morning = journey first). */
export function getPrimaryFocus(period: TimePeriod): "journey" | HeroFeatureId {
  if (period === "morning") return "journey";
  if (period === "afternoon") return "toyBrain";
  if (period === "evening") return "adventure";
  return "familyVoice";
}
