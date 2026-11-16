"use client";

import { useState } from "react";
import { staffLogin, type StaffAudience } from "@/lib/staff-api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export function StaffLogin({ audience, onSuccess }: { audience: StaffAudience; onSuccess: () => void }) {
  const { t } = useLocale();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await staffLogin(audience, email, password); onSuccess(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-xl border bg-white p-6" data-testid={`${audience}-login`}>
    <h2 className="text-xl font-bold">{audience === "admin" ? t("admin_login") : t("seller_login")}</h2>
    <label className="block text-sm">{t("email")}<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label>
    <label className="block text-sm">{t("password")}<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" dir="ltr" /></label>
    <ErrorNotice message={error} />
    <button disabled={busy} className="w-full rounded-lg bg-slate-brand py-2.5 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("login")}</button>
  </form>;
}
