"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";

type Product = {
  name?: string;
  price?: number | null;
  wholesale_price?: number | null;
  description?: string;
  brand?: string;
  seller?: string;
  inStock?: boolean;
  sku?: string;
  moq?: number;
};

export function ProductDetail({ product }: { product: Product }) {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);
  const p = product;

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
        <span className="text-gray-900">{p.name ?? "—"}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
            <span className="text-gray-400 text-sm">تصویر محصول</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            {p.brand && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("brand")}: {p.brand}
              </span>
            )}
            <h1 className="text-2xl font-bold text-slate-brand">{p.name ?? "—"}</h1>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-emerald-600 font-bold text-2xl ltr">
                {formatPrice(p.price ?? null)}
              </span>
              {p.wholesale_price != null && (
                <span className="text-sm text-gray-500 line-through ltr">
                  {formatPrice(p.wholesale_price)}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs font-medium rounded-full px-2 py-1 ${
                p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {p.inStock ? t("in_stock") : t("out_of_stock")}
              </span>
              <span className="text-xs text-gray-500">
                {t("sku")}: {p.sku ?? "—"}
              </span>
            </div>
          </div>

          {p.moq && p.moq > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t("moq")}: {p.moq}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{t("description")}</h3>
            <p className="text-gray-700 leading-relaxed">
              {p.description ?? "توضیحات محصول در دستpresence نیست."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{t("specifications")}</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>برند: {p.brand ?? "—"}</li>
              <li>فروشنده: {p.seller ?? "—"}</li>
              <li>
                موجودی: {p.inStock ? t("in_stock") : t("out_of_stock")}
              </li>
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
                disabled={!p.inStock}
              >
                {t("add_to_cart")}
              </button>
            </div>
            {p.inStock && (
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
