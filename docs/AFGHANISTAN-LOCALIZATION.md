# Afghanistan Localization

Empire's primary market is Afghanistan. This document covers language, currency, addresses, phone numbers, and geographical data.

## Languages

| Locale | Language | Direction | Status |
|--------|----------|-----------|--------|
| `fa-AF` | Dari (Afghanistan) | RTL | Implemented |
| `ps-AF` | Pashto (Afghanistan) | RTL | Implemented |
| `en` | English | LTR | Implemented |

- Translations live in `server/config/locales/{fa-AF,ps-AF,en}.yml` (backend) and `storefront/src/lib/i18n.ts` (frontend).
- Dari and Pashto translations are written natively per language — not machine translations of a single source.
- Users select language via the storefront header; the selection persists as a `locale` query parameter and is reflected in `dir` and `lang` attributes on `<html>`.
- RTL is applied via `[dir="rtl"]` CSS rules in `storefront/src/app/globals.css`.
- Error messages, order statuses and notifications are translated per language.

## Currency

- Primary currency for the Afghanistan market: **AFN** (Afghan afghani).
- AFN is **not** hardcoded as the single system currency — other markets may use their own currencies (see `docs/ARCHITECTURE.md` Markets).
- Amounts are stored as integer subunits in the Spree API and formatted with `Intl.NumberFormat` (`storefront/src/lib/currency.ts`).
- Symbol/formatting follows AFN conventions.

## Phone numbers

- Country code: **+93** (Afghanistan).
- Phone fields carry the `+93` prefix label and are validated server-side and client-side.
- Example format: `+93 70 123 4567`.

## Addresses

Afghanistan addresses support a multi-level hierarchy:

1. Country (Afghanistan)
2. Province (ولاية) — 34 provinces
3. District (ولسوالی)
4. City / town (شهر)
5. Village (روستا) — optional
6. Street / alley (کوچه و خیابان)
7. Detailed address line (نشانی تفصیلی)
8. Postal code (کد پستی) — optional (Afghanistan has limited postal-code coverage)

Customers and companies may save multiple addresses.

## Geographical data (provinces & districts)

The seed file `server/db/seeds/empire_seed.rb` loads all **34 provinces of Afghanistan** with Dari, Pashto and English names, plus their districts.

**Source:** Afghanistan Independent Directorate of Local Governance (IDLG) / official administrative divisions.

**License:** Public administrative boundary data; free for use. Verify the latest official list before production deployment.

**Data currency:** The list reflects the 34-province structure. Some district names may vary by transliteration. An admin UI for correcting/completing districts is provided (planned) so operators can update data without a code deploy.

**Documented gaps:** Where a district name lacks a reliable transliteration, the placeholder is retained and flagged for admin correction. Do not present unverified district names as authoritative.

## Timezone

- Afghanistan: `Asia/Kabul` (UTC+4:30), no DST.

## Number & date formatting

- Dari/Pashto use Arabic-Indic digits optionally; the storefront formats prices with `Intl.NumberFormat` for the selected locale.
- Dates use the Gregorian calendar in the backend; the storefront may display Solar Hijri dates in a future release (planned).

## Right-to-left (RTL)

- `<html dir="rtl">` for fa-AF and ps-AF; `<html dir="ltr">` for en.
- Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`) are used where practical so the same CSS works for both directions.
- Icons that imply direction (arrows, chevrons) are flipped for RTL.
