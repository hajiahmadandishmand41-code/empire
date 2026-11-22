import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { SellerCard } from "@/components/vendor/seller-card";
import { JsonLd, absoluteUrl, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { formatCount } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { listSellers, type Seller } from "@/lib/api";

const PAGE_SIZE = 24;

type Query = Record<string, string | string[] | undefined>;
const one = (params: Query, key: string) => {
  const value = params[key];
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text || undefined;
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const locale = await currentLocale();
  const t = translator(locale);
  const search = one(params, "q");
  return {
    ...buildMetadata({
      locale,
      title: search ? `${t("meta_vendors_title")}: ${search}` : t("meta_vendors_title"),
      description: t("meta_vendors_description"),
      path: "/vendors",
      // Internal seller search is thin, unbounded content.
      noIndex: Boolean(search),
    }),
    alternates: { canonical: absoluteUrl("/vendors") },
  };
}

/** Seller directory.
 *
 * `GET /store/sellers` returns only sellers who can currently take orders, so
 * every card here is a shop a buyer can actually buy from right now.
 */
export default async function VendorsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const locale = await currentLocale();
  const t = translator(locale);
  const search = one(params, "q");
  const page = Math.max(1, Number(one(params, "page") ?? "1") || 1);

  let sellers: Seller[] = [];
  let total = 0;
  let pages = 1;
  let failed = false;
  try {
    const result = await listSellers({ page, limit: PAGE_SIZE, search });
    sellers = result.data;
    total = result.meta.count;
    pages = result.meta.pages;
  } catch {
    failed = true;
  }

  const crumbs = [{ label: t("home"), href: "/" }, { label: t("vendors_title") }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-4" />

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{t("vendors_title")}</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {failed ? t("backend_error") : t("vendors_subtitle")}
          </p>
        </div>

        {/* GET form: seller search works without JavaScript and each query has a
            real, shareable URL. */}
        <form method="get" action="/vendors" className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <label htmlFor="vendor-search" className="sr-only">{t("vendor_search_placeholder")}</label>
            <input
              id="vendor-search"
              name="q"
              type="search"
              defaultValue={search ?? ""}
              placeholder={t("vendor_search_placeholder")}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white ps-9 pe-3 text-sm outline-none focus-visible:border-jade-500"
            />
          </div>
          <Button type="submit" variant="outline">{t("search_submit")}</Button>
        </form>
      </header>

      {!failed && total > 0 ? (
        <p className="num mb-4 text-sm text-gray-500">{t("vendors_count", { count: formatCount(total, locale) })}</p>
      ) : null}

      {failed ? (
        <EmptyState icon="alert" title={t("error_title")} message={t("error_body")} actionHref="/vendors" actionLabel={t("error_action")} />
      ) : sellers.length === 0 ? (
        <EmptyState
          icon="store"
          title={t("vendors_empty")}
          message={search ? t("no_results_body") : t("vendors_empty_body")}
          actionHref={search ? "/vendors" : "/become-seller"}
          actionLabel={search ? t("no_results_action") : t("become_seller")}
          secondaryHref={search ? undefined : "/products"}
          secondaryLabel={search ? undefined : t("catalog_title")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sellers.map((seller) => <SellerCard key={seller.id} seller={seller} locale={locale} />)}
          </div>
          <Pagination
            page={page}
            totalPages={pages}
            locale={locale}
            base="/vendors"
            searchParams={{ q: search, page: one(params, "page") }}
            prevLabel={t("pagination_prev")}
            nextLabel={t("pagination_next")}
          />
        </>
      )}
    </div>
  );
}
