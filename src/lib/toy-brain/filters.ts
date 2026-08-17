import type { ActivityFilter, ToyPlayActivity } from "@/types/toy-brain";

export function filterActivities(
  activities: ToyPlayActivity[],
  filters: ActivityFilter[]
): ToyPlayActivity[] {
  if (filters.length === 0) return activities;

  return activities.filter((a) =>
    filters.every((f) => {
      switch (f) {
        case "5min":
          return a.durationMinutes <= 5;
        case "10min":
          return a.durationMinutes <= 10;
        case "20min":
          return a.durationMinutes <= 20;
        case "30min":
          return a.durationMinutes <= 30;
        case "45min":
          return a.durationMinutes <= 45;
        case "indoor":
          return a.indoorOutdoor === "indoor" || a.indoorOutdoor === "either";
        case "outdoor":
          return a.indoorOutdoor === "outdoor" || a.indoorOutdoor === "either";
        case "mess_free":
          return a.messLevel === "mess_free";
        default:
          return a.filters.includes(f);
      }
    })
  );
}
