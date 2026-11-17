import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "aside" }) {
  return <Tag className={cx("rounded-2xl border border-gray-200/90 bg-white shadow-card", className)}>{children}</Tag>;
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold text-navy-950">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("p-5", className)}>{children}</div>;
}

/** A definition row used across panels and product specs. */
export function DataRow({ label, value, dir }: { label: ReactNode; value: ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 text-sm last:border-0">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className={cx("min-w-0 text-end font-medium text-navy-900", dir === "ltr" && "ltr")} dir={dir}>{value}</dd>
    </div>
  );
}
