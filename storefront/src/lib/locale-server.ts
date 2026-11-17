import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";

/** Server-side locale. The cookie is written by the locale switcher and read
 * here so a Server Component can render translated, correctly-directed HTML
 * on the first byte — no client round trip, and crawlers see real content. */
export async function currentLocale(): Promise<Locale> {
  const value = (await cookies()).get("empire_locale")?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
