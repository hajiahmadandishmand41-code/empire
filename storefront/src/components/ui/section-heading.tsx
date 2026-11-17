import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export function SectionHeading({
  title, subtitle, href, linkLabel, icon, className, level = 2, id,
}: { title: ReactNode; subtitle?: ReactNode; href?: string; linkLabel?: string; icon?: ReactNode; className?: string; level?: 2 | 3; id?: string }) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <div className={cx("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-jade-700">{icon}</span> : null}
          <Tag id={id} className="text-lg font-extrabold tracking-tight text-navy-950 sm:text-xl">{title}</Tag>
        </div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-jade-700 transition-colors hover:bg-jade-50">
          {linkLabel}
          <Icon name="chevronEnd" className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
