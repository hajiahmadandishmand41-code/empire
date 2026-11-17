import type { Metadata } from "next";
import { LOCALE_OPENGRAPH, type Locale, translate } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** Every public page gets a canonical and an OG block. Private pages are
 * excluded from indexing by robots.ts plus `noIndex` here. */
export function buildMetadata({
  locale, title, description, path, image, noIndex,
}: {
  locale: Locale; title: string; description?: string; path: string;
  image?: string | null; noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title,
      description,
      locale: LOCALE_OPENGRAPH[locale],
      images: image ? [{ url: absoluteUrl(image) }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  };
}

/** Metadata for an authenticated or transactional page.
 *
 * Deliberately not `buildMetadata` with `noIndex`: that helper also emits a
 * canonical pointing at the same URL, which tells a crawler this private page
 * is the preferred version of itself. A noindexed page needs no canonical, no
 * OG image and no search snippet — just a correct title for the browser tab and
 * an explicit robots directive.
 */
export function privateMetadata({
  locale, title, description,
}: { locale: Locale; title: string; description?: string }): Metadata {
  return {
    title,
    description,
    openGraph: { type: "website", siteName: SITE.name, title, description, locale: LOCALE_OPENGRAPH[locale] },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

/** Escapes the three characters that could otherwise terminate a <script>. */
function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case "<": return "\\u003c";
      case ">": return "\\u003e";
      case "&": return "\\u0026";
      case "\u2028": return "\\u2028";
      default: return "\\u2029";
    }
  });
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(data) }} />;
}

export function organizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: absoluteUrl("/"),
    description: translate(locale, "footer_tagline"),
    areaServed: { "@type": "Country", name: "Afghanistan" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE.contact.email,
      telephone: SITE.contact.phone,
      availableLanguage: ["fa-AF", "en"],
    },
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    inLanguage: locale === "fa-AF" ? "fa-AF" : "en",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/products")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}
