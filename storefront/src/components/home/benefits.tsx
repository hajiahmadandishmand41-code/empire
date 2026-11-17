import { translator, type Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon, type IconName } from "@/components/ui/icons";

const BENEFITS: { title: "benefit_verified_title" | "benefit_wholesale_title" | "benefit_cod_title" | "benefit_support_title";
                 body: "benefit_verified_body" | "benefit_wholesale_body" | "benefit_cod_body" | "benefit_support_body";
                 icon: IconName }[] = [
  { title: "benefit_verified_title", body: "benefit_verified_body", icon: "shield" },
  { title: "benefit_wholesale_title", body: "benefit_wholesale_body", icon: "package" },
  { title: "benefit_cod_title", body: "benefit_cod_body", icon: "wallet" },
  { title: "benefit_support_title", body: "benefit_support_body", icon: "truck" },
];

/** Why buy on Empire. Every claim maps to something implemented: seller
 * approval in the admin flow, variant-level quantity rules, the cash-on-
 * delivery payment method the backend registers, and seeded coverage of all 34
 * provinces with their districts. */
export function Benefits({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <section aria-labelledby="home-benefits">
      <SectionHeading
        id="home-benefits"
        title={t("benefits_title")}
        subtitle={t("benefits_subtitle")}
        icon={<Icon name="spark" className="h-5 w-5" />}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <li key={benefit.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-jade-50 text-jade-700">
              <Icon name={benefit.icon} className="h-5.5 w-5.5" />
            </span>
            <h3 className="mt-3.5 text-sm font-bold leading-6 text-navy-950">{t(benefit.title)}</h3>
            <p className="mt-1.5 text-xs leading-6 text-gray-500">{t(benefit.body)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
