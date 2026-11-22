/** Empire site constants.
 *
 * Contact details live here rather than in the message catalog: an email
 * address or a phone number is data, not copy, and translating it only creates
 * a way to get it wrong. Values are placeholders the operator must replace
 * before production — they are not connected to any real service.
 */
import type { Locale } from "@/lib/i18n";

export const SITE = {
  name: "Empire",
  /** Public origin, used for canonical URLs, the sitemap and JSON-LD. */
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  defaultLocale: "fa-AF" as Locale,
  locales: ["fa-AF", "en"] as Locale[],
  defaultCurrency: "AFN",
  defaultCountry: "AF",
  contact: {
    email: "info@empire.af",
    /** E.164, used for tel: links and shown formatted per locale. */
    phone: "+93700000000",
    address: { "fa-AF": "کابل، افغانستان", en: "Kabul, Afghanistan" } as Record<Locale, string>,
    hours: {
      "fa-AF": "شنبه تا پنجشنبه، ۰۸:۰۰ تا ۱۷:۰۰",
      en: "Saturday to Thursday, 08:00 to 17:00",
    } as Record<Locale, string>,
  },
  /** Afghanistan mobile prefixes, for client-side validation only. The server
   * remains the authority — see docs/AFGHANISTAN-LOCALIZATION.md. */
  phonePattern: /^(\+93|0093|93|0)?7\d{8}$/,
  social: [] as { label: string; href: string }[],
} as const;

/** Localised, LTR-isolated phone display: +۹۳ ۷۰۰ ۰۰۰ ۰۰۰ / +93 700 000 000 */
export function formatPhone(locale: Locale, value: string = SITE.contact.phone): string {
  const digits = value.replace(/[^\d]/g, "");
  const grouped = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`.trim();
  return locale === "fa-AF" ? `+۹۳ ${grouped.slice(3)}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : `+${grouped}`;
}

/** Accepts +93…, 0093…, 93… and local 07…; rejects everything else. */
export function isValidAfghanPhone(value: string): boolean {
  return SITE.phonePattern.test(value.replace(/[\s\-()]/g, ""));
}

export function normalizeAfghanPhone(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("0093")) return `+93${digits.slice(4)}`;
  if (digits.startsWith("93")) return `+${digits}`;
  if (digits.startsWith("0")) return `+93${digits.slice(1)}`;
  return `+93${digits}`;
}
