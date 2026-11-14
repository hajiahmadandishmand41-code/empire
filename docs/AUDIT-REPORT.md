# Empire Audit Report

Audit of the Empire platform on **Spree Commerce 6.0.4** (official gems, exact-pinned; Spree core is not forked).

- Work branch: `arena/34c27a9c-empire`
- Code evidence commit: **`c8b637e`** (`test: give the migrated test store a valid identity before provisioning defaults`)
- Base commit: `05e80d0fa506f9750039dc949db05611b94c6b83` (`main`)
- Related PR: <https://github.com/hajiahmadandishmand41-code/empire/pull/1>
  - PR #1 head is still `arena/26f7ed83-empire` @ `5a81b36` (stale). The audit/fix work described here lives on `arena/34c27a9c-empire`.
- Production deployment: **not performed**. No production services were created or modified.

## Verdict

The repository is a runnable Spree 6.0.4 host app plus a Next.js storefront, with Empire-specific geography, COD, RFQ/quotes and payout-review extensions. The previously broken runtime paths (migrations, seeds, dev proxy host, demo stock/delivery, checkout labels/locale, COD payment status) are fixed and proven by CI at `c8b637e`.

**Backend CI, Frontend CI and E2E CI are green at `c8b637e`.** This is not a production-readiness claim: real payment gateways, carriers, SMTP/object storage, backup automation and a penetration test remain outside the verified scope. See `docs/KNOWN-LIMITATIONS.md`.

## Execution evidence

### GitHub Actions at `c8b637e`

| Suite | Run | Job | Conclusion | Notes |
|---|---:|---:|---|---|
| Backend CI | [43559345268](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345268) | [132339330544](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345268/job/132339330544) | **SUCCESS** (1m27s) | migrations, migration status, seed + idempotence, runtime boot proof, RSpec, Brakeman, bundle-audit |
| Frontend CI — storefront | [43559345341](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345341) | [132339330862](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345341/job/132339330862) | **SUCCESS** | static audit, TypeScript, ESLint, Next production build |
| Frontend CI — dashboard | same run | [132339330647](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345341/job/132339330647) | **SUCCESS** | pnpm typecheck, lint, contract tests, build |
| Frontend CI — seller-dashboard | same run | [132339330802](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345341/job/132339330802) | **SUCCESS** | pnpm typecheck, lint, contract tests, build |
| E2E CI — browser | [43559345302](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345302) | [132339330419](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345302/job/132339330419) | **SUCCESS** (4m22s) | Docker dev stack, runtime/proxy verification, Playwright suite (7 tests) |
| E2E CI — production-image | same run | [132339330625](https://github.com/hajiahmadandishmand41-code/empire/actions/runs/43559345302/job/132339330625) | **SUCCESS** (2m35s) | production image build, HTTP/runtime smoke, COD/geography present, demo data absent |

The Playwright step exits non-zero on any failed test; its success at `c8b637e` covers the 7 configured tests: home, language/direction persistence, product detail, cart operations, buyer login, browser COD checkout, and the full live marketplace/B2B API journey.

### Local gates (agent sandbox)

The sandbox has Node/npm but **no Ruby, PostgreSQL or Docker**. Backend/E2E execution evidence therefore comes from GitHub Actions, not local runs.

| Check | Result |
|---|---|
| `node scripts/audit-static.mjs` | **PASS** — 140 translation keys, 118 frontend keys checked, Pashto draft/not offered, 37 core + 14 Empire API operations, compose builds Empire `server/Dockerfile`, Spree `6.0.4` pins |
| `npm --prefix storefront run test` (ESLint + `tsc --noEmit`) | **PASS** |
| `node --check scripts/annotate-log.mjs`, `node --check scripts/annotate-playwright.mjs` | **PASS** |
| Annotation-helper smoke tests (successful migrate log emits no error; failure log emits bounded error; Playwright error-context snapshot attached) | **PASS** |
| `git diff --check` | **PASS** |
| Backend RSpec / migrations / Docker Compose locally | **NOT RUN / BLOCKED** (no Ruby/PostgreSQL/Docker) |

## What the audit fixed

1. **Native Spree, not a fork.** Empire features live in the host app (`server/app`, `server/db/migrate`, `server/config`) and the storefront. `Gemfile` and `Gemfile.lock` pin Spree `= 6.0.4`; the static audit checks agreement.
2. **Boot/initializer ordering.** COD registers in `after_initialize`; the AF postal-code exemption replaces Spree's frozen `NO_ZIPCODE_ISO_CODES` safely instead of mutating a frozen array or touching autoloaded constants too early.
3. **Routes/permissions/security.** Empire API routes are drawn in the host app, not inside the Spree engine namespace. Seller/company/payout scoping and staff permissions are covered by request specs; Brakeman and bundle-audit pass in CI.
4. **Dev storefront proxy.** Next.js bakes rewrite targets at build time, so the Docker build receives `API_INTERNAL_URL=http://web:3000`; Rails development also allows the compose proxy Host `web`. The runtime verifier proves the browser-facing relative `/api` proxy reaches the Store API.
5. **Purchasable demo catalog.** Seller warehouses do not auto-propagate variants, so the demo seed explicitly stocks the seller location. The operator's `Standard` delivery method is shared with sellers and visible on the storefront; otherwise Spree prunes rate-less fulfillments. The seed spec proves a real cart quotes the 150 AFN rate.
6. **Checkout accessibility/locale.** Province/district/delivery selects use explicit `label`/`id` pairs so exact accessible-name queries do not swallow option text. Browser API requests send `X-Spree-Locale` from the `empire_locale` cookie.
7. **COD semantics.** Spree 6 authorizes offline COD at checkout (`payment_status: authorized`); staff capture later moves it to `paid`. Journey assertions and docs match the native payment workflow.
8. **CI diagnostics.** `annotate-log.mjs` no longer labels a successful migrate container as failed when a later browser test fails; `annotate-playwright.mjs` surfaces each failed test and attaches the JSON report's error-context page snapshot.

## Remaining limitations (not bugs hidden by this audit)

- No production deployment; no real PSP/Stripe live keys, carrier API, SMTP or object storage connected.
- Bank-transfer receipt upload/verification and buyer–seller disputes/claims are **not implemented**.
- Pashto (`ps-AF`) is an explicit draft stub and is not offered in the UI.
- Strict +93 phone validation, Solar Hijri display and a district-correction admin UI are planned, not complete.
- Admin/seller dashboards are Spree starters with Empire base-path/contract checks, not deeply customized Empire consoles.
- Backup automation is documented only; no penetration test has been performed.

Full detail: `docs/KNOWN-LIMITATIONS.md`, `docs/FEATURE-MATRIX.md`, `docs/TESTING.md`.
