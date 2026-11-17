import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/states";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { currentLocale } from "@/lib/locale-server";
import { translator } from "@/lib/i18n";
import { formatCount } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import { listCollections, sameOriginMedia, type Collection } from "@/lib/api";

export async function generateMetadata() {
  const locale = await currentLocale();
  const t = translator(locale);
  return buildMetadata({ locale, title: t("collections_title"), description: t("collections_subtitle"), path: "/collections" });
}

/** Every curated collection the store has published.
 *
 * Collections are the merchant's own merchandising groups, so this index is
 * built from the API rather than from a hardcoded list of promotions.
 */
export default async function CollectionsPage() {
  const locale = await currentLocale();
  const t = translator(locale);

  let collections: Collection[] = [];
  let failed = false;
  try {
    collections = (await listCollections(200)).data;
  } catch {
    failed = true;
  }

  const crumbs = [{ label: t("home"), href: "/" }, { label: t("collections_title") }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE.url)} />
      <Breadcrumbs items={crumbs} className="mb-5" />

      <header className="mb-7 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">{t("collections_title")}</h1>
        <p className="mt-3 text-base leading-8 text-gray-600">{t("collections_subtitle")}</p>
      </header>

      {failed ? (
        <EmptyState icon="alert" title={t("error_title")} message={t("error_body")} actionHref="/collections" actionLabel={t("error_action")} />
      ) : collections.length === 0 ? (
        <EmptyState
          icon="spark"
          title={t("collections_none")}
          message={t("collections_none_body")}
          actionHref="/products"
          actionLabel={t("catalog_title")}
          secondaryHref="/vendors"
          secondaryLabel={t("vendors_title")}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const image = sameOriginMedia(collection.image_url || collection.square_image_url);
            return (
              <li key={collection.id}>
                <Card className="group h-full overflow-hidden transition-shadow hover:shadow-raised">
                  <Link href={`/collections/${collection.permalink}`} className="flex h-full flex-col">
                    <span className="relative block aspect-[16/9] w-full overflow-hidden bg-navy-50">
                      {image ? (
                        <Image
                          src={image}
                          alt={collection.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-navy-50 to-jade-50">
                          <Icon name="spark" className="h-8 w-8 text-navy-300" />
                        </span>
                      )}
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      <span className="text-base font-bold text-navy-950 group-hover:text-jade-800">{collection.name}</span>
                      {collection.description ? (
                        <span className="mt-1.5 line-clamp-2 flex-1 text-sm leading-7 text-gray-600">{collection.description}</span>
                      ) : (
                        <span className="flex-1" />
                      )}
                      {typeof collection.products_count === "number" ? (
                        <span className="num mt-3 text-xs text-gray-500">
                          {t("results_count", { count: formatCount(collection.products_count, locale) })}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
