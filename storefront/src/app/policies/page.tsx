import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/states";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { formatDate } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { listPolicies, type Policy } from "@/lib/api";

export async function generateMetadata() {
  const locale = await currentLocale();
  const t = translator(locale);
  return buildMetadata({ locale, title: t("policies_title"), description: t("policies_subtitle"), path: "/policies" });
}

/** Index of every policy the store has published. */
export default async function PoliciesPage() {
  const locale = await currentLocale();
  const t = translator(locale);

  let policies: Policy[] = [];
  let failed = false;
  try {
    policies = (await listPolicies()).data;
  } catch {
    failed = true;
  }

  const crumbs = [{ label: t("home"), href: "/" }, { label: t("policies_title") }];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-5" />

      <header className="mb-7">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">{t("policies_title")}</h1>
        <p className="mt-3 text-base leading-8 text-gray-600">{t("policies_subtitle")}</p>
      </header>

      {failed ? (
        <EmptyState icon="alert" title={t("error_title")} message={t("error_body")} actionHref="/policies" actionLabel={t("error_action")} />
      ) : policies.length === 0 ? (
        <EmptyState
          icon="info"
          title={t("footer_no_policies")}
          message={t("policy_questions_body")}
          actionHref="/"
          actionLabel={t("home")}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {policies.map((policy) => (
            <li key={policy.id}>
              <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-raised">
                <a href={`/policies/${policy.slug}`} className="group flex-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50">
                    <Icon name="shield" className="h-5 w-5 text-navy-700" />
                  </span>
                  <h2 className="mt-3 text-base font-bold text-navy-950 group-hover:text-jade-800">{policy.name}</h2>
                  {policy.body ? (
                    <p className="mt-1.5 line-clamp-3 text-sm leading-7 text-gray-600">{policy.body}</p>
                  ) : null}
                </a>
                {policy.updated_at ? (
                  <p className="num mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    {t("policy_updated", { date: formatDate(policy.updated_at, locale) })}
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
