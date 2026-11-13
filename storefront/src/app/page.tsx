"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";

export default function Home() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  // Placeholder featured products — in production these come from the Spree API
  const featured = [
    { id: 1, name: "نمونه محصول ofreció", price: 450000, image: "/placeholder.svg", inStock: true },
    { id: 2, name: "محصول ویژه دوم", price: 1200000, image: "/placeholder.svg", inStock: true },
    { id: 3, name: "کالا پرفروش", price: 750000, image: "/placeholder.svg", inStock: false },
  ];

  const categories = [
    { name: t("categories"), count: 12 },
    { name: t("brands"), count: 8 },
    { name: t("best_sellers"), count: 15 },
    { name: t("wholesale_offers"), count: 6 },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative rounded-2xl bg-slate-brand p-8 md:p-12 text-white overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {t("app_name")} — بازارگاه تجارت الکترونیک
          </h1>
          <p className="text-lg text-gray-200 mb-6 max-w-lg leading-relaxed">
            خرید و فروش عمده و خرده، بازارگاه چندفروشنده، حساب‌های شرکت و
            RFQ. از کابل تا toute ولایت‌های افغانستان و به seluruh جهان.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/products"
              className="px-6 py-3 bg-white text-slate-brand font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              {t("products")}
            </Link>
            <Link
              href="/rfq"
              className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition"
            >
              {t("request_quote")}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-slate-brand">{t("featured_products")}</h2>
          <Link href="/products" className="text-sm text-emerald-600 hover:underline">
            مشاهده همه →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <article
              key={p.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-md transition group"
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{p.image}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{p.name}</h3>
              <div className="mt-auto flex items-baseline gap-2">
                <span className="text-emerald-600 font-bold text-lg ltr">
                  {formatPrice(p.price)}
                </span>
                {!p.inStock && (
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                    {t("out_of_stock")}
                  </span>
                )}
              </div>
              <button className="mt-3 w-full py-2 bg-slate-brand text-white text-sm rounded-lg hover:bg-slate-700 transition disabled:opacity-50" disabled={!p.inStock}>
                {t("add_to_cart")}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Categories grid */}
      <section className="bg-white border-t border-gray-200 py-8">
        <h2 className="text-xl font-bold text-slate-brand mb-6">
          {t("categories")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              href="/categories"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-gray-50 transition text-center"
            >
              <span className="text-emerald-600 font-mono text-sm">{c.count}</span>
              <span className="text-sm font-medium text-gray-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / info */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
        {[
          { label: t("cash_on_delivery"), icon: "COD" },
          { label: t("bank_transfer"), icon: "BT" },
          { label: "تهیه فوری", icon: "QS" },
          { label: "حمایت ۲۴/۷", icon: "24" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              {item.icon}
            </div>
            <span className="text-sm text-gray-700 leading-tight">{item.label}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
