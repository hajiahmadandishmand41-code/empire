/* eslint-disable @typescript-eslint/no-explicit-any -- E2E asserts dynamic HTTP payloads from the real Spree API. */
import { test, expect } from "@playwright/test";

const api = process.env.API_BASE_URL || "http://127.0.0.1:3000";
const key = process.env.SPREE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY || "";
const run = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function call(method: string, path: string, options: { token?: string; seller?: string; cartToken?: string; body?: unknown; status?: number } = {}): Promise<any> {
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json", "X-Spree-Api-Key": key };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.seller) headers["X-Spree-Seller-Id"] = options.seller;
  if (options.cartToken) headers["X-Spree-Token"] = options.cartToken;
  const response = await fetch(`${api}${path}`, { method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: AbortSignal.timeout(20000) });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (response.status !== (options.status ?? 200)) throw new Error(`${method} ${path}: expected ${options.status ?? 200}, got ${response.status}: ${text.slice(0, 1200)}`);
  return body;
}
const store = (method: string, path: string, options: Parameters<typeof call>[2] = {}) => call(method, `/api/v3/store${path}`, options);
const admin = (method: string, path: string, token: string, body?: unknown, status = 200) => call(method, `/api/v3/admin${path}`, { token, body, status });
const seller = (method: string, path: string, token: string, sellerId: string, body?: unknown, status = 200) => call(method, `/api/v3/seller${path}`, { token, seller: sellerId, body, status });

const address = { first_name: "خریدار", last_name: "نمایشی", address1: "کوچه آزمایشی Empire، خانه ۱", address2: "کابل", city: "کابل", state_name: "کابل", country_code: "AF", phone: "+93700123456", postal_code: "" };

test("full marketplace and B2B journey against the live Backend", async () => {
  test.setTimeout(240000);
  expect(key).toBeTruthy();
  const adminLogin = await admin("POST", "/auth/login", "", { email: process.env.ADMIN_EMAIL || "admin@empire.test", password: process.env.ADMIN_PASSWORD || "DemoAdmin123!" });
  const adminToken = adminLogin.token as string;
  expect(adminToken).toBeTruthy();

  // Seller applies with a complete form, only staff approves.
  const sellerEmail = `journey.seller.${run}@empire.test`;
  const application = await store("POST", "/empire/seller_applications", { body: { email: sellerEmail, password: "JourneySeller123!", password_confirmation: "JourneySeller123!", shop_name: `Empire Journey ${run}`, name: "احمد کریمی", phone: "0700 123 456", city: "کابل", address: "سرک ۱۵، ناحیه ۴", description: "فروشنده عمده پارچه", categories: ["پارچه", "پوشاک"], registration_number: `REG-${run}` }, status: 201 });
  expect(application.status).not.toBe("approved");
  // The reviewer must see what the applicant typed — the defect this replaced
  // stored only the shop name.
  const reviewQueue = await admin("GET", "/empire/seller_applications?status=pending", adminToken);
  const queued = reviewQueue.data.find((row: any) => row.id === application.id);
  expect(queued).toBeTruthy();
  expect(queued.phone).toBe("+93700123456");
  expect(queued.city).toBe("کابل");
  expect(queued.categories).toEqual(["پارچه", "پوشاک"]);
  expect(queued.description).toBe("فروشنده عمده پارچه");
  // Approval runs Spree's own workflow against the seller the application made,
  // which is why the seller id — not the application id — is what it takes.
  const approved = await admin("PATCH", `/empire/seller_applications/${application.id}/approve`, adminToken, { override_requirements: true });
  expect(approved.status).toBe("approved");
  expect(approved.seller_id).toBeTruthy();
  const sellerLogin = await seller("POST", "/auth/login", "", "", { email: sellerEmail, password: "JourneySeller123!" });
  const sellerToken = sellerLogin.token as string;
  const sellerId = sellerLogin.sellers[0].id as string;
  const locations = await seller("GET", "/stock_locations", sellerToken, sellerId);
  const stockLocationId = locations.data[0].id as string;

  // Seller creates a product, submits it, staff publishes it.
  const slug = `empire-journey-${run}`;
  const product = await seller("POST", "/products", sellerToken, sellerId, { name: `Empire journey basket ${run}`, slug, description: "کالای آزمایشی برای سفر خرید واقعی", variants: [{ sku: `JOURNEY-${run}`, prices: [{ currency: "AFN", amount: "1000.00" }], stock_levels: [{ stock_location_id: stockLocationId, count_on_hand: 100 }] }] }, 201);
  await seller("PATCH", `/products/${product.id}/submit`, sellerToken, sellerId);
  await admin("PATCH", `/products/${product.id}/approve`, adminToken);
  // Spree 6 visibility is per-channel; publish the approved product to the default channel.
  const channels = await admin("GET", "/channels", adminToken);
  const channel = channels.data.find((row: any) => row.default) || channels.data[0];
  const published = await admin("POST", `/channels/${channel.id}/add_products`, adminToken, { product_ids: [product.id] });
  expect(published.product_count).toBe(1);
  const liveProduct = await store("GET", `/products/${slug}?expand=variants,seller`);
  expect(liveProduct.available).toBe(true);
  expect(liveProduct.purchasable).toBe(true);
  const variantId = liveProduct.default_variant_id as string;

  // Buyer registers, builds a cart, checks out with COD.
  const buyerEmail = `journey.buyer.${run}@empire.test`;
  const buyer = await store("POST", "/customers", { body: { email: buyerEmail, password: "JourneyBuyer123!", password_confirmation: "JourneyBuyer123!", first_name: "خریدار", last_name: "نمایشی" }, status: 201 });
  const buyerToken = buyer.token as string;
  let cart = await store("POST", "/carts", { token: buyerToken, body: {}, status: 201 });
  const cartToken = cart.token as string;
  cart = await store("POST", `/carts/${cart.id}/items`, { token: buyerToken, cartToken, body: { variant_id: variantId, quantity: 1 }, status: 201 });
  cart = await store("PATCH", `/carts/${cart.id}`, { token: buyerToken, cartToken, body: { email: buyerEmail, shipping_address: address, use_shipping: true } });
  cart = await store("GET", `/carts/${cart.id}`, { token: buyerToken, cartToken });
  expect(cart.fulfillments.length).toBeGreaterThan(0);
  const fulfillment = cart.fulfillments[0];
  expect(fulfillment.delivery_rates.length).toBeGreaterThan(0);
  cart = await store("PATCH", `/carts/${cart.id}/fulfillments/${fulfillment.id}`, { token: buyerToken, cartToken, body: { selected_delivery_rate_id: fulfillment.delivery_rates[0].id } });
  const cod = cart.payment_methods.find((method: any) => /CashOnDelivery|cash_on_delivery|پرداخت هنگام تحویل/.test(`${method.type} ${method.name}`));
  expect(cod).toBeTruthy();
  await store("POST", `/carts/${cart.id}/payments`, { token: buyerToken, cartToken, body: { payment_method_id: cod.id }, status: 201 });
  const purchase = await store("POST", `/carts/${cart.id}/complete`, { token: buyerToken, cartToken });
  const order = purchase.orders?.[0] || purchase;
  expect(order.id).toBeTruthy();
  expect(order.payment_status).toBe("authorized"); // COD is recorded as pending collection, never captured at checkout.

  // Seller sees only their assigned order; staff captures COD and fulfils.
  const sellerOrders = await seller("GET", "/orders", sellerToken, sellerId);
  expect(sellerOrders.data.map((row: any) => row.id)).toContain(order.id);
  const payments = await admin("GET", `/orders/${order.id}/payments`, adminToken);
  await admin("PATCH", `/orders/${order.id}/payments/${payments.data[0].id}/capture`, adminToken, {});
  const fulfillments = await admin("GET", `/orders/${order.id}/fulfillments`, adminToken);
  await admin("PATCH", `/orders/${order.id}/fulfillments/${fulfillments.data[0].id}/fulfill`, adminToken, { notify_customer: false });
  const adminOrder = await admin("GET", `/orders/${order.id}`, adminToken);
  expect(adminOrder.payment_status).toBe("paid");
  expect(Number(adminOrder.commission_total)).toBeGreaterThan(0);

  // Native ledger credits the seller; seller requests review; only staff approves.
  await expect.poll(async () => {
    const balances = await seller("GET", "/balances", sellerToken, sellerId);
    return balances.data.some((balance: any) => Number(balance.balance) > 0);
  }, { timeout: 45000, intervals: [1000, 2000, 3000] }).toBe(true);
  const payoutRequest = await seller("POST", "/empire/payout_requests", sellerToken, sellerId, { note: "Journey settlement review" }, 201);
  expect(payoutRequest.status).toBe("requested");
  const review = await admin("PATCH", `/empire/payout_requests/${payoutRequest.id}/approve`, adminToken);
  expect(review.status).toBe("approved");
  expect(review.payout_id).toBeTruthy();
  await admin("PATCH", `/seller_payouts/${review.payout_id}/complete`, adminToken, {});
  await expect.poll(async () => {
    const balances = await seller("GET", "/balances", sellerToken, sellerId);
    return balances.data.every((balance: any) => Number(balance.balance) === 0);
  }, { timeout: 30000, intervals: [1000, 2000] }).toBe(true);

  // B2B: company, catalog, tiered price, MOQ and PO reference.
  const company = await admin("POST", "/companies", adminToken, { name: `Empire Journey Company ${run}`, kind: "company", po_number_required: true }, 201);
  await admin("POST", `/companies/${company.id}/memberships`, adminToken, { customer_id: buyer.user.id }, 201);
  const catalog = await admin("POST", "/catalogs", adminToken, { name: `Journey catalog ${run}`, active: true, minimum_order_quantity: 10, order_multiple: 5, assignments: [{ assignable_type: "company", assignable_id: company.id }], price_list: { name: `Journey prices ${run}`, status: "active", price_adjustment_percentage: "-10.0", price_adjustment_tiers: [{ min_quantity: 10, percentage: "-20.0" }] } }, 201);
  const curated = await admin("POST", `/catalogs/${catalog.id}/products`, adminToken, { product_ids: [product.id] }, 201);
  expect(curated.added_count).toBe(1);
  await admin("PUT", `/catalogs/${catalog.id}/quantity_rules`, adminToken, { terms: { [product.id]: { minimum_order_quantity: 10, order_multiple: 5 } } }, 204);
  let b2bCart = await store("POST", "/carts", { token: buyerToken, body: {}, status: 201 });
  const b2bToken = b2bCart.token as string;
  b2bCart = await store("PATCH", `/carts/${b2bCart.id}`, { token: buyerToken, cartToken: b2bToken, body: { company_id: company.id, po_number: `PO-${run}`, email: buyerEmail, shipping_address: address, use_shipping: true } });
  await store("POST", `/carts/${b2bCart.id}/items`, { token: buyerToken, cartToken: b2bToken, body: { variant_id: variantId, quantity: 1 }, status: 422 });
  b2bCart = await store("POST", `/carts/${b2bCart.id}/items`, { token: buyerToken, cartToken: b2bToken, body: { variant_id: variantId, quantity: 10 }, status: 201 });
  expect(b2bCart.company_id).toBe(company.id);
  expect(b2bCart.items[0].quantity).toBe(10);
  expect(Number(b2bCart.items[0].price)).toBeCloseTo(800, 2);
  // Complete the B2B purchase too: the PO reference and company must survive
  // onto the placed order, not merely live on an abandoned cart.
  b2bCart = await store("GET", `/carts/${b2bCart.id}`, { token: buyerToken, cartToken: b2bToken });
  const b2bFulfillment = b2bCart.fulfillments[0];
  expect(b2bFulfillment.delivery_rates.length).toBeGreaterThan(0);
  await store("PATCH", `/carts/${b2bCart.id}/fulfillments/${b2bFulfillment.id}`, { token: buyerToken, cartToken: b2bToken, body: { selected_delivery_rate_id: b2bFulfillment.delivery_rates[0].id } });
  const b2bCod = b2bCart.payment_methods.find((method: any) => /CashOnDelivery|cash_on_delivery|پرداخت هنگام تحویل/.test(`${method.type} ${method.name}`));
  expect(b2bCod).toBeTruthy();
  await store("POST", `/carts/${b2bCart.id}/payments`, { token: buyerToken, cartToken: b2bToken, body: { payment_method_id: b2bCod.id }, status: 201 });
  const b2bPurchase = await store("POST", `/carts/${b2bCart.id}/complete`, { token: buyerToken, cartToken: b2bToken });
  const b2bOrder = b2bPurchase.orders?.[0] || b2bPurchase;
  expect(b2bOrder.company_id).toBe(company.id);
  expect(b2bOrder.po_number).toBe(`PO-${run}`);
  expect(b2bOrder.total_quantity).toBe(10);
  expect(b2bOrder.payment_status).toBe("authorized");

  // Volume pricing: the ladder the buyer's own agreement grants, from Spree's
  // resolver. The cart is what identifies the company, so it is passed.
  const ladder = await store("GET", `/empire/variants/${variantId}/volume_pricing?quantity=10&cart_id=${b2bCart.id}`, { token: buyerToken });
  expect(ladder.currency).toBe("AFN");
  expect(ladder.price_list_applied).toBe(true);
  expect(ladder.resolved_amount).toBe("800.00");
  const bandAt10 = ladder.tiers.find((tier: any) => tier.min_quantity === 10);
  expect(bandAt10.amount).toBe("800.00");
  expect(ladder.tiers.every((tier: any) => /^\d+\.\d{2}$/.test(tier.amount))).toBe(true);

  // And a guest — no agreement — is told one price, not someone else's ladder.
  const guestLadder = await store("GET", `/empire/variants/${variantId}/volume_pricing?quantity=10`);
  expect(guestLadder.price_list_applied).toBe(false);
  expect(guestLadder.tiers).toEqual([]);
  expect(guestLadder.resolved_amount).toBe("1000.00");

  // RFQ: buyer requests, seller quotes, buyer accepts.
  const rfq = await store("POST", "/empire/rfqs", { token: buyerToken, body: { title: `Journey RFQ ${run}`, requested_quantity: 10, unit: "carton", company_id: company.id, variant_id: variantId, description: "درخواست قیمت عمده آزمایشی" }, status: 201 });
  // The unit is part of the request: "50" alone is not a specification.
  expect(rfq.unit).toBe("carton");
  expect(rfq.quoteable).toBe(true);

  // The buyer sees the negotiation history on their own request.
  const buyerView = await store("GET", `/empire/rfqs/${rfq.id}`, { token: buyerToken });
  expect(buyerView.events.map((row: any) => row.event)).toContain("created");

  // The seller's desk lists it — the endpoint that did not exist before, so a
  // seller could quote but never discover what they were allowed to quote on.
  const sellerDesk = await seller("GET", "/empire/rfqs", sellerToken, sellerId);
  expect(sellerDesk.data.map((row: any) => row.id)).toContain(rfq.id);
  const sellerView = await seller("GET", `/empire/rfqs/${rfq.id}`, sellerToken, sellerId);
  expect(sellerView.title).toBe(`Journey RFQ ${run}`);
  expect(sellerView.requested_quantity).toBe(10);

  const quote = await seller("POST", "/empire/quotes", sellerToken, sellerId, { rfq_id: rfq.id, amount: "900.00", notes: "Journey wholesale quote" }, 201);

  // Correct it, then read it back: a seller had no way to do either before.
  const corrected = await seller("PATCH", `/empire/quotes/${quote.id}`, sellerToken, sellerId, { amount: "880.00" });
  expect(corrected.amount).toBe("880.00");
  const ownQuote = await seller("GET", `/empire/quotes/${quote.id}`, sellerToken, sellerId);
  expect(ownQuote.amount).toBe("880.00");

  // Staff see both offers and the request history.
  const staffView = await admin("GET", `/empire/rfqs/${rfq.id}`, adminToken);
  expect(staffView.quotes.map((row: any) => row.id)).toContain(quote.id);
  expect(staffView.events.map((row: any) => row.event)).toEqual(expect.arrayContaining(["created", "quoted", "quote_updated"]));

  const accepted = await store("POST", `/empire/rfqs/${rfq.id}/quotes/${quote.id}/accept`, { token: buyerToken });
  expect(accepted.status).toBe("accepted");
  expect(accepted.quotes.find((row: any) => row.id === quote.id).status).toBe("accepted");

  // A closed negotiation is no longer quoteable, and the desk says so rather
  // than offering a form that cannot succeed.
  const afterAccept = await admin("GET", `/empire/rfqs/${rfq.id}`, adminToken);
  expect(afterAccept.quoteable).toBe(false);
  // The seller's desk no longer offers it, which is what makes the seller UI
  // honest about a request they can no longer act on.
  const deskAfter = await seller("GET", "/empire/rfqs", sellerToken, sellerId);
  expect(deskAfter.data.map((row: any) => row.id)).not.toContain(rfq.id);
  expect(afterAccept.events.map((row: any) => row.event)).toContain("accepted");
});
