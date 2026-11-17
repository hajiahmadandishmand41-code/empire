import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

/** Empty, error and offline are designed states, not leftover text. */
export function EmptyState({
  icon = "package", title, message, actionHref, actionLabel, secondaryHref, secondaryLabel, className,
}: {
  icon?: IconName; title: string; message?: string; actionHref?: string; actionLabel?: string;
  secondaryHref?: string; secondaryLabel?: string; className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center", className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-600">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <h3 className="text-base font-bold text-navy-950">{title}</h3>
      {message ? <p className="mt-1.5 max-w-md text-sm leading-6 text-gray-500">{message}</p> : null}
      {actionHref && actionLabel ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={actionHref} size="sm">{actionLabel}</ButtonLink>
          {secondaryHref && secondaryLabel ? <ButtonLink href={secondaryHref} variant="outline" size="sm">{secondaryLabel}</ButtonLink> : null}
        </div>
      ) : null}
    </div>
  );
}

export type ErrorTone = "danger" | "warning";

export function ErrorState({
  title, message, onRetry, retryLabel, tone = "danger", className, testId,
}: { title: string; message?: string; onRetry?: () => void; retryLabel?: string; tone?: ErrorTone; className?: string; testId?: string }) {
  const danger = tone === "danger";
  return (
    <div
      data-testid={testId}
      role={danger ? "alert" : "status"}
      className={cx(
        "flex flex-wrap items-start gap-3 rounded-2xl border p-4 text-sm",
        danger ? "border-red-200 bg-red-50 text-red-800" : "border-saffron-400/40 bg-saffron-50 text-saffron-700",
        className,
      )}
    >
      <Icon name={danger ? "alert" : "info"} className={cx("mt-0.5 h-5 w-5 shrink-0", danger ? "text-red-600" : "text-saffron-600")} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {message ? <p className="mt-1 leading-6 opacity-90">{message}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={cx("shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors", danger ? "border-red-300 bg-white text-red-700 hover:bg-red-100" : "border-saffron-400 bg-white text-saffron-700 hover:bg-saffron-100")}>
          {retryLabel ?? "↻"}
        </button>
      ) : null}
    </div>
  );
}

/** Inline notice for a failed mutation, kept visually distinct from a page error. */
export function InlineNotice({ tone = "jade", children, className }: { tone?: ErrorTone | "jade"; children: ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cx(
        "flex items-start gap-2 rounded-xl border p-3 text-sm",
        tone === "jade" && "border-jade-200 bg-jade-50 text-jade-800",
        tone === "danger" && "border-red-200 bg-red-50 text-red-800",
        tone === "warning" && "border-saffron-400/40 bg-saffron-50 text-saffron-700",
        className,
      )}
    >
      <Icon name={tone === "jade" ? "check" : tone === "warning" ? "info" : "alert"} className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
