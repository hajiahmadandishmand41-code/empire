"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function AccountPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500 font-medium">U</span>
              </div>
              <div>
                <div className="font-medium text-gray-900"> مشتری Ausstellung</div>
                <div className="text-xs text-gray-500">customer@example.com</div>
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

        {/* Main content */}
        <main className="flex-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-brand mb-6">
              {t("profile")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("first_name")}
                </label>
                <p className="text-gray-900">مشترینمونه</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("last_name")}
                </label>
                <p className="text-gray-900">نمونهخانی</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("email")}
                </label>
                <p className="text-gray-900">customer@example.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phone_label")}
                </label>
                <p className="text-gray-900">+93 70 123 4567</p>
              </div>
            </div>
            <div className="mt-8">
              <button className="px-5 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 hover:bg-emerald-100 transition">
                ویرایش پروفایل
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
