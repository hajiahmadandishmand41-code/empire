# Empire Storefront

Customer-facing Next.js storefront for the Empire e-commerce platform.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

## Connects to

The Spree backend (`server/`) Store API v3 at `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (http://localhost:3001) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Placeholder (no test runner yet) |

## Environment variables

Copy `.env.example` (create from the values below) to `.env.local`:

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Spree backend Store API URL |
| `NEXT_PUBLIC_STORE_URL` | `http://localhost:3001` | Storefront public URL |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `fa-AF` | Default language |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `AFN` | Default currency |

## Internationalization

- `fa-AF` Dari (RTL), `ps-AF` Pashto (RTL), `en` English (LTR).
- Translations in `src/lib/i18n.ts`.
- Direction set on `<html dir="...">`; RTL styles in `src/app/globals.css`.

## Pages

- `/` — Home (hero, featured products, categories)
- `/products` — Product listing
- `/products/[slug]` — Product detail
- `/cart` — Shopping cart
- `/checkout` — Checkout (address → payment → review)
- `/login`, `/register` — Authentication
- `/account` — Customer dashboard
- `/seller` — Seller dashboard
- `/admin` — Links to Spree Admin Dashboard (backend port 3000)

## Deploy

See `docs/DEPLOYMENT.md`. Target: Vercel or any Next.js-compatible host.
