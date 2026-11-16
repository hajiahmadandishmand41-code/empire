"use client";

import { useEffect, useState } from "react";
import { listProducts, type Product } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { ProductCard } from "@/components/product-card";
import { ErrorNotice } from "@/components/error-notice";

export function ProductsClient({ initialSearch }: { initialSearch: string }) {
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    listProducts({ limit: 24, search: initialSearch || undefined })
      .then((result) => { if (active) setProducts(result.data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialSearch]);
  return <section className="space-y-6"><h1 className="text-3xl font-bold">{t("products")}</h1>
    <form action="/products"><input type="search" name="q" defaultValue={initialSearch} aria-label={t("search")} placeholder={t("search")} className="w-full max-w-lg rounded-lg border border-gray-300 px-4 py-3" /></form>
    <ErrorNotice message={error} />
    {loading ? <p role="status">{t("loading")}</p> : products.length === 0 ? <p data-testid="no-products">{t("no_products")}</p> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
  </section>;
}
