import { RfqClient } from "./rfq-client";
import { breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export async function generateMetadata() {
  const locale = await currentLocale();
  const t = translator(locale);
  return buildMetadata({ locale, title: t("meta_rfq_title"), description: t("meta_rfq_description"), path: "/rfq" });
}

export default async function RfqPage({ searchParams }: { searchParams: Promise<{ variant?: string }> }) {
  const [{ variant }, locale] = await Promise.all([searchParams, currentLocale()]);
  const t = translator(locale);
  const crumbs = [{ label: t("home"), href: "/" }, { label: t("rfq_title") }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <RfqClient variantId={variant || ""} />
    </>
  );
}
