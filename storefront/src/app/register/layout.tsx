import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";

/** A credential form with no indexable content. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = translator(locale);
  return privateMetadata({ locale, title: t("meta_register_title"), description: t("meta_register_description") });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
