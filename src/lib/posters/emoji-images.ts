import "server-only";

/** Fetch Twemoji PNGs for PDF embedding — pdf-lib cannot render emoji as text. */
const TWEMOJI_BASE =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";

function emojiToFilename(emoji: string): string {
  const parts: string[] = [];
  for (const char of emoji.trim()) {
    const cp = char.codePointAt(0)!;
    if (cp === 0xfe0f) continue;
    parts.push(cp.toString(16));
  }
  return parts.join("-");
}

export function twemojiUrl(emoji: string): string {
  return `${TWEMOJI_BASE}/${emojiToFilename(emoji)}.png`;
}

export async function fetchEmojiPng(emoji: string): Promise<Uint8Array | null> {
  const trimmed = emoji.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(twemojiUrl(trimmed), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function fetchEmojiPngMap(emojis: string[]): Promise<Map<string, Uint8Array>> {
  const unique = Array.from(new Set(emojis.map((e) => e.trim()).filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (emoji) => {
      const png = await fetchEmojiPng(emoji);
      return [emoji, png] as const;
    })
  );
  const map = new Map<string, Uint8Array>();
  for (const [emoji, png] of entries) {
    if (png) map.set(emoji, png);
  }
  return map;
}
