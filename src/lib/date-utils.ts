import { startOfDay, subDays } from "date-fns";

/** Calendar date at UTC midnight for DB @db.Date keys */
export function toDateKey(date: Date = new Date()): Date {
  return startOfDay(date);
}

export function yesterdayDateKey(): Date {
  return startOfDay(subDays(new Date(), 1));
}
