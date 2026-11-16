import { formatMoney } from "@spree/sdk";

/** Spree 6 money is a decimal string in major units, never integer cents. */
export function formatAmount(amount: string | null | undefined, currency = "AFN", locale = "fa-AF"): string {
  if (amount == null || amount === "") return "—";
  return formatMoney(amount, currency, locale) || "—";
}
export function formatPrice(amount: string | null | undefined, locale = "fa-AF"): string {
  return formatAmount(amount, "AFN", locale);
}
