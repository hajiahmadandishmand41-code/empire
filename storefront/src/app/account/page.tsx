"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

type UserData = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null;

export default function AccountPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);
  const [user, setUser] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/v3/store/users/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setUser((data as { data?: unknown })?.data ?? null);
          } else if (res.status === 401 || res.status === 403) {
            setUser(null);
          } else {
            setApiError(`خطا در بارگذاری حساب (کد ${res.status})`);
          }
        }
      } catch {
        if (!cancelled) {
          setApiError("اتصال به سرور فروشگاه برقرار نشد. اطلاعات حساب در دسترس نیست.");
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
    <div className="max-w-5xl mx-auto py-8">
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
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500 font-medium">U</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : "–"}
                </div>
                <div className="text-xs text-gray-500">{user?.email || "–"}</div>
              </div>
            </div>
            <nav className="space-y-1">
              {[
                { href: "/account", label: t("profile"), active: true },
                { href: "/account/orders", label: t("orders") },
                { href: "/account/addresses", label: t("addresses") },
                { href: "/account/favorites", label: t("favorites") },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg text-sm transition ${
                    item.active
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {t("loading")}
            </div>
          ) : user === null ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-slate-brand mb-6">
                {t("profile")}
              </h2>
              <div className="text-center py-12 text-gray-500">
                <p>حساب کاربری در دسترس نیست.</p>
                <p className="text-sm mt-2">
                  {apiError || "لطفاً وارد سیستم شوید."}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-slate-brand mb-6">
                {t("profile")}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("first_name")}
                  </label>
                  <p className="text-gray-900">{user.first_name || "–"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("last_name")}
                  </label>
                  <p className="text-gray-900">{user.last_name || "–"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("email")}
                  </label>
                  <p className="text-gray-900">{user.email || "–"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("phone_label")}
                  </label>
                  <p className="text-gray-900">–</p>
                </div>
              </div>
              <div className="mt-8">
                <button className="px-5 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 hover:bg-emerald-100 transition">
                  ویرایش پروفایل
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
