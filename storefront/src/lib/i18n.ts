import en from "@/locales/en.json";
import faAF from "@/locales/fa-AF.json";

/** Storefront languages. Pashto (`ps-AF`) stays an explicit draft stub in
 * `src/locales/ps-AF.json` and is deliberately NOT offered until a qualified
 * reviewer has translated it — see docs/AFGHANISTAN-LOCALIZATION.md. */
export type Locale = "fa-AF" | "en";
export type MessageKey = keyof typeof en;
export type MessageParams = Record<string, string | number>;

export const DEFAULT_LOCALE: Locale = "fa-AF";
export const LOCALES: Locale[] = ["fa-AF", "en"];
export const LOCALE_LABELS: Record<Locale, string> = { "fa-AF": "دری", en: "English" };
export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = { "fa-AF": "rtl", en: "ltr" };
/** BCP-47 for <html lang> and for Intl: Spree's content locale is `fa`. */
export const LOCALE_HTML_LANG: Record<Locale, string> = { "fa-AF": "fa-AF", en: "en" };
export const LOCALE_OPENGRAPH: Record<Locale, string> = { "fa-AF": "fa_AF", en: "en_US" };

const messages: Record<Locale, Record<string, string>> = { en, "fa-AF": faAF };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fa-AF";
}

/** Interpolates `{name}` placeholders. A key with no placeholder is unchanged,
 * so a missing parameter can never render "[object Object]" or "undefined". */
function interpolate(value: string, params?: MessageParams): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match);
}

export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const value = messages[locale][key];
  // A key that exists in en.json but not in the active locale falls back to
  // English rather than rendering `undefined`.
  return interpolate(value ?? messages.en[key] ?? key, params);
}

/** For keys built at runtime (order/payment/payout statuses). Returns the
 * fallback — never `undefined` — so an unmapped status still reads sensibly. */
export function translateDynamic(locale: Locale, key: string, fallback?: string, params?: MessageParams): string {
  const table = messages[locale];
  if (table[key]) return interpolate(table[key], params);
  if (messages.en[key]) return interpolate(messages.en[key], params);
  return fallback ?? key;
}

/** Binds a locale once so a Server Component can call `t("key", params)`.
 * Server Components cannot use the client `useLocale` hook, and re-passing the
 * locale at every call site is how strings end up rendered in the wrong one. */
export type Translator = (key: MessageKey, params?: MessageParams) => string;

export function translator(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}

export function direction(locale: Locale): "rtl" | "ltr" {
  return LOCALE_DIRECTION[locale];
}

export function useTranslation(locale: Locale = DEFAULT_LOCALE) {
  return (key: MessageKey, params?: MessageParams) => translate(locale, key, params);
}
