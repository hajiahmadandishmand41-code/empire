import { cx } from "@/lib/cx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true" />;
}

/** Loading states are designed, not a word: the shape of what is coming. */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-3 shadow-card" aria-hidden="true">
      <Skeleton className="mb-3 aspect-square w-full rounded-xl" />
      <Skeleton className="mb-2 h-4 w-4/5" />
      <Skeleton className="mb-3 h-4 w-2/5" />
      <Skeleton className="mb-3 h-5 w-1/3" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cx("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)} role="status" aria-live="polite">
      <span className="sr-only">…</span>
      {Array.from({ length: count }, (_, index) => <ProductCardSkeleton key={index} />)}
    </div>
  );
}

export function RowSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">…</span>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="rounded-2xl border border-gray-200/90 bg-white p-4" aria-hidden="true">
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="rounded-3xl bg-navy-950 p-8 md:p-12" role="status" aria-live="polite" aria-hidden="true">
      <span className="sr-only">…</span>
      <Skeleton className="mb-4 h-8 w-3/4 bg-white/10" />
      <Skeleton className="mb-8 h-5 w-1/2 bg-white/10" />
      <div className="flex gap-3"><Skeleton className="h-12 w-40 rounded-xl bg-white/10" /><Skeleton className="h-12 w-40 rounded-xl bg-white/10" /></div>
    </div>
  );
}
