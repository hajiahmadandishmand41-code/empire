"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useCart } from "@/components/cart-context";
import { ErrorNotice } from "@/components/error-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, DataRow } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { Price } from "@/components/ui/price";
import { addToCart, productImage, sameOriginMedia, type Product, type Variant } from "@/lib/api";
import { formatCount } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { cx } from "@/lib/cx";

/** Gallery + purchase panel.
 *
 * Quantity rules are enforced here as well as by the store: the stepper cannot
 * go below the variant's minimum order quantity and always moves in its order
 * multiple, so a wholesale buyer is not told "422 Unprocessable" after typing a
 * number the store was never going to accept.
 */
export function ProductDetail({ product, apiError }: { product: Product; apiError: string | null }) {
  const { locale, t } = useLocale();
  const { setCart } = useCart();

  const variants = product.variants ?? [];
  const initialVariantId = product.buy_box_variant_id || product.default_variant_id || variants[0]?.id || "";
  const [variantId, setVariantId] = useState(initialVariantId);
  const [activeImage, setActiveImage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(apiError);

  const variant: Variant | undefined = variants.find((item) => item.id === variantId) ?? product.default_variant ?? variants[0];
  const minimum = variant?.minimum_order_quantity ?? 1;
  const multiple = variant?.order_multiple && variant.order_multiple > 1 ? variant.order_multiple : 1;
  const carton = variant?.units_per_carton ?? null;
  const [quantity, setQuantity] = useState(minimum > 1 ? minimum : 1);

  // Images: the selected variant's own media first, then the product's.
  const images = useMemo(() => {
    const variantMedia = variant?.media ?? [];
    const productMedia = product.media ?? [];
    const merged = [...variantMedia, ...productMedia];
    const seen = new Set<string>();
    const urls: { src: string; alt: string }[] = [];
    for (const item of merged) {
      const src = sameOriginMedia(item.large_url || item.medium_url || item.original_url || item.small_url);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      urls.push({ src, alt: item.alt || product.name });
    }
    if (!urls.length) {
      const fallback = productImage(product, "hero");
      if (fallback) urls.push({ src: fallback, alt: product.name });
    }
    return urls;
  }, [variant, product]);

  const current = images[Math.min(activeImage, images.length - 1)];
  const price = variant?.price ?? product.price;
  const compareAt = variant?.original_price?.compare_at_amount ?? product.original_price?.compare_at_amount ?? price?.compare_at_amount ?? null;
  const currency = price?.currency || product.price?.currency || "AFN";
  const purchasable = product.available && product.purchasable && Boolean(variant?.purchasable !== false);

  /** Snap to the nearest allowed multiple at or above the minimum. */
  function normalize(value: number): number {
    if (!Number.isFinite(value)) return minimum;
    const floor = Math.max(minimum, 1);
    if (value < floor) return floor;
    const steps = Math.round((value - floor) / multiple);
    return floor + steps * multiple;
  }

  function chooseVariant(next: string) {
    setVariantId(next);
    setAdded(false);
    const chosen = variants.find((item) => item.id === next);
    const nextMinimum = chosen?.minimum_order_quantity ?? 1;
    setQuantity(normalizeWith(nextMinimum, chosen?.order_multiple ?? 1, quantity));
  }

  async function add() {
    if (!variantId) return;
    setBusy(true);
    setError(null);
    try {
      setCart(await addToCart(variantId, normalize(quantity)));
      setAdded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  const sellerHref = product.seller ? `/vendors/${product.seller.slug || product.seller.id}` : null;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* --------------------------------------------------------- gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          {current ? (
            <Image
              src={current.src}
              alt={current.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-navy-200">
              <Icon name="package" className="h-20 w-20" />
            </span>
          )}
          {product.seller?.name ? (
            <span className="absolute top-3 start-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-bold text-navy-900 shadow-card backdrop-blur-sm">
              <Icon name="shield" className="h-3.5 w-3.5 text-jade-600" />
              {t("badge_verified")}
            </span>
          ) : null}
        </div>

        {images.length > 1 ? (
          <>
            <p className="num mt-3 text-center text-2xs text-gray-500">
              {t("image_counter", { index: formatCount(Math.min(activeImage, images.length - 1) + 1, locale), total: formatCount(images.length, locale) })}
            </p>
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("gallery_label")}>
              {images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-current={index === activeImage}
                  aria-label={t("image_counter", { index: formatCount(index + 1, locale), total: formatCount(images.length, locale) })}
                  className={cx(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-100 transition-colors",
                    index === activeImage ? "border-jade-600" : "border-transparent hover:border-navy-200",
                  )}
                >
                  <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* --------------------------------------------------- purchase panel */}
      <section className="min-w-0">
        <h1 className="text-2xl font-extrabold leading-9 tracking-tight text-navy-950 sm:text-3xl" data-testid="product-title">
          {product.name}
        </h1>

        {variant?.sku ? (
          <p className="num mt-2 text-xs text-gray-500">SKU: <span dir="ltr">{variant.sku}</span></p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="product-price">
          <Price amount={price?.amount} currency={currency} locale={locale} compareAt={compareAt} size="xl" />
          {carton && carton > 1 ? <span className="text-xs text-gray-500">{t("per_unit")}</span> : null}
        </div>

        <p className={cx("mt-2 flex items-center gap-1.5 text-sm font-semibold", purchasable ? "text-jade-700" : "text-red-700")}>
          <Icon name={purchasable ? "check" : "alert"} className="h-4 w-4" />
          {purchasable ? t("in_stock") : product.backorderable ? t("stock_backorderable") : t("out_of_stock")}
        </p>

        {/* Variant selection, grouped by the option types the store publishes. */}
        {variants.length > 1 ? (
          <div className="mt-6">
            <label htmlFor="variant-select" className="mb-1.5 block text-xs font-bold text-navy-900">{t("select_variant")}</label>
            <select
              id="variant-select"
              value={variantId}
              onChange={(event) => chooseVariant(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus-visible:border-jade-500"
            >
              {variants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.options_text || item.sku || t("variant_default")}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Real wholesale rules from the variant. Volume *prices* are not part
            of the Store API, so nothing here invents a tier table. */}
        {minimum > 1 || multiple > 1 || (carton && carton > 1) ? (
          <Card className="mt-6">
            <div className="flex items-center gap-2 px-4 pt-4">
              <Icon name="package" className="h-4 w-4 text-jade-700" />
              <h2 className="text-sm font-bold text-navy-950">{t("wholesale_section_title")}</h2>
              <Badge tone="navy" className="ms-auto">{t("badge_wholesale")}</Badge>
            </div>
            <div className="space-y-0 px-4 py-3 text-sm">
              {minimum > 1 ? <DataRow label={t("minimum_quantity")} value={<span className="num font-bold">{formatCount(minimum, locale)}</span>} /> : null}
              {multiple > 1 ? <DataRow label={t("order_multiple")} value={<span className="num font-bold">{formatCount(multiple, locale)}</span>} /> : null}
              {carton && carton > 1 ? <DataRow label={t("per_carton")} value={<span className="num font-bold">{formatCount(carton, locale)}</span>} /> : null}
              {variant?.purchase_unit ? <DataRow label={t("unit")} value={variant.purchase_unit} /> : null}
            </div>
            <p className="border-t border-gray-100 px-4 py-3 text-xs leading-6 text-gray-500">
              {multiple > 1 ? t("order_multiple_notice") : t("wholesale_section_body")}
              {carton && carton > 1 ? ` ${t("carton_notice", { count: formatCount(carton, locale) })}` : ""}
            </p>
          </Card>
        ) : null}

        {/* Quantity + add to cart */}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="quantity" className="mb-1.5 block text-xs font-bold text-navy-900">{t("select_quantity")}</label>
            <div className="flex h-12 items-center rounded-xl border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((value) => normalize(value - multiple))}
                disabled={quantity <= minimum}
                aria-label={t("decrease_quantity")}
                className="flex h-full w-11 items-center justify-center rounded-s-xl text-navy-700 transition-colors hover:bg-navy-50 disabled:text-gray-300"
              >
                <Icon name="minus" className="h-4 w-4" />
              </button>
              <input
                id="quantity"
                type="number"
                dir="ltr"
                min={minimum}
                step={multiple}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                onBlur={(event) => event.target.value = String(normalize(Number(event.target.value)))}
                aria-label={t("quantity")}
                className="num h-full w-16 border-x border-gray-200 text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((value) => normalize(value + multiple))}
                aria-label={t("increase_quantity")}
                className="flex h-full w-11 items-center justify-center rounded-e-xl text-navy-700 transition-colors hover:bg-navy-50"
              >
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            type="button"
            onClick={add}
            disabled={busy || !purchasable}
            busy={busy}
            size="lg"
            data-testid="add-to-cart"
            className="min-w-48 flex-1"
            iconStart={busy ? undefined : <Icon name="cart" className="h-5 w-5" />}
          >
            {busy ? t("adding_to_cart") : added ? t("added_to_cart") : t("add_to_cart")}
          </Button>
        </div>

        {added ? (
          <Link href="/cart" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-jade-700 underline-offset-4 hover:underline">
            <Icon name="cart" className="h-4 w-4" />
            {t("your_cart")}
          </Link>
        ) : null}

        <Link
          href={`/rfq?variant=${encodeURIComponent(variant?.id ?? product.default_variant_id)}&quantity=${normalize(quantity)}`}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white text-sm font-bold text-navy-900 transition-colors hover:border-navy-300 hover:bg-navy-50"
        >
          <Icon name="quote" className="h-4 w-4 text-jade-700" />
          {t("request_quote_for_product")}
        </Link>

        <ErrorNotice message={error} className="mt-4" />

        {/* Seller */}
        {product.seller ? (
          <Card className="mt-6">
            <div className="flex items-center gap-3 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy-50">
                {sameOriginMedia(product.seller.square_logo_url || product.seller.logo_url) ? (
                  <Image src={sameOriginMedia(product.seller.square_logo_url || product.seller.logo_url) as string} alt={t("vendor_logo_alt")} fill sizes="48px" className="object-cover" />
                ) : (
                  <Icon name="store" className="h-6 w-6 text-navy-400" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-semibold text-gray-500">{t("seller_card_title")}</p>
                <p className="truncate text-sm font-bold text-navy-950">{product.seller.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-2xs font-semibold text-jade-700">
                  <Icon name="shield" className="h-3 w-3" />
                  {t("seller_card_verified")}
                </p>
              </div>
              {sellerHref ? (
                <Link href={sellerHref} className="shrink-0 rounded-lg border border-navy-200 px-3 py-2 text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50">
                  {t("visit_seller_store")}
                </Link>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* Shipping and payment, stated as what is actually configured. */}
        <Card className="mt-4">
          <div className="space-y-0 p-4 text-sm">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-950">
              <Icon name="truck" className="h-4 w-4 text-jade-700" />
              {t("shipping_title")}
            </h2>
            <DataRow label={t("hero_trust_delivery")} value={<Icon name="check" className="h-4 w-4 text-jade-600" />} />
            <DataRow label={t("cash_on_delivery")} value={<Icon name="check" className="h-4 w-4 text-jade-600" />} />
          </div>
          <p className="border-t border-gray-100 px-4 py-3 text-xs leading-6 text-gray-500">{t("shipping_body")}</p>
        </Card>

        <p className="num mt-4 text-2xs text-gray-400">
          {SITE.name} · {t("currency_afn")}
        </p>
      </section>
    </div>
  );
}

/** Snapping helper that takes an explicit minimum/multiple, used when the
 * selected variant changes and the current quantity may no longer be legal. */
function normalizeWith(minimum: number, multiple: number, value: number): number {
  const floor = Math.max(minimum, 1);
  const step = multiple > 1 ? multiple : 1;
  if (!Number.isFinite(value) || value < floor) return floor;
  return floor + Math.round((value - floor) / step) * step;
}
