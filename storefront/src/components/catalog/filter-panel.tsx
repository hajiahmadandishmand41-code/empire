"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatCount } from "@/lib/numbers";
import type { ProductFilters } from "@/lib/api";
import { cx } from "@/lib/cx";

/** Sort ids the Store API documents, mapped to catalog keys. The API returns
 * sort_options with a null label, so the wording comes from the storefront's
 * own catalog instead of being invented per request. */
const SORTS = [
  { id: "best_selling", key: "sort_best_selling" },
  { id: "-available_on", key: "sort_newest" },
  { id: "price", key: "sort_price_asc" },
  { id: "-price", key: "sort_price_desc" },
  { id: "name", key: "sort_name_asc" },
] as const;

/** Catalog controls.
 *
 * One GET form drives everything, so filtering works with JavaScript disabled
 * and every refined view has a real, shareable, indexable URL. Changing a
 * discrete control pushes that URL through the router; the submit button stays
 * for no-JS and for the price range, which must not navigate per keystroke.
 *
 * The form is rendered exactly once. On small screens its container becomes a
 * fixed drawer through CSS rather than by rendering a second copy inside a
 * portal — a duplicate would repeat every field id and name in the document and
 * make label lookups ambiguous.
 */
export function FilterPanel({
  filters, resultCount, base, params,
}: {
  filters: ProductFilters | null;
  resultCount: number;
  base: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };
  const many = (key: string) => {
    const value = params[key];
    return new Set(Array.isArray(value) ? value : value ? [value] : []);
  };
  const selectedOptions = many("ov");

  function submit() {
    const form = formRef.current;
    if (!form) return;
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      const text = String(value).trim();
      if (text) query.append(key, text);
    }
    const suffix = query.size ? `?${query.toString()}` : "";
    setOpen(false);
    router.push(`${base}${suffix}`);
  }

  // Drawer hygiene: Escape closes it and the page behind it stops scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open]);

  const price = filters?.filters.find((group) => group.type === "price_range");
  const availability = filters?.filters.find((group) => group.type === "availability");
  const categories = filters?.filters.find((group) => group.type === "category");
  const optionGroups = (filters?.filters ?? []).filter((group) => group.type === "option");
  const inStockCount = availability?.options?.find((option) => option.id === "in_stock")?.count;

  return (
    <>
      {/* Mobile trigger. The desktop sidebar needs none. */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} aria-expanded={open} iconStart={<Icon name="filter" className="h-4 w-4" />}>
          {t("filters_toggle")}
        </Button>
        <p className="num text-xs text-gray-500">{t("results_count", { count: formatCount(resultCount, locale) })}</p>
      </div>

      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("close")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-80 cursor-default bg-navy-950/50 animate-fade-in lg:hidden"
        />
      ) : null}

      <aside
        aria-label={t("filters_title")}
        className={cx(
          "w-full shrink-0 lg:static lg:z-auto lg:block lg:w-60 lg:max-w-none lg:translate-x-0 lg:bg-transparent lg:p-0 lg:shadow-none",
          "fixed inset-y-0 start-0 z-90 max-w-sm overflow-y-auto bg-white p-4 shadow-pop transition-transform duration-200 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full ltr:-translate-x-full rtl:translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3 lg:mb-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-950">
            <Icon name="filter" className="h-4 w-4 text-jade-700" />
            {t("filters_title")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("close")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} method="get" action={base} onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-6 lg:sticky lg:top-32">
          <div>
            <label htmlFor="catalog-sort" className="mb-1.5 block text-xs font-bold text-navy-900">{t("sort_label")}</label>
            <select
              id="catalog-sort"
              name="sort"
              defaultValue={one("sort") || SORTS[0].id}
              onChange={submit}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus-visible:border-jade-500"
            >
              {SORTS.map((sort) => <option key={sort.id} value={sort.id}>{t(sort.key)}</option>)}
            </select>
          </div>

          {categories?.options?.length ? (
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-navy-900">{t("filter_category")}</legend>
              <div className="space-y-1">
                {categories.options.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-navy-800 transition-colors hover:bg-navy-50">
                    <input type="radio" name="category" value={option.id} defaultChecked={one("category") === option.id} onChange={submit} className="h-4 w-4 accent-jade-700" />
                    <span className="min-w-0 flex-1 truncate">{option.name}</span>
                    {option.count != null ? <span className="num shrink-0 text-2xs text-gray-400">{formatCount(option.count, locale)}</span> : null}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {price ? (
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-navy-900">{t("filter_price_range")}</legend>
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-min" className="sr-only">{t("filter_price_min")}</label>
                <input id="catalog-min" name="min" type="number" min={0} inputMode="numeric" defaultValue={one("min")} placeholder={t("filter_price_min")} className="num h-10 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus-visible:border-jade-500" />
                <span aria-hidden="true" className="shrink-0 text-gray-400">–</span>
                <label htmlFor="catalog-max" className="sr-only">{t("filter_price_max")}</label>
                <input id="catalog-max" name="max" type="number" min={0} inputMode="numeric" defaultValue={one("max")} placeholder={t("filter_price_max")} className="num h-10 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus-visible:border-jade-500" />
              </div>
            </fieldset>
          ) : null}

          {availability?.options?.length ? (
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-navy-900">{t("filter_availability")}</legend>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-navy-800 transition-colors hover:bg-navy-50">
                <input type="checkbox" name="stock" value="1" defaultChecked={one("stock") === "1"} onChange={submit} className="h-4 w-4 accent-jade-700" />
                <span className="flex-1">{t("filter_in_stock_only")}</span>
                {inStockCount != null ? <span className="num text-2xs text-gray-400">{formatCount(inStockCount, locale)}</span> : null}
              </label>
            </fieldset>
          ) : null}

          {optionGroups.map((group) => group.options?.length ? (
            <fieldset key={group.id}>
              <legend className="mb-2 text-xs font-bold text-navy-900">{group.label || group.name}</legend>
              <div className="space-y-1">
                {group.options.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-navy-800 transition-colors hover:bg-navy-50">
                    <input type="checkbox" name="ov" value={option.id} defaultChecked={selectedOptions.has(option.id)} onChange={submit} className="h-4 w-4 accent-jade-700" />
                    {option.color_code ? (
                      <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-gray-300" style={{ backgroundColor: option.color_code }} />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{option.label || option.name}</span>
                    {option.count != null ? <span className="num shrink-0 text-2xs text-gray-400">{formatCount(option.count, locale)}</span> : null}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null)}

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" block>{t("filters_apply")}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); router.push(base); }}>
              {t("filters_clear")}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
