"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccount, listAddresses, listOrders, listProvinces, listRfqs, logout, signedIn,
  type Address, type Customer, type Order, type Province, type Rfq,
} from "@/lib/api";
import { formatCount, formatDate } from "@/lib/numbers";
import { useLocale } from "@/components/locale-provider";
import { AddressesPanel } from "@/components/account/addresses-panel";
import { ErrorNotice } from "@/components/error-notice";
import { OrderDetail } from "@/components/account/order-detail";
import { SettingsPanel } from "@/components/account/settings-panel";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { RowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";

/** Statuses the Store API documents. Anything outside these lists is rendered as
 * the Backend sent it rather than mapped to a label this storefront invented. */
const ORDER_STATUSES = ["draft", "pending", "placed", "completed", "canceled"];
const RFQ_STATUSES = ["open", "quoted", "accepted", "closed"];

const ORDER_TONES: Record<string, BadgeTone> = {
  draft: "gray", pending: "saffron", placed: "navy", completed: "jade", canceled: "red",
};
const RFQ_TONES: Record<string, BadgeTone> = {
  open: "navy", quoted: "saffron", accepted: "jade", closed: "gray",
};

export default function AccountPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!signedIn()) {
        setChecked(true);
        return;
      }
      try {
        const [account, orderResult, addressResult, provinceResult] = await Promise.all([
          getAccount(), listOrders(), listAddresses(), listProvinces(),
        ]);
        if (!active) return;
        setUser(account);
        setOrders(orderResult.data);
        setAddresses(addressResult.data);
        setProvinces(provinceResult.data);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (active) setChecked(true);
      }
      // Kept out of the batch above on purpose: a buyer whose request history
      // cannot be read should still see their orders and addresses.
      try {
        const result = await listRfqs();
        if (active) setRfqs(result.data);
      } catch {
        if (active) setRfqs([]);
      }
    })();
    return () => { active = false; };
  }, []);

  async function signOut() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  if (!checked) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
        <RowSkeleton lines={2} />
        <RowSkeleton lines={6} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
        <ErrorNotice message={error} />
        <EmptyState
          icon="user"
          title={t("account_title")}
          message={t("login_or_guest")}
          actionHref="/login"
          actionLabel={t("login")}
          secondaryHref="/register"
          secondaryLabel={t("register")}
        />
      </div>
    );
  }

  const orderLabel = (status: string) =>
    ORDER_STATUSES.includes(status) ? t(`order_status_${status}` as "order_status_placed") : status;
  const rfqLabel = (status: string) =>
    RFQ_STATUSES.includes(status) ? t(`rfq_status_${status}` as "rfq_status_open") : status;
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  const ordersTab = orders.length === 0 ? (
    <EmptyState
      icon="package"
      title={t("no_orders")}
      message={t("no_orders_body")}
      actionHref="/products"
      actionLabel={t("catalog_title")}
    />
  ) : (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Card as="article">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-950" dir="ltr">{order.number}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {order.created_at ? formatDate(order.created_at, locale) : t("order_placed")}
                  {typeof order.total_quantity === "number"
                    ? ` · ${t("order_quantity")}: ${formatCount(order.total_quantity, locale)}`
                    : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={ORDER_TONES[order.status] ?? "gray"}>{orderLabel(order.status)}</Badge>
                <Price amount={order.total} currency={order.currency} locale={locale} size="sm" />
                <Button size="sm" variant="outline" onClick={() => setOpenOrder(order.id)}>{t("order_view")}</Button>
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );

  const rfqsTab = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t("account_rfqs_hint")}</p>
      {rfqs.length === 0 ? (
        <EmptyState icon="tag" title={t("no_rfqs")} actionHref="/rfq" actionLabel={t("rfq_banner_cta")} />
      ) : (
        <ul className="space-y-3">
          {rfqs.map((rfq) => (
            <li key={rfq.id}>
              <Card as="article">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy-950">{rfq.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("rfq_quantity_label")}: {formatCount(rfq.requested_quantity, locale)}
                      {rfq.created_at ? ` · ${formatDate(rfq.created_at, locale)}` : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={RFQ_TONES[rfq.status] ?? "gray"}>{rfqLabel(rfq.status)}</Badge>
                    <ButtonLink href="/rfq" size="sm" variant="outline">{t("rfq_view")}</ButtonLink>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{t("account_title")}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{t("account_subtitle")}</p>
          <p className="mt-3 text-sm text-navy-900">
            {t("welcome")}
            {fullName ? ` · ${fullName}` : null}
            {" · "}
            <span dir="ltr">{user.email}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>{t("logout")}</Button>
      </header>

      <ErrorNotice message={error} className="mb-4" />

      {openOrder ? (
        <OrderDetail orderId={openOrder} onBack={() => setOpenOrder(null)} />
      ) : (
        <Tabs
          items={[
            {
              id: "orders",
              label: t("account_nav_orders"),
              badge: orders.length > 0 ? formatCount(orders.length, locale) : undefined,
              content: ordersTab,
            },
            {
              id: "addresses",
              label: t("account_nav_addresses"),
              content: <AddressesPanel addresses={addresses} provinces={provinces} onChange={setAddresses} />,
            },
            { id: "rfqs", label: t("account_nav_rfqs"), content: rfqsTab },
            { id: "settings", label: t("account_nav_settings"), content: <SettingsPanel user={user} onSaved={setUser} /> },
          ]}
        />
      )}
    </div>
  );
}
