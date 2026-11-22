"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { useLocale } from "@/components/locale-provider";
import { subscribeNewsletter } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

/** Newsletter signup.
 *
 * Rendered only when NEXT_PUBLIC_NEWSLETTER_ENABLED is set. A guest
 * subscription is stored unverified and Spree then needs an SMTP relay to
 * deliver the confirmation email; that relay is not provisioned, so offering
 * this by default would present an incomplete capability as working.
 */
export function NewsletterForm() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) { setState("failed"); return; }
    setState("busy");
    try {
      await subscribeNewsletter(email, absoluteUrl("/newsletter/confirm"));
      setState("done");
      setEmail("");
    } catch {
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-jade-900/40 px-3 py-2.5 text-sm text-jade-100">
        <Icon name="check" className="h-4 w-4 shrink-0" />
        {t("newsletter_success")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">{t("newsletter_placeholder")}</label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          dir="ltr"
          onChange={(event) => { setEmail(event.target.value); setState("idle"); }}
          placeholder={t("newsletter_placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-navy-400 focus-visible:border-jade-500"
        />
        <Button type="submit" variant="accent" size="sm" busy={state === "busy"} className="shrink-0">
          {t("newsletter_submit")}
        </Button>
      </div>
      {state === "failed" ? (
        <p className="flex items-center gap-1.5 text-xs text-saffron-400">
          <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
          {t("newsletter_error")}
        </p>
      ) : (
        <p className="text-xs leading-5 text-navy-300">{t("newsletter_body")}</p>
      )}
    </form>
  );
}
