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
