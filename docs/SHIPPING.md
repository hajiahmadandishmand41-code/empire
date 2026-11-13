# Shipping & Delivery

Shipping uses **native Spree 6.0.4**: shipping methods, zones, delivery rates, fulfillments and delivery confirmation. Empire does not add a custom shipping-rules engine or carrier integration.

## Rates

- Rates are defined by operators in the Admin Dashboard / Admin API (flat-rate, weight/region-based Spree calculators). The seed provisions Spree's default `Standard` and `International Shipping` flat-rate methods when an admin is created.
- No live carrier API is connected, so rates are **not** real-time carrier quotes.
- At checkout the cart's fulfillments expose `delivery_rates`; the buyer selects one via `PATCH /api/v3/store/carts/:id/fulfillments/:id` (`selected_delivery_rate_id`).

## Delivery lifecycle (native)

1. Order placed → Spree creates fulfillments.
2. Staff/seller fulfils: `PATCH /api/v3/{admin,seller}/orders/:order_id/fulfillments/:id/fulfill`.
3. Admin can mark delivered: `PATCH /api/v3/admin/orders/:order_id/fulfillments/:id/mark_delivered` (`delivered_at`, `notify_customer`).
4. Tracking numbers / labels use Spree's native fulfillment delivery/label endpoints.
5. Seller earnings are credited on fulfilment (see `docs/MARKETPLACE.md`).

## Returns

- Returns/refunds flow through Spree's native returns and refunds.
- A dedicated buyer–seller **disputes/claims** workflow is **not implemented** (no `empire_disputes` table). Earlier documentation claiming otherwise was inaccurate.

## Future carrier integration

Connecting DHL/FedEx/Afghan Post or private couriers would require a carrier adapter, credentials, and real-time rate/label/tracking integration. None is present; no carrier credentials are stored in Git.
