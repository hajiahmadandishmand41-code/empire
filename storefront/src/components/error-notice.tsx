"use client";

import { useLocale } from "@/components/locale-provider";
import { ErrorState } from "@/components/ui/states";

/** Inline API failure. `data-testid="api-error"` is part of the E2E contract
 * (a successful journey must render zero of these) — do not rename it. */
export function ErrorNotice({ message, onRetry, className }: { message: string | null; onRetry?: () => void; className?: string }) {
  const { t } = useLocale();
  if (!message) return null;
  const title = message === "configuration_error"
    ? t("configuration_error")
    : message === "backend_error"
      ? t("backend_error")
      : message;
  return <ErrorState title={title} onRetry={onRetry} retryLabel={t("retry")} className={className} testId="api-error" />;
}

ErrorNotice.displayName = "ErrorNotice";
