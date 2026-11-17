import { FilterPanel } from "@/components/catalog/filter-panel";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { JsonLd, absoluteUrl, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { formatCount } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { translator } from "@/lib/i18n";
import { getCategory, listProductFilters, listProducts, uniqueProducts, type ProductSort } from "@/lib/api";

const PAGE_SIZE = 24;
const SORTS: ProductSort[] = ["price", "-price", "best_selling", "name", "-name", "-available_on", "available_on"];

type Query = Record<string, string | string[] | undefined>;

function one(params: Query, key: string): string | undefined {
  const value = params[key];
  const text = Array.isArray(value) ? value[0] : value;
  const trimmed = text?.trim();
  return trimmed ? trimmed : undefined;
}

function many(params: Query, key: string): string[] {
  const value = params[key];
  return (Array.isArray(value) ? value : value ? [value] : []).map((item) => item.trim()).filter(Boolean);
}

/** Refinement params are stripped from the canonical URL. Sort order, a price
 * window and an availability toggle do not create a distinct page worth
 * indexing; without this, every combination multiplies the crawl surface and
 * splits ranking signals across near-duplicate URLs. `category` and `page` are
 * kept because a category landing page and each paginated page are real,
 * distinct content. */
function canonicalFor(params: Query): string {
  const query = new URLSearchParams();
  const category = one(params, "category");
  if (category) query.set("category", category);
  const seller = one(params, "seller");
  if (seller) query.set("seller", seller);
  const page = Number(one(params, "page") ?? "1");
  if (page > 1) query.set("page", String(page));
  const suffix = query.size ? `?${query.toString()}` : "";
  return absoluteUrl(`/products${suffix}`);
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const locale = await currentLocale();
  const t = translator(locale);
  const search = one(params, "q");
  const categoryId = one(params, "category");

  let title = t("meta_products_title");
  let description = t("meta_products_description");
  if (categoryId) {
    try {
      const category = await getCategory(categoryId);
      title = category.meta_title || category.name;
      description = category.meta_description || `${t("meta_category_title")}: ${category.name}`;
    } catch { /* fall back to the generic catalog metadata */ }
  }

  return {
    ...buildMetadata({
      locale, title, description, path: "/products",
      // Internal search results are thin, unbounded content: crawlable but not
      // indexable.
      noIndex: Boolean(search),
    }),
    alternates: { canonical: canonicalFor(params) },
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const locale = await currentLocale();
  const t = translator(locale);

  const search = one(params, "q");
  const categoryId = one(params, "category");
  const sellerId = one(params, "seller");
  const requestedSort = one(params, "sort") as ProductSort | undefined;
  const sort = requestedSort && SORTS.includes(requestedSort) ? requestedSort : undefined;
  const page = Math.max(1, Number(one(params, "page") ?? "1") || 1);
  const min = one(params, "min");
  const max = one(params, "max");
  const inStock = one(params, "stock") === "1";
  const optionValues = many(params, "ov");

  let products: Awaited<ReturnType<typeof listProducts>>["data"] = [];
  let total = 0;
  let pages = 1;
  let failed = false;
  try {
    const result = await listProducts({
      page, limit: PAGE_SIZE, search, sort, category: categoryId, seller: sellerId,
      priceGte: min, priceLte: max, inStock, optionValues,
      expand: "variants,seller",
    });
    products = uniqueProducts(result.data);
    total = result.meta.count;
    pages = result.meta.pages;
  } catch {
    failed = true;
  }

  let filters: Awaited<ReturnType<typeof listProductFilters>> | null = null;
  try {
    filters = await listProductFilters({ category: categoryId, search });
  } catch {
    filters = null;
  }

  let categoryName: string | undefined;
  if (categoryId) {
    try { categoryName = (await getCategory(categoryId)).name; } catch { categoryName = undefined; }
  }

  const crumbs = [
    { label: t("home"), href: "/" },
    { label: t("catalog_title"), href: categoryName || search || sellerId ? "/products" : undefined },
    ...(categoryName ? [{ label: categoryName }] : []),
  ];

  const heading = search
    ? `${t("search_submit")}: ${search}`
    : categoryName ?? (sellerId ? t("vendor_products_title") : t("catalog_title"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-4" />

      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{heading}</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {failed ? t("backend_error") : t("results_count", { count: formatCount(total, locale) })}
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <FilterPanel filters={filters} resultCount={total} base="/products" params={params} />

        <div className="min-w-0 flex-1">
          {failed ? (
            <EmptyState icon="alert" title={t("error_title")} message={t("error_body")} actionHref="/products" actionLabel={t("error_action")} />
          ) : products.length === 0 ? (
            <EmptyState
              icon="search"
              title={t("no_results_title")}
              message={t("no_results_body")}
              actionHref="/products"
              actionLabel={t("no_results_action")}
              secondaryHref="/rfq"
              secondaryLabel={t("rfq_banner_cta")}
            />
          ) : (
            <>
              <ProductGrid products={products} />
              <Pagination
                page={page}
                totalPages={pages}
                locale={locale}
                base="/products"
                searchParams={Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))}
                prevLabel={t("pagination_prev")}
                nextLabel={t("pagination_next")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
