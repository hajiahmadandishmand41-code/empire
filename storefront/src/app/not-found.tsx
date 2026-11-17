import Link from "next/link";
import { translate } from "@/lib/i18n";
import { currentLocale } from "@/lib/locale-server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/states";

export async function generateMetadata() {
  const locale = await currentLocale();
  // A 404 must never be indexed.
  return buildMetadata({ locale, title: translate(locale, "meta_not_found_title"), path: "/404", noIndex: true });
}

/** not-found is a Server Component, so it cannot use the client locale hook;
 * it reads the same cookie through currentLocale() instead. */
export default async function NotFound() {
  const locale = await currentLocale();
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="num mb-4 text-center text-6xl font-extrabold text-navy-100">404</p>
      <EmptyState
        icon="search"
        title={translate(locale, "not_found_title")}
        message={translate(locale, "not_found_body")}
        actionHref="/"
        actionLabel={translate(locale, "not_found_action")}
        secondaryHref="/products"
        secondaryLabel={translate(locale, "catalog_title")}
      />
      <p className="mt-6 text-center text-sm">
        <Link href="/rfq" className="font-semibold text-jade-700 underline-offset-4 hover:underline">
          {translate(locale, "rfq_banner_cta")}
        </Link>
      </p>
    </div>
  );
}
