# Afghanistan Localization

Empire's primary market is Afghanistan. This document states what is actually implemented.

## Languages

| Locale | Language | Direction | Status |
|--------|----------|-----------|--------|
| `fa-AF` | Dari (Afghanistan) — storefront UI | RTL | Implemented |
| `fa` | Dari/Persian — Spree canonical **content** locale | RTL | Implemented (Spree `Spree::Locales::ALL`) |
| `en` | English | LTR | Implemented |
| `ps-AF` | Pashto (Afghanistan) | RTL | **Draft stub only — not offered in the UI** |

- Storefront messages: `storefront/src/locales/{en,fa-AF}.json` (140 keys, parity-checked by `scripts/audit-static.mjs`). `storefront/src/lib/i18n.ts` offers only `fa-AF` and `en`.
- Backend messages: `server/config/locales/{en,fa-AF}.yml` are generated from the storefront JSON (`node scripts/audit-static.mjs --write`); `empire-backend.{en,fa-AF}.yml` holds backend-only service messages.
- `server/config/locales/ps-AF.yml` is an explicit draft (`translation_status: draft`, empty `empire:`). No machine-guessed Pashto is shipped; a qualified reviewer must populate and review it before it is offered.
- Spree 6.0.4's canonical content locale for Dari/Persian is `fa`, so the seeded store uses `default_locale: fa`, `supported_locales: en,fa`. The app keeps `en`, `fa`, `fa-AF` available with fallbacks (`fa-AF → fa → en`) so store content and Empire messages both resolve.
- Language selection persists in the `empire_locale` cookie and sets `<html lang>` / `dir` on the next server render. RTL is applied via `[dir="rtl"]` rules in `storefront/src/app/globals.css`.

## Currency

- Primary currency: **AFN** (Afghan afghani), seeded on the Afghanistan store/market.
- Spree 6 money is a **decimal string in major units** (e.g. `"1200.00"`), not integer cents. `storefront/src/lib/currency.ts` formats via `@spree/sdk` `formatMoney` / `Intl.NumberFormat`.
- AFN is not hardcoded as the only system currency; other markets may use their own.

## Phone numbers

- Country code **+93** is shown in labels (`phone_label`) and phone inputs are rendered LTR (`dir="ltr"`, `type="tel"`).
- There is **no strict +93 format validation** yet beyond Spree's address phone presence; do not claim server-side Afghan phone validation as complete.

## Addresses

Afghanistan addresses use Spree's address model with:
- Country `AF`, province/state (`state_name`), city, address lines, optional postal code (limited coverage in Afghanistan), phone. Empire adds `AF` to Spree's explicitly extensible `NO_ZIPCODE_ISO_CODES` list; other countries keep their native validation.
- The storefront address form (`storefront/src/components/address-fields.tsx`) defaults `country_code: AF` and keeps phone/postal code LTR.
- Customers may save multiple addresses via the native Store API (`customers/me/addresses`).

## Geographical data (provinces & districts)

- `server/db/seeds/empire_seed.rb` loads all **34 provinces** with Dari (`name`) and English (`name_en`) names plus districts (`empire_provinces`, `empire_districts`).
- Source: public administrative-division data (IDLG / official 34-province structure). Verify the latest official list before production; transliteration of some district names may vary.
- An admin UI for correcting/completing districts is **planned**, not implemented.

## Timezone, numbers, dates

- Timezone: `Asia/Kabul` (UTC+4:30, no DST), set in `server/config/initializers/empire.rb`.
- Prices use `Intl.NumberFormat` for the selected locale. Backend dates are Gregorian; Solar Hijri display is **planned**.

## Right-to-left (RTL)

- `<html dir="rtl">` for `fa-AF`; `ltr` for `en`.
- Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`) are used where practical; directional icons are flipped for RTL.
