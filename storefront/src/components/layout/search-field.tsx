"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { listProducts, sameOriginMedia, type Product } from "@/lib/api";
import { formatAmount } from "@/lib/currency";
import { cx } from "@/lib/cx";

/** Live product search.
 *
 * Deliberately conservative for Afghan connections: 250 ms debounce, at most
 * five suggestions, every in-flight request aborted when a newer keystroke
 * arrives, and no request at all for fewer than two characters. The form still
 * submits to /products?q=… without JavaScript doing anything clever, so the
 * search works even when suggestions fail.
 */
export function SearchField({ className, autoFocus = false, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const listId = useId();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Clearing on a too-short term happens in the event handler, not in an
   * effect: the keystroke is the external event, so the state change belongs
   * with it and no extra render pass is needed. */
  function onTermChange(value: string) {
    setTerm(value);
    if (value.trim().length < 2) {
      setResults(null);
      setOpen(false);
      setBusy(false);
      setActive(-1);
    }
  }

  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    // Both the busy flag and the results are written from asynchronous
    // callbacks (the debounce timer and the promise), never synchronously in
    // the effect body.
    const timer = setTimeout(() => {
      setBusy(true);
      listProducts({ search: query, limit: 5 }, { signal: controller.signal })
        .then((page) => { setResults(page.data); setActive(-1); setOpen(true); })
        // An abort is our own doing; anything else simply hides suggestions
        // rather than turning the search box into an error surface.
        .catch(() => { if (!controller.signal.aborted) setResults(null); })
        .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    const query = term.trim();
    setOpen(false);
    onNavigate?.();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = results?.length ?? 0;
    if (event.key === "Escape") { setOpen(false); setActive(-1); return; }
    if (event.key === "ArrowDown" && count) { event.preventDefault(); setOpen(true); setActive((index) => (index + 1) % count); return; }
    if (event.key === "ArrowUp" && count) { event.preventDefault(); setActive((index) => (index <= 0 ? count - 1 : index - 1)); return; }
    if (event.key === "Enter" && open && active >= 0 && results?.[active]) {
      event.preventDefault();
      const product = results[active];
      setOpen(false);
      onNavigate?.();
      router.push(`/products/${product.slug}`);
    }
  }

  const expanded = open && results !== null;
  return (
    <div ref={boxRef} className={cx("relative", className)}>
      <form action="/products" method="get" onSubmit={submit} role="search">
        <div className="flex items-stretch overflow-hidden rounded-xl border border-navy-200 bg-white shadow-card transition-shadow focus-within:border-jade-500 focus-within:shadow-raised">
          <span className="flex items-center ps-3 text-gray-400">
            {busy ? <Spinner className="h-4 w-4" /> : <Icon name="search" className="h-5 w-5" />}
          </span>
          <input
            ref={inputRef}
            name="q"
            type="search"
            value={term}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(event) => onTermChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => { if (results?.length) setOpen(true); }}
            aria-label={t("search")}
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            aria-autocomplete="list"
            role="combobox"
            placeholder={t("search_placeholder")}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-navy-950 outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <button type="submit" className="shrink-0 bg-jade-700 px-4 text-sm font-bold text-white transition-colors hover:bg-jade-600 active:bg-jade-800 sm:px-5">
            <span className="hidden sm:inline">{t("search_submit")}</span>
            <Icon name="search" className="h-4 w-4 sm:hidden" />
          </button>
        </div>
      </form>

      {expanded ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("search_suggestions")}
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-pop animate-rise"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500" role="option" aria-selected={false}>{t("search_no_results")}</li>
          ) : results.map((product, index) => (
            <li key={product.id} role="option" aria-selected={index === active}>
              <Link
                href={`/products/${product.slug}`}
                onClick={() => { setOpen(false); onNavigate?.(); }}
                onMouseEnter={() => setActive(index)}
                className={cx("flex items-center gap-3 px-3 py-2.5 transition-colors", index === active ? "bg-navy-50" : "hover:bg-gray-50")}
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {sameOriginMedia(product.thumbnail_url) ? (
                    <Image src={sameOriginMedia(product.thumbnail_url) as string} alt={product.name} fill sizes="44px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-navy-950">{product.name}</span>
                  <span className="num block text-xs font-bold text-jade-700">
                    {formatAmount(product.price?.amount, product.price?.currency || "AFN", locale)}
                  </span>
                </span>
                <Icon name="chevronEnd" className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            </li>
          ))}
          <li className="border-t border-gray-100 px-3 pt-2">
            <button
              type="button"
              onClick={() => submit()}
              className="w-full rounded-lg px-2 py-2 text-start text-sm font-semibold text-jade-700 transition-colors hover:bg-jade-50"
            >
              {t("search_submit")}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
