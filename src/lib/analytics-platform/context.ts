/** Parse client context from request headers / body (no PII). */
export type EventContext = {
  sessionId?: string;
  feature?: string;
  source?: string;
  device?: string;
  browser?: string;
  platform?: string;
  country?: string;
};

export function parseUserAgent(ua?: string | null): Pick<EventContext, "device" | "browser" | "platform"> {
  if (!ua) return {};
  const lower = ua.toLowerCase();
  let platform = "web";
  if (/iphone|ipad|ipod/.test(lower)) platform = "ios";
  else if (/android/.test(lower)) platform = "android";

  let device = "desktop";
  if (/mobile|iphone|android/.test(lower) && !/ipad|tablet/.test(lower)) device = "mobile";
  else if (/ipad|tablet/.test(lower)) device = "tablet";

  let browser = "other";
  if (/edg\//.test(lower)) browser = "edge";
  else if (/chrome\//.test(lower) && !/edg\//.test(lower)) browser = "chrome";
  else if (/safari\//.test(lower) && !/chrome\//.test(lower)) browser = "safari";
  else if (/firefox\//.test(lower)) browser = "firefox";

  return { device, browser, platform };
}

export function countryFromHeaders(headers: Headers): string | undefined {
  return headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? undefined;
}
