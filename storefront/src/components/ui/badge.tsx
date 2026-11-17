import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type BadgeTone = "navy" | "jade" | "saffron" | "red" | "gray" | "outline";

const TONES: Record<BadgeTone, string> = {
  navy: "bg-navy-100 text-navy-800",
  jade: "bg-jade-100 text-jade-800",
  saffron: "bg-saffron-100 text-saffron-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-600",
  outline: "border border-gray-300 bg-white text-gray-600",
};

export function Badge({ tone = "gray", className, children, icon }: { tone?: BadgeTone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Status pill whose tone comes from the value, so every panel reads the same. */
export function StatusBadge({ status, labels, tones }: { status: string; labels: Record<string, string>; tones: Record<string, BadgeTone> }) {
  return <Badge tone={tones[status] ?? "gray"}>{labels[status] ?? status}</Badge>;
}
