import Link from "next/link";
import Image from "next/image";
import { translator, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/ui/icons";
import { sameOriginMedia, type Collection } from "@/lib/api";

/** Promo banners, driven by real Spree collections rather than hard-coded
 * artwork: an operator curates a collection in the dashboard and it appears
 * here with its own image, name and product count. */
export function CollectionBanners({ collections, locale }: { collections: Collection[]; locale: Locale }) {
  const t = translator(locale);
  if (!collections.length) return null;
  return (
    <section aria-labelledby="home-collections">
      <h2 id="home-collections" className="sr-only">{t("collections_title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, index) => {
          const image = sameOriginMedia(collection.image_url || collection.square_image_url);
          const wide = index === 0 && collections.length > 2;
          return (
            <Link
              key={collection.id}
              href={`/collections/${collection.permalink}`}
              className={`group relative flex min-h-44 items-end overflow-hidden rounded-2xl bg-navy-900 shadow-card transition-shadow hover:shadow-raised ${wide ? "sm:col-span-2" : ""}`}
            >
              {image ? (
                <Image
                  src={image}
                  alt={collection.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <span aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-navy-800 via-navy-900 to-jade-950" />
              )}
              <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-navy-950/95 via-navy-950/45 to-transparent" />
              <span className="relative flex w-full items-end justify-between gap-3 p-5">
                <span className="min-w-0">
                  <span className="block truncate text-lg font-extrabold text-white">{collection.name}</span>
                  {collection.products_count != null ? (
                    <span className="num mt-0.5 block text-2xs font-semibold text-jade-300">
                      {t("results_count", { count: collection.products_count })}
                    </span>
                  ) : null}
                  {collection.description ? (
                    <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-navy-200">{collection.description}</span>
                  ) : null}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-navy-900 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  <Icon name="chevronEnd" className="h-4 w-4" />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
