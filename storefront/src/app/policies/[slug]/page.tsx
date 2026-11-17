import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { formatDate } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { SpreeApiError, getPolicy, listPolicies, type Policy } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await currentLocale();
  const t = translator(locale);
  try {
    const policy = await getPolicy(slug);
    return buildMetadata({
      locale,
      title: policy.name,
      description: policy.body?.slice(0, 160) || t("policies_subtitle"),
      path: `/policies/${policy.slug}`,
    });
  } catch {
    return buildMetadata({ locale, title: t("meta_not_found_title"), path: `/policies/${slug}`, noIndex: true });
  }
}

/** A single store policy (terms, privacy, returns, shipping). */
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await currentLocale();
  const t = translator(locale);

  let policy: Policy;
  try {
    policy = await getPolicy(slug);
  } catch (cause) {
    if (cause instanceof SpreeApiError && cause.status === 404) notFound();
    throw cause;
  }

  let siblings: Policy[] = [];
  try {
    siblings = (await listPolicies()).data.filter((item) => item.slug !== policy.slug).slice(0, 8);
  } catch {
    siblings = [];
  }

  const crumbs = [
    { label: t("home"), href: "/" },
    { label: t("policies_title"), href: "/policies" },
    { label: policy.name },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-5" />

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">
        <article>
          <Card>
            <header className="border-b border-gray-100 px-5 py-5 sm:px-7">
              <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{policy.name}</h1>
              {policy.updated_at ? (
                <p className="num mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  {t("policy_updated", { date: formatDate(policy.updated_at, locale) })}
                </p>
              ) : null}
            </header>

            <div className="px-5 py-6 sm:px-7">
              {policy.body ? (
                /** `body_html` is merchant-authored and deliberately not
                 * injected: rendering untrusted HTML here would be a stored-XSS
                 * path onto every page that links to a policy. The plain-text
                 * body preserves the document, including its paragraph breaks. */
                <div className="max-w-none whitespace-pre-line text-sm leading-8 text-gray-700">{policy.body}</div>
              ) : (
                <p className="text-sm leading-8 text-gray-500">{t("policy_no_body")}</p>
              )}
            </div>
          </Card>

          <Card className="mt-4 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-navy-950">{t("policy_questions_title")}</h2>
            <p className="mt-1.5 text-sm leading-7 text-gray-600">{t("policy_questions_body")}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a href={`tel:${SITE.contact.phone}`} className="num inline-flex items-center gap-2 rounded-xl border border-navy-900/15 px-4 py-2.5 font-semibold text-navy-900 transition-colors hover:bg-navy-900/5">
                <Icon name="phone" className="h-4 w-4 text-jade-700" />
                {SITE.contact.phone}
              </a>
              <a href={`mailto:${SITE.contact.email}`} className="inline-flex items-center gap-2 rounded-xl border border-navy-900/15 px-4 py-2.5 font-semibold text-navy-900 transition-colors hover:bg-navy-900/5">
                <Icon name="mail" className="h-4 w-4 text-jade-700" />
                {SITE.contact.email}
              </a>
            </div>
          </Card>
        </article>

        {siblings.length ? (
          <aside className="lg:sticky lg:top-32">
            <Card>
              <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-navy-950">{t("policies_title")}</h2>
              <ul className="px-2 py-2">
                {siblings.map((item) => (
                  <li key={item.id}>
                    <a href={`/policies/${item.slug}`} className="block rounded-lg px-2.5 py-2 text-sm text-gray-600 transition-colors hover:bg-navy-900/5 hover:text-navy-900">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
