"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export default function RegisterPage() {
  const { t } = useLocale(); const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const field = (name: keyof typeof form, type = "text") => <label className="block text-sm">{t(name === "password_confirmation" ? "password_confirm" : name)}<input type={type} required autoComplete={type === "password" ? "new-password" : name} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="mt-1 w-full rounded-lg border p-3" dir={["email", "phone", "password"].includes(type) || name === "password" ? "ltr" : undefined} /></label>;
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (form.password !== form.password_confirmation) { setError(t("action_error")); return; }
    setBusy(true);
    try { await register(form); router.push("/account"); router.refresh(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8"><h1 className="mb-6 text-2xl font-bold">{t("register")}</h1>
    <form onSubmit={submit} className="space-y-4"><div className="grid grid-cols-2 gap-4">{field("first_name")}{field("last_name")}</div>{field("email", "email")}{field("phone", "tel")}{field("password", "password")}{field("password_confirmation", "password")}<ErrorNotice message={error} /><button disabled={busy} className="w-full rounded-lg bg-slate-brand py-3 font-semibold text-white disabled:opacity-50">{busy ? t("loading") : t("register")}</button></form>
    <p className="mt-6 text-sm">{t("already_have_account")} <Link href="/login" className="text-emerald-700 underline">{t("login")}</Link></p>
  </div>;
}
