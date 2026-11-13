import type { FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const api = process.env.API_BASE_URL || "http://127.0.0.1:3000";
  const key = process.env.SPREE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY;
  if (!key) throw new Error("A real Backend publishable key is required. E2E is NOT RUN without it.");
  const response = await fetch(`${api}/api/v3/store/products`, { headers: { "X-Spree-Api-Key": key }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Backend required: products returned HTTP ${response.status}`);
  const body = await response.json() as { data: { slug: string }[] };
  if (!body.data.some((product) => product.slug === "empire-demo-handmade-basket")) throw new Error("Backend has no seeded Empire demo product; refusing a vacuous E2E pass");
  const frontend = await fetch(config.projects[0].use.baseURL || "http://127.0.0.1:3001", { signal: AbortSignal.timeout(15000) });
  if (!frontend.ok) throw new Error(`Storefront required: HTTP ${frontend.status}`);
}
