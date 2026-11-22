import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { formatCount } from "@/lib/numbers";
import type { Locale } from "@/lib/i18n";
import { cx } from "@/lib/cx";

/** Builds the href for a page number, preserving every other query param. */
export function pageHref(searchParams: Record<string, string | undefined>, page: number, base: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || key === "page") continue;
    query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const suffix = query.size ? `?${query.toString()}` : "";
  return `${base}${suffix}`;
}

export function Pagination({
  page, totalPages, searchParams, base, prevLabel, nextLabel, locale = "fa-AF",
}: { page: number; totalPages: number; searchParams: Record<string, string | undefined>; base: string; prevLabel: string; nextLabel: string; locale?: Locale }) {
  if (totalPages <= 1) return null;
  const window: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, from + 4);
  for (let value = from; value <= to; value += 1) window.push(value);

  const item = "flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={pageHref(searchParams, page - 1, base)} className={cx(item, "border-gray-300 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50")} rel="prev">
          <Icon name="chevronStart" className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ms-1">{prevLabel}</span>
        </Link>
      ) : null}
      {from > 1 ? (
        <Link href={pageHref(searchParams, 1, base)} className={cx(item, "border-gray-300 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50")}>
          <span className="num">{formatCount(1, locale)}</span>
        </Link>
      ) : null}
      {from > 2 ? <span className="px-1 text-gray-400">…</span> : null}
      {window.map((value) => (
        <Link
          key={value}
          href={pageHref(searchParams, value, base)}
          aria-current={value === page ? "page" : undefined}
          className={cx(item, value === page ? "border-navy-900 bg-navy-900 text-white" : "border-gray-300 bg-white text-navy-800 hover:bg-navy-50")}
        >
          <span className="num">{formatCount(value, locale)}</span>
        </Link>
      ))}
      {to < totalPages - 1 ? <span className="px-1 text-gray-400">…</span> : null}
      {to < totalPages ? <Link href={pageHref(searchParams, totalPages, base)} className={cx(item, "border-gray-300 bg-white text-navy-800 hover:bg-navy-50")}><span className="num">{totalPages}</span></Link> : null}
      {page < totalPages ? (
        <Link href={pageHref(searchParams, page + 1, base)} className={cx(item, "border-gray-300 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50")} rel="next">
          <span className="sr-only sm:not-sr-only sm:me-1">{nextLabel}</span>
          <Icon name="chevronEnd" className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
