/**
 * Empire Storefront — Spree Store API v3 client
 *
 * Connects to the Spree backend (`server/`) Store API. All product, variant,
 * cart, order, checkout, country/state and address data is fetched from the
 * real API — no mocks.
 *
 * Configuration:
 *   NEXT_PUBLIC_API_URL  base URL of the Spree backend (default http://localhost:3000)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type JsonMap = Record<string, unknown>;

export class SpreeApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "SpreeApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(opts.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    let errors: Record<string, string[]> | undefined;
    try {
      const body = (await res.json()) as JsonMap;
      message = (body.error ?? body.errors ?? message) as string;
      errors = body.errors as Record<string, string[]> | undefined;
    } catch {
      // ignore parse errors
    }
    throw new SpreeApiError(res.status, message, errors);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function del(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* Store API v3 resources                                             */
/* ------------------------------------------------------------------ */

export async function listStores() {
  return get<{ data: JsonMap[] }>("/api/v3/store/stores");
}

export interface ProductFilters {
  q?: Record<string, unknown>;
  page?: number;
  per_page?: number;
  taxon_id?: number;
}

export async function listProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) {
    Object.entries(filters.q).forEach(([k, v]) => params.append(`q[${k}]`, String(v)));
  }
  if (filters.page) params.append("page", String(filters.page));
  if (filters.per_page) params.append("per_page", String(filters.per_page));
  if (filters.taxon_id) params.append("taxon_id", String(filters.taxon_id));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return get<{ data: JsonMap[]; meta: JsonMap }>(`/api/v3/store/products${qs}`);
}

export async function getProduct(id: string | number) {
  return get<{ data: JsonMap }>(`/api/v3/store/products/${id}`);
}

export async function listTaxonomies() {
  return get<{ data: JsonMap[] }>("/api/v3/store/taxonomies");
}

export async function getTaxonomy(id: string | number) {
  return get<{ data: JsonMap }>(`/api/v3/store/taxonomies/${id}`);
}

export async function listCountries() {
  return get<{ data: JsonMap[] }>("/api/v3/store/countries");
}

export interface CartLineItem {
  variant_id: number;
  quantity: number;
}

export async function getCart() {
  return get<{ data: JsonMap }>("/api/v3/store/orders");
}

export async function addToCart(item: CartLineItem) {
  return post("/api/v3/store/orders/line_items", item);
}

export async function updateCartLineItem(lineItemId: string, quantity: number) {
  return patch(`/api/v3/store/orders/line_items/${lineItemId}`, { quantity });
}

export async function removeCartLineItem(lineItemId: string) {
  return del(`/api/v3/store/orders/line_items/${lineItemId}`);
}

export async function checkoutOrder(orderId: string) {
  return post(`/api/v3/store/orders/${orderId}/checkout`, {});
}

export async function listAddresses() {
  return get<{ data: JsonMap[] }>("/api/v3/store/addresses");
}

export async function createAddress(address: unknown) {
  return post("/api/v3/store/addresses", address);
}

export async function listPaymentMethods() {
  return get<{ data: JsonMap[] }>("/api/v3/store/payment_methods");
}

export async function listShippingMethods() {
  return get<{ data: JsonMap[] }>("/api/v3/store/shipments");
}

const api = { get, post, patch, del };
export default api;
