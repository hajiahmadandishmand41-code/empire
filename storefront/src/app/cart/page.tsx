"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import {
  getCart,
  updateCartLineItem,
  removeCartLineItem,
  checkoutOrder,
} from "@/lib/api";
import type { JsonMap } from "@/lib/api";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  variantId: number;
  lineItemId: string;
};

export default function CartPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCart();
        if (!cancelled) {
          const order = data.data || data;
          const lineItems = (order.line_items as JsonMap[] | undefined) ?? [];
          setItems(
            lineItems.map((li: JsonMap) => ({
              id: String(li.id),
              name: String(li.name || li.product_name || "محصول"),
              price: Number(li.price || 0),
              qty: Number(li.quantity || 1),
              image: String(li.image_url || "/placeholder.svg"),
              variantId: Number(li.variant_id || 0),
              lineItemId: String(li.id),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            (err as Error)?.message ||
              "اتصال به سرور فروشگاه برقرار نشد. سبد خرید در دسترس نیست."
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shipping = 150000;
  const tax = 0;
  const total = subtotal + shipping + tax;

  const handleQtyChange = async (lineItemId: string, qty: number) => {
    if (qty < 1) return;
    try {
      await updateCartLineItem(lineItemId, qty);
      setItems((prev) =>
        prev.map((it) => (it.lineItemId === lineItemId ? { ...it, qty } : it))
      );
    } catch (err) {
      setApiError(
        (err as Error)?.message || "به‌روزرسانی تعداد ناموفق بود. لطفاً دوباره سعی کنید."
      );
    }
  };

  const handleRemove = async (lineItemId: string) => {
    try {
      await removeCartLineItem(lineItemId);
      setItems((prev) => prev.filter((it) => it.lineItemId !== lineItemId));
    } catch (err) {
      setApiError(
        (err as Error)?.message || "حذف محصول ناموفق بود. لطفاً دوباره سعی کنید."
      );
    }
  };

  const handleCheckout = async () => {
    try {
      const data = await getCart();
      const order = data.data || data;
      await checkoutOrder(String((order as { id?: string }).id));
      setItems([]);
    } catch (err) {
      setApiError(
        (err as Error)?.message || "ثبت سفارش ناموفق بود. لطفاً دوباره سعی کنید."
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex justify-between items-end mb-4">
        <h1 className="text-2xl font-bold text-slate-brand">{t("your_cart")}</h1>
        <Link href="/products" className="text-sm text-emerald-600 hover:underline">
          ← {t("products")}
        </Link>
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
      ) : items.length === 0 ? (
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
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700"></th>
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
                        {formatPrice(it.price * 100)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center ltr">
                      <input
                        type="number"
                        value={it.qty}
                        min="1"
                        onChange={(e) =>
                          handleQtyChange(it.lineItemId, Number(e.target.value))
                        }
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                        dir="ltr"
                      />
                    </td>
                    <td className="px-6 py-4 text-right ltr font-medium">
                      <span className="ltr">{formatPrice(it.price * it.qty * 100)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(it.lineItemId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        {t("remove_item")}
                      </button>
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
                  <span className="ltr">{formatPrice(subtotal * 100)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("shipping")}</span>
                  <span className="ltr">{formatPrice(shipping * 100)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("tax")}</span>
                  <span className="ltr">{formatPrice(tax * 100)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 text-lg font-bold">
                  <span>{t("total")}</span>
                  <span className="ltr text-emerald-600">{formatPrice(total * 100)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="block w-full py-4 bg-slate-brand text-white text-center text-lg font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("proceed_to_checkout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
