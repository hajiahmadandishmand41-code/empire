"use client";

import { useState } from "react";
import { createAddress, deleteAddress, updateAddress, type Address, type Province } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { AddressFields, emptyAddress } from "@/components/address-fields";
import { ErrorNotice } from "@/components/error-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { EmptyState, InlineNotice } from "@/components/ui/states";

/** Saved addresses: create, edit and delete. The Backend has accepted all three
 * operations since the first version of this storefront and only the first was
 * ever wired up, so a buyer who mistyped a phone number had to add a whole new
 * address instead of correcting it. */
export function AddressesPanel({
  addresses, provinces, onChange,
}: {
  addresses: Address[];
  provinces: Province[];
  onChange: (next: Address[]) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState<Address | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setDraft({ ...emptyAddress });
    setError(null);
    setNotice(null);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id ?? null);
    setDraft({ ...address });
    setError(null);
    setNotice(null);
  };

  const close = () => {
    setDraft(null);
    setEditingId(null);
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await updateAddress(editingId, draft);
        onChange(addresses.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createAddress(draft);
        onChange([...addresses, created]);
      }
      setNotice(t("address_saved"));
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove(address: Address) {
    if (!address.id) return;
    if (!window.confirm(t("address_delete_confirm"))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAddress(address.id);
      onChange(addresses.filter((item) => item.id !== address.id));
      setNotice(t("address_deleted"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  const region = (address: Address) =>
    [address.address1, address.address2, address.city, address.state_name].filter(Boolean).join("، ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy-950">{t("addresses_title")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("addresses_subtitle")}</p>
        </div>
        {draft ? (
          <Button variant="outline" size="sm" onClick={close}>{t("cancel")}</Button>
        ) : (
          <Button size="sm" iconStart={<Icon name="plus" className="h-4 w-4" />} onClick={openNew}>{t("add_address")}</Button>
        )}
      </div>

      <ErrorNotice message={error} />
      {notice ? <InlineNotice tone="jade">{notice}</InlineNotice> : null}

      {draft ? (
        <Card>
          <CardHeader title={editingId ? `${t("address_edit")} — ${t("addresses")}` : t("add_address")} />
          <CardBody>
            <form onSubmit={save} className="space-y-4">
              <AddressFields value={draft} onChange={setDraft} provinces={provinces} />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" busy={busy} busyLabel={t("loading")}>{t("save")}</Button>
                <Button type="button" variant="outline" onClick={close}>{t("cancel")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {addresses.length === 0 && !draft ? (
        <EmptyState icon="truck" title={t("no_addresses")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id ?? region(address)} as="article">
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-bold text-navy-950">
                    {address.full_name || `${address.first_name} ${address.last_name}`.trim()}
                  </p>
                  {address.is_default_shipping || address.is_default_billing ? (
                    <Badge tone="jade">{t("address_default")}</Badge>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-gray-600">{region(address)}</p>
                <p className="text-sm text-gray-600" dir="ltr">{address.phone}</p>
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(address)}>{t("address_edit")}</Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => remove(address)}>{t("address_delete")}</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
