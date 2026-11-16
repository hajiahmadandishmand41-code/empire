"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, translate, type Locale, type MessageKey } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const setLocale = (next: Locale) => {
    document.cookie = `empire_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };
  return <LocaleContext.Provider value={{ locale, setLocale, t: (key) => translate(locale, key) }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
