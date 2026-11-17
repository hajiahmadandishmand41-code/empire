import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd, absoluteUrl, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { formatCount } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import {
  SpreeApiError, listCollections, listProducts, sameOriginMedia,
  type Collection, type Product,
} from "@/lib/api";

const PAGE_SIZE = 24;

type Query = Record<string, string | string[] | undefined>;
const one = (params: Query, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
};

/** Collections have no single-record lookup endpoint in the Store API, so the
 * permalink is resolved from the list. Bounded to 200, which covers a curated
 * merchandising set; a store beyond that needs a `GET /store/collections/{id}`
 * endpoint rather than a larger scan here. */
async function resolveCollection(permalink: string): Promise<Collection | null> {
  const result = await listCollections(200);
  return result.data.find((collection) => collection.permalink === permalink) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ permalink: string }> }) {
  const { permalink } = await params;
  const locale = await currentLocale();
  const t = translator(locale);
  try {
    const collection = await resolveCollection(permalink);
    if (!collection) return buildMetadata({ locale, title: t("meta_not_found_title"), path: `/collections/${permalink}`, noIndex: true });
    return buildMetadata({
      locale,
      title: collection.name,
      description: collection.description || t("meta_collection_title"),
      path: `/collections/${collection.permalink}`,
      image: sameOriginMedia(collection.image_url || collection.square_image_url),
    });
  } catch {
    return buildMetadata({ locale, title: t("meta_collection_title"), path: `/collections/${permalink}`, noIndex: true });
  }
}

/** Collection landing page: a merchant-curated set of products. */
export default async function CollectionPage({ params, searchParams }: { params: Promise<{ permalink: string }>; searchParams: Promise<Query> }) {
  const [{ permalink }, query] = await Promise.all([params, searchParams]);
  const locale = await currentLocale();
  const t = translator(locale);
  const page = Math.max(1, Number(one(query, "page") ?? "1") || 1);

  let collection: Collection | null = null;
  let failed = false;
  try {
    collection = await resolveCollection(permalink);
  } catch (cause) {
    // A backend outage must not be reported as "this collection does not exist".
    if (cause instanceof SpreeApiError && cause.status === 404) notFound();
    failed = true;
  }
  if (!failed && !collection) notFound();

  let products: Product[] = [];
  let total = 0;
  let pages = 1;
  if (collection) {
    try {
      const result = await listProducts({ collection: collection.id, page, limit: PAGE_SIZE, sort: "best_selling", expand: "variants,seller" });
      products = result.data;
      total = result.meta.count;
      pages = result.meta.pages;
    } catch {
      products = [];
    }
  }

  const image = collection ? sameOriginMedia(collection.image_url || collection.square_image_url) : null;
  const crumbs = [
    { label: t("home"), href: "/" },
    { label: t("collections_title"), href: "/products" },
    { label: collection?.name ?? permalink },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      {collection ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: collection.name,
          description: collection.description || undefined,
          url: absoluteUrl(`/collections/${collection.permalink}`),
          image: image ? absoluteUrl(image) : undefined,
        }} />
      ) : null}
      <Breadcrumbs items={crumbs} className="mb-5" />

      <header className="mb-7 overflow-hidden rounded-3xl border border-navy-900/10 bg-white">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          {image ? (
            <span className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-navy-50 sm:h-32 sm:w-44">
              <Image src={image} alt={collection?.name ?? ""} fill priority sizes="(max-width: 640px) 100vw, 176px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{collection?.name ?? permalink}</h1>
            {collection?.description ? (
              <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-7 text-gray-600">{collection.description}</p>
            ) : null}
            {!failed ? (
              <p className="num mt-3 text-sm text-gray-500">{t("results_count", { count: formatCount(total, locale) })}</p>
            ) : null}
          </div>
        </div>
      </header>

      {failed ? (
        <EmptyState icon="alert" title={t("error_title")} message={t("error_body")} actionHref={`/collections/${permalink}`} actionLabel={t("error_action")} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="package"
          title={t("collections_empty")}
          message={t("collections_empty_body")}
          actionHref="/products"
          actionLabel={t("catalog_title")}
          secondaryHref="/"
          secondaryLabel={t("home")}
        />
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination
            page={page}
            totalPages={pages}
            locale={locale}
            base={`/collections/${collection?.permalink ?? permalink}`}
            searchParams={{ page: one(query, "page") }}
            prevLabel={t("pagination_prev")}
            nextLabel={t("pagination_next")}
          />
        </>
      )}
    </div>
  );
}
