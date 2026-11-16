/** Empire client for the exact Spree 6.0.4 Store API (docs/api/spree-6.0.4).
 * Browser URLs are origin-relative. Only the Next server uses API_INTERNAL_URL.
 * Money is a decimal string; IDs are prefixed strings, never database integers.
 */
export type JsonMap = Record<string, unknown>;
export interface Price { id?: string; amount: string | null; currency: string }
export interface Variant { id: string; sku: string | null; price: Price | null; in_stock: boolean; purchasable: boolean; minimum_order_quantity: number | null; order_multiple: number | null }
export interface Product { id: string; name: string; slug: string; description: string | null; thumbnail_url: string | null; available: boolean; in_stock: boolean; purchasable: boolean; price: Price | null; default_variant_id: string; buy_box_variant_id: string | null; seller_id?: string | null; seller?: { id: string; name: string }; variants?: Variant[] }
export interface Address { id?: string; first_name: string; last_name: string; address1: string; address2?: string | null; city: string; postal_code?: string | null; phone: string; country_code: string; state_name?: string | null; company?: string | null }
export interface LineItem { id: string; variant_id: string; name: string; slug: string; quantity: number; price: string | null; total: string | null; currency: string; thumbnail_url: string | null }
export interface DeliveryRate { id: string; name?: string; cost: string | null }
export interface Fulfillment { id: string; delivery_rates: DeliveryRate[]; selected_delivery_rate_id: string | null }
export interface PaymentMethod { id: string; name: string; description: string | null; type: string; session_required: boolean }
export interface Cart { id: string; token: string; currency: string; locale: string; email: string | null; items: LineItem[]; item_total: string | null; delivery_total: string | null; tax_total: string | null; total: string | null; fulfillments: Fulfillment[]; payment_methods: PaymentMethod[]; requirements: { code: string; message: string; field?: string }[]; shipping_address: Address | null; billing_address: Address | null; company_id: string | null; po_number_required: boolean; po_number: string | null }
export interface Customer { id: string; email: string; first_name: string | null; last_name: string | null; phone?: string | null }
export interface AuthResult { token: string; refresh_token: string; user: Customer }
export interface Order { id: string; number: string; status: string; total: string | null; currency: string; created_at?: string }
export interface Purchase { id: string; number?: string; orders?: Order[]; total?: string | null; currency?: string }
export interface Company { id: string; name: string; kind: string }
export interface Quote { id: number; seller_id: string; amount: string; currency: string; status: string; notes: string | null }
export interface Rfq { id: number; title: string; description: string | null; status: string; requested_quantity: number; currency: string; company_id: string | null; quotes?: Quote[] }
export interface Province { id: number; code: string; name: string; districts: { id: number; name: string }[] }

const STORE = "/api/v3/store";
const CART_KEY = "empire.cart.v1";
const SESSION_KEY = "empire.session.v1";
export class SpreeApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); this.name = "SpreeApiError"; }
}
function publicKey(): string {
  const key = process.env.NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY;
  if (!key) throw new SpreeApiError(0, "configuration_error");
  return key;
}
function baseUrl(): string { return typeof window === "undefined" ? (process.env.API_INTERNAL_URL || "http://127.0.0.1:3000") : ""; }
function session(): { token: string; refresh_token: string } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
export function signedIn(): boolean { return Boolean(session()?.token); }
export function clearSession(): void { sessionStorage.removeItem(SESSION_KEY); }
function saveSession(result: AuthResult): void { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: result.token, refresh_token: result.refresh_token })); }
export function storedCart(): { id: string; token: string } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "null"); } catch { return null; }
}
function saveCart(cart: Cart): Cart { localStorage.setItem(CART_KEY, JSON.stringify({ id: cart.id, token: cart.token })); return cart; }
export function clearCart(): void { localStorage.removeItem(CART_KEY); }

let refreshing: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  const current = session();
  if (!current?.refresh_token) return false;
  refreshing ??= (async () => {
    try {
      const result = await request<AuthResult>(`${STORE}/auth/refresh`, { method: "POST", body: { refresh_token: current.refresh_token }, noRetry: true, noAuth: true });
      saveSession(result); return true;
    } catch { clearSession(); return false; }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

interface RequestOptions { method?: string; body?: unknown; noRetry?: boolean; noAuth?: boolean; cartToken?: string | null }
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json", "X-Spree-Api-Key": publicKey() };
  if (typeof window !== "undefined") {
    const locale = document.cookie.split("; ").find((row) => row.startsWith("empire_locale="))?.split("=")[1] || "fa-AF";
    headers["X-Spree-Locale"] = locale === "en" ? "en" : "fa";
  }
  const token = !options.noAuth && session()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.cartToken) headers["X-Spree-Token"] = options.cartToken;
  const response = await fetch(`${baseUrl()}${path}`, { method: options.method || "GET", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), cache: "no-store" });
  if (response.status === 401 && !options.noRetry && !options.noAuth && await refreshSession()) return request<T>(path, { ...options, noRetry: true });
  if (!response.ok) {
    let message = `HTTP ${response.status}`; let code: string | undefined;
    try {
      const body = await response.json() as { error?: { message?: string; code?: string } | string; errors?: unknown; message?: string };
      message = typeof body.error === "object" ? body.error?.message || message : typeof body.error === "string" ? body.error : body.message || message;
      code = typeof body.error === "object" ? body.error?.code : undefined;
      if (body.errors) message += `: ${JSON.stringify(body.errors)}`;
    } catch { /* Keep the HTTP status; never turn a failed response into success. */ }
    throw new SpreeApiError(response.status, message, code);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

export async function listProducts(filters: { page?: number; limit?: number; search?: string } = {}): Promise<{ data: Product[]; meta: JsonMap }> {
  const query = new URLSearchParams();
  if (filters.page) query.set("page", String(filters.page));
  if (filters.limit) query.set("limit", String(filters.limit));
  if (filters.search) query.set("q[search]", filters.search);
  return request(`${STORE}/products${query.size ? `?${query}` : ""}`);
}
export async function getProduct(idOrSlug: string): Promise<Product> { return request(`${STORE}/products/${encodeURIComponent(idOrSlug)}?expand=variants,seller`); }
export async function getCart(): Promise<Cart | null> {
  const ref = storedCart(); if (!ref) return null;
  try { return saveCart(await request<Cart>(`${STORE}/carts/${ref.id}`, { cartToken: ref.token })); }
  catch (error) { if (error instanceof SpreeApiError && error.status === 404) { clearCart(); return null; } throw error; }
}
export async function createCart(): Promise<Cart> { return saveCart(await request<Cart>(`${STORE}/carts`, { method: "POST", body: {} })); }
export async function ensureCart(): Promise<Cart> { return await getCart() || await createCart(); }
export async function addToCart(variantId: string, quantity = 1): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/items`, { method: "POST", body: { variant_id: variantId, quantity }, cartToken: cart.token }));
}
export async function updateCartLineItem(lineItemId: string, quantity: number): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/items/${lineItemId}`, { method: "PATCH", body: { quantity }, cartToken: cart.token }));
}
export async function removeCartLineItem(lineItemId: string): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/items/${lineItemId}`, { method: "DELETE", cartToken: cart.token }));
}
export async function updateCart(attributes: { email?: string; shipping_address?: Address; billing_address?: Address; use_shipping?: boolean; company_id?: string | null; po_number?: string | null }): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}`, { method: "PATCH", body: attributes, cartToken: cart.token }));
}
export async function selectDelivery(fulfillmentId: string, rateId: string): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/fulfillments/${fulfillmentId}`, { method: "PATCH", body: { selected_delivery_rate_id: rateId }, cartToken: cart.token }));
}
export async function choosePayment(paymentMethodId: string): Promise<JsonMap> {
  const cart = await ensureCart();
  return request(`${STORE}/carts/${cart.id}/payments`, { method: "POST", body: { payment_method_id: paymentMethodId }, cartToken: cart.token });
}
export async function completeCart(): Promise<Purchase> {
  const cart = await ensureCart();
  const purchase = await request<Purchase>(`${STORE}/carts/${cart.id}/complete`, { method: "POST", cartToken: cart.token });
  clearCart(); return purchase;
}
async function associateCart(): Promise<void> {
  const ref = storedCart(); if (!ref) return;
  saveCart(await request<Cart>(`${STORE}/carts/${ref.id}/associate`, { method: "PATCH", cartToken: ref.token }));
}
export async function login(email: string, password: string): Promise<AuthResult> {
  const result = await request<AuthResult>(`${STORE}/auth/login`, { method: "POST", body: { email, password }, noAuth: true });
  saveSession(result); await associateCart(); return result;
}
export async function register(attributes: { email: string; password: string; password_confirmation: string; first_name: string; last_name: string; phone?: string }): Promise<AuthResult> {
  const result = await request<AuthResult>(`${STORE}/customers`, { method: "POST", body: attributes, noAuth: true });
  saveSession(result); await associateCart(); return result;
}
export async function logout(): Promise<void> {
  const current = session();
  if (current) await request(`${STORE}/auth/logout`, { method: "POST", body: { refresh_token: current.refresh_token }, noAuth: true });
  clearSession();
}
export async function getAccount(): Promise<Customer> { return request(`${STORE}/customers/me`); }
export async function listOrders(): Promise<{ data: Order[] }> { return request(`${STORE}/customers/me/orders`); }
export async function listAddresses(): Promise<{ data: Address[] }> { return request(`${STORE}/customers/me/addresses`); }
export async function createAddress(address: Address): Promise<Address> { return request(`${STORE}/customers/me/addresses`, { method: "POST", body: address }); }
export async function listCompanies(): Promise<{ data: Company[] }> {
  // Spree returns the buyer's company memberships, each with the company nested.
  const result = await request<{ data: { company: Company }[] }>(`${STORE}/account/companies`);
  return { data: result.data.map((membership) => membership.company) };
}
export async function listProvinces(): Promise<{ data: Province[] }> { return request(`${STORE}/empire/provinces`); }
export async function listRfqs(): Promise<{ data: Rfq[] }> { return request(`${STORE}/empire/rfqs`); }
export async function getRfq(id: number): Promise<Rfq> { return request(`${STORE}/empire/rfqs/${id}`); }
export async function createRfq(attributes: { title: string; description?: string; requested_quantity: number; company_id?: string; variant_id?: string; budget_min?: string; budget_max?: string }): Promise<Rfq> { return request(`${STORE}/empire/rfqs`, { method: "POST", body: attributes }); }
export async function acceptQuote(rfqId: number, quoteId: number): Promise<Rfq> { return request(`${STORE}/empire/rfqs/${rfqId}/quotes/${quoteId}/accept`, { method: "POST" }); }
export async function applySeller(attributes: { email: string; password: string; password_confirmation: string; shop_name: string; registration_number?: string }): Promise<{ id: string; status: string }> { return request(`${STORE}/empire/seller_applications`, { method: "POST", body: attributes, noAuth: true }); }
