"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-xl mb-3">
            <span>E</span>
            <span>mpire</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-brand">{t("sign_in")}</h2>
          <p className="text-gray-600 mt-2">
            به حساب کاربری خود وارد شوید تا سفارشات و آدرس‌های خود را مدیریت کنید.
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("password")}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-emerald-600" />
              {t("remember_me")}
            </label>
            <Link href="/forgot-password" className="text-sm text-emerald-600 hover:underline">
              فراموشی رمز عبور؟
            </Link>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-slate-brand text-white text-lg font-semibold rounded-lg hover:bg-slate-700 transition shadow-sm"
          >
            {t("sign_in")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {t("no_account")}
          </p>
          <Link
            href="/register"
            className="inline-block px-5 py-2 border border-emerald-600 text-emerald-600 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition"
          >
            {t("register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
