"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { choosePayment, completeCart, getAccount, getCart, listCompanies, listProvinces, selectDelivery, signedIn, updateCart, type Address, type Cart, type Company, type Province, type Purchase } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { AddressFields, emptyAddress } from "@/components/address-fields";

export default function CheckoutPage() {
  const { locale, t } = useLocale();
  const [cart, setCart] = useState<Cart | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [address, setAddress] = useState<Address>(emptyAddress); const [billing, setBilling] = useState<Address>(emptyAddress); const [sameBilling, setSameBilling] = useState(true);
  const [email, setEmail] = useState(""); const [companies, setCompanies] = useState<Company[]>([]); const [companyId, setCompanyId] = useState(""); const [poNumber, setPoNumber] = useState("");
  const [provinces, setProvinces] = useState<Province[]>([]); const [paymentMethod, setPaymentMethod] = useState(""); const [paymentReady, setPaymentReady] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await getCart();
        const provinceResult = await listProvinces();
        let accountEmail = ""; let companyResult: Company[] = [];
        if (signedIn()) { const account = await getAccount(); accountEmail = account.email; companyResult = (await listCompanies()).data; }
        if (!active) return;
        setCart(current); setProvinces(provinceResult.data); setCompanies(companyResult);
        setEmail(current?.email || accountEmail); setAddress(current?.shipping_address || emptyAddress); setBilling(current?.billing_address || emptyAddress);
        setCompanyId(current?.company_id || ""); setPoNumber(current?.po_number || "");
        setPaymentMethod(current?.payment_methods.find((method) => !method.session_required)?.id || "");
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  async function saveAddress(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      await updateCart({ email, shipping_address: address, billing_address: sameBilling ? undefined : billing, use_shipping: sameBilling, company_id: companyId || null, po_number: poNumber || null });
      setCart(await getCart()); setPaymentReady(false);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function chooseDelivery(fulfillmentId: string, rateId: string) {
    setBusy(true); setError(null);
    try { setCart(await selectDelivery(fulfillmentId, rateId)); setPaymentReady(false); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function placeOrder() {
    setBusy(true); setError(null);
    try { if (!paymentReady) { await choosePayment(paymentMethod); setPaymentReady(true); } setPurchase(await completeCart()); setCart(null); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const money = (amount: string | null | undefined) => formatAmount(amount, cart?.currency || "AFN", locale);
  const methods = cart?.payment_methods.filter((method) => !method.session_required) || [];
  const deliveryReady = Boolean(cart?.shipping_address && cart.fulfillments.length > 0 && cart.fulfillments.every((item) => item.selected_delivery_rate_id));
  if (loading) return <p role="status">{t("loading")}</p>;
  if (purchase) return <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center" data-testid="order-success"><h1 className="mb-4 text-2xl font-bold text-emerald-700">{t("order_placed")}</h1><p className="mb-2">{t("order_number")}: <span dir="ltr">{purchase.number || purchase.id}</span></p>{purchase.orders?.map((order) => <p key={order.id} dir="ltr">{order.number}</p>)}<Link href="/account" className="mt-6 inline-block rounded-lg bg-slate-brand px-5 py-3 text-white">{t("my_orders")}</Link></div>;
  if (!cart || cart.items.length === 0) return <div><h1 className="mb-4 text-2xl font-bold">{t("checkout")}</h1><p className="mb-6">{t("cart_empty")}</p><Link href="/products" className="text-emerald-700 underline">{t("continue_shopping")}</Link></div>;
  return <div className="mx-auto max-w-5xl space-y-6"><h1 className="text-3xl font-bold">{t("checkout")}</h1><ErrorNotice message={error} />
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <form onSubmit={saveAddress} className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{t("shipping_address")}</h2>
          <label className="block text-sm">{t("email")}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label>
          {companies.length > 0 && <label className="block text-sm">{t("company")}<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2.5"><option value="">{t("personal_purchase")}</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
          {companyId && <label className="block text-sm">{t("po_number")}<input required={cart.po_number_required} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label>}
          <AddressFields value={address} onChange={setAddress} provinces={provinces} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sameBilling} onChange={(e) => setSameBilling(e.target.checked)} />{t("same_billing")}</label>
          {!sameBilling && <><h3 className="font-semibold">{t("billing_address")}</h3><AddressFields value={billing} onChange={setBilling} provinces={provinces} /></>}
          <button disabled={busy} className="rounded-lg bg-slate-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("save")}</button>
        </form>
        {cart.shipping_address && <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{t("delivery_method")}</h2>
          {cart.fulfillments.length === 0 ? <p className="text-sm text-gray-500">{t("select_delivery")}</p> : cart.fulfillments.map((fulfillment) => <div key={fulfillment.id} className="block text-sm"><label htmlFor={`delivery-${fulfillment.id}`}>{t("delivery_method")}</label><select id={`delivery-${fulfillment.id}`} required disabled={busy} value={fulfillment.selected_delivery_rate_id || ""} onChange={(e) => chooseDelivery(fulfillment.id, e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2.5"><option value="">{t("select_delivery")}</option>{fulfillment.delivery_rates.map((rate) => <option key={rate.id} value={rate.id}>{rate.name || t("shipping")} — {money(rate.cost)}</option>)}</select></div>)}
        </section>}
        {deliveryReady && <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{t("payment_method")}</h2>{methods.length === 0 ? <p>{t("no_payment_methods")}</p> : methods.map((method) => <label key={method.id} className="flex items-start gap-3 rounded-lg border p-4"><input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => { setPaymentMethod(method.id); setPaymentReady(false); }} /><span><span className="block font-semibold">{method.name}</span><span className="text-sm text-gray-500">{method.description}</span></span></label>)}</section>}
      </div>
      <aside className="h-fit rounded-xl border bg-white p-6"><h2 className="mb-4 text-xl font-bold">{t("order_summary")}</h2><ul className="mb-4 space-y-2 text-sm">{cart.items.map((item) => <li key={item.id} className="flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><span>{money(item.total)}</span></li>)}</ul><dl className="space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><dt>{t("subtotal")}</dt><dd>{money(cart.item_total)}</dd></div><div className="flex justify-between"><dt>{t("shipping")}</dt><dd>{money(cart.delivery_total)}</dd></div><div className="flex justify-between"><dt>{t("tax")}</dt><dd>{money(cart.tax_total)}</dd></div><div className="flex justify-between text-lg font-bold"><dt>{t("total")}</dt><dd data-testid="checkout-total">{money(cart.total)}</dd></div></dl>
        {cart.requirements.length > 0 && <ul className="mt-4 space-y-1 text-sm text-amber-700">{cart.requirements.map((requirement) => <li key={requirement.code}>{requirement.message}</li>)}</ul>}
        <button type="button" onClick={placeOrder} disabled={busy || !deliveryReady || !paymentMethod} data-testid="place-order" className="mt-6 w-full rounded-lg bg-slate-brand px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("place_order")}</button>
      </aside>
    </div>
  </div>;
}
