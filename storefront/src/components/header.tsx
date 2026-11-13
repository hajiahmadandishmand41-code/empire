"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  direction,
} from "@/lib/i18n";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initialLocale = (() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    const urlLocale = new URLSearchParams(window.location.search).get(
      "locale"
    ) as typeof DEFAULT_LOCALE | null;
    return urlLocale && LOCALES.includes(urlLocale) ? urlLocale : DEFAULT_LOCALE;
  })();
  const [locale, setLocaleState] = useState<typeof DEFAULT_LOCALE>(initialLocale);
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (nextLocale: typeof DEFAULT_LOCALE) => {
    setLocaleState(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("locale", nextLocale);
    router.push(url.toString(), { scroll: false });
  };

  const dir = direction(locale);

  const navLinks = [
    { href: "/", labelKey: "home" },
    { href: "/products", labelKey: "products" },
    { href: "/categories", labelKey: "categories" },
    { href: "/brands", labelKey: "brands" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-brand font-bold text-xl tracking-tight"
          aria-label="Empire homepage"
        >
          <span className="text-emerald-brand">E</span>
          <span>mpire</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="search"
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
              dir="ltr"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Actions: language, currency, cart, account */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative ml-2">
            <button
              onClick={() => setLocale(locale)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              aria-expanded="true"
              aria-haspopup="listbox"
            >
              <span className={locale === "en" ? "ltr" : "rtl"}>
                {LOCALE_LABELS[locale]}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`w-full text-left px-3 py-2 text-sm ${locale === l ? "bg-emerald-50 text-emerald-600 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                  dir={direction(l)}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          <button className="text-gray-700 hover:text-emerald-600 transition" aria-label="Cart">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          <Link
            href="/login"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-brand text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
          >
            {locale === "en" ? "Sign in" : "ورود"}
          </Link>

          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="md:hidden text-gray-700"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm rounded-lg ${
                  pathname === link.href ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-100"
                }`}
                dir={dir}
              >
                {link.labelKey}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">{locale === "en" ? "Language" : "زبان"}</p>
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                    locale === l ? "bg-emerald-50 text-emerald-600 font-medium" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  dir={direction(l)}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
