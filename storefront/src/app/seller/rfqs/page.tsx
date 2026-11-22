"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { StaffLogin } from "@/components/staff-login";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/card";
import { TextArea, TextInput } from "@/components/ui/field";
import { EmptyState, InlineNotice } from "@/components/ui/states";
import { Price } from "@/components/ui/price";
import {
  createSellerQuote, listSellerRfqs, sellerQuoteAction, staffLogout, staffSignedIn,
  type SellerRfq,
} from "@/lib/staff-api";
import { formatCount, formatDate } from "@/lib/numbers";

/** Seller RFQ desk.
 *
 * The API this page talks to is scoped to the signed-in seller: the list only
 * ever contains requests addressed to them or open to the marketplace, and the
 * detail contains only their own offer. Nothing here filters client-side, so a
 * bug in this component cannot leak a competitor's quote — the server never
 * sends one.
 */
const STATUS_TONES: Record<string, BadgeTone> = {
  open: "navy", quoted: "saffron", accepted: "jade", closed: "gray",
};

const QUOTE_TONES: Record<string, BadgeTone> = {
  pending: "saffron", accepted: "jade", rejected: "red", withdrawn: "gray",
};

export default function SellerRfqsPage() {
  const { locale, t, td } = useLocale();
  const [ready, setReady] = useState(false);
  const [rfqs, setRfqs] = useState<SellerRfq[]>([]);
  const [selected, setSelected] = useState<SellerRfq | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", quantity: "", notes: "", valid_until: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const data = await listSellerRfqs();
    setRfqs(data);
    setReady(true);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!staffSignedIn("seller")) { setReady(false); return; }
      try {
        const data = await listSellerRfqs();
        if (active) { setRfqs(data); setReady(true); }
      } catch { if (active) setReady(false); }
    })();
    return () => { active = false; };
  }, []);

  function openForm(rfq: SellerRfq) {
    setSelected(rfq);
    setNotice(null);
    setError(null);
    setFieldErrors({});
    setForm({
      amount: rfq.my_quote?.amount ?? "",
      quantity: String(rfq.my_quote?.quantity ?? rfq.requested_quantity),
      notes: rfq.my_quote?.notes ?? "",
      valid_until: rfq.my_quote?.valid_until?.slice(0, 10) ?? "",
    });
  }

  async function submitQuote(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const next: Record<string, string> = {};
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim()) || Number(form.amount) <= 0) {
      next.amount = t("seller_quote_amount_invalid");
    }
    if (!/^\d+$/.test(form.quantity.trim()) || Number(form.quantity) <= 0) {
      next.quantity = t("seller_quote_quantity_invalid");
    }
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (selected.my_quote) {
        await sellerQuoteAction("update", selected.my_quote.id, {
          amount: form.amount.trim(),
          quantity: Number(form.quantity),
          notes: form.notes.trim(),
          valid_until: form.valid_until ? new Date(`${form.valid_until}T23:59:59`).toISOString() : null,
        });
        setNotice(t("seller_quote_updated"));
      } else {
        await createSellerQuote(selected.id, {
          amount: form.amount.trim(),
          quantity: Number(form.quantity),
          notes: form.notes.trim(),
          valid_until: form.valid_until ? new Date(`${form.valid_until}T23:59:59`).toISOString() : null,
        });
        setNotice(t("seller_quote_success"));
      }
      const data = await load();
      const fresh = data.find((row) => row.id === selected.id);
      if (fresh) setSelected(fresh);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(quoteId: number) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await sellerQuoteAction("withdraw", quoteId);
      setNotice(t("seller_quote_withdrawn"));
      const data = await load();
      const fresh = data.find((row) => row.id === selected?.id);
      if (fresh) setSelected(fresh);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await staffLogout("seller");
    setReady(false);
    setRfqs([]);
    setSelected(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{t("seller_rfq_desk")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">{t("seller_rfq_desk_body")}</p>
        </div>
        {ready ? <Button variant="outline" size="sm" onClick={signOut}>{t("logout")}</Button> : null}
      </header>

      {!ready ? (
        <StaffLogin audience="seller" onSuccess={() => { void load().catch((err: Error) => setError(err.message)); }} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <section aria-label={t("seller_open_rfqs")} className="space-y-3">
            <ErrorNotice message={error} />
            {rfqs.length === 0 ? (
              <EmptyState icon="quote" title={t("seller_no_open_rfqs")} message={t("seller_no_open_rfqs_body")} />
            ) : (
              rfqs.map((rfq) => (
                <Card key={rfq.id} as="article" data-testid="seller-rfq">
                  <CardBody className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openForm(rfq)}
                        className="text-start text-sm font-bold text-navy-950 underline decoration-jade-400 underline-offset-4 hover:text-jade-800"
                      >
                        {rfq.title}
                      </button>
                      <Badge tone={STATUS_TONES[rfq.status] ?? "gray"}>
                        {td(`rfq_status_${rfq.status}`, rfq.status)}
                      </Badge>
                    </div>
                    <p className="text-xs leading-6 text-gray-600">
                      {t("seller_rfq_quantity_label")}: {formatCount(rfq.requested_quantity, locale)}
                      {rfq.unit ? ` ${rfq.unit}` : ""}
                      {rfq.expires_at ? ` · ${t("rfq_deadline")}: ${formatDate(rfq.expires_at, locale)}` : ""}
                    </p>
                    {rfq.my_quote ? (
                      <p className="text-xs font-semibold text-jade-800">
                        {t("seller_quote_status")}: {td(`quote_status_${rfq.my_quote.status}`, rfq.my_quote.status)}
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              ))
            )}
          </section>

          <section aria-label={t("rfq_detail_title")} className="space-y-4">
            {!selected ? (
              <EmptyState icon="info" title={t("seller_select_rfq")} />
            ) : (
              <>
                <Card>
                  <CardHeader title={selected.title} subtitle={selected.company_name || undefined} />
                  <CardBody className="space-y-0 text-sm">
                    <DataRow label={t("seller_rfq_buyer")} value={selected.buyer_name} />
                    <DataRow
                      label={t("seller_rfq_quantity_label")}
                      value={<span className="num font-bold">{formatCount(selected.requested_quantity, locale)}{selected.unit ? ` ${selected.unit}` : ""}</span>}
                    />
                    {selected.product_name ? (
                      <DataRow label={t("seller_rfq_product")} value={`${selected.product_name}${selected.product_sku ? ` · ${selected.product_sku}` : ""}`} />
                    ) : null}
                    {selected.budget_min || selected.budget_max ? (
                      <DataRow
                        label={t("seller_rfq_budget")}
                        value={<Price amount={selected.budget_max ?? selected.budget_min} currency={selected.currency} locale={locale} size="sm" />}
                      />
                    ) : null}
                    {selected.expires_at ? (
                      <DataRow label={t("rfq_deadline")} value={formatDate(selected.expires_at, locale)} />
                    ) : null}
                  </CardBody>
                  {selected.description ? (
                    <p className="border-t border-gray-100 px-4 py-3 text-sm leading-7 text-gray-600">{selected.description}</p>
                  ) : null}
                </Card>

                <Card>
                  <CardHeader title={selected.my_quote ? t("seller_quote_edit_title") : t("seller_submit_quote")} subtitle={t("seller_quote_hint")} />
                  <CardBody className="space-y-4">
                    {notice ? <InlineNotice tone="jade">{notice}</InlineNotice> : null}
                    {!selected.quoteable ? <InlineNotice tone="warning">{t("rfq_closed_notice")}</InlineNotice> : null}
                    <form onSubmit={submitQuote} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput
                          label={t("seller_quote_amount")}
                          hint={selected.currency}
                          dir="ltr"
                          inputMode="decimal"
                          className="num"
                          required
                          disabled={!selected.quoteable}
                          value={form.amount}
                          onChange={(event) => setForm({ ...form, amount: event.target.value })}
                          error={fieldErrors.amount}
                          invalid={Boolean(fieldErrors.amount)}
                        />
                        <TextInput
                          label={t("seller_quote_quantity")}
                          dir="ltr"
                          inputMode="numeric"
                          className="num"
                          required
                          disabled={!selected.quoteable}
                          value={form.quantity}
                          onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                          error={fieldErrors.quantity}
                          invalid={Boolean(fieldErrors.quantity)}
                        />
                      </div>
                      <TextInput
                        type="date"
                        dir="ltr"
                        label={t("seller_quote_valid_until")}
                        hint={selected.expires_at ? t("seller_quote_valid_until_hint") : undefined}
                        disabled={!selected.quoteable}
                        value={form.valid_until}
                        onChange={(event) => setForm({ ...form, valid_until: event.target.value })}
                      />
                      <TextArea
                        label={t("seller_quote_notes")}
                        rows={3}
                        maxLength={2000}
                        disabled={!selected.quoteable}
                        value={form.notes}
                        onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" busy={busy} busyLabel={t("loading")} disabled={!selected.quoteable}>
                          {selected.my_quote ? t("save") : t("seller_submit_quote")}
                        </Button>
                        {selected.my_quote?.editable ? (
                          <Button type="button" variant="outline" disabled={busy} onClick={() => withdraw(selected.my_quote!.id)}>
                            {t("seller_withdraw_quote")}
                          </Button>
                        ) : null}
                      </div>
                    </form>
                  </CardBody>
                </Card>

                {selected.my_quotes?.length ? (
                  <Card>
                    <CardHeader title={t("seller_my_quotes")} />
                    <CardBody className="space-y-2">
                      {selected.my_quotes.map((quote) => (
                        <div key={quote.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm">
                          <Price amount={quote.amount} currency={quote.currency} locale={locale} size="sm" />
                          <span className="num text-xs text-gray-600">
                            {formatCount(quote.quantity ?? selected.requested_quantity, locale)}
                            {quote.unit ? ` ${quote.unit}` : ""}
                          </span>
                          <Badge tone={QUOTE_TONES[quote.status] ?? "gray"}>{td(`quote_status_${quote.status}`, quote.status)}</Badge>
                          <span className="text-xs text-gray-500">{formatDate(quote.created_at, locale)}</span>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                ) : null}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
