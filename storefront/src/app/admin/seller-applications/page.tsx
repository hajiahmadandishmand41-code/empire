"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { StaffLogin } from "@/components/staff-login";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, DataRow } from "@/components/ui/card";
import { Select, TextArea } from "@/components/ui/field";
import { EmptyState, InlineNotice } from "@/components/ui/states";
import {
  listSellerApplications, reviewSellerApplication, staffLogout, staffSignedIn,
  type SellerApplication,
} from "@/lib/staff-api";
import { formatDate } from "@/lib/numbers";

/** Staff review queue for seller applications.
 *
 * Approval calls Spree's own `seller_approve_workflow` on the Backend, so a
 * decision here is the same act as approving the seller in the native
 * dashboard: requirement checks, seller events and webhooks all still fire.
 */
const TONES: Record<string, BadgeTone> = { pending: "saffron", approved: "jade", rejected: "red" };

export default function AdminSellerApplicationsPage() {
  const { locale, t, td } = useLocale();
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (status = filter) => {
    setApplications(await listSellerApplications(status || undefined));
    setReady(true);
  }, [filter]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!staffSignedIn("admin")) { setReady(false); return; }
      try {
        const data = await listSellerApplications("pending");
        if (active) { setApplications(data); setReady(true); }
      } catch { if (active) setReady(false); }
    })();
    return () => { active = false; };
  }, []);

  async function review(id: number, decision: "approve" | "reject") {
    const reason = (reasons[id] ?? "").trim();
    if (decision === "reject" && reason.length < 3) {
      setError(t("admin_application_reason_required"));
      return;
    }
    setBusy(id);
    setError(null);
    setNotice(null);
    try {
      await reviewSellerApplication(id, decision, reason || undefined);
      setNotice(decision === "approve" ? t("admin_application_approved") : t("admin_application_rejected"));
      setReasons((current) => ({ ...current, [id]: "" }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  }

  async function signOut() {
    await staffLogout("admin");
    setReady(false);
    setApplications([]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{t("admin_applications_title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">{t("admin_applications_body")}</p>
        </div>
        {ready ? <Button variant="outline" size="sm" onClick={signOut}>{t("logout")}</Button> : null}
      </header>

      {!ready ? (
        <StaffLogin audience="admin" onSuccess={() => { void load().catch((err: Error) => setError(err.message)); }} />
      ) : (
        <div className="space-y-4">
          <ErrorNotice message={error} />
          {notice ? <InlineNotice tone="jade">{notice}</InlineNotice> : null}
          <Select
            label={t("admin_rfq_status")}
            value={filter}
            onChange={(event) => { setFilter(event.target.value); void load(event.target.value).catch(() => undefined); }}
          >
            <option value="">{t("admin_rfq_all_statuses")}</option>
            {["pending", "approved", "rejected"].map((status) => (
              <option key={status} value={status}>{td(`application_status_${status}`, status)}</option>
            ))}
          </Select>

          {applications.length === 0 ? (
            <EmptyState icon="store" title={t("admin_no_applications")} />
          ) : applications.map((application) => (
            <Card key={application.id} as="article" data-testid="seller-application">
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-navy-950">{application.shop_name}</h2>
                    <p className="text-xs text-gray-500">{formatDate(application.created_at, locale, true)}</p>
                  </div>
                  <Badge tone={TONES[application.status] ?? "gray"}>{td(`application_status_${application.status}`, application.status)}</Badge>
                </div>

                <dl className="text-sm">
                  <DataRow label={t("seller_owner_label")} value={application.contact_name || "—"} />
                  <DataRow label={t("email")} value={<span dir="ltr">{application.email}</span>} />
                  {application.phone ? <DataRow label={t("seller_phone_label")} value={<span dir="ltr" className="num">{application.phone}</span>} /> : null}
                  {application.city ? <DataRow label={t("seller_city_label")} value={application.city} /> : null}
                  {application.address ? <DataRow label={t("seller_address_label")} value={application.address} /> : null}
                  {application.registration_number ? <DataRow label={t("seller_registration_label")} value={<span dir="ltr">{application.registration_number}</span>} /> : null}
                  {application.categories.length ? <DataRow label={t("seller_form_categories")} value={application.categories.join('، ')} /> : null}
                </dl>

                {application.description ? (
                  <p className="rounded-lg bg-gray-50 p-3 text-sm leading-7 text-gray-700">{application.description}</p>
                ) : null}

                {application.status === "rejected" && application.rejection_reason ? (
                  <InlineNotice tone="warning">{application.rejection_reason}</InlineNotice>
                ) : null}

                {application.status === "pending" ? (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <TextArea
                      label={t("admin_application_reason")}
                      hint={t("admin_application_reason_hint")}
                      rows={2}
                      maxLength={1000}
                      value={reasons[application.id] ?? ""}
                      onChange={(event) => setReasons((current) => ({ ...current, [application.id]: event.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" busy={busy === application.id} busyLabel={t("loading")} onClick={() => void review(application.id, "approve")}>
                        {t("approve")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === application.id} onClick={() => void review(application.id, "reject")}>
                        {t("reject")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
