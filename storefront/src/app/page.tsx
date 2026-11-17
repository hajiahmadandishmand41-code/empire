import { Hero } from "@/components/home/hero";
import { CategoryRail } from "@/components/home/category-rail";
import { CollectionBanners } from "@/components/home/collection-banners";
import { ProductSection } from "@/components/home/product-section";
import { SellerSection } from "@/components/home/seller-section";
import { RfqBanner } from "@/components/home/rfq-banner";
import { Benefits } from "@/components/home/benefits";
import { ErrorNotice } from "@/components/error-notice";
import { currentLocale } from "@/lib/locale-server";
import { buildMetadata } from "@/lib/seo";
import { translate } from "@/lib/i18n";
import {
  isOnOffer, isWholesale, listCollectionProducts, listCollections, listProducts,
  listRootCategories, listSellers,
  type Category, type Collection, type Product, type Seller,
} from "@/lib/api";

export async function generateMetadata() {
  const locale = await currentLocale();
  return buildMetadata({
    locale,
    title: translate(locale, "meta_home_title"),
    description: translate(locale, "meta_home_description"),
    path: "/",
  });
}

type Settled<T> = { value: T; failed: boolean };

/** Resolves to a fallback instead of rejecting, so one unavailable endpoint
 * removes its own section rather than taking the whole home page down.
 *
 * The `failed` flag is kept because "this store has no products yet" and "the
 * catalog could not be reached" need different UI. The first is a normal state
 * and must not be reported as an error. */
async function settle<T>(promise: Promise<T>, fallback: T): Promise<Settled<T>> {
  try { return { value: await promise, failed: false }; } catch { return { value: fallback, failed: true }; }
}

export default async function Home() {
  const locale = await currentLocale();

  const [categories, collections, pool, bestSellers, newArrivals, sellers] = await Promise.all([
    settle(listRootCategories(12), [] as Category[]),
    settle(listCollections(6).then((page) => page.data), [] as Collection[]),
    // One wider sample with variants expanded, from which the offer and
    // wholesale rails are derived. Both are computed from real price and
    // quantity-rule fields returned by the API, never hand-written.
    settle(listProducts({ limit: 32, expand: "variants,seller" }).then((page) => page.data), [] as Product[]),
    settle(listProducts({ sort: "best_selling", limit: 12, expand: "variants,seller" }).then((page) => page.data), [] as Product[]),
    settle(listProducts({ sort: "-available_on", limit: 12, expand: "variants,seller" }).then((page) => page.data), [] as Product[]),
    settle(listSellers({ limit: 8 }).then((page) => page.data), [] as Seller[]),
  ]);

  // "Featured" means operator-curated: the first real collection when the store
  // has one, otherwise the best-selling products stand in.
  const featuredCollection = collections.value[0];
  const featuredRaw = featuredCollection
    ? (await settle(listCollectionProducts(featuredCollection.id, 12).then((page) => page.data), bestSellers.value)).value
    : bestSellers.value;

  /** Rails are de-duplicated in display order. Repeating one product across
   * four sections is poor merchandising on a small catalog, and it also makes
   * "the card for product X" ambiguous for assistive technology and for
   * label/text based lookups, which must resolve to a single element. */
  const seen = new Set<string>();
  const take = (list: Product[]) => list.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });

  const featured = take(featuredRaw).slice(0, 12);
  const best = take(bestSellers.value).slice(0, 12);
  const offers = take(pool.value.filter(isOnOffer)).slice(0, 12);
  const wholesale = take(pool.value.filter(isWholesale)).slice(0, 12);
  const fresh = take(newArrivals.value).slice(0, 12);

  const catalogUnreachable = pool.failed && bestSellers.failed && newArrivals.failed;

  return (
    <>
      <Hero locale={locale} />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {catalogUnreachable ? <ErrorNotice message="backend_error" /> : null}

        <CategoryRail categories={categories.value} locale={locale} />

        <CollectionBanners collections={collections.value} locale={locale} />

        <ProductSection
          id="home-featured"
          products={featured}
          locale={locale}
          titleKey="featured_products"
          subtitleKey={featuredCollection ? "collections_subtitle" : "bestsellers_subtitle"}
          href={featuredCollection ? `/collections/${featuredCollection.permalink}` : "/products"}
          icon="spark"
        />

        <ProductSection
          id="home-bestsellers"
          products={best}
          locale={locale}
          titleKey="bestsellers_title"
          subtitleKey="bestsellers_subtitle"
          href="/products?sort=best_selling"
          icon="chart"
        />

        <ProductSection
          id="home-offers"
          products={offers}
          locale={locale}
          titleKey="offers_title"
          subtitleKey="offers_subtitle"
          href="/offers"
          icon="tag"
        />

        <ProductSection
          id="home-wholesale"
          products={wholesale}
          locale={locale}
          titleKey="wholesale_title"
          subtitleKey="wholesale_subtitle"
          href="/wholesale"
          icon="package"
        />

        <SellerSection sellers={sellers.value} locale={locale} />

        <ProductSection
          id="home-new"
          products={fresh}
          locale={locale}
          titleKey="new_arrivals_title"
          subtitleKey="new_arrivals_subtitle"
          href="/products?sort=-available_on"
          icon="clock"
        />

        <RfqBanner locale={locale} />

        <Benefits locale={locale} />
      </div>
    </>
  );
}
