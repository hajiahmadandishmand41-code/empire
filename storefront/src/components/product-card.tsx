"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCart, type Product } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export function mediaUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value, "http://empire.invalid"); return url.pathname.startsWith("/rails/") ? `${url.pathname}${url.search}` : value; }
  catch { return null; }
}

export function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const image = mediaUrl(product.thumbnail_url);
  const variantId = product.buy_box_variant_id || product.default_variant_id;
  async function add() {
    setBusy(true); setError(null);
    try { await addToCart(variantId, 1); setAdded(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <article data-testid="product-card" className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <Link href={`/products/${product.slug}`} data-testid="product-link" className="block">
        <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
          {image ? <Image src={image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-bold text-gray-300">Empire</div>}
        </div>
        <h3 className="mb-2 font-semibold text-gray-900">{product.name}</h3>
      </Link>
      <p className="mb-4 text-lg font-bold text-emerald-700">{formatAmount(product.price?.amount, product.price?.currency || "AFN", locale)}</p>
      <button type="button" onClick={add} disabled={busy || !product.available || !product.purchasable} data-testid="add-to-cart" className="mt-auto rounded-lg bg-slate-brand px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
        {busy ? t("loading") : added ? t("added_to_cart") : product.available ? t("add_to_cart") : t("out_of_stock")}
      </button>
      {added && <Link href="/cart" className="mt-2 text-center text-sm text-emerald-700 underline">{t("your_cart")}</Link>}
      <ErrorNotice message={error} />
    </article>
  );
}
