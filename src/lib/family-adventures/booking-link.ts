import type { AdventureBookingLink } from "@/lib/family-adventures/types";

const DCC_EVENT_TYPE_IDS: Record<NonNullable<AdventureBookingLink["eventType"]>, string> = {
  "kids-family-fun": "184",
  "library-event": "223",
  "summer-dublin": "845",
  "free-event": "185",
  "community-event": "187",
};

const DCC_DATE_WINDOW_IDS: Record<NonNullable<AdventureBookingLink["dateWindow"]>, string> = {
  any: "1",
  today: "2",
  tomorrow: "3",
  week: "4",
  month: "5",
};

const DCC_EVENT_TYPE_LABELS: Record<NonNullable<AdventureBookingLink["eventType"]>, string> = {
  "kids-family-fun": "Kids & Family Fun",
  "library-event": "Library Event",
  "summer-dublin": "Summer Dublin",
  "free-event": "Free Event",
  "community-event": "Community Event",
};

const DCC_DATE_LABELS: Record<NonNullable<AdventureBookingLink["dateWindow"]>, string> = {
  any: "any day",
  today: "today",
  tomorrow: "tomorrow",
  week: "the next week",
  month: "the next month",
};

function buildDublinCityCouncilUrl(link: AdventureBookingLink): string {
  if (link.eventSlug) {
    return `https://www.dublincity.ie/events/${link.eventSlug.replace(/^\//, "")}`;
  }

  const params = new URLSearchParams();
  if (link.eventType) {
    params.set("type", DCC_EVENT_TYPE_IDS[link.eventType]);
  }
  if (link.dateWindow && link.dateWindow !== "any") {
    params.set("event_date_end", DCC_DATE_WINDOW_IDS[link.dateWindow]);
  }
  if (link.searchQuery?.trim()) {
    params.set("keys", link.searchQuery.trim());
  }

  const query = params.toString();
  return query ? `https://www.dublincity.ie/events?${query}` : "https://www.dublincity.ie/events";
}

function buildEventbriteUrl(link: AdventureBookingLink): string {
  const base = link.url ?? "https://www.eventbrite.ie/d/ireland--dublin/family/";
  if (!link.searchQuery?.trim()) return base;

  try {
    const url = new URL(base);
    url.searchParams.set("q", link.searchQuery.trim());
    return url.toString();
  } catch {
    return base;
  }
}

export function resolveBookingUrl(link?: AdventureBookingLink): string | undefined {
  if (!link) return undefined;

  switch (link.kind) {
    case "direct":
      return link.url;
    case "dublin-city-council":
      return buildDublinCityCouncilUrl(link);
    case "eventbrite":
      return buildEventbriteUrl(link);
    default:
      return link.url;
  }
}

export function resolveBookingLabel(link?: AdventureBookingLink, title?: string): string | undefined {
  if (!link) return undefined;
  if (link.label) return link.label;

  if (link.kind === "direct" && link.eventSlug) {
    return `View ${title ?? "event"} details`;
  }

  if (link.kind === "dublin-city-council") {
    if (link.eventSlug) {
      return `View ${title ?? "event"} on Dublin City Council`;
    }
    const parts: string[] = [];
    if (link.eventType) parts.push(DCC_EVENT_TYPE_LABELS[link.eventType]);
    if (link.dateWindow && link.dateWindow !== "any") {
      parts.push(DCC_DATE_LABELS[link.dateWindow]);
    }
    if (link.searchQuery) parts.push(`matching "${link.searchQuery}"`);
    if (parts.length === 0) return "Browse Dublin City Council events";
    return `Browse ${parts.join(" · ")}`;
  }

  if (link.kind === "eventbrite") {
    return link.searchQuery
      ? `Search Eventbrite for "${link.searchQuery}"`
      : "Browse family events on Eventbrite";
  }

  return "Book / Learn More";
}
