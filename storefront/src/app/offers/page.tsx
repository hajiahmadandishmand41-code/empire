import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { formatCount } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { listProducts, type Product } from "@/lib/api";

const PAGE_SIZE = 24;

/** Which curated collection backs this page. A merchant puts discounted
 * products into a collection; the storefront does not guess at discounts,
 * because the Store API exposes no `on_sale` filter — `compare_at_amount` is a
 * display field, not a queryable one. */
const OFFERS_COLLECTION = process.env.EMPIRE_OFFERS_COLLECTION || "offers";

type Query = Record<string, string | string[] | undefined>;
const one = (params: Query, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
};

export async function generateMetadata() {
  const locale = await currentLocale();
  const t = translator(locale);
  return buildMetadata({ locale, title: t("meta_offers_title"), description: t("offers_subtitle"), path: "/offers" });
}

/** Current offers.
 *
 * Counts and pagination come from the API, so the page never claims more offers
 * than the store actually has. When the merchant has not curated an offers
 * collection yet this renders an honest empty state instead of filling the grid
 * with products that are not discounted.
 */
export default async function OffersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const locale = await currentLocale();
  const t = translator(locale);
  const page = Math.max(1, Number(one(params, "page") ?? "1") || 1);

  let products: Product[] = [];
  let total = 0;
  let pages = 1;
  let failed = false;
  try {
    const result = await listProducts({
      collectionPermalink: OFFERS_COLLECTION,
      page,
      limit: PAGE_SIZE,
      sort: "best_selling",
      expand: "variants,seller",
    });
    products = result.data;
    total = result.meta.count;
    pages = result.meta.pages;
  } catch {
    failed = true;
  }

  const crumbs = [{ label: t("home"), href: "/" }, { label: t("offers_title") }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-5" />

      <header className="mb-7 overflow-hidden rounded-3xl bg-linear-to-br from-saffron-50 via-white to-jade-50 p-6 ring-1 ring-saffron-400/25 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{t("offers_title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">{t("offers_subtitle")}</p>
        {!failed && total > 0 ? (
          <p className="num mt-3 text-sm font-semibold text-navy-900">{t("results_count", { count: formatCount(total, locale) })}</p>
        ) : null}
      </header>

      {failed ? (
        <EmptyState icon="alert" title={t("error_title")} message={t("error_body")} actionHref="/offers" actionLabel={t("error_action")} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="tag"
          title={t("offers_empty")}
          message={t("offers_empty_body")}
          actionHref="/products"
          actionLabel={t("catalog_title")}
          secondaryHref="/rfq"
          secondaryLabel={t("nav_rfq")}
        />
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination
            page={page}
            totalPages={pages}
            locale={locale}
            base="/offers"
            searchParams={{ page: one(params, "page") }}
            prevLabel={t("pagination_prev")}
            nextLabel={t("pagination_next")}
          />
        </>
      )}
    </div>
  );
}
