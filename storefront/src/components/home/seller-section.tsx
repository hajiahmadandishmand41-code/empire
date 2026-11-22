import { translator, type Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/section-heading";
import { SellerCard } from "@/components/vendor/seller-card";
import { Icon } from "@/components/ui/icons";
import type { Seller } from "@/lib/api";

/** Verified suppliers. `GET /store/sellers` returns only sellers who can
 * currently take orders, so this rail is real store state. */
export function SellerSection({ sellers, locale }: { sellers: Seller[]; locale: Locale }) {
  const t = translator(locale);
  if (!sellers.length) return null;
  return (
    <section aria-labelledby="home-sellers">
      <SectionHeading
        id="home-sellers"
        title={t("verified_suppliers_title")}
        subtitle={t("verified_suppliers_subtitle")}
        href="/vendors"
        linkLabel={t("view_all_vendors")}
        icon={<Icon name="store" className="h-5 w-5" />}
      />
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {sellers.map((seller) => (
          <div key={seller.id} className="w-60 shrink-0 sm:w-auto">
            <SellerCard seller={seller} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}
