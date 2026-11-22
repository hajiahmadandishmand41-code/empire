import Link from "next/link";
import { translate } from "@/lib/i18n";
import { currentLocale } from "@/lib/locale-server";
import { listPolicies } from "@/lib/api";
import { SITE, formatPhone } from "@/lib/site";
import { EmpireMark, Icon } from "@/components/ui/icons";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const SHOP_LINKS = [
  { href: "/products", key: "products" },
  { href: "/vendors", key: "nav_vendors" },
  { href: "/wholesale", key: "nav_wholesale" },
  { href: "/offers", key: "nav_offers" },
  { href: "/collections", key: "collections_title" },
] as const;

const SERVICE_LINKS = [
  { href: "/rfq", key: "nav_rfq" },
  { href: "/become-seller", key: "become_seller" },
  { href: "/account", key: "my_account" },
  { href: "/company", key: "company_account" },
  { href: "/cart", key: "cart" },
] as const;

/** Site footer.
 *
 * Policies come from the Store API, so the footer lists what the merchant
 * actually published and says so plainly when nothing has been published yet —
 * a hard-coded "Terms / Privacy / Returns" row would be a display-only section.
 */
export async function Footer() {
  const locale = await currentLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const year = new Date().getFullYear();

  let policies: { name: string; slug: string }[] = [];
  let policiesFailed = false;
  try {
    policies = (await listPolicies()).data.map((policy) => ({ name: policy.name, slug: policy.slug }));
  } catch {
    policiesFailed = true;
  }

  const newsletterEnabled = process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "true";

  return (
    <footer className="mt-16 bg-navy-950 text-navy-200">
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={websiteJsonLd(locale)} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* ------------------------------------------------------- about */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label={SITE.name}>
              <EmpireMark className="h-10 w-10" />
              <span className="text-2xl font-extrabold tracking-tight text-white">{SITE.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-navy-300">{t("footer_tagline")}</p>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-jade-400" />
                <span>
                  <span className="block text-2xs font-semibold text-navy-400">{t("footer_address_label")}</span>
                  <span className="text-navy-100">{SITE.contact.address[locale]}</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-jade-400" />
                <span>
                  <span className="block text-2xs font-semibold text-navy-400">{t("phone_label")}</span>
                  <a href={`tel:${SITE.contact.phone}`} className="num text-navy-100 transition-colors hover:text-white">
                    {formatPhone(locale)}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-jade-400" />
                <span>
                  <span className="block text-2xs font-semibold text-navy-400">{t("email")}</span>
                  <a href={`mailto:${SITE.contact.email}`} dir="ltr" className="text-navy-100 transition-colors hover:text-white">
                    {SITE.contact.email}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-jade-400" />
                <span>
                  <span className="block text-2xs font-semibold text-navy-400">{t("footer_hours_label")}</span>
                  <span className="text-navy-100">{SITE.contact.hours[locale]}</span>
                </span>
              </li>
            </ul>
          </div>

          {/* ------------------------------------------------------- links */}
          <nav aria-label={t("footer_shop_title")} className="lg:col-span-2">
            <h2 className="text-sm font-bold text-white">{t("footer_shop_title")}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-navy-300 transition-colors hover:text-jade-300">{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("footer_services_title")} className="lg:col-span-2">
            <h2 className="text-sm font-bold text-white">{t("footer_services_title")}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-navy-300 transition-colors hover:text-jade-300">{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-white">{t("footer_policies_title")}</h2>
            {policies.length ? (
              <ul className="mt-4 space-y-2.5 text-sm">
                {policies.map((policy) => (
                  <li key={policy.slug}>
                    <Link href={`/policies/${policy.slug}`} className="text-navy-300 transition-colors hover:text-jade-300">
                      {policy.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-navy-400">
                {policiesFailed ? t("backend_error") : t("footer_no_policies")}
              </p>
            )}
          </div>

          {/* -------------------------------------------------- newsletter */}
          <div className="lg:col-span-2">
            {newsletterEnabled ? (
              <>
                <h2 className="text-sm font-bold text-white">{t("newsletter_title")}</h2>
                <div className="mt-4"><NewsletterForm /></div>
              </>
            ) : (
              <>
                <h2 className="text-sm font-bold text-white">{t("footer_payment_title")}</h2>
                <p className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-navy-300">
                  <Icon name="wallet" className="mt-0.5 h-4 w-4 shrink-0 text-jade-400" />
                  {t("footer_payment_body")}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-navy-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="num text-xs text-navy-400">
            © {year} {SITE.name}. {t("rights")}
          </p>
          <p className="flex items-center gap-2 text-xs text-navy-400">
            <Icon name="shield" className="h-4 w-4 text-jade-500" />
            {t("made_in_afghanistan")}
          </p>
        </div>
      </div>
    </footer>
  );
}
