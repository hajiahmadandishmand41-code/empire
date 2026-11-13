"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";

export default function SellerPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-brand">{t("seller_dashboard")}</h1>
          <p className="text-gray-600">نما نمای کلی فروشگاه و محصولات شما</p>
        </div>
        <Link
          href="/products"
          className="px-5 py-2 bg-slate-brand text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
        >
          افزودن محصول
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {[
          { label: "فروش امروز", value: "۲,۴۵۰,۰۰۰", suffix: "AFN", icon: "AFN" },
          { label: "سفارش جدید", value: "۱۴", icon: "🛒" },
          { label: "محصول فعال", value: "۳۲", icon: "📦" },
          { label: "کمیسیون در انتظار", value: "۴۵۰,۰۰۰", suffix: "AFN", icon: "%" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-brand ltr">
                    {stat.value}
                  </span>
                  {stat.suffix && <span className="text-sm text-gray-500 ltr">{stat.suffix}</span>}
                </div>
              </div>
              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">{t("seller_orders")}</h3>
          <Link href="/seller/orders" className="text-sm text-emerald-600 hover:underline">
            مشاهده همه
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-gray-500 font-medium">سفارش</th>
                <th className="px-6 py-3 text-gray-500 font-medium">مشتری</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-right ltr">مبلغ</th>
                <th className="px-6 py-3 text-gray-500 font-medium">وضعیت</th>
                <th className="px-6 py-3 text-gray-500 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium text-gray-900">#100{i}</td>
                  <td className="px-6 py-4 text-gray-700">مشتری نمونه{i}</td>
                  <td className="px-6 py-4 text-right ltr font-medium text-gray-900 ltr">
                    {formatPrice((i + 1) * 450000)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      در انتظار
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">۱۴۰۵/۰۸/۱۳</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-amber-800">
              فروشگاه شما در انتظار تأیید است
            </div>
            <div className="text-sm text-amber-700 mt-1">
              پس از تایید توسط مدیریت Empire، محصولات شما برای مشتریان قابل مشاهده می‌شود.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
