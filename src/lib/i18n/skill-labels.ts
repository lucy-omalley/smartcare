import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/translate";

const SKILL_KEYS: Record<string, string> = {
  gross_motor: "activityCategories.grossMotor",
  fine_motor: "activityCategories.fineMotor",
  language: "activityCategories.language",
  outdoor: "activityCategories.outdoor",
  indoor: "activityCategories.indoor",
  montessori: "activityCategories.montessori",
};

export function localizedSkillLabel(skill: string, locale: Locale): string {
  const key = SKILL_KEYS[skill];
  if (key) return translate(locale, key);
  return skill.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
