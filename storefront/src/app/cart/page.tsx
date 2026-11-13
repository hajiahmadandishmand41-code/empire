"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";

export default function CartPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  const [items, setItems] = useState<Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    image: string;
  }>>([
    { id: "1", name: "نمونه محصول یک", price: 450000, qty: 2, image: "/placeholder.svg" },
    { id: "2", name: "نمونه محصول دو", price: 1200000, qty: 1, image: "/placeholder.svg" },
  ]);

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shipping = 150000;
  const tax = Math.round(subtotal * 0.0);
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex justify-between items-end mb-4">
        <h1 className="text-2xl font-bold text-slate-brand">{t("your_cart")}</h1>
        <Link href="/products" className="text-sm text-emerald-600 hover:underline">
          ← {t("products")}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-2xl">
          <p className="text-gray-500 text-lg">{t("cart_empty")}</p>
          <p className="text-sm text-gray-400">{t("cart_empty_message")}</p>
          <Link
            href="/products"
            className="mt-6 inline-block px-6 py-2 bg-slate-brand text-white rounded-lg hover:bg-slate-700 transition"
          >
            {t("products")}
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    {t("products")}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right ltr">
                    {t("price")}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center ltr">
                    {t("quantity")}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right ltr">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((it) => (
                  <tr key={it.id} className="group hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-xs text-gray-400">{it.image}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{it.name}</div>
                          <div className="text-xs text-gray-500">SKU: SMP-{it.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right ltr">
                      <span className="text-gray-900 font-medium ltr">
                        {formatPrice(it.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center ltr">
                      <input
                        type="number"
                        value={it.qty}
                        min="1"
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                        dir="ltr"
                      />
                    </td>
                    <td className="px-6 py-4 text-right ltr font-medium">
                      <span className="ltr">{formatPrice(it.price * it.qty)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-brand mb-4">
                {t("order_summary")}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t("subtotal")}</span>
                  <span className="ltr">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("shipping")}</span>
                  <span className="ltr">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("tax")}</span>
                  <span className="ltr">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 text-lg font-bold">
                  <span>{t("total")}</span>
                  <span className="ltr text-emerald-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <Link
                href="/checkout"
                className="block w-full py-4 bg-slate-brand text-white text-center text-lg font-semibold rounded-lg hover:bg-slate-700 transition"
              >
                {t("proceed_to_checkout")}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
