"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export default function AdminPage() {
  const { t } = useLocale();
  return <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8"><h1 className="mb-4 text-3xl font-bold">{t("admin_dashboard")}</h1><p className="mb-6 text-gray-600">Empire</p><div className="flex flex-wrap gap-3"><a href="/dashboard" className="inline-block rounded-lg bg-slate-brand px-6 py-3 font-semibold text-white">{t("admin_panel")}</a><Link href="/admin/payout-requests" className="inline-block rounded-lg border px-6 py-3 font-semibold">{t("payout_review_link")}</Link></div></div>;
}
