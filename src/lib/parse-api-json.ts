/** Parse fetch JSON safely — surfaces plain-text proxy errors (e.g. 413 Request Entity Too Large). */
export async function parseApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(response.status === 413 ? "Photo is too large. Please try again." : `Empty response (${response.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.slice(0, 80).replace(/\s+/g, " ").trim();
    if (response.status === 413 || /request entity too large/i.test(text)) {
      throw new Error("Photo is too large. We'll compress it automatically — please try again.");
    }
    if (response.status >= 500) {
      throw new Error("Something went wrong on our side. Please try again in a moment.");
    }
    throw new Error(snippet || `Invalid response (${response.status})`);
  }
}
