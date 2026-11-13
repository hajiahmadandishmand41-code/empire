/**
 * Empire Storefront — Currency formatting
 *
 * Formats amounts in AFN (Afghan afghani) and other currencies. AFN is the
 * primary currency for the Afghanistan market. Amounts are stored as integer
 * subunits (cents / afghani subunits) in the Spree API and converted here.
 */

export function formatAmount(
  amountSubunits: number | null | undefined,
  currency: string = "AFN",
  locale: string = "fa-AF"
): string {
  if (amountSubunits == null) return "—";
  const units = amountSubunits / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(units);
  } catch {
    // Fallback for locales/currencies Intl may not support
    const symbol = currency === "AFN" ? "AFN" : currency;
    return `${symbol} ${units.toLocaleString(locale)}`;
  }
}

export function formatPrice(amountSubunits: number | null | undefined) {
  return formatAmount(amountSubunits, "AFN", "fa-AF");
}
