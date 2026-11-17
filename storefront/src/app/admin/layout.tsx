import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";

/** Staff area. Also covers /admin/payout-requests, which inherits this segment's
 * metadata; nothing under /admin is ever indexable. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = translator(locale);
  return privateMetadata({ locale, title: t("meta_admin_title"), description: t("meta_admin_description") });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
