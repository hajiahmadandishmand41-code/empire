/** Empire client for the exact Spree 6.0.4 Store API (docs/api/spree-6.0.4)
 * plus the Empire extension endpoints.
 *
 * Rules this module enforces:
 * - Browser URLs are origin-relative; only the Next server uses API_INTERNAL_URL.
 * - Money is a decimal string in major units, never integer cents, and never a
 *   `display_*` field (those are deprecated and removed in Spree 6.1).
 * - IDs are prefixed strings (`prod_…`), never database integers.
 * - A failed response always throws; it is never turned into an empty success.
 */
export type JsonMap = Record<string, unknown>;

/* ------------------------------------------------------------------ types */

export interface PaginationMeta {
  page: number;
  limit: number;
  count: number;
  pages: number;
  from?: number;
  to?: number;
  in?: number;
  previous?: number | null;
  next?: number | null;
}
export interface Paginated<T> { data: T[]; meta: PaginationMeta }

export interface Price {
  id?: string;
  amount: string | null;
  currency: string;
  compare_at_amount?: string | null;
  price_list_id?: string | null;
}

export interface Media {
  id: string;
  position: number;
  alt: string | null;
  media_type?: string;
  original_url?: string | null;
  mini_url?: string | null;
  small_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  xlarge_url?: string | null;
  og_image_url?: string | null;
  video_url?: string | null;
  poster_url?: string | null;
}

export interface OptionValue {
  id: string;
  name: string;
  label: string;
  position?: number;
  color_code?: string | null;
  option_type_name?: string;
  option_type_label?: string;
  image_url?: string | null;
}

export interface OptionType { id: string; name: string; label: string; position?: number }

export interface CustomField { id?: string; key: string; label: string; field_type?: string; value: unknown }

export interface Variant {
  id: string;
  sku: string | null;
  options_text?: string;
  price: Price | null;
  original_price?: Price | null;
  in_stock: boolean;
  purchasable: boolean;
  backorderable?: boolean;
  preorder?: boolean;
  minimum_order_quantity: number | null;
  order_multiple: number | null;
  purchase_unit?: string | null;
  units_per_carton?: number | null;
  thumbnail_url?: string | null;
  media?: Media[];
  option_values?: OptionValue[];
  seller_id?: string | null;
}

export interface Seller {
  id: string;
  name: string;
  slug?: string;
  about?: string | null;
  about_html?: string | null;
  logo_url?: string | null;
  square_logo_url?: string | null;
  cover_photo_url?: string | null;
  policies?: Policy[];
  custom_fields?: CustomField[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  description_html?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  thumbnail_url: string | null;
  available: boolean;
  in_stock: boolean;
  purchasable: boolean;
  preorder?: boolean;
  backorderable?: boolean;
  variant_count?: number;
  available_on?: string | null;
  tags?: string[];
  price: Price | null;
  original_price?: Price | null;
  default_variant_id: string;
  buy_box_variant_id: string | null;
  seller_id?: string | null;
  seller?: Seller | null;
  primary_media?: Media | null;
  media?: Media[];
  variants?: Variant[];
  default_variant?: Variant | null;
  option_types?: OptionType[];
  option_values?: OptionValue[];
  categories?: Category[];
  custom_fields?: CustomField[];
}

export interface Category {
  id: string;
  name: string;
  permalink: string;
  position?: number;
  depth?: number;
  parent_id?: string | null;
  children_count?: number;
  description?: string | null;
  image_url?: string | null;
  square_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_root?: boolean;
  is_leaf?: boolean;
  products_count?: number;
  children?: Category[];
  parent?: Category | null;
  pretty_name?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  permalink: string;
  position?: number;
  sort_order?: string;
  description?: string | null;
  products_count?: number;
  image_url?: string | null;
  square_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface Policy { id: string; name: string; slug: string; body?: string | null; body_html?: string | null; updated_at?: string }

export interface DeliveryMethod {
  id: string;
  name: string;
  code?: string | null;
  estimated_transit_business_days_min?: number | null;
  estimated_transit_business_days_max?: number | null;
  digital?: boolean;
  pickup?: boolean;
  pickup_point?: boolean;
}

export interface Address {
  id?: string;
  label?: string | null;
  first_name: string;
  last_name: string;
  full_name?: string;
  address1: string;
  address2?: string | null;
  city: string;
  postal_code?: string | null;
  phone: string;
  country_code: string;
  country_name?: string;
  state_name?: string | null;
  state_text?: string | null;
  company?: string | null;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
}

export interface LineItem {
  id: string;
  variant_id: string;
  seller_id?: string | null;
  name: string;
  slug: string;
  options_text?: string;
  quantity: number;
  price: string | null;
  total: string | null;
  currency: string;
  thumbnail_url?: string | null;
}

export interface DeliveryRate { id: string; name?: string; cost: string | null }
export interface Fulfillment { id: string; delivery_rates: DeliveryRate[]; selected_delivery_rate_id: string | null }
export interface PaymentMethod { id: string; name: string; description: string | null; type: string; session_required: boolean }
export interface CartWarning { code: string; message: string; line_item_id?: string; variant_id?: string }

export interface Cart {
  id: string;
  token: string;
  currency: string;
  locale: string;
  email: string | null;
  customer_note?: string | null;
  total_quantity?: number;
  items: LineItem[];
  item_total: string | null;
  discount_total?: string | null;
  delivery_total: string | null;
  tax_total: string | null;
  total: string | null;
  coupon_code?: string | null;
  warnings?: CartWarning[];
  fulfillments: Fulfillment[];
  payment_methods: PaymentMethod[];
  requirements: { code: string; message: string; field?: string }[];
  shipping_address: Address | null;
  billing_address: Address | null;
  company_id: string | null;
  company_name?: string | null;
  po_number_required: boolean;
  po_number: string | null;
}

export interface Customer { id: string; email: string; first_name: string | null; last_name: string | null; phone?: string | null }

/** What `PATCH /store/customers/me` accepts. `current_password` is required by the
 * API when the email or the password changes, so callers send it only then. */
export interface UpdateCustomerParams {
  email?: string;
  password?: string;
  password_confirmation?: string;
  current_password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}
export interface AuthResult { token: string; refresh_token: string; user: Customer }

export interface Order {
  id: string;
  number: string;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  total: string | null;
  item_total?: string | null;
  delivery_total?: string | null;
  tax_total?: string | null;
  discount_total?: string | null;
  currency: string;
  total_quantity?: number;
  company_name?: string | null;
  po_number?: string | null;
  completed_at?: string | null;
  created_at?: string;
  email?: string;
  items?: LineItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  fulfillments?: Fulfillment[];
}

export interface Purchase { id: string; number?: string; orders?: Order[]; total?: string | null; currency?: string }
export interface Company { id: string; name: string; kind: string; po_number_required?: boolean }

export interface Quote { id: number; seller_id: string; seller_name?: string; amount: string; currency: string; status: string; notes: string | null; created_at?: string }
export interface Rfq {
  id: number;
  title: string;
  description: string | null;
  status: string;
  requested_quantity: number;
  currency: string;
  budget_min?: string | null;
  budget_max?: string | null;
  company_id?: string | null;
  variant_id?: string | null;
  seller_id?: string | null;
  product_name?: string | null;
  customer_name?: string | null;
  quotes?: Quote[];
  my_quote?: Quote | null;
  expires_at?: string | null;
  created_at?: string;
}
export interface Province { id: number; code: string; name: string; districts: { id: number; name: string }[] }

export interface WishlistItem { id: string; variant_id: string; product_id: string; quantity: number; variant?: Variant; product?: Product }
export interface Wishlist { id: string; name: string; token?: string; is_default?: boolean; is_private?: boolean; items?: WishlistItem[] }

/** Shape of `GET /store/products/filters`, taken from the documented example
 * response rather than assumed. `label` is null on sort_options in practice, so
 * the UI maps sort ids to its own catalog keys. */
export interface FilterOptionValue {
  id: string;
  name?: string | null;
  label?: string | null;
  permalink?: string | null;
  position?: number | null;
  color_code?: string | null;
  image_url?: string | null;
  count?: number;
}
export interface ProductFilterGroup {
  id: string;
  type: "price_range" | "availability" | "option" | "category" | string;
  name?: string | null;
  label?: string | null;
  kind?: string | null;
  min?: string | null;
  max?: string | null;
  currency?: string | null;
  options?: FilterOptionValue[];
}
export interface ProductFilters {
  id?: string | null;
  default_sort?: string | null;
  total_count?: number;
  filters: ProductFilterGroup[];
  sort_options?: { id: string; label?: string | null }[];
}

/* ------------------------------------------------------------- plumbing */

const STORE = "/api/v3/store";
/** Reference data (taxonomy, sellers, policies, geography) is public and
 * changes rarely; caching it keeps slow connections off the critical path. */
const REFERENCE_REVALIDATE = 300;
const CART_KEY = "empire.cart.v1";
const SESSION_KEY = "empire.session.v1";

export class SpreeApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = "SpreeApiError";
  }
}

function publicKey(): string {
  const key = process.env.NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY;
  if (!key) throw new SpreeApiError(0, "configuration_error");
  return key;
}

function baseUrl(): string {
  return typeof window === "undefined" ? (process.env.API_INTERNAL_URL || "http://127.0.0.1:3000") : "";
}

function session(): { token: string; refresh_token: string } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function signedIn(): boolean { return Boolean(session()?.token); }
export function clearSession(): void { sessionStorage.removeItem(SESSION_KEY); }
function saveSession(result: AuthResult): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: result.token, refresh_token: result.refresh_token }));
}

export function storedCart(): { id: string; token: string } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "null"); } catch { return null; }
}
function saveCart(cart: Cart): Cart {
  localStorage.setItem(CART_KEY, JSON.stringify({ id: cart.id, token: cart.token }));
  return cart;
}
export function clearCart(): void { localStorage.removeItem(CART_KEY); }

let refreshing: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  const current = session();
  if (!current?.refresh_token) return false;
  refreshing ??= (async () => {
    try {
      const result = await request<AuthResult>(`${STORE}/auth/refresh`, {
        method: "POST", body: { refresh_token: current.refresh_token }, noRetry: true, noAuth: true,
      });
      saveSession(result);
      return true;
    } catch { clearSession(); return false; }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  noRetry?: boolean;
  noAuth?: boolean;
  cartToken?: string | null;
  /** Cache a public, non-commercial payload (taxonomy, policies, sellers).
   * Prices, stock and carts are never cached. */
  revalidate?: number;
  /** Cancels an in-flight request. Used by live search so a slow connection
   * never resolves a stale query over a newer one. */
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Spree-Api-Key": publicKey(),
  };
  if (typeof window !== "undefined") {
    const locale = document.cookie.split("; ").find((row) => row.startsWith("empire_locale="))?.split("=")[1] || "fa-AF";
    headers["X-Spree-Locale"] = locale === "en" ? "en" : "fa";
  }
  const token = !options.noAuth && session()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.cartToken) headers["X-Spree-Token"] = options.cartToken;

  const response = await fetch(`${baseUrl()}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    // `cache: "no-store"` forces revalidate:0, so the two are mutually
    // exclusive: commercial payloads (price, stock, cart, orders) are never
    // stored, public reference data is held in the Data Cache for 5 minutes.
    ...(options.revalidate
      ? { next: { revalidate: options.revalidate } }
      : { cache: "no-store" as RequestCache }),
  });

  if (response.status === 401 && !options.noRetry && !options.noAuth && await refreshSession()) {
    return request<T>(path, { ...options, noRetry: true });
  }
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let code: string | undefined;
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

function withQuery(path: string, params: Record<string, string | number | boolean | undefined | null | string[]>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    if (Array.isArray(value)) {
      for (const item of value) if (item) query.append(key.endsWith("[]") ? key : `${key}[]`, item);
      continue;
    }
    query.set(key, String(value));
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return `${path}${suffix}`;
}

/* ---------------------------------------------------------------- catalog */

export type ProductSort = "price" | "-price" | "best_selling" | "name" | "-name" | "-available_on" | "available_on";

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: ProductSort;
  /** Prefixed id (`ctg_…`) — includes descendant categories. */
  category?: string;
  /** Prefixed id (`col_…`). */
  collection?: string;
  /** Collection permalink, through the documented `collections_` association
   * filter. Use this when the caller only knows a slug: resolving the permalink
   * to a prefixed id first would cost a second request. */
  collectionPermalink?: string;
  /** Prefixed id (`sel_…`). */
  seller?: string;
  priceGte?: number | string;
  priceLte?: number | string;
  inStock?: boolean;
  /** Option value ids (`optval_…`), documented as q[with_option_value_ids][]. */
  optionValues?: string[];
  expand?: string;
}

/** Removes repeated products while preserving the order the API returned.
 *
 * A guard, not a workaround for a measured defect. Expanding a has_many
 * association is the usual way a list endpoint ends up emitting one row per
 * child instead of one per parent, so this was added on that suspicion. Measured
 * against the real Store API it does not happen: `page=1&limit=24&expand=
 * variants,seller` returns one row per product with `meta.count` agreeing, and
 * distinct ids equal to the row count.
 *
 * It stays because rendering the same product twice is a bad failure to reach a
 * shopper — it doubles the payload and makes "the card for product X" resolve to
 * two elements for assistive technology and for label-based lookups — and
 * because the guarantee is cheap. `meta.count` is left exactly as the API
 * reports it: a "corrected" total would be a guess about a query this storefront
 * cannot see.
 */
export function uniqueProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => (seen.has(product.id) ? false : (seen.add(product.id), true)));
}

export async function listProducts(filters: ProductQuery = {}, options: { signal?: AbortSignal } = {}): Promise<Paginated<Product>> {
  return request(withQuery(`${STORE}/products`, {
    page: filters.page,
    limit: filters.limit,
    "q[search]": filters.search,
    sort: filters.sort,
    "q[in_category]": filters.category,
    "q[in_collection]": filters.collection,
    "q[collections_permalink_eq]": filters.collectionPermalink,
    "q[seller_id_eq]": filters.seller,
    "q[price_gte]": filters.priceGte,
    "q[price_lte]": filters.priceLte,
    "q[in_stock]": filters.inStock === true ? true : undefined,
    "q[with_option_value_ids][]": filters.optionValues,
    expand: filters.expand,
  }), { signal: options.signal });
}

export async function getProduct(idOrSlug: string, expand = "variants,seller,media,categories,option_types"): Promise<Product> {
  return request(`${STORE}/products/${encodeURIComponent(idOrSlug)}?expand=${encodeURIComponent(expand)}`);
}

export async function listCategories(limit = 100): Promise<Paginated<Category>> {
  return request(withQuery(`${STORE}/categories`, { limit }), { revalidate: REFERENCE_REVALIDATE });
}

export async function getCategory(idOrPermalink: string): Promise<Category> {
  return request(`${STORE}/categories/${encodeURIComponent(idOrPermalink)}`);
}

/** Root categories only — the top-level navigation the home page needs. */
export async function listRootCategories(limit = 24): Promise<Category[]> {
  const result = await listCategories(limit);
  const roots = result.data.filter((category) => category.is_root || !category.parent_id || category.depth === 0);
  return (roots.length ? roots : result.data).slice(0, limit);
}

export async function listCollections(limit = 24): Promise<Paginated<Collection>> {
  return request(withQuery(`${STORE}/collections`, { limit }), { revalidate: REFERENCE_REVALIDATE });
}

export async function listCollectionProducts(collectionId: string, limit = 12): Promise<Paginated<Product>> {
  return request(withQuery(`${STORE}/collections/${encodeURIComponent(collectionId)}/products`, { limit }));
}

export async function listDeliveryMethods(): Promise<Paginated<DeliveryMethod>> {
  return request(`${STORE}/delivery_methods`, { revalidate: REFERENCE_REVALIDATE });
}

/** Creates a newsletter subscription.
 *
 * A guest subscription is stored UNVERIFIED and Spree then expects a
 * confirmation email to be delivered, which needs a working SMTP relay. Until
 * that relay is provisioned and tested, the storefront must not offer this as
 * a working feature — see NEXT_PUBLIC_NEWSLETTER_ENABLED in the footer. */
export async function subscribeNewsletter(email: string, redirectUrl?: string): Promise<JsonMap> {
  return request(`${STORE}/newsletter_subscribers`, {
    method: "POST",
    body: redirectUrl ? { email, redirect_url: redirectUrl } : { email },
  });
}

export async function listPolicies(): Promise<Paginated<Policy>> {
  return request(`${STORE}/policies`, { revalidate: REFERENCE_REVALIDATE });
}

export async function getPolicy(idOrSlug: string): Promise<Policy> {
  return request(`${STORE}/policies/${encodeURIComponent(idOrSlug)}`);
}

/** Context-aware facets with counts. Scoped by category and search so the
 * sidebar only offers refinements that can actually return results. */
export async function listProductFilters(params: { category?: string; search?: string } = {}): Promise<ProductFilters> {
  return request(withQuery(`${STORE}/products/filters`, {
    "category_id": params.category,
    "q[search]": params.search,
  }), { revalidate: REFERENCE_REVALIDATE });
}

/* ---------------------------------------------------------------- sellers */

export async function listSellers(query: { page?: number; limit?: number; search?: string } = {}): Promise<Paginated<Seller>> {
  return request(withQuery(`${STORE}/sellers`, {
    page: query.page, limit: query.limit, "q[search]": query.search, expand: "policies",
  }), { revalidate: REFERENCE_REVALIDATE });
}

/** Seller profile.
 *
 * `custom_fields` is expanded here because the API returns only the fields the
 * seller marked storefront-visible — that is the boundary between publishable
 * company/contact details and private seller data, so the storefront must not
 * widen it by guessing at other fields. */
export async function getSeller(slugOrId: string): Promise<Seller> {
  return request(`${STORE}/sellers/${encodeURIComponent(slugOrId)}?expand=policies,custom_fields`, {
    revalidate: REFERENCE_REVALIDATE,
  });
}

/* ------------------------------------------------------------------- cart */

export async function getCart(): Promise<Cart | null> {
  const ref = storedCart();
  if (!ref) return null;
  try {
    return saveCart(await request<Cart>(`${STORE}/carts/${ref.id}`, { cartToken: ref.token }));
  } catch (error) {
    if (error instanceof SpreeApiError && error.status === 404) { clearCart(); return null; }
    throw error;
  }
}
export async function createCart(): Promise<Cart> { return saveCart(await request<Cart>(`${STORE}/carts`, { method: "POST", body: {} })); }
export async function ensureCart(): Promise<Cart> { return await getCart() || await createCart(); }

export async function addToCart(variantId: string, quantity = 1): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/items`, {
    method: "POST", body: { variant_id: variantId, quantity }, cartToken: cart.token,
  }));
}
export async function updateCartLineItem(lineItemId: string, quantity: number): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/items/${lineItemId}`, {
    method: "PATCH", body: { quantity }, cartToken: cart.token,
  }));
}
export async function removeCartLineItem(lineItemId: string): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/items/${lineItemId}`, {
    method: "DELETE", cartToken: cart.token,
  }));
}
export async function updateCart(attributes: {
  email?: string; shipping_address?: Address; billing_address?: Address; use_shipping?: boolean;
  company_id?: string | null; po_number?: string | null; customer_note?: string | null;
}): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}`, { method: "PATCH", body: attributes, cartToken: cart.token }));
}
export async function selectDelivery(fulfillmentId: string, rateId: string): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/fulfillments/${fulfillmentId}`, {
    method: "PATCH", body: { selected_delivery_rate_id: rateId }, cartToken: cart.token,
  }));
}
export async function choosePayment(paymentMethodId: string): Promise<JsonMap> {
  const cart = await ensureCart();
  return request(`${STORE}/carts/${cart.id}/payments`, {
    method: "POST", body: { payment_method_id: paymentMethodId }, cartToken: cart.token,
  });
}
export async function applyDiscountCode(code: string): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/discount_codes`, {
    method: "POST", body: { code }, cartToken: cart.token,
  }));
}
export async function removeDiscountCode(id: string): Promise<Cart> {
  const cart = await ensureCart();
  return saveCart(await request<Cart>(`${STORE}/carts/${cart.id}/discount_codes/${id}`, {
    method: "DELETE", cartToken: cart.token,
  }));
}
export async function completeCart(): Promise<Purchase> {
  const cart = await ensureCart();
  const purchase = await request<Purchase>(`${STORE}/carts/${cart.id}/complete`, {
    method: "POST", cartToken: cart.token,
  });
  clearCart();
  return purchase;
}

async function associateCart(): Promise<void> {
  const ref = storedCart();
  if (!ref) return;
  saveCart(await request<Cart>(`${STORE}/carts/${ref.id}/associate`, { method: "PATCH", cartToken: ref.token }));
}

/* ------------------------------------------------------------------- auth */

export async function login(email: string, password: string): Promise<AuthResult> {
  const result = await request<AuthResult>(`${STORE}/auth/login`, { method: "POST", body: { email, password }, noAuth: true });
  saveSession(result);
  await associateCart();
  return result;
}

export async function register(attributes: {
  email: string; password: string; password_confirmation: string;
  first_name: string; last_name: string; phone?: string;
}): Promise<AuthResult> {
  const result = await request<AuthResult>(`${STORE}/customers`, { method: "POST", body: attributes, noAuth: true });
  saveSession(result);
  await associateCart();
  return result;
}

export async function logout(): Promise<void> {
  const current = session();
  if (current) {
    await request(`${STORE}/auth/logout`, { method: "POST", body: { refresh_token: current.refresh_token }, noAuth: true });
  }
  clearSession();
}

export async function requestPasswordReset(email: string): Promise<JsonMap> {
  return request(`${STORE}/password_resets`, { method: "POST", body: { email }, noAuth: true });
}

export async function resetPassword(token: string, password: string, passwordConfirmation: string): Promise<JsonMap> {
  return request(`${STORE}/password_resets/${encodeURIComponent(token)}`, {
    method: "PATCH", body: { password: password, password_confirmation: passwordConfirmation }, noAuth: true,
  });
}

/* ---------------------------------------------------------------- account */

export async function getAccount(): Promise<Customer> { return request(`${STORE}/customers/me`); }
export async function updateAccount(params: UpdateCustomerParams): Promise<Customer> {
  return request(`${STORE}/customers/me`, { method: "PATCH", body: params });
}
export async function listOrders(): Promise<Paginated<Order>> { return request(`${STORE}/customers/me/orders`); }
export async function getOrder(id: string): Promise<Order> { return request(`${STORE}/customers/me/orders/${encodeURIComponent(id)}?expand=items,fulfillments`); }
export async function listAddresses(): Promise<Paginated<Address>> { return request(`${STORE}/customers/me/addresses`); }
export async function createAddress(address: Address): Promise<Address> { return request(`${STORE}/customers/me/addresses`, { method: "POST", body: address }); }
export async function updateAddress(id: string, address: Partial<Address>): Promise<Address> {
  return request(`${STORE}/customers/me/addresses/${encodeURIComponent(id)}`, { method: "PATCH", body: address });
}
export async function deleteAddress(id: string): Promise<void> {
  return request(`${STORE}/customers/me/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listCompanies(): Promise<{ data: Company[] }> {
  // Spree returns the buyer's company memberships, each with the company nested.
  const result = await request<{ data: ({ company: Company } & Partial<Company>)[] }>(`${STORE}/account/companies`);
  return { data: result.data.map((membership) => membership.company ?? (membership as unknown as Company)) };
}
export async function getCompany(id: string): Promise<Company> { return request(`${STORE}/companies/${encodeURIComponent(id)}`); }

/* -------------------------------------------------------------- wishlist */

export async function listWishlists(): Promise<Paginated<Wishlist>> {
  return request(`${STORE}/wishlists?expand=items`);
}
export async function ensureDefaultWishlist(): Promise<Wishlist> {
  const existing = await listWishlists();
  const fallback = existing.data.find((list) => list.is_default) || existing.data[0];
  if (fallback) return fallback;
  return request(`${STORE}/wishlists`, { method: "POST", body: { name: "Empire", is_default: true } });
}
export async function addWishlistItem(wishlistId: string, variantId: string, quantity = 1): Promise<Wishlist> {
  return request(`${STORE}/wishlists/${encodeURIComponent(wishlistId)}/items`, {
    method: "POST", body: { variant_id: variantId, quantity },
  });
}
export async function removeWishlistItem(wishlistId: string, itemId: string): Promise<Wishlist> {
  return request(`${STORE}/wishlists/${encodeURIComponent(wishlistId)}/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------- RFQ */

export async function listProvinces(): Promise<{ data: Province[] }> { return request(`${STORE}/empire/provinces`, { revalidate: REFERENCE_REVALIDATE }); }
export async function listRfqs(): Promise<{ data: Rfq[] }> { return request(`${STORE}/empire/rfqs`); }
export async function getRfq(id: number): Promise<Rfq> { return request(`${STORE}/empire/rfqs/${id}`); }
export async function createRfq(attributes: {
  title: string; description?: string; requested_quantity: number; company_id?: string;
  variant_id?: string; budget_min?: string; budget_max?: string; seller_id?: string;
}): Promise<Rfq> {
  return request(`${STORE}/empire/rfqs`, { method: "POST", body: attributes });
}
export async function acceptQuote(rfqId: number, quoteId: number): Promise<Rfq> {
  return request(`${STORE}/empire/rfqs/${rfqId}/quotes/${quoteId}/accept`, { method: "POST" });
}
/** Seller application payload.
 *
 * Every field here is in the API's permit list
 * (`app/controllers/api/v3/store/empire/seller_applications_controller.rb`), so
 * the storefront can collect a complete application in one step instead of
 * asking a merchant to finish their profile somewhere else. `categories` is an
 * array of names and is submitted with Rails' indexed form (`categories[]`). */
export type SellerApplicationInput = {
  shop_name: string;
  name?: string;
  email: string;
  password: string;
  password_confirmation: string;
  registration_number?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  categories?: string[];
};

export async function applySeller(attributes: SellerApplicationInput): Promise<{ id: string; status: string }> {
  return request(`${STORE}/empire/seller_applications`, { method: "POST", body: attributes, noAuth: true });
}

/* -------------------------------------------------------------- helpers */

/** Absolute media URLs from Rails are rewritten to same-origin `/rails/...` so
 * the browser never needs to know where the backend lives. */
export function sameOriginMedia(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "http://empire.invalid");
    return url.pathname.startsWith("/rails/") ? `${url.pathname}${url.search}` : value;
  } catch { return null; }
}

/** Best available image for a product, largest first when it is a hero. */
export function productImage(product: Product, size: "thumb" | "card" | "hero" = "card"): string | null {
  const media = product.media?.length ? product.media : undefined;
  const primary = product.primary_media ?? media?.[0];
  if (primary) {
    const pick = size === "thumb" ? primary.small_url || primary.mini_url
      : size === "hero" ? primary.xlarge_url || primary.large_url || primary.original_url
        : primary.large_url || primary.medium_url || primary.original_url;
    const resolved = sameOriginMedia(pick);
    if (resolved) return resolved;
  }
  return sameOriginMedia(product.thumbnail_url);
}

export function variantImage(variant: Variant | undefined | null, fallback: string | null): string | null {
  if (!variant) return fallback;
  const media = variant.media?.[0];
  return sameOriginMedia(media?.large_url || media?.medium_url || media?.original_url || variant.thumbnail_url) ?? fallback;
}

export function isWholesale(product: Product): boolean {
  const variants = product.variants?.length ? product.variants : product.default_variant ? [product.default_variant] : [];
  return variants.some((variant) => (variant.minimum_order_quantity ?? 1) > 1 || (variant.units_per_carton ?? 0) > 1);
}

export function isOnOffer(product: Product): boolean {
  const compare = product.original_price?.compare_at_amount ?? product.price?.compare_at_amount ?? null;
  const amount = product.price?.amount ?? null;
  return Boolean(compare && amount && Number(compare) > Number(amount));
}
