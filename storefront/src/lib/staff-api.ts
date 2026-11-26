/** Empire staff/seller extension client. Core contracts: docs/api/spree-6.0.4.
 * Admin and seller JWTs are kept separate. Refresh uses the HttpOnly cookie
 * set by the matching Spree auth controller through the same-origin proxy.
 */
export type StaffAudience = "admin" | "seller";
export interface StaffSeller { id: string; name: string; status: string }
export interface StaffLogin { token: string; user: { id: string; email: string }; sellers?: StaffSeller[] }
export interface PayoutRequest { id: number; seller_id: string; status: string; currency: string; note?: string | null; payout_id: string | null; created_at?: string; reviewed_at?: string | null }
export interface SellerBalance { currency: string; balance: string; earned?: string; pending?: string; paid?: string }
const SELLER_KEY = "empire.seller.v1";
const tokens: Record<StaffAudience, string | null> = { admin: null, seller: null };
const base = (audience: StaffAudience) => `/api/v3/${audience}`;
function baseUrl() { return typeof window === "undefined" ? (process.env.API_INTERNAL_URL || "http://127.0.0.1:3000") : ""; }
export function selectedSeller(): string | null { return typeof window === "undefined" ? null : sessionStorage.getItem(SELLER_KEY); }
export function selectSeller(id: string) { sessionStorage.setItem(SELLER_KEY, id); }
export function staffSignedIn(audience: StaffAudience) { return Boolean(tokens[audience]); }
export function clearStaff(audience: StaffAudience) { tokens[audience] = null; if (audience === "seller") sessionStorage.removeItem(SELLER_KEY); }
async function raw<T>(audience: StaffAudience, path: string, options: { method?: string; body?: unknown; noAuth?: boolean; noRetry?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (!options.noAuth && tokens[audience]) headers.Authorization = `Bearer ${tokens[audience]}`;
  if (audience === "seller" && selectedSeller()) headers["X-Spree-Seller-Id"] = selectedSeller()!;
  const response = await fetch(`${baseUrl()}${base(audience)}${path}`, { method: options.method || "GET", headers, credentials: "same-origin", body: options.body === undefined ? undefined : JSON.stringify(options.body), cache: "no-store" });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try { const body = await response.json() as { error?: { message?: string } | string; message?: string }; message = typeof body.error === "object" ? body.error?.message || message : typeof body.error === "string" ? body.error : body.message || message; } catch { /* keep status */ }
    throw Object.assign(new Error(message), { status: response.status });
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}
async function request<T>(audience: StaffAudience, path: string, options: { method?: string; body?: unknown; noAuth?: boolean; noRetry?: boolean } = {}): Promise<T> {
  try { return await raw<T>(audience, path, options); }
  catch (error) {
    if ((error as { status?: number }).status !== 401 || options.noAuth || options.noRetry) throw error;
    const refreshed = await raw<{ token: string }>(audience, "/auth/refresh", { method: "POST", noAuth: true, noRetry: true });
    tokens[audience] = refreshed.token;
    return raw<T>(audience, path, { ...options, noRetry: true });
  }
}
export async function staffLogin(audience: StaffAudience, email: string, password: string): Promise<StaffLogin> {
  const result = await raw<StaffLogin>(audience, "/auth/login", { method: "POST", body: { email, password }, noAuth: true });
  tokens[audience] = result.token;
  if (audience === "seller") {
    const seller = result.sellers?.[0];
    if (!seller) { clearStaff("seller"); throw new Error("seller_membership_required"); }
    selectSeller(seller.id);
  }
  return result;
}
export async function staffLogout(audience: StaffAudience) { await raw(audience, "/auth/logout", { method: "POST", noAuth: true }); clearStaff(audience); }
export async function sellerMemberships(): Promise<StaffSeller[]> { return (await request<{ sellers: StaffSeller[] }>("seller", "/me")).sellers; }
export async function listPayoutRequests(audience: StaffAudience): Promise<PayoutRequest[]> { return (await request<{ data: PayoutRequest[] }>(audience, "/empire/payout_requests")).data; }
export async function createPayoutRequest(note: string): Promise<PayoutRequest> { return request<PayoutRequest>("seller", "/empire/payout_requests", { method: "POST", body: { note } }); }
export async function reviewPayoutRequest(id: number, approve: boolean, reason?: string): Promise<PayoutRequest> { return request<PayoutRequest>("admin", `/empire/payout_requests/${id}/${approve ? "approve" : "reject"}`, { method: "PATCH", body: { reason } }); }
export async function listSellerBalances(): Promise<SellerBalance[]> { return (await request<{ data: SellerBalance[] }>("seller", "/balances")).data; }

/* ------------------------------------------------------------------- RFQ */

export interface SellerQuote {
  id: number;
  amount: string;
  quantity: number | null;
  unit: string | null;
  currency: string;
  status: string;
  notes: string | null;
  valid_until: string | null;
  total: string | null;
  editable: boolean;
  created_at?: string;
  responded_at?: string | null;
}

export interface SellerRfq {
  id: number;
  title: string;
  description: string | null;
  status: string;
  quoteable: boolean;
  requested_quantity: number;
  unit: string | null;
  currency: string;
  budget_min: string | null;
  budget_max: string | null;
  expires_at: string | null;
  status_reason: string | null;
  created_at?: string;
  buyer_name: string;
  company_name: string | null;
  product_name: string | null;
  product_sku: string | null;
  my_quote: SellerQuote | null;
  my_quotes?: SellerQuote[];
  quote_count?: number;
}

export interface QuoteInput {
  amount?: string;
  quantity?: number;
  notes?: string;
  valid_until?: string | null;
}

/** The seller's RFQ desk. The Backend scopes both calls to `current_seller`:
 * the list excludes requests addressed to another seller and the detail
 * contains only this seller's own offer. */
export async function listSellerRfqs(): Promise<SellerRfq[]> {
  return (await request<{ data: SellerRfq[] }>("seller", "/empire/rfqs")).data;
}

export async function getSellerRfq(id: number): Promise<SellerRfq> {
  return request<SellerRfq>("seller", `/empire/rfqs/${id}`);
}

export async function createSellerQuote(rfqId: number, input: QuoteInput): Promise<SellerQuote> {
  return request<SellerQuote>("seller", "/empire/quotes", { method: "POST", body: { rfq_id: rfqId, ...input } });
}

export async function sellerQuoteAction(
  action: "update" | "withdraw", quoteId: number, input?: QuoteInput,
): Promise<SellerQuote> {
  return request<SellerQuote>("seller", `/empire/quotes/${quoteId}${action === "withdraw" ? "/withdraw" : ""}`, {
    method: "PATCH",
    body: action === "withdraw" ? undefined : input,
  });
}

export interface AdminRfqQuote {
  id: number;
  seller_id: string | null;
  seller_name: string | null;
  amount: string;
  quantity: number | null;
  unit: string | null;
  currency: string;
  status: string;
  notes: string | null;
  valid_until: string | null;
  total: string | null;
  created_at?: string;
}

export interface AdminRfqEvent {
  id: number;
  event: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  quote_id: number | null;
  actor: string | null;
  created_at?: string;
}

export interface AdminRfq {
  id: number;
  title: string;
  description: string | null;
  status: string;
  quoteable: boolean;
  requested_quantity: number;
  unit: string | null;
  currency: string;
  budget_min: string | null;
  budget_max: string | null;
  customer_name: string | null;
  company_name: string | null;
  product_name: string | null;
  seller_name: string | null;
  expires_at: string | null;
  closed_at: string | null;
  status_reason: string | null;
  quote_count: number;
  created_at?: string;
  quotes?: AdminRfqQuote[];
  events?: AdminRfqEvent[];
}

export async function listAdminRfqs(status?: string): Promise<AdminRfq[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (await request<{ data: AdminRfq[] }>("admin", `/empire/rfqs${query}`)).data;
}

export async function getAdminRfq(id: number): Promise<AdminRfq> {
  return request<AdminRfq>("admin", `/empire/rfqs/${id}`);
}

export async function adminRfqAction(
  id: number, action: "close" | "cancel" | "reopen", reason?: string,
): Promise<AdminRfq> {
  return request<AdminRfq>("admin", `/empire/rfqs/${id}/${action}`, {
    method: "PATCH", body: action === "reopen" ? undefined : { reason },
  });
}

export async function rejectAdminQuote(rfqId: number, quoteId: number, reason?: string): Promise<AdminRfq> {
  return request<AdminRfq>("admin", `/empire/rfqs/${rfqId}/quotes/${quoteId}/reject`, {
    method: "PATCH", body: { reason },
  });
}

export interface SellerApplication {
  id: number;
  shop_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  registration_number: string | null;
  categories: string[];
  status: string;
  seller_id: string | null;
  created_at?: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export async function listSellerApplications(status?: string): Promise<SellerApplication[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (await request<{ data: SellerApplication[] }>("admin", `/empire/seller_applications${query}`)).data;
}

export async function reviewSellerApplication(
  id: number, decision: "approve" | "reject", reason?: string,
): Promise<SellerApplication> {
  return request<SellerApplication>("admin", `/empire/seller_applications/${id}/${decision}`, {
    method: "PATCH",
    body: decision === "approve" ? { override_requirements: true } : { reason },
  });
}
