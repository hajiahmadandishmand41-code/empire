"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function AdminPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-brand">{t("admin_dashboard")}</h1>
          <p className="text-gray-600">
            مدیریت کل پلتفرم Empire — داشبورد مدیریت رسمی Spree روی بک‌اند اجرا می‌شود.
          </p>
        </div>
        <Link
          href="http://localhost:3000/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 bg-slate-brand text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
        >
          بپرد به داشبورد مدیریت Spree
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("admin_orders"), href: "#" },
          { label: t("admin_products"), href: "#" },
          { label: t("admin_sellers"), href: "#" },
          { label: t("admin_customers"), href: "#" },
          { label: t("admin_markets"), href: "#" },
          { label: t("admin_payouts"), href: "#" },
          { label: t("admin_rfq"), href: "#" },
          { label: t("admin_settings"), href: "#" },
        ].map((item, i) => (
          <a
            key={i}
            href={item.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-gray-50 transition text-center text-sm text-gray-600"
          >
            <span className="text-emerald-600 font-bold text-lg">•</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-blue-800">داشبورد مدیریت Spree</div>
            <div className="text-sm text-blue-700 mt-1">
              داشبورد مدیریت رسمی Spree روی بک‌اند در پورت ۳۰۰۰ اجرا می‌شود. با کلیک روی دکمه بالا به آن مراجعه کنید.
              آمار و گزارش‌های управління از طریق داشبورد Spree قابل مشاهده هستند.
            </div>
          </div>
        </div>
      </div>

      {/* API connection note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-amber-800">اتصال به بک‌اند</div>
            <div className="text-sm text-amber-700 mt-1">
              صفحات مدیریت Empire با API Spree متصل می‌شوند. در صورت عدم دسترسی به بک‌اند، خطای صریح نمایش داده می‌شود (بدون دادهٔ جعلی).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
