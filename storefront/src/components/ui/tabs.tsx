"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

export type TabItem = { id: string; label: string; content: ReactNode; badge?: ReactNode };

export function Tabs({ items, initial = 0, className }: { items: TabItem[]; initial?: number; className?: string }) {
  const base = useId();
  const [active, setActive] = useState(Math.min(initial, items.length - 1));
  const current = items[active];
  if (!current) return null;
  return (
    <div className={className}>
      <div role="tablist" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-gray-200 px-1">
        {items.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            id={`${base}-${item.id}`}
            type="button"
            aria-selected={index === active}
            aria-controls={`${base}-panel-${item.id}`}
            onClick={() => setActive(index)}
            className={cx(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              index === active ? "border-jade-700 text-navy-950" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-navy-800",
            )}
          >
            {item.label}
            {item.badge}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel-${current.id}`} aria-labelledby={`${base}-${current.id}`} className="pt-5">
        {current.content}
      </div>
    </div>
  );
}
