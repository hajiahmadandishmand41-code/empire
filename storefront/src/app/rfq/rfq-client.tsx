"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptQuote, createRfq, getRfq, listCompanies, listRfqs, signedIn, type Company, type Rfq } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export function RfqClient({ variantId }: { variantId: string }) {
  const { locale, t } = useLocale();
  const [rfqs, setRfqs] = useState<Rfq[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [selected, setSelected] = useState<Rfq | null>(null);
  const [form, setForm] = useState({ title: "", description: "", requested_quantity: 1, company_id: "", budget_min: "", budget_max: "" });
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function reload() { const result = await listRfqs(); setRfqs(result.data); }
  useEffect(() => {
    let active = true;
    (async () => {
      if (!signedIn()) { setLoading(false); return; }
      try { const [rfqResult, companyResult] = await Promise.all([listRfqs(), listCompanies()]); if (active) { setRfqs(rfqResult.data); setCompanies(companyResult.data); } }
      catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await createRfq({ ...form, company_id: form.company_id || undefined, variant_id: variantId || undefined, budget_min: form.budget_min || undefined, budget_max: form.budget_max || undefined }); setForm({ ...form, title: "", description: "" }); await reload(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function accept(rfqId: number, quoteId: number) {
    setBusy(true); setError(null);
    try { setSelected(await acceptQuote(rfqId, quoteId)); await reload(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (loading) return <p>{t("loading")}</p>;
  if (!signedIn()) return <div><h1 className="mb-4 text-3xl font-bold">{t("rfq")}</h1><Link href="/login" className="text-emerald-700 underline">{t("login")}</Link></div>;
  return <div className="space-y-8"><h1 className="text-3xl font-bold">{t("rfq")}</h1><ErrorNotice message={error} />
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border bg-white p-6">
      <label className="block text-sm">{t("rfq_title")}<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5" /></label>
      <label className="block text-sm">{t("rfq_description")}<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border p-2.5" /></label>
      <label className="block text-sm">{t("requested_quantity")}<input type="number" min={1} required value={form.requested_quantity} onChange={(e) => setForm({ ...form, requested_quantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label>
      {companies.length > 0 && <label className="block text-sm">{t("company")}<select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2.5"><option value="">{t("personal_purchase")}</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
      <div className="grid grid-cols-2 gap-4"><label className="block text-sm">{t("budget_min")}<input type="number" min="0" step="0.01" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label><label className="block text-sm">{t("budget_max")}<input type="number" min="0" step="0.01" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label></div>
      <button disabled={busy} className="rounded-lg bg-slate-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("submit")}</button>
    </form>
    <section className="space-y-3">{rfqs.length === 0 ? <p>{t("no_rfqs")}</p> : rfqs.map((rfq) => <article key={rfq.id} className="rounded-xl border bg-white p-4"><button onClick={async () => { try { setSelected(await getRfq(rfq.id)); } catch (err) { setError((err as Error).message); } }} className="font-semibold text-emerald-700 underline">{rfq.title}</button><span className="ms-4 text-sm text-gray-500">{rfq.status} · {rfq.requested_quantity}</span></article>)}</section>
    {selected && <section className="rounded-xl border bg-white p-6"><h2 className="mb-4 text-xl font-bold">{t("quotes")}: {selected.title}</h2>{selected.quotes?.length ? <div className="space-y-3">{selected.quotes.map((quote) => <div key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><span>{formatAmount(quote.amount, quote.currency, locale)} — {quote.status}</span>{quote.status === "pending" && selected.status !== "accepted" && <button disabled={busy} onClick={() => accept(selected.id, quote.id)} className="rounded-lg bg-slate-brand px-4 py-2 text-sm text-white disabled:opacity-50">{t("accept_quote")}</button>}</div>)}</div> : <p className="text-gray-500">{t("loading")}</p>}</section>}
  </div>;
}
