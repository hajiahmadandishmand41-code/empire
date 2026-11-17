import type { MetadataRoute } from "next";
import { listCategories, listCollections, listPolicies, listProducts, listSellers } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

/** Sitemap built from the live catalog.
 *
 * Every URL here is a real, indexable page backed by store data. A backend
 * outage yields a partial sitemap rather than a 500: search engines keep the
 * previously discovered URLs instead of seeing the whole site fail.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/vendors"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/wholesale"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/offers"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/collections"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/rfq"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/become-seller"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/policies"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const [categories, collections, policies, products, sellers] = await Promise.all([
    listCategories(200).then((page) => page.data).catch(() => []),
    listCollections(200).then((page) => page.data).catch(() => []),
    listPolicies().then((page) => page.data).catch(() => []),
    // 500 products keeps the sitemap meaningful without paging the whole
    // catalog on every request; raise this when the catalog outgrows it.
    listProducts({ limit: 500, sort: "-available_on" }).then((page) => page.data).catch(() => []),
    listSellers({ limit: 100 }).then((page) => page.data).catch(() => []),
  ]);

  return [
    ...staticRoutes,
    ...categories.map((category) => ({
      url: absoluteUrl(`/products?category=${encodeURIComponent(category.id)}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: product.available_on ? new Date(product.available_on) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.thumbnail_url ? [{ url: absoluteUrl(product.thumbnail_url) }] : undefined,
    })),
    ...collections.map((collection) => ({
      url: absoluteUrl(`/collections/${collection.permalink}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Policies are indexable legal content and the footer links every one.
    ...policies.map((policy) => ({
      url: absoluteUrl(`/policies/${policy.slug}`),
      lastModified: policy.updated_at ? new Date(policy.updated_at) : now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...sellers.map((seller) => ({
      url: absoluteUrl(`/vendors/${seller.slug || seller.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
