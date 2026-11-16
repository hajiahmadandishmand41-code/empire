"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listCompanies, signedIn, type Company } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";

export default function CompanyPage() {
  const { t } = useLocale(); const [companies, setCompanies] = useState<Company[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!signedIn()) { setLoading(false); return; }
      try { const result = await listCompanies(); if (active) setCompanies(result.data); }
      catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  return <div className="space-y-6"><h1 className="text-3xl font-bold">{t("company_account")}</h1><ErrorNotice message={error} />{loading ? <p>{t("loading")}</p> : !signedIn() ? <Link href="/login" className="text-emerald-700 underline">{t("login")}</Link> : companies.length === 0 ? <p>{t("no_companies")}</p> : <div className="grid gap-4 sm:grid-cols-2">{companies.map((company) => <article key={company.id} className="rounded-xl border bg-white p-6"><h2 className="font-bold">{company.name}</h2><Link href="/checkout" className="mt-4 inline-block text-emerald-700 underline">{t("checkout")}</Link></article>)}</div>}</div>;
}
