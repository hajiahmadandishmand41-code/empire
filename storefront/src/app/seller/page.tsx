"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function SellerPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);
  const [seller, setSeller] = useState<{
    shop_name?: string;
    verification_status?: string;
    commission_rate?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/v3/store/empire/sellers/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setSeller((data as { data?: unknown })?.data ?? null);
          } else if (res.status === 401 || res.status === 403) {
            setSeller(null);
            setApiError("دسترسی به داشبورد فروشنده محدود است. لطفاً وارد شوید.");
          } else {
            setApiError(`خطا در بارگذاری اطلاعات فروشنده (کد ${res.status})`);
          }
        }
      } catch {
        if (!cancelled) {
          setApiError("اتصال به سرور فروشگاه برقرار نشد. داشبورد فروشنده در دسترس نیست.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {apiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-amber-800">{apiError}</div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-brand">{t("seller_dashboard")}</h1>
          <p className="text-gray-600">
            نمای کلی فروشگاه و محصولات شما
          </p>
        </div>
        <Link
          href="/products"
          className="px-5 py-2 bg-slate-brand text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
        >
          افزودن محصول
        </Link>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          {t("loading")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[
              { label: "فروش امروز", value: "–", suffix: "AFN", icon: "AFN" },
              { label: "سفارش جدید", value: "–", icon: "🛒" },
              { label: "محصول فعال", value: "–", icon: "📦" },
              { label: "کمیسیون در انتظار", value: "–", suffix: "AFN", icon: "%" },
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
                  <tr>
                    <td className="px-6 py-4 text-gray-500 text-center" colSpan={5}>
                      اطلاعات سفارشات از سرور فروشگاه در دسترس نیست.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-brand mb-4">اطلاعات فروشگاه</h3>
            {!seller ? (
              <p className="text-gray-500">پروفایل فروشنده در دسترس نیست.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">نام فروشگاه</span>
                  <span className="text-gray-900">{seller.shop_name || "–"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">وضعیت تایید</span>
                  <span className={`text-sm font-medium ${seller.verification_status === "verified" ? "text-green-700" : seller.verification_status === "rejected" ? "text-red-700" : "text-amber-700"}`}>
                    {seller.verification_status || "–"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نرخ کمیسیون</span>
                  <span className="text-gray-900 ltr">
                    {(seller.commission_rate != null ? Number(seller.commission_rate) * 100 : 0)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {seller?.verification_status !== "verified" && (
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
          )}
        </>
      )}
    </div>
  );
}
