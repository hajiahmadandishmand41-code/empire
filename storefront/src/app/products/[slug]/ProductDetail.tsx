"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";

type Product = Record<string, unknown> | null;

export function ProductDetail({ product, apiError }: { product: Product; apiError: string | null }) {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  const p = product ?? {};
  const name = (p.name ?? "—") as string;
  const price = p.price != null ? Number(p.price) : null;
  const wholesalePrice = p.wholesale_price != null ? Number(p.wholesale_price) : null;
  const description = (p.description ?? "") as string;
  const brand = (p.brand ?? "—") as string;
  const seller = (p.seller ?? "—") as string;
  const inStock = Boolean(p.available ?? true);
  const sku = (p.sku ?? "—") as string;
  const moq = p.moq != null ? Number(p.moq) : undefined;

  // API error state (backend unreachable / product not found)
  if (apiError || (!p.name && !apiError)) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <Link href="/products" className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1">
          ← {t("back")}
        </Link>
        {apiError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <svg className="w-6 h-6 text-amber-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-amber-800 mb-2">{t("product_not_found")}</h2>
            <p className="text-amber-700 mb-4">{apiError}</p>
            <Link
              href="/products"
              className="inline-block px-5 py-2 bg-slate-brand text-white rounded-lg hover:bg-slate-700 transition"
            >
              {t("products")}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <nav className="flex gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-emerald-600">
          {t("home")}
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-emerald-600">
          {t("products")}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
            <span className="text-gray-400 text-sm">تصویر محصول</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            {brand !== "—" && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("brand")}: {brand}
              </span>
            )}
            <h1 className="text-2xl font-bold text-slate-brand">{name}</h1>
            <div className="flex items-baseline gap-2 mt-2">
              {price != null && (
                <span className="text-emerald-600 font-bold text-2xl ltr">
                  {formatPrice(price * 100)}
                </span>
              )}
              {wholesalePrice != null && (
                <span className="text-sm text-gray-500 line-through ltr">
                  {formatPrice(wholesalePrice * 100)}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs font-medium rounded-full px-2 py-1 ${
                inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {inStock ? t("in_stock") : t("out_of_stock")}
              </span>
              <span className="text-xs text-gray-500">
                {t("sku")}: {sku}
              </span>
            </div>
          </div>

          {moq && moq > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t("moq")}: {moq}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{t("description")}</h3>
            <p className="text-gray-700 leading-relaxed">
              {description || "توضیحات محصول در دسترس نیست."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{t("specifications")}</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>برند: {brand}</li>
              <li>فروشنده: {seller}</li>
              <li>موجودی: {inStock ? t("in_stock") : t("out_of_stock")}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{t("variants")}</h3>
            <div className="flex gap-3">
              {["S", "M", "L", "XL"].map((size) => (
                <button
                  key={size}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="number"
                defaultValue="1"
                min="1"
                className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg text-center"
                dir="ltr"
              />
              <button
                className="flex-1 py-2.5 bg-slate-brand text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                disabled={!inStock}
              >
                {t("add_to_cart")}
              </button>
            </div>
            {inStock && (
              <button className="mt-3 w-full py-2.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
                {t("buy_now")}
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link href="/rfq" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline font-medium">
              {t("request_quote")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
