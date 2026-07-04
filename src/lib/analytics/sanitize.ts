const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "childnickname",
  "child_nickname",
  "childname",
  "child_name",
  "note",
  "notes",
  "content",
  "message",
  "messages",
  "story",
  "conversation",
  "feeling",
  "win",
  "challenge",
  "routineNotes",
  "developmentNotes",
  "bio",
  "exactLocation",
  "authorization",
  "cookie",
  "session",
]);

const SENSITIVE_PATTERN =
  /password|token|secret|authorization|bearer|child.?name|nickname|private.?note|conversation|message.?content/i;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_-]/g, "");
  return SENSITIVE_KEYS.has(normalized) || SENSITIVE_PATTERN.test(key);
}

/** Strip PII before sending analytics payloads (GDPR-safe). */
export function sanitizeProperties(
  properties?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!properties) return undefined;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isSensitiveKey(key)) continue;
    if (typeof value === "string" && value.length > 500) {
      clean[key] = "[truncated]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizeProperties(value as Record<string, unknown>);
      if (nested && Object.keys(nested).length > 0) clean[key] = nested;
      continue;
    }
    clean[key] = value;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}
