"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { listProducts } from "@/lib/api";
import type { JsonMap } from "@/lib/api";

export default function ProductsPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  const [products, setProducts] = useState<Array<{
    id: number;
    name: string;
    price: number | null;
    inStock: boolean;
    slug: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listProducts({ per_page: 20 });
        if (!cancelled) {
          setProducts(
            ((data.data as JsonMap[] | undefined) ?? []).map((p: JsonMap) => ({
              id: Number(p.id),
              name: String(p.name),
              price: p.price != null ? Number(p.price) : null,
              inStock: Boolean(p.available ?? true),
              slug: String(p.slug),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            (err as Error)?.message ||
              "اتصال به سرور فروشگاه برقرار نشد. لطفاً بعداً دوباره سعی کنید."
          );
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-brand">{t("products")}</h1>
      </div>

      {apiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-amber-800">
                خطای اتصال به سرور فروشگاه
              </div>
              <div className="text-sm text-amber-700 mt-1">{apiError}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          {t("loading")}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>
            محصولی یافت نشد. {apiError || "سرور فروشگاه در دسترس نیست."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <article
              key={p.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-md transition"
            >
              <Link href={`/products/${p.slug}`}>
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">تصویر محصول</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                  {p.name}
                </h3>
              </Link>
              <div className="mt-auto flex items-baseline gap-2">
                {p.price != null && (
                  <span className="text-emerald-600 font-bold text-lg ltr">
                    {p.price} AFN
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <button className="flex-1 py-2 bg-slate-brand text-white text-sm rounded-lg hover:bg-slate-700 transition disabled:opacity-50" disabled={!p.inStock}>
                  {t("add_to_cart")}
                </button>
                {!p.inStock && (
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                    {t("out_of_stock")}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
