const production = process.argv.includes('--production');
const api = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
const key = process.env.SPREE_PUBLISHABLE_KEY;
if (!key) throw new Error('SPREE_PUBLISHABLE_KEY is required; refusing to claim runtime success');
async function json(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Spree-Api-Key': key, ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${JSON.stringify(body)}`);
  return body;
}
const products = await json('/api/v3/store/products');
if (!Array.isArray(products.data)) throw new Error('Product response is not a real Store API collection');
if (!production && !products.data.some((p) => p.slug === 'empire-demo-handmade-basket')) {
  throw new Error('Seeded demo product missing from the live Backend');
}
for (const path of ['/dashboard', '/sellers']) {
  const response = await fetch(`${api}${path}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
}
// A 200 storefront shell is not enough: prove the browser-facing relative API
// proxy reaches the Backend (Next bakes rewrite targets into the image).
const storefront = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';
const proxied = await fetch(`${storefront}/api/v3/store/products`, {
  headers: { 'X-Spree-Api-Key': key }, signal: AbortSignal.timeout(15000),
});
if (!proxied.ok) throw new Error(`Storefront API proxy: HTTP ${proxied.status}`);
const proxyBody = await proxied.json();
if (!Array.isArray(proxyBody.data)) throw new Error('Storefront API proxy did not return a Store API collection');
if (!production && !proxyBody.data.some((p) => p.slug === 'empire-demo-handmade-basket')) {
  throw new Error('Storefront API proxy cannot see the seeded demo product');
}
if (!production) {
  for (const [path, email, password] of [
    ['/api/v3/store/auth/login', process.env.DEMO_BUYER_EMAIL, process.env.DEMO_BUYER_PASSWORD],
    ['/api/v3/admin/auth/login', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD],
    ['/api/v3/seller/auth/login', process.env.DEMO_SELLER_EMAIL, process.env.DEMO_SELLER_PASSWORD],
  ]) {
    const result = await json(path, { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!result.token) throw new Error(`${path}: no JWT returned`);
  }
}
console.log(JSON.stringify({ status: 'PASS', environment: production ? 'production-image-test' : 'development', products: products.data.length, dashboard: true, sellerPanel: true }));
