import Link from "next/link";
import { translator, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/ui/icons";

/** RFQ call to action. Links to the real quotation flow: the buyer publishes a
 * request, approved sellers quote it, and accepting a quote is enforced in a
 * database transaction by Empire::AcceptQuote. */
export function RfqBanner({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <section aria-labelledby="home-rfq" className="relative overflow-hidden rounded-2xl bg-jade-900">
      <div aria-hidden="true" className="absolute -top-20 -end-10 h-56 w-56 rounded-full bg-jade-500/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -start-10 h-56 w-56 rounded-full bg-navy-900/40 blur-3xl" />
      <div className="relative flex flex-col gap-6 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 id="home-rfq" className="flex items-center gap-2.5 text-xl font-extrabold leading-8 text-white sm:text-2xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Icon name="quote" className="h-5 w-5 text-jade-200" />
            </span>
            {t("rfq_banner_title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-jade-100 sm:text-base">{t("rfq_banner_body")}</p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-jade-200">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            {t("rfq_banner_note")}
          </p>
        </div>
        <Link
          href="/rfq"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-jade-900 transition-colors hover:bg-jade-50 active:bg-jade-100"
        >
          {t("rfq_banner_cta")}
          <Icon name="chevronEnd" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
