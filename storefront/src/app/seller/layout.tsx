import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";

/** Seller area. Also covers /seller/payout-requests. Merchant balances and payout
 * requests are private commercial data and are never indexable. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = translator(locale);
  return privateMetadata({ locale, title: t("meta_seller_title"), description: t("meta_seller_description") });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
