"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

export function Header() {
  const { locale, setLocale, t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-brand" aria-label="Empire">Empire<span className="text-emerald-brand">.</span></Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label={t("home")}>
          <Link href="/products" className="hover:text-emerald-700">{t("products")}</Link>
          <Link href="/cart" className="hover:text-emerald-700">{t("cart")}</Link>
          <Link href="/account" className="hover:text-emerald-700">{t("account")}</Link>
          <Link href="/rfq" className="hover:text-emerald-700">{t("request_quote")}</Link>
        </nav>
        <form action="/products" className="ms-auto hidden md:block">
          <input name="q" type="search" aria-label={t("search")} placeholder={t("search")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </form>
        <label className="sr-only" htmlFor="locale">{t("language")}</label>
        <select id="locale" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm">
          {LOCALES.map((value) => <option key={value} value={value}>{LOCALE_LABELS[value]}</option>)}
        </select>
        <Link href="/login" className="rounded-lg bg-slate-brand px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{t("login")}</Link>
      </div>
    </header>
  );
}
