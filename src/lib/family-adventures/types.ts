/** AI Family Adventures — core types */

export type AdventureCategory =
  | "museum"
  | "zoo"
  | "library"
  | "playground"
  | "nature"
  | "farm"
  | "indoor_play"
  | "community"
  | "festival";

export type IndoorOutdoor = "indoor" | "outdoor" | "either";

export interface FamilyAdventure {
  id: string;
  providerId: string;
  title: string;
  description: string;
  location: string;
  area: string;
  distanceKm: number;
  travelMinutes: number;
  priceLabel: string;
  priceCents: number;
  ageMinMonths: number;
  ageMaxMonths: number;
  ageLabel: string;
  durationMinutes: number;
  category: AdventureCategory;
  indoorOutdoor: IndoorOutdoor;
  imageEmoji: string;
  bookingUrl?: string;
  openingHours?: string;
  whatToBring: string[];
  parking?: string;
  toilets: boolean;
  babyFacilities: boolean;
  wheelchairAccess: boolean;
  rainSuitable: boolean;
  learningSkills: string[];
  followUpActivity?: string;
  interestTags: string[];
  isFree: boolean;
  mapQuery: string;
}

export interface RecommendedAdventure extends FamilyAdventure {
  matchScore: number;
  matchStars: number;
  whyRecommended: string[];
  collectionIds: string[];
}

export interface AdventureCollection {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export interface FamilyAdventuresView {
  subtitle: string;
  heroMessage: string;
  recommendationCount: number;
  weatherNote: string;
  isRainy: boolean;
  recommendations: RecommendedAdventure[];
  collections: AdventureCollection[];
  savedIds: string[];
  childName: string;
}

export interface AdventureFilters {
  maxDistanceKm?: number;
  freeOnly?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
  wheelchair?: boolean;
  babyFriendly?: boolean;
  collectionId?: string;
  maxDurationMinutes?: number;
}

export interface AdventureProviderRecord {
  id: string;
  name: string;
  adventures: FamilyAdventure[];
}
