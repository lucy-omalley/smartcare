/** Admin access for founder dashboard — set FOUNDER_ADMIN_EMAILS in Vercel (comma-separated). */
export function getFounderAdminEmails(): string[] {
  const raw = process.env.FOUNDER_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isFounderAdmin(email?: string | null): boolean {
  if (!email) return false;
  const admins = getFounderAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.toLowerCase());
}
