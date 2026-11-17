import { formatAmount } from "@/lib/currency";
import { cx } from "@/lib/cx";

/** Spree 6 money is a decimal string in major units. Never render it raw:
 * the locale decides digits, grouping and the currency sign. */
export function Price({
  amount, currency = "AFN", locale = "fa-AF", compareAt, size = "md", className,
}: { amount: string | null | undefined; currency?: string; locale?: string; compareAt?: string | null; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-3xl" } as const;
  const discount = compareAt && amount && Number(compareAt) > Number(amount)
    ? Math.round((1 - Number(amount) / Number(compareAt)) * 100)
    : null;
  return (
    <span className={cx("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cx("num font-extrabold text-jade-700", sizes[size])}>{formatAmount(amount, currency, locale)}</span>
      {compareAt && discount ? (
        <>
          <span className={cx("num text-gray-400 line-through", size === "xl" ? "text-base" : "text-xs")}>{formatAmount(compareAt, currency, locale)}</span>
          <span className="num rounded-md bg-saffron-100 px-1.5 py-0.5 text-2xs font-bold text-saffron-700">−{discount}٪</span>
        </>
      ) : null}
    </span>
  );
}

export function PriceHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cx("text-xs text-gray-500", className)}>{children}</span>;
}
