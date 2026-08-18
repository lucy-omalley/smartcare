import type { Locale } from "@/lib/i18n/config";
import { en, type MessageTree } from "@/lib/i18n/messages/en";
import { zhCN } from "@/lib/i18n/messages/zh-CN";

const MESSAGES: Record<Locale, MessageTree> = {
  en,
  "zh-CN": zhCN,
};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = MESSAGES[locale] ?? MESSAGES.en;
  const value = getNestedValue(messages as unknown as Record<string, unknown>, key);
  if (typeof value === "string") return interpolate(value, params);
  const fallback = getNestedValue(MESSAGES.en as unknown as Record<string, unknown>, key);
  if (typeof fallback === "string") return interpolate(fallback, params);
  return key;
}

export function getMessages(locale: Locale): MessageTree {
  return MESSAGES[locale] ?? MESSAGES.en;
}
