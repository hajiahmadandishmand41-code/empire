"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";
import { useLocale } from "@/components/locale-provider";

/** Route-level error boundary.
 *
 * The technical error is logged, never rendered: a stack trace or a database
 * message on a public page leaks internals and reads as broken to a shopper.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLocale();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title={t("error_title")}
        message={t("error_body")}
        onRetry={reset}
        retryLabel={t("error_action")}
      />
      {error.digest ? (
        // A reference the operator can match against server logs, with no
        // detail from the failure itself.
        <p className="num mt-4 text-center text-2xs text-gray-400">{error.digest}</p>
      ) : null}
    </div>
  );
}
