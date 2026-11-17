"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useCart } from "@/components/cart-context";
import { ErrorNotice } from "@/components/error-notice";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { Price } from "@/components/ui/price";
import { Spinner } from "@/components/ui/button";
import {
  addToCart, isOnOffer, isWholesale, productImage, sameOriginMedia,
  type Product, type Variant,
} from "@/lib/api";
import { formatCount } from "@/lib/numbers";
import { isNew } from "@/lib/numbers";
import { cx } from "@/lib/cx";

/** Kept as an alias: `sameOriginMedia` in lib/api.ts is the single
 * implementation, and older pages still import this name. */
export const mediaUrl = sameOriginMedia;

/** The variant the buy box will actually add: Spree's own buy-box choice when
 * it publishes one, otherwise the default variant. */
function buyBoxVariant(product: Product): Variant | undefined {
  const variants = product.variants ?? [];
  if (product.buy_box_variant_id) {
    const chosen = variants.find((variant) => variant.id === product.buy_box_variant_id);
    if (chosen) return chosen;
  }
  if (product.default_variant) return product.default_variant;
  if (product.default_variant_id) return variants.find((variant) => variant.id === product.default_variant_id);
  return variants[0];
}

/** Smallest MOQ across variants — the honest "from" quantity for a card. */
function minimumQuantity(product: Product, variant?: Variant): number {
  const quantities = (product.variants?.length ? product.variants : variant ? [variant] : [])
    .map((item) => item.minimum_order_quantity ?? 1)
    .filter((value) => value > 1);
  return quantities.length ? Math.min(...quantities) : variant?.minimum_order_quantity ?? 1;
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { locale, t } = useLocale();
  const { setCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = buyBoxVariant(product);
  const variantId = variant?.id ?? product.buy_box_variant_id ?? product.default_variant_id;
  const image = productImage(product, "card");
  const price = variant?.price ?? product.price;
  const compareAt = variant?.original_price?.compare_at_amount ?? product.original_price?.compare_at_amount ?? price?.compare_at_amount ?? null;
  const currency = price?.currency || product.price?.currency || "AFN";
  const purchasable = product.available && product.purchasable && Boolean(variantId);
  const moq = minimumQuantity(product, variant);
  const wholesale = isWholesale(product);
  const offer = isOnOffer(product);
  const fresh = isNew(product.available_on);
  const carton = variant?.units_per_carton ?? null;

  async function add() {
    if (!variantId) return;
    setBusy(true);
    setError(null);
    try {
      // Adopt the returned cart so the header badge updates immediately; the
      // store is the authority on quantity rules, so its response is kept
      // rather than a locally incremented count.
      setCart(await addToCart(variantId, moq > 1 ? moq : 1));
      setAdded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      data-testid="product-card"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised"
    >
      <Link href={`/products/${product.slug}`} data-testid="product-link" className="flex min-w-0 flex-1 flex-col">
        <div className={cx("relative w-full overflow-hidden bg-gray-100", compact ? "aspect-[4/3]" : "aspect-square")}>
          {image ? (
            <Image
              src={image}
              alt={product.primary_media?.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-navy-200">
              <Icon name="package" className="h-12 w-12" />
            </span>
          )}

          {/* Badges sit over the image, start-aligned so they follow dir. */}
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-1.5 p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {offer ? <Badge tone="saffron">{t("badge_offer")}</Badge> : null}
              {fresh && !offer ? <Badge tone="jade">{t("badge_new")}</Badge> : null}
              {wholesale ? <Badge tone="navy">{t("badge_wholesale")}</Badge> : null}
            </div>
            {product.seller?.name ? (
              <span className="flex max-w-28 items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-2xs font-semibold text-navy-800 backdrop-blur-sm">
                <Icon name="shield" className="h-3 w-3 shrink-0 text-jade-600" />
                <span className="truncate">{product.seller.name}</span>
              </span>
            ) : null}
          </div>

          {!purchasable ? (
            <span className="absolute inset-x-0 bottom-0 bg-navy-950/80 px-3 py-1.5 text-center text-2xs font-bold text-white">
              {t("out_of_stock")}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3.5">
          {product.seller?.name && !compact ? (
            <p className="mb-1 truncate text-2xs text-gray-500">{t("seller_card_title")}: {product.seller.name}</p>
          ) : null}
          <h3 className={cx("font-bold leading-6 text-navy-950", compact ? "line-clamp-1 text-sm" : "line-clamp-2 text-sm")}>
            {product.name}
          </h3>

          {variant?.options_text ? (
            <p className="mt-1 truncate text-2xs text-gray-500">{variant.options_text}</p>
          ) : null}

          <div className="mt-2">
            <Price amount={price?.amount} currency={currency} locale={locale} compareAt={compareAt} size={compact ? "sm" : "md"} />
          </div>

          {/* Wholesale terms are real variant data, not decoration: MOQ and
              carton size change what the shopper is allowed to add. */}
          {wholesale ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {moq > 1 ? <Badge tone="outline">{t("badge_moq", { count: formatCount(moq, locale) })}</Badge> : null}
              {carton && carton > 1 ? <Badge tone="outline">{t("badge_carton", { count: formatCount(carton, locale) })}</Badge> : null}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="mt-auto px-3.5 pb-3.5">
        <button
          type="button"
          onClick={add}
          disabled={busy || !purchasable}
          data-testid="add-to-cart"
          className={cx(
            "flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors",
            added
              ? "bg-jade-50 text-jade-700"
              : purchasable
                ? "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 disabled:bg-navy-900/40"
                : "cursor-not-allowed bg-gray-100 text-gray-400",
          )}
        >
          {busy ? (
            <><Spinner className="h-4 w-4" />{t("adding_to_cart")}</>
          ) : added ? (
            <><Icon name="check" className="h-4 w-4" />{t("added_to_cart")}</>
          ) : purchasable ? (
            <><Icon name="cart" className="h-4 w-4" />{t("add_to_cart")}</>
          ) : (
            t("out_of_stock")
          )}
        </button>
        {added ? (
          <Link href="/cart" className="mt-2 block text-center text-xs font-semibold text-jade-700 underline-offset-4 hover:underline">
            {t("your_cart")}
          </Link>
        ) : null}
        <ErrorNotice message={error} className="mt-2" />
      </div>
    </article>
  );
}
