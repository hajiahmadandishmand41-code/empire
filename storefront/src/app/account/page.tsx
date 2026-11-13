"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAddress, getAccount, listAddresses, listOrders, listProvinces, logout, signedIn, type Address, type Customer, type Order, type Province } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { AddressFields, emptyAddress } from "@/components/address-fields";

export default function AccountPage() {
  const { locale, t } = useLocale(); const router = useRouter();
  const [checked, setChecked] = useState(false); const [user, setUser] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]); const [addresses, setAddresses] = useState<Address[]>([]); const [provinces, setProvinces] = useState<Province[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress); const [adding, setAdding] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!signedIn()) { setChecked(true); return; }
      try {
        const [account, orderResult, addressResult, provinceResult] = await Promise.all([getAccount(), listOrders(), listAddresses(), listProvinces()]);
        if (!active) return; setUser(account); setOrders(orderResult.data); setAddresses(addressResult.data); setProvinces(provinceResult.data);
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setChecked(true); }
    })();
    return () => { active = false; };
  }, []);
  async function saveAddress(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try { const result = await createAddress(address); setAddresses([...addresses, result]); setAdding(false); setSaved(true); setAddress(emptyAddress); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function signOut() { await logout(); router.push("/login"); router.refresh(); }
  if (!checked) return <p role="status">{t("loading")}</p>;
  if (!user) return <div className="mx-auto max-w-lg rounded-xl border bg-white p-8"><h1 className="mb-4 text-2xl font-bold">{t("account")}</h1><ErrorNotice message={error} /><p className="mb-6">{t("login_or_guest")}</p><div className="flex gap-3"><Link href="/login" className="rounded-lg bg-slate-brand px-5 py-2 text-white">{t("login")}</Link><Link href="/register" className="rounded-lg border px-5 py-2">{t("register")}</Link></div></div>;
  return <div className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">{t("account")}</h1><p className="mt-2 text-gray-600">{t("welcome")}، {user.first_name} {user.last_name} — <span dir="ltr">{user.email}</span></p></div><button onClick={signOut} className="rounded-lg border px-4 py-2 text-sm">{t("logout")}</button></div>
    <ErrorNotice message={error} />
    <section><h2 className="mb-4 text-xl font-bold">{t("my_orders")}</h2>{orders.length === 0 ? <p className="text-gray-500">{t("no_orders")}</p> : <div className="space-y-3">{orders.map((order) => <article key={order.id} className="flex flex-wrap justify-between gap-3 rounded-xl border bg-white p-4"><span dir="ltr">{order.number}</span><span>{t(`order_status_${order.status}` as "order_status_placed") || order.status}</span><span className="font-semibold">{formatAmount(order.total, order.currency, locale)}</span></article>)}</div>}</section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{t("addresses")}</h2><button onClick={() => setAdding(!adding)} className="rounded-lg border px-4 py-2 text-sm">{adding ? t("cancel") : t("add_address")}</button></div>
      {saved && <p role="status" className="mb-3 text-emerald-700">{t("address_saved")}</p>}
      {addresses.length === 0 && !adding && <p className="text-gray-500">{t("no_addresses")}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{addresses.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4 text-sm leading-6"><p className="font-semibold">{item.first_name} {item.last_name}</p><p>{item.address1}، {item.city}، {item.state_name}</p><p dir="ltr">{item.phone}</p></article>)}</div>
      {adding && <form onSubmit={saveAddress} className="mt-4 max-w-2xl space-y-4 rounded-xl border bg-white p-6"><AddressFields value={address} onChange={setAddress} provinces={provinces} /><button disabled={busy} className="rounded-lg bg-slate-brand px-5 py-2 text-white disabled:opacity-50">{busy ? t("loading") : t("save")}</button></form>}
    </section>
  </div>;
}
