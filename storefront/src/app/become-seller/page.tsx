import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icons";
import { SellerApplicationForm } from "@/components/seller/application-form";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { listRootCategories, type Category } from "@/lib/api";

export async function generateMetadata() {
  const locale = await currentLocale();
  const t = translator(locale);
  return buildMetadata({ locale, title: t("meta_become_seller_title"), description: t("meta_become_seller_description"), path: "/become-seller" });
}

/** Seller application.
 *
 * The categories offered as checkboxes are the store's real taxonomy, so a
 * merchant picks from the same vocabulary buyers browse — not from a list the
 * storefront invented.
 */
export default async function BecomeSellerPage() {
  const locale = await currentLocale();
  const t = translator(locale);

  let categories: Category[] = [];
  try {
    categories = await listRootCategories(24);
  } catch {
    categories = [];
  }

  const benefits: { icon: IconName; title: string; body: string }[] = [
    { icon: "store", title: t("seller_benefit_store_title"), body: t("seller_benefit_store_body") },
    { icon: "wallet", title: t("seller_benefit_payment_title"), body: t("seller_benefit_payment_body") },
    { icon: "quote", title: t("seller_benefit_rfq_title"), body: t("seller_benefit_rfq_body") },
    { icon: "truck", title: t("seller_benefit_shipping_title"), body: t("seller_benefit_shipping_body") },
  ];

  const crumbs = [{ label: t("home"), href: "/" }, { label: t("become_seller") }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-5" />

      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">{t("seller_application_title")}</h1>
        <p className="mt-3 text-base leading-8 text-gray-600">{t("seller_application_subtitle")}</p>
        <p className="mt-2 text-sm leading-7 text-gray-500">{t("seller_about_hint")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <SellerApplicationForm categories={categories} />

        <aside className="space-y-4 lg:sticky lg:top-32">
          <Card>
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-navy-950">{t("seller_step_title")}</h2>
            <ol className="space-y-3 px-4 py-4 text-sm leading-7 text-gray-600">
              <li className="flex gap-3">
                <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jade-50 text-xs font-bold text-jade-800">۱</span>
                {t("seller_step_1")}
              </li>
              <li className="flex gap-3">
                <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jade-50 text-xs font-bold text-jade-800">۲</span>
                {t("seller_step_2")}
              </li>
              <li className="flex gap-3">
                <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jade-50 text-xs font-bold text-jade-800">۳</span>
                {t("seller_step_3")}
              </li>
            </ol>
            <p className="border-t border-gray-100 px-4 py-3 text-xs leading-6 text-gray-500">{t("seller_step_body")}</p>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="p-4">
                <Icon name={benefit.icon} className="h-5 w-5 text-jade-700" />
                <h3 className="mt-2 text-sm font-bold text-navy-950">{benefit.title}</h3>
                <p className="mt-1 text-xs leading-6 text-gray-600">{benefit.body}</p>
              </Card>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
