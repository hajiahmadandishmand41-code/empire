import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { LocaleProvider } from "@/components/locale-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LOCALE_DIRECTION, LOCALE_HTML_LANG, translate } from "@/lib/i18n";
import { currentLocale } from "@/lib/locale-server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  return buildMetadata({
    locale,
    title: translate(locale, "meta_home_title"),
    description: translate(locale, "meta_home_description"),
    path: "/",
  });
}

/** Theme colour matches the header so the browser chrome on mid-range Android
 * devices does not flash white above a navy header. */
export const viewport: Viewport = {
  themeColor: "#0a1a33",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await currentLocale();
  return (
    <html lang={LOCALE_HTML_LANG[locale]} dir={LOCALE_DIRECTION[locale]} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-gray-50 font-sans text-navy-950 antialiased">
        <LocaleProvider locale={locale}>
          <CartProvider>
            <a href="#main" className="skip-link">{translate(locale, "skip_to_content")}</a>
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
