import { translator, type Locale, type MessageKey } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductRail } from "@/components/product/product-grid";
import { Icon, type IconName } from "@/components/ui/icons";
import type { Product } from "@/lib/api";

/** A merchandising rail.
 *
 * Renders nothing when there is no data behind it: an empty "Special offers"
 * heading on a store with no discounted product would be a display-only
 * section, which is exactly what the storefront must not contain.
 */
export function ProductSection({
  products, locale, titleKey, subtitleKey, href, linkLabelKey = "view_all", icon, level = 2, id,
}: {
  products: Product[];
  locale: Locale;
  titleKey: MessageKey;
  subtitleKey?: MessageKey;
  href?: string;
  linkLabelKey?: MessageKey;
  icon?: IconName;
  level?: 2 | 3;
  id: string;
}) {
  const t = translator(locale);
  if (!products.length) return null;
  return (
    <section aria-labelledby={id}>
      <SectionHeading
        id={id}
        level={level}
        title={t(titleKey)}
        subtitle={subtitleKey ? t(subtitleKey) : undefined}
        href={href}
        linkLabel={t(linkLabelKey)}
        icon={icon ? <Icon name={icon} className="h-5 w-5" /> : undefined}
      />
      <ProductRail products={products} />
    </section>
  );
}
