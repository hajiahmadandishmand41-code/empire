import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { Icon } from "@/components/ui/icons";
import { JsonLd, absoluteUrl, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { SpreeApiError, getSeller, listProducts, sameOriginMedia, type Product, type Seller } from "@/lib/api";

const PAGE_SIZE = 12;

type Query = Record<string, string | string[] | undefined>;
const one = (params: Query, key: string) => {
  const value = params[key];
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text || undefined;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await currentLocale();
  const t = translator(locale);
  try {
    const seller = await getSeller(slug);
    return buildMetadata({
      locale,
      title: seller.name,
      description: seller.about?.slice(0, 160) || t("meta_vendors_description"),
      path: `/vendors/${seller.slug || seller.id}`,
      image: sameOriginMedia(seller.cover_photo_url || seller.logo_url),
    });
  } catch {
    return buildMetadata({ locale, title: t("vendor_not_found"), path: `/vendors/${slug}`, noIndex: true });
  }
}

/** Seller storefront.
 *
 * Only data the API is willing to publish is shown. `GET /store/sellers/{id}`
 * 404s for a seller who is not currently selling, and `custom_fields` contains
 * only what the seller marked storefront-visible, so private company details
 * never reach this page even if they exist in the database.
 */
export default async function VendorPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Query> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const locale = await currentLocale();
  const t = translator(locale);
  const page = Math.max(1, Number(one(query, "page") ?? "1") || 1);

  let seller: Seller;
  try {
    seller = await getSeller(slug);
  } catch (cause) {
    if (cause instanceof SpreeApiError && cause.status === 404) notFound();
    throw cause;
  }

  let products: Product[] = [];
  let total = 0;
  let pages = 1;
  try {
    // `seller_id` is a documented filter attribute, so this needs no backend
    // change and no client-side filtering of an unrelated page of results.
    const result = await listProducts({ seller: seller.id, page, limit: PAGE_SIZE, sort: "best_selling", expand: "variants,seller" });
    products = result.data;
    total = result.meta.count;
    pages = result.meta.pages;
  } catch {
    products = [];
  }

  const cover = sameOriginMedia(seller.cover_photo_url);
  const logo = sameOriginMedia(seller.square_logo_url || seller.logo_url);
  const fields = seller.custom_fields ?? [];
  const policies = seller.policies ?? [];
  const crumbs = [
    { label: t("home"), href: "/" },
    { label: t("vendors_title"), href: "/vendors" },
    { label: seller.name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: seller.name,
        url: absoluteUrl(`/vendors/${seller.slug || seller.id}`),
        description: seller.about || undefined,
        logo: logo ? absoluteUrl(logo) : undefined,
        image: cover ? absoluteUrl(cover) : undefined,
      }} />

      {/* ------------------------------------------------------- cover + head */}
      <div className="relative h-40 w-full overflow-hidden bg-navy-900 sm:h-56">
        {cover ? (
          <Image src={cover} alt={t("vendor_cover_alt")} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-navy-800 via-navy-900 to-jade-950" />
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-navy-950/80 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 sm:-mt-14">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
              <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-navy-50 shadow-raised sm:h-24 sm:w-24">
                {logo ? (
                  <Image src={logo} alt={t("vendor_logo_alt")} fill sizes="96px" className="object-cover" />
                ) : (
                  <Icon name="store" className="h-9 w-9 text-navy-400" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">{seller.name}</h1>
                  <Badge tone="jade" icon={<Icon name="shield" className="h-3 w-3" />}>{t("vendor_verified_note")}</Badge>
                </div>
                {seller.about ? (
                  <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600">{seller.about}</p>
                ) : null}
                <p className="num mt-3 text-xs text-gray-500">{t("vendors_count", { count: total })}</p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link
                  href={`/products?seller=${encodeURIComponent(seller.id)}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-bold text-white transition-colors hover:bg-navy-800"
                >
                  <Icon name="grid" className="h-4 w-4" />
                  {t("vendor_products_title")}
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <Breadcrumbs items={crumbs} className="mt-5" />

        <div className="mt-6 grid gap-8 pb-12 lg:grid-cols-[1fr_20rem] lg:items-start">
          {/* ------------------------------------------------------ products */}
          <section aria-labelledby="vendor-products">
            <h2 id="vendor-products" className="mb-4 text-lg font-extrabold tracking-tight text-navy-950">
              {t("vendor_products_title")}
            </h2>
            {products.length ? (
              <>
                <ProductGrid products={products} />
                <Pagination
                  page={page}
                  totalPages={pages}
                  locale={locale}
                  base={`/vendors/${seller.slug || seller.id}`}
                  searchParams={{ page: one(query, "page") }}
                  prevLabel={t("pagination_prev")}
                  nextLabel={t("pagination_next")}
                />
              </>
            ) : (
              <EmptyState
                icon="package"
                title={t("vendor_products_empty")}
                actionHref="/vendors"
                actionLabel={t("view_all_vendors")}
                secondaryHref="/products"
                secondaryLabel={t("catalog_title")}
              />
            )}
          </section>

          {/* ------------------------------------------- company info + terms */}
          <aside className="space-y-4 lg:sticky lg:top-32">
            {fields.length ? (
              <Card>
                <h2 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-bold text-navy-950">
                  <Icon name="building" className="h-4 w-4 text-jade-700" />
                  {t("company_title")}
                </h2>
                <dl className="space-y-0 px-4 py-2 text-sm">
                  {fields.map((field) => (
                    <div key={field.key} className="flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0">
                      <dt className="shrink-0 text-gray-500">{field.label || field.key}</dt>
                      <dd
                        className="min-w-0 text-end font-medium text-navy-900"
                        // A code, registration number or phone stays LTR inside
                        // Dari copy; prose follows the page direction.
                        dir={field.field_type === "number" || !/[\u0600-\u06FF]/.test(String(field.value ?? "")) ? "ltr" : undefined}
                      >
                        {formatFieldValue(field.value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ) : null}

            {policies.length ? (
              <Card>
                <h2 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-bold text-navy-950">
                  <Icon name="shield" className="h-4 w-4 text-jade-700" />
                  {t("vendor_policies_title")}
                </h2>
                <div className="space-y-4 px-4 py-3">
                  {policies.map((policy) => (
                    <div key={policy.id}>
                      <h3 className="text-sm font-bold text-navy-900">{policy.name}</h3>
                      {policy.body ? (
                        /** Seller-authored HTML is not injected; the plain-text
                         * body carries the same terms without an XSS path. */
                        <p className="mt-1 whitespace-pre-line text-xs leading-6 text-gray-600">{policy.body}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card>
              <h2 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-bold text-navy-950">
                <Icon name="truck" className="h-4 w-4 text-jade-700" />
                {t("shipping_title")}
              </h2>
              <p className="px-4 py-3 text-xs leading-6 text-gray-600">{t("shipping_body")}</p>
              <p className="border-t border-gray-100 px-4 py-3 text-xs leading-6 text-gray-600">{t("footer_payment_body")}</p>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

/** Renders a custom field from its real typed value instead of stringifying an
 * object into "[object Object]". */
function formatFieldValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => (item && typeof item === "object" ? String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? "") : String(item)))
      .filter(Boolean)
      .join("، ") || "—";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = record.label ?? record.name ?? record.value;
    return text == null ? "—" : String(text);
  }
  return "—";
}
