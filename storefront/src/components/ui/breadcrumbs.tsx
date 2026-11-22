import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="breadcrumb" className={cx("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="truncate rounded transition-colors hover:text-jade-700 hover:underline">{item.label}</Link>
              ) : (
                <span className="truncate font-medium text-navy-900" aria-current={last ? "page" : undefined}>{item.label}</span>
              )}
              {!last ? <Icon name="chevronEnd" className="h-3.5 w-3.5 shrink-0 text-gray-300" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** schema.org BreadcrumbList, emitted next to the visible trail. */
export function breadcrumbJsonLd(items: Crumb[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
      .filter((item) => item.href)
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: new URL(item.href as string, baseUrl).toString(),
      })),
  };
}
