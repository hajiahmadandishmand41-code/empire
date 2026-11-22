"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/components/locale-provider";
import { useCart } from "@/components/cart-context";
import { SearchField } from "@/components/layout/search-field";
import { EmpireMark, Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { SITE, formatPhone } from "@/lib/site";
import { formatCount } from "@/lib/numbers";
import { sameOriginMedia, type Category } from "@/lib/api";
import { cx } from "@/lib/cx";

type NavKey = "products" | "nav_vendors" | "nav_wholesale" | "nav_offers" | "nav_rfq";

const NAV_LINKS: { href: string; key: NavKey; icon: "grid" | "store" | "package" | "tag" | "quote" }[] = [
  { href: "/products", key: "products", icon: "grid" },
  { href: "/vendors", key: "nav_vendors", icon: "store" },
  { href: "/wholesale", key: "nav_wholesale", icon: "package" },
  { href: "/offers", key: "nav_offers", icon: "tag" },
  { href: "/rfq", key: "nav_rfq", icon: "quote" },
];

/** Exactly one language control is rendered, in the main bar, at every
 * breakpoint. Duplicating it per breakpoint would give three elements the same
 * accessible name — an ambiguity for assistive technology and for label-based
 * lookups — so the utility bar and the drawer deliberately have none. */
export function HeaderClient({ categories }: { categories: Category[] }) {
  const { locale, setLocale, t } = useLocale();
  const { itemCount, session } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the drawer on navigation; a sheet left open over a new page traps
  // keyboard and screen-reader focus behind it. This is React's documented
  // "adjust state when a prop changes" pattern, run during render rather than
  // in an effect so the drawer is never painted open on the new route.
  const [drawnPathname, setDrawnPathname] = useState(pathname);
  if (drawnPathname !== pathname) {
    setDrawnPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    // setState only from the scroll callback — subscribing to an external
    // system, which is what an effect is for.
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const badge = itemCount > 0 ? formatCount(itemCount, locale) : null;

  return (
    <header className={cx("sticky top-0 z-50 transition-shadow", scrolled && "shadow-raised")}>
      {/* ---------------------------------------------------- utility bar */}
      <div className="hidden bg-navy-950 text-navy-100 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-1.5 text-2xs sm:px-6 lg:px-8">
          <a href={`tel:${SITE.contact.phone}`} className="num inline-flex items-center gap-1.5 transition-colors hover:text-white">
            <Icon name="phone" className="h-3.5 w-3.5" />
            {formatPhone(locale)}
          </a>
          <span className="inline-flex items-center gap-1.5 text-navy-300">
            <Icon name="truck" className="h-3.5 w-3.5" />
            {t("hero_trust_delivery")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-navy-300">
            <Icon name="wallet" className="h-3.5 w-3.5" />
            {t("hero_trust_cod")}
          </span>
          <Link href="/become-seller" className="ms-auto transition-colors hover:text-white">{t("become_seller")}</Link>
        </div>
      </div>

      {/* ------------------------------------------------------- main bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            aria-expanded={menuOpen}
            className="-ms-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy-800 transition-colors hover:bg-navy-50 lg:hidden"
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={SITE.name}>
            <EmpireMark className="h-9 w-9" />
            <span className="hidden flex-col leading-none xl:flex">
              <span className="text-xl font-extrabold tracking-tight text-navy-950">{SITE.name}</span>
              <span className="mt-0.5 text-2xs text-gray-500">{t("tagline")}</span>
            </span>
          </Link>

          <SearchField className="min-w-0 flex-1" />

          <div className="flex shrink-0 items-center">
            <div className="relative flex items-center">
              <Icon name="globe" className="pointer-events-none absolute start-2 h-4 w-4 text-gray-400" />
              <label htmlFor="locale-select" className="sr-only">{t("language")}</label>
              <select
                id="locale-select"
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="h-10 cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent ps-8 pe-2 text-sm font-medium text-navy-800 outline-none transition-colors hover:bg-navy-50 focus-visible:bg-navy-50"
              >
                {LOCALES.map((value) => <option key={value} value={value}>{LOCALE_LABELS[value]}</option>)}
              </select>
            </div>

            <Link
              href={session ? "/account" : "/login"}
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50 sm:flex"
            >
              <Icon name="user" className="h-5 w-5" />
              <span className="max-w-28 truncate">{session ? t("my_account") : t("login")}</span>
            </Link>

            <Link
              href="/cart"
              aria-label={badge ? t("cart_badge_count", { count: badge }) : t("cart")}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-navy-800 transition-colors hover:bg-navy-50"
            >
              <Icon name="cart" className="h-6 w-6" />
              {badge ? (
                <span className="num absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-jade-700 px-1 text-2xs font-bold text-white ring-2 ring-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- nav bar */}
      <nav aria-label={t("nav_categories")} className="hidden bg-navy-900 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="flex h-11 shrink-0 items-center gap-2 bg-jade-700 px-4 text-sm font-bold text-white transition-colors hover:bg-jade-600"
          >
            <Icon name="grid" className="h-4 w-4" />
            {t("all_categories")}
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.id)}`}
                className="flex h-11 max-w-40 shrink-0 items-center truncate px-3 text-sm text-navy-100 transition-colors hover:bg-navy-800 hover:text-white"
              >
                {category.name}
              </Link>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {NAV_LINKS.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "flex h-11 items-center px-3 text-sm transition-colors hover:bg-navy-800 hover:text-white",
                  isActive(link.href) ? "font-bold text-white" : "text-navy-100",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* -------------------------------------------------- mobile drawer */}
      {/* Sheet already provides the scroll container and its padding, so the
          drawer body is a plain stack: a second overflow container here would
          nest scroll areas and trap the wheel on touch devices. */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t("menu")} side="start">
        <div className="-mx-4 -my-4">
          <nav aria-label={t("nav_categories")} className="px-2 py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive(link.href) ? "bg-navy-50 text-navy-900" : "text-navy-800 hover:bg-gray-50",
                )}
              >
                <Icon name={link.icon} className="h-5 w-5 text-jade-700" />
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {categories.length ? (
            <div className="border-t border-gray-100 px-2 py-2">
              <p className="px-3 py-2 text-xs font-bold text-gray-400">{t("nav_categories")}</p>
              {categories.map((category) => {
                const image = sameOriginMedia(category.square_image_url || category.image_url);
                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(category.id)}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-800 transition-colors hover:bg-gray-50"
                  >
                    {image ? (
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        <Image src={image} alt="" fill sizes="32px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-500">
                        <Icon name="grid" className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    <Icon name="chevronEnd" className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div className="border-t border-gray-100 px-2 py-2">
            <Link href={session ? "/account" : "/login"} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-navy-800 transition-colors hover:bg-gray-50">
              <Icon name="user" className="h-5 w-5 text-jade-700" />
              {session ? t("my_account") : t("login")}
            </Link>
            <Link href="/cart" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-navy-800 transition-colors hover:bg-gray-50">
              <Icon name="cart" className="h-5 w-5 text-jade-700" />
              {t("cart")}
              {badge ? <Badge tone="jade" className="ms-auto">{t("cart_badge_count", { count: badge })}</Badge> : null}
            </Link>
            <Link href="/become-seller" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-navy-800 transition-colors hover:bg-gray-50">
              <Icon name="building" className="h-5 w-5 text-jade-700" />
              {t("become_seller")}
            </Link>
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <a href={`tel:${SITE.contact.phone}`} className="num flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Icon name="phone" className="h-4 w-4 text-jade-700" />
              {formatPhone(locale)}
            </a>
            <p className="mt-1 text-xs text-gray-500">{SITE.contact.hours[locale]}</p>
          </div>
        </div>
      </Sheet>
    </header>
  );
}
