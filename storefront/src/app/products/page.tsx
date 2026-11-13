"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/v3/store/products?per_page=20`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
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
      } catch {
        // API not reachable in this environment — fall back to placeholders
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const fallback = [
    { id: 1, name: "نمونه محصول۱", price: 450000, inStock: true, slug: "sample-1" },
    { id: 2, name: "نمونه محصول۲", price: 1200000, inStock: true, slug: "sample-2" },
    { id: 3, name: "نمونه محصول۳", price: 750000, inStock: false, slug: "sample-3" },
  ];

  const list = products.length > 0 ? products : fallback;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-brand">{t("products")}</h1>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          {t("loading")}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{t("not_found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.map((p) => (
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
                    {formatPrice(p.price)}
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
