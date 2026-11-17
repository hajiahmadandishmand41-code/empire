import Link from "next/link";
import Image from "next/image";
import { translator, type Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icons";
import { sameOriginMedia, type Category } from "@/lib/api";

/** Main categories. Links carry the category's prefixed id because
 * `q[in_category]` is documented as taking an id, not a permalink — sending a
 * permalink would silently return an unfiltered catalog. */
export function CategoryRail({ categories, locale }: { categories: Category[]; locale: Locale }) {
  const t = translator(locale);
  if (!categories.length) return null;
  return (
    <section aria-labelledby="home-categories">
      <SectionHeading
        id="home-categories"
        title={t("categories_title")}
        subtitle={t("categories_subtitle")}
        href="/products"
        linkLabel={t("all_categories")}
        icon={<Icon name="grid" className="h-5 w-5" />}
      />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-6">
        {categories.map((category) => {
          const image = sameOriginMedia(category.square_image_url || category.image_url);
          return (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.id)}`}
              className="group flex w-28 shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-jade-300 hover:shadow-raised sm:w-auto"
            >
              <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-navy-50 text-navy-500 transition-colors group-hover:bg-jade-50 group-hover:text-jade-700">
                {image ? <Image src={image} alt="" fill sizes="56px" className="object-cover" /> : <Icon name="package" className="h-6 w-6" />}
              </span>
              <span className="line-clamp-2 text-xs font-bold leading-5 text-navy-900">{category.name}</span>
              {category.products_count != null ? (
                <span className="num text-2xs text-gray-400">{category.products_count}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
