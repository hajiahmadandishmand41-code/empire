import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DEFAULT_LOCALE, direction } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    template: "%s | Empire",
    default: "Empire — بازارگاه تجارت الکترونیک",
  },
  description:
    "Empire — پلتفرم تجارت الکترونیک چندفروشنده برای افغانستان و بازارهای جهانی. خرید و فروش عمده و خرده، بازارگاه، شرکت‌های تجاری و more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3001"),
  openGraph: {
    siteName: "Empire",
    title: "Empire — بازارگاه تجارت الکترونیک",
    description:
      "بازارگاه تجارت الکترونیک چندفروشنده برای افغانستان و بازارهای جهانی.",
    type: "website",
    locale: "fa-AF",
  },
  alternates: {
    canonical: "/",
    languages: {
      "fa-AF": "/",
      "ps-AF": "/?locale=ps-AF",
      en: "/?locale=en",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dir = direction(DEFAULT_LOCALE);
  return (
    <html lang={DEFAULT_LOCALE} dir={dir}>
      <body className={`${dir === "rtl" ? "rtl" : "ltr"} font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
