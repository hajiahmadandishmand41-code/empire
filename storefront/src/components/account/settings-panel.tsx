"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout, updateAccount, type Customer } from "@/lib/api";
import { isValidAfghanPhone, normalizeAfghanPhone } from "@/lib/site";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextInput } from "@/components/ui/field";
import { InlineNotice } from "@/components/ui/states";

/**
 * The buyer's own profile. Two separate forms on purpose: changing a name or a
 * phone number needs nothing but the access token, while the Backend requires the
 * current password before it will accept a new email address or password. Mixing
 * them into one form would ask for a password on every ordinary edit.
 *
 * There is no marketing-consent toggle here even though the API accepts one. The
 * customer profile this storefront can read back has no such field, so a checkbox
 * would show a state the Backend never told us — and a control that cannot
 * display its own current value is a control that lies half the time.
 */
export function SettingsPanel({ user, onSaved }: { user: Customer; onSaved: (next: Customer) => void }) {
  const { t } = useLocale();
  const router = useRouter();

  const [profile, setProfile] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone: user.phone ?? "",
  });
  const [credentials, setCredentials] = useState({
    email: user.email,
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyCredentials, setBusyCredentials] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    setProfileError(null);
    const phone = profile.phone.trim();
    if (phone && !isValidAfghanPhone(phone)) {
      setPhoneError(t("phone_invalid"));
      return;
    }
    setPhoneError(null);
    setBusyProfile(true);
    try {
      const updated = await updateAccount({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        ...(phone ? { phone: normalizeAfghanPhone(phone) } : {}),
      });
      onSaved(updated);
      setSaved(true);
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusyProfile(false);
    }
  }

  async function saveCredentials(event: React.FormEvent) {
    event.preventDefault();
    setBusyCredentials(true);
    setCredentialError(null);
    try {
      await updateAccount({
        email: credentials.email.trim(),
        current_password: credentials.current_password,
        ...(credentials.password
          ? { password: credentials.password, password_confirmation: credentials.password_confirmation }
          : {}),
      });
      // The Backend revokes every refresh token when credentials change, so the
      // local session is ended here instead of being left to fail on its next
      // refresh — and the buyer is told why they are back at the sign-in form.
      await logout();
      router.push("/login");
      router.refresh();
    } catch (cause) {
      setCredentialError(cause instanceof Error ? cause.message : String(cause));
      setBusyCredentials(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title={t("profile")} subtitle={t("account_subtitle")} />
        <CardBody className="space-y-4">
          {saved ? <InlineNotice tone="jade">{t("profile_saved")}</InlineNotice> : null}
          <ErrorNotice message={profileError} />
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label={t("first_name")}
                autoComplete="given-name"
                value={profile.first_name}
                onChange={(event) => setProfile({ ...profile, first_name: event.target.value })}
              />
              <TextInput
                label={t("last_name")}
                autoComplete="family-name"
                value={profile.last_name}
                onChange={(event) => setProfile({ ...profile, last_name: event.target.value })}
              />
            </div>
            <TextInput
              label={t("phone_label")}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              invalid={Boolean(phoneError)}
              error={phoneError}
              value={profile.phone}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
            />
            <Button type="submit" busy={busyProfile} busyLabel={t("loading")}>{t("save")}</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("sign_in_details")} />
        <CardBody className="space-y-4">
          <ErrorNotice message={credentialError} />
          <form onSubmit={saveCredentials} className="space-y-4">
            <TextInput
              label={t("email")}
              type="email"
              dir="ltr"
              required
              autoComplete="email"
              value={credentials.email}
              onChange={(event) => setCredentials({ ...credentials, email: event.target.value })}
            />
            <TextInput
              label={t("current_password")}
              type="password"
              required
              autoComplete="current-password"
              value={credentials.current_password}
              onChange={(event) => setCredentials({ ...credentials, current_password: event.target.value })}
            />
            <TextInput
              label={t("new_password")}
              type="password"
              autoComplete="new-password"
              hint={t("password_change_notice")}
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
            />
            <TextInput
              label={t("password_confirm")}
              type="password"
              autoComplete="new-password"
              value={credentials.password_confirmation}
              onChange={(event) => setCredentials({ ...credentials, password_confirmation: event.target.value })}
            />
            <Button type="submit" busy={busyCredentials} busyLabel={t("loading")}>{t("save")}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
