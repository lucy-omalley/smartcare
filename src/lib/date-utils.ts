/** Calendar date at UTC midnight for DB @db.Date keys (consistent across local + Vercel). */
export function toDateKey(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function yesterdayDateKey(): Date {
  const today = toDateKey();
  return new Date(today.getTime() - 86_400_000);
}
