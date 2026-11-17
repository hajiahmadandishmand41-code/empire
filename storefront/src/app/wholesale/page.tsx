import Link from "next/link";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card, DataRow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Icon, type IconName } from "@/components/ui/icons";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd, absoluteUrl, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { listProducts, type Product } from "@/lib/api";

/** Optional curated collection. Wholesale is a programme, not only a product
 * set, so this page still renders its full explanation when the collection is
 * absent — the grid is a bonus, never the page. */
const WHOLESALE_COLLECTION = process.env.EMPIRE_WHOLESALE_COLLECTION || "wholesale";

export async function generateMetadata() {
  const locale = await currentLocale();
  const t = translator(locale);
  return buildMetadata({ locale, title: t("meta_wholesale_title"), description: t("meta_wholesale_description"), path: "/wholesale" });
}

/** Wholesale / B2B programme page.
 *
 * Every rule described here is a field the Store API actually returns per
 * variant — `minimum_order_quantity`, `order_multiple`, `units_per_carton`,
 * `purchase_unit` — and each product card and product page enforces them. No
 * volume-discount ladder is claimed: the Store API exposes no price list or tier
 * endpoint (those live only under `/api/v3/admin/price_lists`), so inventing one
 * here would publish prices the checkout would not honour.
 */
export default async function WholesalePage() {
  const locale = await currentLocale();
  const t = translator(locale);

  let products: Product[] = [];
  try {
    products = (await listProducts({ collectionPermalink: WHOLESALE_COLLECTION, limit: 12, sort: "best_selling", expand: "variants,seller" })).data;
  } catch {
    products = [];
  }

  const pillars: { icon: IconName; title: string; body: string }[] = [
    { icon: "package", title: t("wholesale_pillar_moq_title"), body: t("wholesale_pillar_moq_body") },
    { icon: "grid", title: t("wholesale_pillar_carton_title"), body: t("wholesale_pillar_carton_body") },
    { icon: "quote", title: t("wholesale_pillar_rfq_title"), body: t("wholesale_pillar_rfq_body") },
    { icon: "wallet", title: t("wholesale_pillar_payment_title"), body: t("wholesale_pillar_payment_body") },
    { icon: "truck", title: t("wholesale_pillar_shipping_title"), body: t("wholesale_pillar_shipping_body") },
    { icon: "building", title: t("wholesale_pillar_company_title"), body: t("wholesale_pillar_company_body") },
  ];

  const steps: string[] = [t("wholesale_step_1"), t("wholesale_step_2"), t("wholesale_step_3"), t("wholesale_step_4")];
  const crumbs = [{ label: t("home"), href: "/" }, { label: t("wholesale_title") }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: t("wholesale_title"),
        description: t("meta_wholesale_description"),
        url: absoluteUrl("/wholesale"),
        provider: { "@type": "Organization", name: SITE.name, url: absoluteUrl("/") },
        areaServed: { "@type": "Country", name: "Afghanistan" },
      }} />

      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-navy-900 via-navy-950 to-jade-950" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <Badge tone="saffron" icon={<Icon name="package" className="h-3 w-3" />}>{t("nav_wholesale")}</Badge>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">{t("wholesale_title")}</h1>
            <p className="mt-4 text-base leading-8 text-navy-100 sm:text-lg">{t("wholesale_subtitle")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/rfq" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-saffron-400 px-6 text-sm font-bold text-navy-950 transition-colors hover:bg-saffron-300">
                <Icon name="quote" className="h-4 w-4" />
                {t("rfq_banner_cta")}
              </Link>
              <Link href="/products" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10">
                <Icon name="grid" className="h-4 w-4" />
                {t("catalog_title")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={crumbs} className="mb-8" />

        {/* ---------------------------------------------------------- pillars */}
        <section aria-labelledby="wholesale-pillars" className="mb-12">
          <h2 id="wholesale-pillars" className="mb-5 text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">
            {t("wholesale_pillars_title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-jade-50">
                  <Icon name={pillar.icon} className="h-5 w-5 text-jade-800" />
                </span>
                <h3 className="mt-3 text-base font-bold text-navy-950">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-gray-600">{pillar.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ steps */}
        <section aria-labelledby="wholesale-steps" className="mb-12 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <Card>
            <h2 id="wholesale-steps" className="border-b border-gray-100 px-5 py-4 text-lg font-extrabold tracking-tight text-navy-950">
              {t("wholesale_how_title")}
            </h2>
            <ol className="space-y-5 px-5 py-5">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-7 text-gray-700">{step}</p>
                </li>
              ))}
            </ol>
            <div className="border-t border-gray-100 px-5 py-4">
              <Link href="/rfq" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800">
                <Icon name="quote" className="h-4 w-4" />
                {t("nav_rfq")}
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-navy-950">{t("wholesale_rules_title")}</h2>
            <div className="px-4 py-2">
              <DataRow label={t("wholesale_rule_moq")} value={t("wholesale_rule_moq_value")} />
              <DataRow label={t("wholesale_rule_multiple")} value={t("wholesale_rule_multiple_value")} />
              <DataRow label={t("wholesale_rule_carton")} value={t("wholesale_rule_carton_value")} />
              <DataRow label={t("wholesale_rule_payment")} value={t("wholesale_rule_payment_value")} />
            </div>
            <p className="border-t border-gray-100 px-4 py-3 text-xs leading-6 text-gray-500">{t("wholesale_rules_note")}</p>
          </Card>
        </section>

        {/* ------------------------------------------------- curated products */}
        <section aria-labelledby="wholesale-products">
          <h2 id="wholesale-products" className="mb-4 text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">
            {t("wholesale_products_title")}
          </h2>
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState
              icon="package"
              title={t("wholesale_products_empty")}
              message={t("wholesale_products_empty_body")}
              actionHref="/rfq"
              actionLabel={t("rfq_banner_cta")}
              secondaryHref="/products"
              secondaryLabel={t("catalog_title")}
            />
          )}
        </section>
      </div>
    </>
  );
}
