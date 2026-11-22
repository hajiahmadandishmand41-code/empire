"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { StaffLogin } from "@/components/staff-login";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/card";
import { Select, TextArea } from "@/components/ui/field";
import { EmptyState, InlineNotice } from "@/components/ui/states";
import { Price } from "@/components/ui/price";
import {
  adminRfqAction, getAdminRfq, listAdminRfqs, rejectAdminQuote, staffLogout, staffSignedIn,
  type AdminRfq,
} from "@/lib/staff-api";
import { formatCount, formatDate } from "@/lib/numbers";

/** Staff RFQ management.
 *
 * Everything this page shows comes from an endpoint gated on `read_rfqs`, and
 * every button from one gated on `write_rfqs` — the page hides controls it
 * cannot use, but the refusal is the Backend's, not this component's.
 */
const STATUS_TONES: Record<string, BadgeTone> = {
  open: "navy", quoted: "saffron", accepted: "jade", closed: "gray",
};
const QUOTE_TONES: Record<string, BadgeTone> = {
  pending: "saffron", accepted: "jade", rejected: "red", withdrawn: "gray",
};

export default function AdminRfqsPage() {
  const { locale, t, td } = useLocale();
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("");
  const [rfqs, setRfqs] = useState<AdminRfq[]>([]);
  const [detail, setDetail] = useState<AdminRfq | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (status = filter) => {
    setRfqs(await listAdminRfqs(status || undefined));
    setReady(true);
  }, [filter]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!staffSignedIn("admin")) { setReady(false); return; }
      try {
        const data = await listAdminRfqs();
        if (active) { setRfqs(data); setReady(true); }
      } catch { if (active) setReady(false); }
    })();
    return () => { active = false; };
  }, []);

  async function open(id: number) {
    setError(null);
    setNotice(null);
    try { setDetail(await getAdminRfq(id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function act(action: "close" | "cancel" | "reopen") {
    if (!detail) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminRfqAction(detail.id, action, reason.trim() || undefined);
      setDetail(updated);
      setReason("");
      setNotice(t(`admin_rfq_${action}_done` as "admin_rfq_close_done"));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function reject(quoteId: number) {
    if (!detail) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await rejectAdminQuote(detail.id, quoteId, reason.trim() || undefined);
      setDetail(updated);
      setReason("");
      setNotice(t("admin_rfq_quote_rejected"));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await staffLogout("admin");
    setReady(false);
    setRfqs([]);
    setDetail(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{t("admin_rfq_title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">{t("admin_rfq_body")}</p>
        </div>
        {ready ? <Button variant="outline" size="sm" onClick={signOut}>{t("logout")}</Button> : null}
      </header>

      {!ready ? (
        <StaffLogin audience="admin" onSuccess={() => { void load().catch((err: Error) => setError(err.message)); }} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
          <section aria-label={t("admin_rfq_list")} className="space-y-3">
            <ErrorNotice message={error} />
            <Select
              label={t("admin_rfq_status")}
              value={filter}
              onChange={(event) => { setFilter(event.target.value); void load(event.target.value).catch(() => undefined); }}
            >
              <option value="">{t("admin_rfq_all_statuses")}</option>
              {["open", "quoted", "accepted", "closed"].map((status) => (
                <option key={status} value={status}>{td(`rfq_status_${status}`, status)}</option>
              ))}
            </Select>
            {rfqs.length === 0 ? (
              <EmptyState icon="quote" title={t("admin_no_rfqs")} />
            ) : (
              rfqs.map((rfq) => (
                <Card key={rfq.id} as="article" data-testid="admin-rfq">
                  <CardBody className="space-y-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => void open(rfq.id)}
                        className="text-start text-sm font-bold text-navy-950 underline decoration-jade-400 underline-offset-4 hover:text-jade-800"
                      >
                        {rfq.title}
                      </button>
                      <Badge tone={STATUS_TONES[rfq.status] ?? "gray"}>{td(`rfq_status_${rfq.status}`, rfq.status)}</Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {rfq.customer_name}
                      {rfq.company_name ? ` · ${rfq.company_name}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("quotes")}: {formatCount(rfq.quote_count, locale)}
                      {rfq.created_at ? ` · ${formatDate(rfq.created_at, locale)}` : ""}
                    </p>
                  </CardBody>
                </Card>
              ))
            )}
          </section>

          <section aria-label={t("admin_rfq_detail")}>
            {!detail ? (
              <EmptyState icon="info" title={t("admin_rfq_select")} />
            ) : (
              <div className="space-y-4">
                {notice ? <InlineNotice tone="jade">{notice}</InlineNotice> : null}
                <Card>
                  <CardHeader
                    title={detail.title}
                    subtitle={detail.description || undefined}
                    action={<Badge tone={STATUS_TONES[detail.status] ?? "gray"}>{td(`rfq_status_${detail.status}`, detail.status)}</Badge>}
                  />
                  <CardBody className="space-y-0 text-sm">
                    <DataRow label={t("admin_rfq_customer")} value={detail.customer_name ?? "—"} />
                    {detail.company_name ? <DataRow label={t("company")} value={detail.company_name} /> : null}
                    <DataRow
                      label={t("rfq_quantity_label")}
                      value={<span className="num">{formatCount(detail.requested_quantity, locale)}{detail.unit ? ` ${detail.unit}` : ""}</span>}
                    />
                    {detail.product_name ? <DataRow label={t("seller_rfq_product")} value={detail.product_name} /> : null}
                    {detail.expires_at ? <DataRow label={t("rfq_deadline")} value={formatDate(detail.expires_at, locale)} /> : null}
                    {detail.status_reason ? <DataRow label={t("admin_rfq_reason")} value={detail.status_reason} /> : null}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title={t("admin_rfq_actions")} />
                  <CardBody className="space-y-3">
                    <TextArea
                      label={t("admin_rfq_reason")}
                      hint={t("admin_rfq_reason_hint")}
                      rows={2}
                      maxLength={1000}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy || detail.status === "closed"} onClick={() => void act("close")}>
                        {t("admin_rfq_close")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy || detail.status === "closed"} onClick={() => void act("cancel")}>
                        {t("admin_rfq_cancel")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy || detail.status !== "closed"} onClick={() => void act("reopen")}>
                        {t("admin_rfq_reopen")}
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title={t("quotes")} subtitle={`${formatCount(detail.quotes?.length ?? 0, locale)}`} />
                  <CardBody className="space-y-2">
                    {detail.quotes?.length ? detail.quotes.map((quote) => (
                      <div key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900">{quote.seller_name ?? quote.seller_id}</p>
                          <p className="num text-xs text-gray-500">
                            {formatCount(quote.quantity ?? detail.requested_quantity, locale)}
                            {quote.unit ? ` ${quote.unit}` : ""}
                            {quote.valid_until ? ` · ${formatDate(quote.valid_until, locale)}` : ""}
                          </p>
                        </div>
                        <Price amount={quote.amount} currency={quote.currency} locale={locale} size="sm" />
                        <Badge tone={QUOTE_TONES[quote.status] ?? "gray"}>{td(`quote_status_${quote.status}`, quote.status)}</Badge>
                        {quote.status === "pending" ? (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => void reject(quote.id)}>
                            {t("admin_rfq_reject_quote")}
                          </Button>
                        ) : null}
                      </div>
                    )) : <p className="text-sm text-gray-500">{t("rfq_no_quotes")}</p>}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title={t("admin_rfq_history")} />
                  <CardBody className="space-y-2 text-sm">
                    {detail.events?.length ? detail.events.map((event) => (
                      <div key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-2 last:border-0">
                        <span className="font-medium text-navy-900">{td(`rfq_event_${event.event}`, event.event)}</span>
                        <span className="text-xs text-gray-500">
                          {event.actor ? `${event.actor} · ` : ""}
                          {formatDate(event.created_at, locale, true)}
                        </span>
                        {event.note ? <p className="w-full text-xs leading-6 text-gray-600">{event.note}</p> : null}
                      </div>
                    )) : <p className="text-gray-500">{t("admin_rfq_no_history")}</p>}
                  </CardBody>
                </Card>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
