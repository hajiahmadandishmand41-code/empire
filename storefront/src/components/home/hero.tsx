import Link from "next/link";
import { translate, type Locale } from "@/lib/i18n";
import { Icon, type IconName } from "@/components/ui/icons";
import { SearchField } from "@/components/layout/search-field";

const TRUST: { key: "hero_trust_verified" | "hero_trust_wholesale" | "hero_trust_delivery" | "hero_trust_cod"; icon: IconName }[] = [
  { key: "hero_trust_verified", icon: "shield" },
  { key: "hero_trust_wholesale", icon: "package" },
  { key: "hero_trust_delivery", icon: "truck" },
  { key: "hero_trust_cod", icon: "wallet" },
];

/** Hero. The headline is the h1 the storefront is ranked on, and the trust row
 * states only capabilities that are actually implemented: seller approval,
 * variant-level quantity rules, seeded coverage of all 34 provinces, and the
 * cash-on-delivery payment method the backend registers. */
export function Hero({ locale }: { locale: Locale }) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <section className="relative overflow-hidden bg-navy-950">
      {/* Decorative grid, painted in CSS so the hero never waits on an image. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div aria-hidden="true" className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-jade-700/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -start-16 h-80 w-80 rounded-full bg-navy-600/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-jade-500/40 bg-jade-500/10 px-3 py-1 text-2xs font-bold text-jade-300">
            <Icon name="spark" className="h-3.5 w-3.5" />
            {t("site_name")}
          </p>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("hero_title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-navy-200 sm:text-base sm:leading-8">
            {t("hero_body")}
          </p>

          <div className="mt-7 max-w-2xl">
            <SearchField />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-jade-700 px-6 text-sm font-bold text-white transition-colors hover:bg-jade-600 active:bg-jade-800"
            >
              <Icon name="grid" className="h-4 w-4" />
              {t("shop_now")}
            </Link>
            <Link
              href="/rfq"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-navy-600 bg-navy-900/60 px-6 text-sm font-bold text-white transition-colors hover:border-navy-400 hover:bg-navy-800"
            >
              <Icon name="quote" className="h-4 w-4" />
              {t("request_quote")}
            </Link>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 border-t border-navy-800 pt-8 sm:gap-4 lg:grid-cols-4">
          {TRUST.map((item) => (
            <li key={item.key} className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-jade-400 ring-1 ring-navy-700">
                <Icon name={item.icon} className="h-4.5 w-4.5" />
              </span>
              <span className="text-xs font-semibold leading-5 text-navy-100 sm:text-sm">{t(item.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
