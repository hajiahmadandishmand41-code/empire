"use client";

import { useState } from "react";
import Link from "next/link";
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
            مدیریت کل پلتفرم Empire — سفارش‌ها، فروشندگان، مشتریان، محصولات و بازاریها.
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: "سفارش‌های کل", value: "1,234", icon: "🛒" },
          { label: "فروشندگان", value: "56", icon: "🏪" },
          { label: "مشتریان", value: "2,048", icon: "👥" },
          { label: "محصولات", value: "1,890", icon: "📦" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <span className="text-2xl font-bold text-slate-brand ltr">{stat.value}</span>
              </div>
              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
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
          <Link
            key={i}
            href={item.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-gray-50 transition text-center text-sm"
          >
            <span className="text-emerald-600 font-bold text-lg">•</span>
            <span className="text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-blue-800">داشبورد مدیریت Spree</div>
            <div className="text-sm text-blue-700 mt-1">
              داشبورد مدیریت رسمی Spree روی بک‌اند در پورت ۳۰۰۰ اجرا می‌شود. با کلیک روی دکمه بالا به آن مراجعه کنید.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
