"use client";

import { useCallback, useEffect, useState } from "react";
import { createPayoutRequest, listPayoutRequests, listSellerBalances, selectSeller, selectedSeller, sellerMemberships, staffLogout, type PayoutRequest, type SellerBalance, type StaffSeller } from "@/lib/staff-api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { StaffLogin } from "@/components/staff-login";

export default function SellerPayoutRequestsPage() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false); const [requests, setRequests] = useState<PayoutRequest[]>([]); const [balances, setBalances] = useState<SellerBalance[]>([]); const [sellers, setSellers] = useState<StaffSeller[]>([]);
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { const [r, b, s] = await Promise.all([listPayoutRequests("seller"), listSellerBalances(), sellerMemberships()]); setRequests(r); setBalances(b); setSellers(s); setReady(true); }, []);
  useEffect(() => { let active = true; (async () => { try { const [r, b, s] = await Promise.all([listPayoutRequests("seller"), listSellerBalances(), sellerMemberships()]); if (active) { setRequests(r); setBalances(b); setSellers(s); setReady(true); } } catch { if (active) setReady(false); } })(); return () => { active = false; }; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await createPayoutRequest(note); setNote(""); await load(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function signOut() { await staffLogout("seller"); setReady(false); setRequests([]); }
  return <div className="mx-auto max-w-4xl space-y-6"><h1 className="text-3xl font-bold">{t("payout_requests")}</h1><ErrorNotice message={error} />
    {!ready ? <StaffLogin audience="seller" onSuccess={() => { void load().catch((err: Error) => setError(err.message)); }} /> : <>
      <div className="flex flex-wrap items-center justify-between gap-3">{sellers.length > 1 && <select value={selectedSeller() || ""} onChange={(e) => { selectSeller(e.target.value); void load().catch((err: Error) => setError(err.message)); }} className="rounded-lg border p-2">{sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select>}<button onClick={signOut} className="rounded-lg border px-4 py-2 text-sm">{t("logout")}</button></div>
      <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 text-lg font-bold">{t("balances")}</h2>{balances.length === 0 ? <p className="text-sm text-gray-500">{t("no_balance")}</p> : <ul className="space-y-1 text-sm">{balances.map((balance) => <li key={balance.currency} dir="ltr">{balance.currency}: {balance.balance}</li>)}</ul>}</section>
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-5"><label className="block text-sm">{t("payout_note")}<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className="mt-1 w-full rounded-lg border p-2.5" /></label><button disabled={busy} className="rounded-lg bg-slate-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("request_payout")}</button></form>
      <section className="space-y-3">{requests.length === 0 ? <p>{t("no_payout_requests")}</p> : requests.map((request) => <article key={request.id} className="flex flex-wrap justify-between gap-3 rounded-xl border bg-white p-4" data-testid="payout-request"><span>{t(`payout_status_${request.status}` as "payout_status_requested")}</span><span dir="ltr">{request.currency}</span><span className="text-sm text-gray-600">{request.note}</span></article>)}</section>
    </>}
  </div>;
}
