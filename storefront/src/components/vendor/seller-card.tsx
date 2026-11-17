import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { translate, type Locale } from "@/lib/i18n";
import { sameOriginMedia, type Seller } from "@/lib/api";

/** Verified supplier card.
 *
 * `GET /store/sellers` only returns sellers who can currently take orders, so
 * the "verified" badge here is a statement about real store state rather than
 * decoration. Product counts are not part of that payload and are deliberately
 * not invented.
 */
export function SellerCard({ seller, locale }: { seller: Seller; locale: Locale }) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const href = `/vendors/${seller.slug || seller.id}`;
  const logo = sameOriginMedia(seller.square_logo_url || seller.logo_url);
  const cover = sameOriginMedia(seller.cover_photo_url);
  const about = seller.about?.trim();

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised"
    >
      <div className="relative h-20 w-full overflow-hidden bg-navy-900">
        {cover ? (
          <Image src={cover} alt={t("vendor_cover_alt")} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover opacity-90" />
        ) : (
          <span className="absolute inset-0 bg-linear-to-br from-navy-800 to-navy-950" aria-hidden="true" />
        )}
      </div>

      <div className="-mt-8 flex flex-1 flex-col px-4 pb-4">
        <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-navy-50 shadow-card">
          {logo ? (
            <Image src={logo} alt={t("vendor_logo_alt")} fill sizes="64px" className="object-cover" />
          ) : (
            <Icon name="store" className="h-7 w-7 text-navy-400" />
          )}
        </span>

        <h3 className="mt-2.5 line-clamp-1 text-sm font-bold text-navy-950">{seller.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-2xs font-semibold text-jade-700">
          <Icon name="shield" className="h-3.5 w-3.5 shrink-0" />
          {t("vendor_verified_note")}
        </p>

        {about ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">{about}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge tone="outline">{t("seller_card_products")}</Badge>
          {seller.policies?.length ? <Badge tone="gray">{t("vendor_policies_title")}</Badge> : null}
        </div>

        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-bold text-jade-700 transition-colors group-hover:text-jade-600">
          {t("visit_seller_store")}
          <Icon name="chevronEnd" className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
