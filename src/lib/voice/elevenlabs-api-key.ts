import "server-only";

/** Strip common Vercel paste mistakes (quotes, whitespace, accidental prefix). */
export function normalizeElevenLabsApiKey(raw: string | undefined): string {
  let key = raw?.trim() ?? "";
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/\s+/g, "");
  if (key.toLowerCase().startsWith("xi-api-key:")) {
    key = key.slice("xi-api-key:".length).trim();
  }
  return key;
}

export type ElevenLabsKeyStatus = "missing" | "valid" | "invalid";

/** Lightweight remote check — uses /v1/voices (same scope voice cloning needs). */
export async function checkElevenLabsApiKey(): Promise<ElevenLabsKeyStatus> {
  const key = normalizeElevenLabsApiKey(process.env.ELEVENLABS_API_KEY);
  if (!key) return "missing";

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": key, Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) return "valid";
    if (res.status === 401 || res.status === 403) return "invalid";
    return "invalid";
  } catch {
    return "invalid";
  }
}

export function formatElevenLabsAuthError(detail: unknown): string {
  let message: string | null = null;
  if (typeof detail === "string") {
    message = detail;
  } else if (typeof detail === "object" && detail !== null && "message" in detail) {
    const raw = (detail as { message: unknown }).message;
    message = typeof raw === "string" ? raw : null;
  }

  const lower = message?.toLowerCase() ?? "";

  if (lower.includes("instant voice cloning") || lower.includes("does not include")) {
    return (
      "Your ElevenLabs account needs a paid plan for voice cloning. Upgrade the ElevenLabs account tied to your API key to Starter or above at elevenlabs.io/pricing, then try Clone my voice again. Until then, stories will use a similar preset AI voice."
    );
  }

  if (lower.includes("invalid api key")) {
    return (
      "ElevenLabs rejected the API key. Create a new key at elevenlabs.io/app/settings/api-keys: copy the full key when it is first shown, turn off “Restrict Key” (or enable Voices + Text to Speech), paste into Vercel as ELEVENLABS_API_KEY with no quotes, tick Production, then Redeploy."
    );
  }

  return message ?? "ElevenLabs request failed. Check your API key and ElevenLabs plan, then try again.";
}
