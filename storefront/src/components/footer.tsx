"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export function Footer() {
  const { t } = useLocale();
  const links = [["/products", t("products")], ["/cart", t("cart")], ["/account", t("account")], ["/seller", t("seller_dashboard")], ["/admin", t("admin_dashboard")], ["/company", t("company_account")], ["/rfq", t("request_quote")]] as const;
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 text-sm text-gray-600 sm:px-6 lg:px-8">
        <span className="text-lg font-bold text-slate-brand">Empire</span>
        {links.map(([href, label]) => <Link key={href} href={href} className="hover:text-emerald-700">{label}</Link>)}
        <span className="ms-auto">© {new Date().getFullYear()} Empire. {t("rights")}</span>
      </div>
    </footer>
  );
}
