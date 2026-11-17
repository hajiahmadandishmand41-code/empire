import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetail } from "./ProductDetail";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card, DataRow } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductRail } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icons";
import { JsonLd, absoluteUrl, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { SpreeApiError, getProduct, listProducts, productImage, uniqueProducts, type CustomField, type Product } from "@/lib/api";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await currentLocale();
  const t = translator(locale);

  let product: Product;
  try {
    product = await getProduct(slug);
  } catch (cause) {
    // A missing product is a real 404; any other failure is a server error and
    // must not be reported to the shopper as "this product does not exist".
    if (cause instanceof SpreeApiError && cause.status === 404) notFound();
    throw cause;
  }

  const category = product.categories?.[0];
  const crumbs = [
    { label: t("home"), href: "/" },
    { label: t("catalog_title"), href: "/products" },
    ...(category ? [{ label: category.name, href: `/products?category=${encodeURIComponent(category.id)}` }] : []),
    { label: product.name },
  ];

  // Related products come from the same category, excluding this one. A failure
  // here removes the rail rather than the page.
  let related: Product[] = [];
  if (category) {
    try {
      const result = await listProducts({ category: category.id, limit: 13, expand: "variants,seller" });
      related = uniqueProducts(result.data).filter((item) => item.id !== product.id).slice(0, 12);
    } catch { related = []; }
  }

  const specs = buildSpecs(product, t);
  const description = product.description?.trim();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <JsonLd data={productJsonLd(product)} />

      <Breadcrumbs items={crumbs} className="mb-5" />

      <ProductDetail product={product} apiError={null} />

      {/* ------------------------------------------------- description / specs */}
      <div className="mt-12">
        <Tabs
          items={[
            {
              id: "description",
              label: t("description_tab"),
              content: description ? (
                /** Seller-authored HTML is never injected: `description_html`
                 * comes from a marketplace vendor, so rendering it would be a
                 * stored-XSS path into every shopper's browser. The plain-text
                 * field carries the same information safely. */
                <p className="whitespace-pre-line text-sm leading-8 text-gray-700">{description}</p>
              ) : (
                <p className="text-sm text-gray-500">{t("spec_no_data")}</p>
              ),
            },
            {
              id: "specifications",
              label: t("specifications"),
              content: specs.length ? (
                <Card>
                  <div className="space-y-0 p-4">
                    {specs.map((row) => <DataRow key={row.label} label={row.label} value={row.value} dir={row.dir} />)}
                  </div>
                </Card>
              ) : (
                <p className="text-sm text-gray-500">{t("spec_no_data")}</p>
              ),
            },
            {
              id: "shipping",
              label: t("shipping_tab"),
              content: (
                <div className="space-y-3 text-sm leading-7 text-gray-700">
                  <p className="flex items-start gap-2.5">
                    <Icon name="truck" className="mt-1 h-4 w-4 shrink-0 text-jade-700" />
                    {t("hero_trust_delivery")}
                  </p>
                  <p className="flex items-start gap-2.5">
                    <Icon name="wallet" className="mt-1 h-4 w-4 shrink-0 text-jade-700" />
                    {t("footer_payment_body")}
                  </p>
                  <p className="text-gray-500">{t("shipping_body")}</p>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* ------------------------------------------------------- seller terms */}
      {product.seller?.policies?.length ? (
        <section aria-labelledby="pdp-policies" className="mt-12">
          <SectionHeading id="pdp-policies" title={t("vendor_policies_title")} icon={<Icon name="shield" className="h-5 w-5" />} />
          <div className="grid gap-4 sm:grid-cols-2">
            {product.seller.policies.map((policy) => (
              <Card key={policy.id} className="p-4">
                <h3 className="text-sm font-bold text-navy-950">{policy.name}</h3>
                {policy.body ? <p className="mt-1.5 whitespace-pre-line text-xs leading-6 text-gray-600">{policy.body}</p> : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ related */}
      <section aria-labelledby="pdp-related" className="mt-12">
        <SectionHeading
          id="pdp-related"
          title={t("related_products")}
          href={category ? `/products?category=${encodeURIComponent(category.id)}` : "/products"}
          linkLabel={t("view_all")}
          icon={<Icon name="spark" className="h-5 w-5" />}
        />
        {related.length ? (
          <ProductRail products={related} />
        ) : (
          <>
            <EmptyState icon="package" title={t("related_products_empty")} actionHref="/products" actionLabel={t("catalog_title")} />
            <p className="mt-4 text-center text-sm">
              <Link href="/rfq" className="font-semibold text-jade-700 underline-offset-4 hover:underline">{t("rfq_banner_cta")}</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

/** Specifications from data the API actually returns: published custom fields
 * first, then the variant's own attributes. Nothing is inferred. */
function buildSpecs(product: Product, t: ReturnType<typeof translator>): { label: string; value: string; dir?: "ltr" | "rtl" }[] {
  const rows: { label: string; value: string; dir?: "ltr" | "rtl" }[] = [];
  for (const field of product.custom_fields ?? []) rows.push(...customFieldRow(field));
  const variant = product.variants?.find((item) => item.id === (product.buy_box_variant_id || product.default_variant_id)) ?? product.default_variant ?? product.variants?.[0];
  if (variant?.sku) rows.push({ label: "SKU", value: variant.sku, dir: "ltr" });
  if (variant?.purchase_unit) rows.push({ label: t("unit"), value: variant.purchase_unit });
  if (product.available_on) rows.push({ label: t("sort_newest"), value: product.available_on.slice(0, 10), dir: "ltr" });
  return rows;
}

/** A custom field's value is typed by the merchant, so each field_type is
 * rendered from its real shape rather than stringified blindly. */
function customFieldRow(field: CustomField): { label: string; value: string; dir?: "ltr" | "rtl" }[] {
  const label = field.label || field.key;
  const value = field.value;
  if (value == null || value === "") return [];
  if (typeof value === "boolean") return [];
  if (typeof value === "number" || typeof value === "string") {
    const text = String(value);
    // Latin-script values (codes, model numbers) stay LTR inside Dari copy.
    return [{ label, value: text, dir: /[\u0600-\u06FF]/.test(text) ? undefined : "ltr" }];
  }
  if (Array.isArray(value)) {
    const text = value.map((item) => (typeof item === "object" && item ? String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? "") : String(item))).filter(Boolean).join("، ");
    return text ? [{ label, value: text }] : [];
  }
  return [];
}

/** schema.org Product. Price and availability come from the same fields the
 * visible page renders, so the structured data cannot drift from what a
 * shopper actually sees. */
function productJsonLd(product: Product) {
  const variant = product.variants?.find((item) => item.id === (product.buy_box_variant_id || product.default_variant_id)) ?? product.default_variant;
  const price = variant?.price ?? product.price;
  const image = productImage(product, "hero");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    sku: variant?.sku || undefined,
    image: image ? absoluteUrl(image) : undefined,
    url: absoluteUrl(`/products/${product.slug}`),
    brand: { "@type": "Brand", name: product.seller?.name || SITE.name },
    ...(product.seller ? { seller: { "@type": "Organization", name: product.seller.name } } : {}),
    offers: price?.amount ? {
      "@type": "Offer",
      price: price.amount,
      priceCurrency: price.currency,
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/products/${product.slug}`),
    } : undefined,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await currentLocale();
  const t = translator(locale);
  try {
    const product = await getProduct(slug, "media,seller");
    const image = productImage(product, "hero");
    return buildMetadata({
      locale,
      title: product.meta_title || product.name,
      description: product.meta_description || product.description?.slice(0, 160) || t("meta_products_description"),
      path: `/products/${product.slug}`,
      image,
    });
  } catch {
    return buildMetadata({ locale, title: t("product_not_found"), path: `/products/${slug}`, noIndex: true });
  }
}
