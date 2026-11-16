"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export default function LoginPage() {
  const { t } = useLocale(); const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await login(email, password); router.push("/account"); router.refresh(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-md rounded-2xl border bg-white p-8"><h1 className="mb-6 text-2xl font-bold">{t("sign_in")}</h1>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">{t("email")}<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3" dir="ltr" /></label>
      <label className="block text-sm">{t("password")}<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" dir="ltr" /></label>
      <ErrorNotice message={error} />
      <button disabled={busy} className="w-full rounded-lg bg-slate-brand py-3 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("login")}</button>
    </form><p className="mt-6 text-sm">{t("no_account")} <Link href="/register" className="text-emerald-700 underline">{t("register")}</Link></p>
  </div>;
}
