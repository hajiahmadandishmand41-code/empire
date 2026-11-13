"use client";

import { useState } from "react";
import { applySeller } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export default function SellerPage() {
  const { t } = useLocale();
  const [form, setForm] = useState({ shop_name: "", registration_number: "", email: "", password: "", password_confirmation: "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [submitted, setSubmitted] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (form.password !== form.password_confirmation) { setError(t("action_error")); return; }
    setBusy(true);
    try { await applySeller(form); setSubmitted(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const field = (name: keyof typeof form, label: string, type = "text", required = true) => <label className="block text-sm">{label}<input type={type} required={required} minLength={type === "password" ? 8 : undefined} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="mt-1 w-full rounded-lg border p-3" dir={["email", "password"].includes(type) ? "ltr" : undefined} /></label>;
  return <div className="mx-auto max-w-xl space-y-6"><h1 className="text-3xl font-bold">{t("become_seller")}</h1><a href="/sellers" className="inline-block rounded-lg border px-5 py-2 text-sm">{t("seller_panel")}</a>
    {submitted ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">{t("application_submitted")}</p> : <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6">{field("shop_name", t("shop_name"))}{field("registration_number", `${t("registration_number")} (${t("optional")})`, "text", false)}{field("email", t("email"), "email")}{field("password", t("password"), "password")}{field("password_confirmation", t("password_confirm"), "password")}<ErrorNotice message={error} /><button disabled={busy} className="w-full rounded-lg bg-slate-brand py-3 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("submit")}</button></form>}
  </div>;
}
