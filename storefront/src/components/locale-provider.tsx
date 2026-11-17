"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE, translate, translateDynamic,
  type Locale, type MessageKey, type MessageParams,
} from "@/lib/i18n";

type Translator = (key: MessageKey, params?: MessageParams) => string;
type DynamicTranslator = (key: string, fallback?: string, params?: MessageParams) => string;

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: Translator; td: DynamicTranslator }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
  td: (key, fallback, params) => translateDynamic(DEFAULT_LOCALE, key, fallback, params),
});

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const setLocale = useCallback((next: Locale) => {
    document.cookie = `empire_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router]);
  const value = useMemo(() => ({
    locale,
    setLocale,
    t: ((key: MessageKey, params?: MessageParams) => translate(locale, key, params)) as Translator,
    td: ((key: string, fallback?: string, params?: MessageParams) => translateDynamic(locale, key, fallback, params)) as DynamicTranslator,
  }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
