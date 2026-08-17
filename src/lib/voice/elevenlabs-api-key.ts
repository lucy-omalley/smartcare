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

  if (message?.toLowerCase().includes("invalid api key")) {
    return (
      "ElevenLabs rejected the API key. In Vercel → Environment Variables, replace ELEVENLABS_API_KEY with a fresh key from elevenlabs.io/app/settings/api-keys (no quotes), then redeploy."
    );
  }

  return message ?? "ElevenLabs authentication failed. Check ELEVENLABS_API_KEY in Vercel and redeploy.";
}
