import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";

/** Buyer account: orders, addresses, RFQs and wishlist are personal to the
 * signed-in customer, so the segment is noindexed. Declared in a layout because
 * the page itself is a client component and cannot export generateMetadata. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = translator(locale);
  return privateMetadata({ locale, title: t("meta_account_title"), description: t("meta_account_description") });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
