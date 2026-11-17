import type { Locale } from "@/lib/i18n";

/** Counts and dates must use the same digits as prices: Persian-extended for
 * Dari, Latin for English. Formatting them by hand is how a UI ends up mixing
 * ۱۲۰۰ and 1200 on one screen. */
const numberFormats = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: Locale): Intl.NumberFormat {
  const cached = numberFormats.get(locale);
  if (cached) return cached;
  const created = new Intl.NumberFormat(locale === "fa-AF" ? "fa-AF" : "en-US", { maximumFractionDigits: 0 });
  numberFormats.set(locale, created);
  return created;
}

export function formatCount(value: number | null | undefined, locale: Locale): string {
  if (value == null || Number.isNaN(value)) return "—";
  return numberFormat(locale).format(value);
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();
/** Dari renders on the Solar Hijri calendar (the official Afghan calendar);
 * English renders Gregorian. Both come from the same ISO instant. */
export function formatDate(value: string | null | undefined, locale: Locale, withTime = false): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const key = `${locale}:${withTime}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale === "fa-AF" ? "fa-AF-u-ca-persian" : "en-GB", {
      year: "numeric", month: "short", day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
    dateFormats.set(key, format);
  }
  return format.format(date);
}

/** Days between now and an ISO instant, rounded up; null when in the past. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  return diff <= 0 ? null : Math.ceil(diff / 86_400_000);
}

/** True when the product was published within the last `days` (drives "New"). */
export function isNew(availableOn: string | null | undefined, days = 30): boolean {
  if (!availableOn) return false;
  const then = new Date(availableOn).getTime();
  if (Number.isNaN(then)) return false;
  const diff = Date.now() - then;
  return diff >= 0 && diff <= days * 86_400_000;
}

/** Persian/Latin digit conversion for short codes (order numbers stay as the
 * backend issued them; only counts and prices are localised). */
export function percent(value: number, locale: Locale): string {
  return `${formatCount(Math.round(value), locale)}${locale === "fa-AF" ? "٪" : "%"}`;
}
