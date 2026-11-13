"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProducts, type Product } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { ProductCard } from "@/components/product-card";
import { ErrorNotice } from "@/components/error-notice";

export default function Home() {
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    listProducts({ limit: 4 }).then((result) => { if (active) setProducts(result.data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-slate-brand p-8 text-white md:p-12">
        <h1 className="mb-4 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">{t("hero_title")}</h1>
        <p className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-200">{t("hero_body")}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="rounded-lg bg-white px-6 py-3 font-semibold text-slate-brand">{t("shop_now")}</Link>
          <Link href="/rfq" className="rounded-lg border border-white/30 px-6 py-3 font-semibold">{t("request_quote")}</Link>
        </div>
      </section>
      <section>
        <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold">{t("featured_products")}</h2><Link href="/products" className="text-emerald-700 underline">{t("view_all")}</Link></div>
        <ErrorNotice message={error} />
        {loading ? <p role="status">{t("loading")}</p> : products.length === 0 ? <p data-testid="no-products">{t("no_products")}</p> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>
    </div>
  );
}
