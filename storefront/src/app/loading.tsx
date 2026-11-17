import { ProductGridSkeleton, HeroSkeleton, RowSkeleton } from "@/components/ui/skeleton";

/** Root loading fallback. Shapes match the real page so the swap does not
 * reflow the viewport — the main Core Web Vitals risk on a slow connection. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HeroSkeleton />
      <div className="mt-10"><RowSkeleton lines={2} /></div>
      <ProductGridSkeleton count={8} className="mt-6" />
    </div>
  );
}
