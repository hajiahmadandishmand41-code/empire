import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Private and transactional surfaces are excluded from indexing.
 *
 * Everything a shopper should find is allowed; account, cart, checkout, the
 * staff panels and the auth pages are not content and must never appear in a
 * search result. `checkout` and `cart` are also session-dependent, so indexing
 * them would produce duplicate, non-canonical URLs.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account", "/cart", "/checkout", "/company",
          "/login", "/register", "/admin", "/seller",
          "/dashboard", "/sellers", "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
