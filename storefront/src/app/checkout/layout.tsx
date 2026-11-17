import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";

/** Checkout carries a cart token and personal details; it must never appear in a
 * search index or be followed by a crawler. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = translator(locale);
  return privateMetadata({ locale, title: t("meta_checkout_title"), description: t("meta_checkout_description") });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
