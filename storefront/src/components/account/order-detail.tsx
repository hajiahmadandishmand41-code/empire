"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrder, type Order } from "@/lib/api";
import { formatCount, formatDate } from "@/lib/numbers";
import { useLocale } from "@/components/locale-provider";
import { ErrorNotice } from "@/components/error-notice";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { Price } from "@/components/ui/price";
import { RowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";

/** Order statuses the Store API documents. Anything else is shown exactly as the
 * API sent it: inventing a label for a status this storefront has not seen would
 * tell the buyer something the Backend never said. */
const ORDER_STATUSES = ["draft", "pending", "placed", "completed", "canceled"];

const ORDER_TONES: Record<string, BadgeTone> = {
  draft: "gray",
  pending: "saffron",
  placed: "navy",
  completed: "jade",
  canceled: "red",
};

export function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { locale, t } = useLocale();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      setOrder(null);
      try {
        const result = await getOrder(orderId);
        if (active) setOrder(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [orderId]);

  const statusLabel = (status: string) =>
    ORDER_STATUSES.includes(status) ? t(`order_status_${status}` as "order_status_placed") : status;

  const summaryLine = (label: string, amount: string | null | undefined, currency: string) =>
    amount == null ? null : (
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-gray-600">{label}</dt>
        <dd><Price amount={amount} currency={currency} locale={locale} size="sm" /></dd>
      </div>
    );

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" iconStart={<Icon name="arrowStart" className="h-4 w-4" />} onClick={onBack}>
        {t("order_back")}
      </Button>

      {loading ? <RowSkeleton lines={8} /> : null}
      <ErrorNotice message={error} />

      {!loading && !order && !error ? <EmptyState icon="package" title={t("order_not_found")} /> : null}

      {order ? (
        <Card>
          <CardHeader
            title={`${t("order_detail_title")} ${order.number}`}
            subtitle={order.created_at ? formatDate(order.created_at, locale) : undefined}
            action={<Badge tone={ORDER_TONES[order.status] ?? "gray"}>{statusLabel(order.status)}</Badge>}
          />
          <CardBody className="space-y-6">
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <DataRow label={t("order_number")} value={order.number} dir="ltr" />
              {order.created_at ? <DataRow label={t("order_date")} value={formatDate(order.created_at, locale)} /> : null}
              {order.payment_status ? <DataRow label={t("order_payment_status")} value={order.payment_status} dir="ltr" /> : null}
              {order.fulfillment_status ? <DataRow label={t("order_fulfillment_status")} value={order.fulfillment_status} dir="ltr" /> : null}
              {order.company_name ? <DataRow label={t("order_company")} value={order.company_name} /> : null}
              {order.po_number ? <DataRow label={t("order_po")} value={order.po_number} dir="ltr" /> : null}
            </div>

            <section>
              <h3 className="mb-3 text-sm font-bold text-navy-950">{t("order_items_title")}</h3>
              {(order.items ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">{t("no_products")}</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {(order.items ?? []).map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} className="text-sm font-semibold text-navy-900 hover:underline">
                          {item.name}
                        </Link>
                        {item.options_text ? <p className="mt-0.5 text-2xs text-gray-500">{item.options_text}</p> : null}
                        <p className="mt-0.5 text-2xs text-gray-500">
                          {t("order_quantity")}: {formatCount(item.quantity, locale)}
                        </p>
                      </div>
                      <Price amount={item.total} currency={item.currency} locale={locale} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl bg-navy-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-navy-950">{t("order_summary")}</h3>
              <dl className="space-y-1.5 text-sm">
                {summaryLine(t("subtotal"), order.item_total, order.currency)}
                {summaryLine(t("shipping"), order.delivery_total, order.currency)}
                {summaryLine(t("tax"), order.tax_total, order.currency)}
                <div className="flex items-baseline justify-between gap-4 border-t border-navy-100 pt-2 font-bold text-navy-950">
                  <dt>{t("total")}</dt>
                  <dd><Price amount={order.total} currency={order.currency} locale={locale} size="sm" /></dd>
                </div>
              </dl>
            </section>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
