"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, TextArea, TextInput } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";
import { InlineNotice } from "@/components/ui/states";
import { useLocale } from "@/components/locale-provider";
import { applySeller, SpreeApiError, type Category } from "@/lib/api";
import { isValidAfghanPhone, normalizeAfghanPhone } from "@/lib/site";

/** Seller application.
 *
 * The API creates the merchant's Spree user account from this one request, so
 * the form collects credentials and business details together rather than
 * sending them to a half-finished account and asking them to finish elsewhere.
 * Every field is in the controller's permit list.
 */
export function SellerApplicationForm({ categories }: { categories: Category[] }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const str = (key: string) => String(data.get(key) ?? "").trim();

    const password = str("password");
    const confirmation = str("password_confirmation");
    const email = str("email");
    const phone = str("phone");
    const next: Record<string, string> = {};

    // Validate before the request so a merchant sees which field is wrong
    // instead of a single server message that may name none of them.
    if (!str("shop_name")) next.shop_name = t("seller_shop_name_required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("seller_email_invalid");
    if (phone && !isValidAfghanPhone(phone)) next.phone = t("seller_phone_invalid");
    if (password.length < 8) next.password = t("seller_password_hint");
    if (password !== confirmation) next.password_confirmation = t("seller_password_mismatch");
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setError(null);
    try {
      await applySeller({
        shop_name: str("shop_name"),
        name: str("name") || undefined,
        email,
        password,
        password_confirmation: confirmation,
        registration_number: str("registration_number") || undefined,
        phone: phone ? normalizeAfghanPhone(phone) : undefined,
        address: str("address") || undefined,
        city: str("city") || undefined,
        description: str("description") || undefined,
        // Rails' indexed array form: categories[]=…
        categories: data.getAll("categories[]").map((value) => String(value)).filter(Boolean),
      });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof SpreeApiError ? cause.message : t("backend_error"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card data-testid="seller-application-success">
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-jade-50">
            <Icon name="check" className="h-7 w-7 text-jade-700" />
          </span>
          <h2 className="mt-4 text-lg font-extrabold tracking-tight text-navy-950">{t("seller_application_done_title")}</h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-gray-600">{t("seller_application_done_body")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-xl bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800">{t("login")}</Link>
            <Link href="/products" className="inline-flex h-11 items-center justify-center rounded-xl border border-navy-900/20 px-5 text-sm font-bold text-navy-900 transition-colors hover:bg-navy-900/5">{t("catalog_title")}</Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-6 p-5 sm:p-6">
        {/* Wrapped rather than given a testId prop: ErrorNotice hardcodes
            data-testid="api-error", which the E2E contract requires to be zero
            on a successful journey, so a form validation failure must not
            reuse it. */}
        {error ? (
          <div data-testid="seller-application-error">
            <InlineNotice tone="danger">{error}</InlineNotice>
          </div>
        ) : null}

        {/* ------------------------------------------------- shop identity */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy-950">
            <Icon name="store" className="h-4 w-4 text-jade-700" />
            {t("seller_form_identity")}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <TextInput
              name="shop_name"
              label={t("seller_shop_name_label")}
              required
              autoFocus
              error={fieldErrors.shop_name}
              invalid={Boolean(fieldErrors.shop_name)}
            />
            <TextInput name="name" label={t("seller_owner_label")} hint={t("seller_owner_hint")} />
            <TextInput name="registration_number" label={t("seller_registration_label")} hint={t("seller_registration_hint")} className="num" />
            <TextInput
              name="email"
              type="email"
              dir="ltr"
              label={t("email")}
              hint={t("seller_email_hint")}
              autoComplete="email"
              required
              error={fieldErrors.email}
              invalid={Boolean(fieldErrors.email)}
            />
          </div>
        </section>

        {/* ------------------------------------------------------ categories */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy-950">
            <Icon name="grid" className="h-4 w-4 text-jade-700" />
            {t("seller_form_categories")}
          </h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">{t("seller_categories_hint")}</p>
          {categories.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <Checkbox key={category.id} name="categories[]" value={category.name} label={category.name} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">{t("seller_categories_unavailable")}</p>
          )}
        </section>

        {/* ------------------------------------------------- contact & place */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy-950">
            <Icon name="pin" className="h-4 w-4 text-jade-700" />
            {t("seller_form_contact")}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <TextInput
              name="phone"
              type="tel"
              dir="ltr"
              label={t("seller_phone_label")}
              hint={t("seller_phone_hint")}
              placeholder="07XXXXXXXX"
              className="num"
              error={fieldErrors.phone}
              invalid={Boolean(fieldErrors.phone)}
            />
            <TextInput name="city" label={t("seller_city_label")} placeholder={t("seller_city_placeholder")} />
            <TextInput name="address" label={t("seller_address_label")} className="sm:col-span-2" placeholder={t("seller_address_placeholder")} />
          </div>
        </section>

        {/* ------------------------------------------------------- about you */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy-950">
            <Icon name="edit" className="h-4 w-4 text-jade-700" />
            {t("seller_form_about")}
          </h2>
          <div className="mt-3">
            <TextArea name="description" label={t("seller_description_label")} hint={t("seller_description_hint")} rows={4} maxLength={2000} />
          </div>
        </section>

        {/* ------------------------------------------------------ credentials */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy-950">
            <Icon name="lock" className="h-4 w-4 text-jade-700" />
            {t("seller_form_account")}
          </h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">{t("seller_account_hint")}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <TextInput
              name="password"
              type="password"
              label={t("password")}
              required
              minLength={8}
              autoComplete="new-password"
              error={fieldErrors.password}
              invalid={Boolean(fieldErrors.password)}
            />
            <TextInput
              name="password_confirmation"
              type="password"
              label={t("password_confirm")}
              required
              minLength={8}
              /** `password_confirmation` is not a valid autocomplete token; a
               * second new-password field is what a password manager expects. */
              autoComplete="new-password"
              error={fieldErrors.password_confirmation}
              invalid={Boolean(fieldErrors.password_confirmation)}
            />
          </div>
        </section>

        <div className="border-t border-gray-100 pt-5">
          <Button type="submit" block busy={busy} busyLabel={t("seller_submitting")} iconStart={<Icon name="store" className="h-4 w-4" />}>
            {t("become_seller")}
          </Button>
          <p className="mt-3 text-center text-xs leading-6 text-gray-500">{t("seller_apply_terms_note")}</p>
        </div>
      </form>
    </Card>
  );
}
