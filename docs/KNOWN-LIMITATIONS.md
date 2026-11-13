# Known Limitations

Honest status of what is **not implemented, not executed, or not operational**. Required reading before any production consideration. Execution evidence is in `docs/TESTING.md` and the audit report.

## Agent sandbox limitations

- **No Ruby / Rails / Bundler**, **no PostgreSQL**, **no Docker** locally. Backend specs, migrations, seeds and `docker compose` cannot run in this sandbox; they are executed (or not) by GitHub Actions.
- Node.js/npm are available, so frontend lint/typecheck/build and dashboard builds/tests run locally.
- A feature is only counted as verified when a CI job proves it; local absence is reported as NOT RUN / BLOCKED, never as PASS.

## Not implemented (code absent)

- **Bank transfer with receipt upload/verification** — no model, endpoint, or admin workflow.
- **Disputes / claims** — no `empire_disputes` table or workflow.
- **Pashto (`ps-AF`)** — draft stub only; not offered in the UI.
- **Strict +93 phone validation** — labels/LTR inputs only.
- **Solar Hijri calendar**, **district admin correction UI** — planned.
- **Carrier API / real-time shipping quotes** — manual Spree rates only.
- **Local PSP / Stripe live payments** — gem present, not enabled; needs legal review + credentials.

## Implemented but not production-proven

- COD, RFQ/quotes, payout review, seller application, geography seed: implemented and covered by specs/E2E in CI, but not exercised against real delivery, real banks, or real sellers.
- Marketplace/B2B rely on native Spree behaviour; operators must configure commission rates, shipping zones/rates, catalogs and price lists for their business.

## Frontend / dashboards

- Storefront: lint, typecheck and production build run locally and in CI; Playwright E2E runs in CI against the Docker stack.
- `apps/dashboard` and `apps/seller-dashboard`: Spree starters with contract tests; built/typechecked/linted in CI. They are not deeply customized for Empire beyond base path and contract checks.

## Deployment / operations

- No production deployment performed; no real gateway/carrier/SMTP/object storage connected.
- Backup automation documented only.
- No penetration test; Brakeman/bundle-audit run in CI (status in TESTING/report).
