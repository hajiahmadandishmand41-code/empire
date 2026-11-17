import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/api";
import { cx } from "@/lib/cx";

/** Responsive product grid. Two columns from the smallest phone up: a single
 * column wastes half the screen on a 360px device, and four columns is the
 * desktop maximum that still leaves a card wide enough to read. */
export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cx("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}

/** Merchandising rail: one horizontally scrolling row on phones, a grid from
 * `lg` up.
 *
 * Each product is rendered exactly once and the container changes display mode
 * instead. Rendering the rail and the grid as two sibling lists would put every
 * card in the DOM twice, doubling the payload on the slow connections this
 * store targets and making "first product card" resolve to a hidden node.
 */
export function ProductRail({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div
      className={cx(
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1",
        "sm:mx-0 sm:px-0",
        "lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:snap-none xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <div key={product.id} className="w-44 shrink-0 snap-start sm:w-52 lg:w-auto lg:shrink lg:snap-none">
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  );
}
