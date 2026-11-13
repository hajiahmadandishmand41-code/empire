"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, removeCartLineItem, updateCartLineItem, type Cart } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export default function CartPage() {
  const { locale, t } = useLocale();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getCart().then((value) => { if (active) setCart(value); }).catch((err: Error) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function change(id: string, quantity: number | "remove") {
    setBusy(true); setError(null);
    try { setCart(quantity === "remove" ? await removeCartLineItem(id) : await updateCartLineItem(id, quantity)); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const money = (amount: string | null) => formatAmount(amount, cart?.currency || "AFN", locale);
  return <div className="mx-auto max-w-4xl space-y-6">
    <h1 className="text-3xl font-bold">{t("your_cart")}</h1>
    <ErrorNotice message={error} />
    {loading ? <p role="status">{t("loading")}</p> : !cart || cart.items.length === 0 ? <div className="rounded-xl border bg-white p-10 text-center"><p className="mb-2 text-xl">{t("cart_empty")}</p><p className="mb-6 text-gray-500">{t("cart_empty_message")}</p><Link href="/products" className="rounded-lg bg-slate-brand px-5 py-3 text-white">{t("continue_shopping")}</Link></div> : <>
      <div className="space-y-4">{cart.items.map((item) => <article key={item.id} data-testid="cart-item" className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-5">
        <div className="min-w-48 flex-1"><Link href={`/products/${item.slug}`} className="font-semibold">{item.name}</Link><p className="mt-1 text-sm text-gray-500">{money(item.price)}</p></div>
        <div className="flex items-center gap-2" dir="ltr">
          <button type="button" aria-label={t("decrease_quantity")} disabled={busy || item.quantity <= 1} onClick={() => change(item.id, item.quantity - 1)} className="h-9 w-9 rounded border text-lg disabled:opacity-40">−</button>
          <output aria-label={t("quantity")} data-testid="item-quantity" className="w-10 text-center">{item.quantity}</output>
          <button type="button" aria-label={t("increase_quantity")} disabled={busy} onClick={() => change(item.id, item.quantity + 1)} className="h-9 w-9 rounded border text-lg disabled:opacity-40">+</button>
        </div>
        <p className="min-w-28 font-semibold" data-testid="item-total">{money(item.total)}</p>
        <button type="button" disabled={busy} onClick={() => change(item.id, "remove")} data-testid="remove-item" className="text-sm text-red-700 underline disabled:opacity-40">{t("remove_item")}</button>
      </article>)}</div>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">{t("order_summary")}</h2>
        <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt>{t("subtotal")}</dt><dd>{money(cart.item_total)}</dd></div><div className="flex justify-between"><dt>{t("shipping")}</dt><dd>{money(cart.delivery_total)}</dd></div><div className="flex justify-between"><dt>{t("tax")}</dt><dd>{money(cart.tax_total)}</dd></div><div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>{t("total")}</dt><dd data-testid="cart-total">{money(cart.total)}</dd></div></dl>
        <Link href="/checkout" className="mt-6 block rounded-lg bg-slate-brand px-5 py-3 text-center font-semibold text-white">{t("proceed_to_checkout")}</Link>
      </section>
    </>}
  </div>;
}
