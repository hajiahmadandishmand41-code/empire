import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LocaleProvider } from "@/components/locale-provider";
import { DEFAULT_LOCALE, direction, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { template: "%s | Empire", default: "Empire — بازارگاه آنلاین" },
  description: "Empire؛ بازارگاه چندفروشنده برای خرید عمده و خرده در افغانستان.",
  openGraph: { siteName: "Empire", title: "Empire", locale: "fa_AF", type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = (await cookies()).get("empire_locale")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  return (
    <html lang={locale} dir={direction(locale)}>
      <body className="font-sans antialiased">
        <LocaleProvider locale={locale}>
          <Header />
          <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
