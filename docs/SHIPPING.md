# Shipping & Delivery

Empire supports city and inter-city delivery within Afghanistan and cross-border shipment for international markets.

## Shipping methods

| Method | Coverage | Rate basis |
|--------|----------|------------|
| City delivery | Within a city (e.g. Kabul) | Flat or weight-based |
| Inter-city delivery | Between provinces | Region-based |
| Cross-border | International markets | Carrier/region-based |

Spree shipping methods and zones are used natively. Empire adds region/weight-based rules where the core doesn't cover them.

## Delivery lifecycle

1. Order placed → shipment created (Spree).
2. Seller marks shipment `ready`.
3. Carrier picks up → shipment `shipped`, tracking number recorded.
4. Customer receives → shipment `delivered`, delivery confirmation.
5. Customer may file a "not delivered" or "damaged" claim → `empire_disputes`.

## Rates

- Without a live carrier API connection, rates are **not displayed as real-time quotes**.
- Admins define manual rules: region, weight, or fixed rates in the Admin Dashboard.
- When a carrier API is integrated, rates are fetched in real time.

## Tracking

- Each shipment carries a tracking number.
- Customers can track orders from their account page.
- Delivery confirmation is recorded.

## Returns & claims

- Return requests flow through Spree returns/refunds.
- Damage/non-delivery claims are recorded as `empire_disputes` and reviewed by admin.

## Future carrier API integration

An extensible adapter pattern is reserved for connecting carrier companies (DHL, FedEx, Afghan Post, private couriers). No carrier credentials are stored in Git.
