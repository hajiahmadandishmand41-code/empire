"use client";

import { useCallback, useEffect, useState } from "react";
import { listPayoutRequests, reviewPayoutRequest, staffLogout, type PayoutRequest } from "@/lib/staff-api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { StaffLogin } from "@/components/staff-login";

export default function AdminPayoutRequestsPage() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false); const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [reason, setReason] = useState("");
  const load = useCallback(async () => { setRequests(await listPayoutRequests("admin")); setReady(true); }, []);
  useEffect(() => { let active = true; (async () => { try { const data = await listPayoutRequests("admin"); if (active) { setRequests(data); setReady(true); } } catch { if (active) setReady(false); } })(); return () => { active = false; }; }, []);
  async function review(id: number, approve: boolean) {
    setBusy(true); setError(null);
    try { await reviewPayoutRequest(id, approve, approve ? undefined : reason); await load(); setReason(""); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function signOut() { await staffLogout("admin"); setReady(false); setRequests([]); }
  return <div className="mx-auto max-w-4xl space-y-6"><h1 className="text-3xl font-bold">{t("payout_review")}</h1><ErrorNotice message={error} />
    {!ready ? <StaffLogin audience="admin" onSuccess={() => { void load().catch((err: Error) => setError(err.message)); }} /> : <>
      <div className="flex justify-end"><button onClick={signOut} className="rounded-lg border px-4 py-2 text-sm">{t("logout")}</button></div>
      {requests.length === 0 ? <p className="rounded-xl border bg-white p-6">{t("no_payout_requests")}</p> : <div className="space-y-4">{requests.map((request) => <article key={request.id} className="space-y-3 rounded-xl border bg-white p-5" data-testid="payout-request">
        <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold" dir="ltr">{request.seller_id}</span><span>{t(`payout_status_${request.status}` as "payout_status_requested")}</span><span dir="ltr">{request.currency}</span></div>
        {request.note && <p className="text-sm text-gray-600">{request.note}</p>}
        {request.payout_id && <p className="text-sm" dir="ltr">{request.payout_id}</p>}
        {request.status === "requested" && <div className="flex flex-wrap items-center gap-3"><button disabled={busy} onClick={() => review(request.id, true)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50">{t("approve")}</button><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("rejection_reason")} className="min-w-48 flex-1 rounded-lg border p-2 text-sm" /><button disabled={busy || !reason.trim()} onClick={() => review(request.id, false)} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-50">{t("reject")}</button></div>}
      </article>)}</div>}
    </>}
  </div>;
}
