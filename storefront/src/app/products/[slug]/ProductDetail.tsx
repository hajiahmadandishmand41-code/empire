"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCart, type Product } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { mediaUrl } from "@/components/product-card";

export function ProductDetail({ product, apiError }: { product: Product | null; apiError: string | null }) {
  const { locale, t } = useLocale();
  const [variantId, setVariantId] = useState(product?.buy_box_variant_id || product?.default_variant_id || "");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(apiError);
  if (!product) return <div><h1 className="text-2xl font-bold">{t("product_not_found")}</h1><ErrorNotice message={error || "backend_error"} /><Link href="/products" className="text-emerald-700 underline">{t("back")}</Link></div>;
  const variant = product.variants?.find((item) => item.id === variantId);
  const minimum = variant?.minimum_order_quantity || 1;
  const image = mediaUrl(product.thumbnail_url);
  async function add() {
    setBusy(true); setError(null);
    try { await addToCart(variantId, Math.max(quantity, minimum)); setAdded(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <nav className="text-sm text-gray-500"><Link href="/products" className="text-emerald-700 underline">{t("products")}</Link> / {product.name}</nav>
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">{image ? <Image src={image} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-5xl font-bold text-gray-300">Empire</div>}</div>
      <section className="space-y-5">
        <h1 className="text-3xl font-bold" data-testid="product-title">{product.name}</h1>
        <p className="text-2xl font-bold text-emerald-700" data-testid="product-price">{formatAmount(variant?.price?.amount ?? product.price?.amount, product.price?.currency || "AFN", locale)}</p>
        <p className={product.available ? "text-emerald-700" : "text-red-700"}>{product.available ? t("in_stock") : t("out_of_stock")}</p>
        {product.seller && <p className="text-sm text-gray-600">{t("seller")}: {product.seller.name}</p>}
        <p className="leading-7 text-gray-700">{product.description}</p>
        {product.variants && product.variants.length > 1 && <label className="block text-sm">{t("quantity")}<select value={variantId} onChange={(event) => { setVariantId(event.target.value); setAdded(false); }} className="mt-1 block w-full rounded-lg border border-gray-300 p-2">{product.variants.map((item) => <option key={item.id} value={item.id}>{item.sku || item.id}</option>)}</select></label>}
        {minimum > 1 && <p className="text-sm">{t("minimum_quantity")}: {minimum}</p>}
        {variant?.order_multiple && variant.order_multiple > 1 && <p className="text-sm">{t("order_multiple")}: {variant.order_multiple}</p>}
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">{t("quantity")}<input aria-label={t("quantity")} type="number" min={minimum} step={variant?.order_multiple || 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1 block w-24 rounded-lg border border-gray-300 p-2" dir="ltr" /></label>
          <button type="button" onClick={add} disabled={busy || !product.available || !product.purchasable} data-testid="add-to-cart" className="rounded-lg bg-slate-brand px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : added ? t("added_to_cart") : t("add_to_cart")}</button>
        </div>
        {added && <Link href="/cart" className="block text-emerald-700 underline">{t("your_cart")}</Link>}
        <Link href={`/rfq?variant=${product.default_variant_id}`} className="block text-sm text-emerald-700 underline">{t("request_quote")}</Link>
        <ErrorNotice message={error} />
      </section>
    </div>
  </div>;
}
