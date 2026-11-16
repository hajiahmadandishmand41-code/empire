import en from "@/locales/en.json";
import faAF from "@/locales/fa-AF.json";

export type Locale = "fa-AF" | "en";
export type MessageKey = keyof typeof en;
export const DEFAULT_LOCALE: Locale = "fa-AF";
export const LOCALES: Locale[] = ["fa-AF", "en"];
export const LOCALE_LABELS: Record<Locale, string> = { "fa-AF": "دری", en: "English" };
export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = { "fa-AF": "rtl", en: "ltr" };
const messages: Record<Locale, Record<MessageKey, string>> = { en, "fa-AF": faAF };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fa-AF";
}
export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
export function direction(locale: Locale): "rtl" | "ltr" {
  return LOCALE_DIRECTION[locale];
}
export function useTranslation(locale: Locale = DEFAULT_LOCALE) {
  return (key: MessageKey) => translate(locale, key);
}
