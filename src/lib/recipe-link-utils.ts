/** Shared helpers for recipe inspiration links (safe for client + server). */
export function isGenericRecipeLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname.includes("youtube.com") && parsed.pathname === "/results") ||
      (parsed.hostname.includes("google.com") && parsed.pathname === "/search") ||
      (parsed.hostname.includes("search.brave.com") && parsed.pathname === "/search")
    );
  } catch {
    return true;
  }
}
