"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

/** Side sheet built on the platform: Escape closes, focus is trapped by the
 * browser's own modal handling, and body scroll is locked while it is open. */
export function Sheet({
  open, onClose, title, children, side = "start",
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: "start" | "end" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-90 flex" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={title} onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-navy-950/50 animate-fade-in" tabIndex={-1} />
      <div className={cx("relative flex h-full w-[86vw] max-w-sm flex-col bg-white shadow-pop animate-rise", side === "start" ? "start-0" : "end-0")}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <h2 className="truncate text-base font-bold text-navy-950">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy-900" aria-label={title}>
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
