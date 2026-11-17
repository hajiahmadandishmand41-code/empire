import type { Page } from "@playwright/test";

/**
 * True once no hidden container in the document holds rendered markup.
 *
 * Nothing in this storefront sets the `hidden` attribute — decorative elements use
 * `aria-hidden` and responsive hiding uses Tailwind classes — so every hidden
 * container in the document is one of React's streaming buffers, and "empty" is a
 * permanent state rather than a lucky one.
 *
 * Deliberately not keyed to `[data-testid]`. The first version was, and the login
 * page has no test ids at all, so the wait returned immediately while a buffered
 * copy of the form was still in the document and `getByLabel("ایمیل")` resolved
 * twice. Buffer content has to be ruled out whatever a locator happens to match
 * on: test id, label, role or text.
 */
function settled(): boolean {
  return Array.from(document.querySelectorAll("body div[hidden]")).every(
    (container) => container.firstElementChild === null && (container.textContent ?? "").trim() === "",
  );
}

/**
 * Waits for a streamed server render to finish settling.
 *
 * The catalog, product and home routes are Server Components that fetch from the
 * Backend, so their HTML streams: React parks each finished segment in a hidden
 * container (`<div hidden id="S:0">`) and discards it shortly after load.
 *
 * That window is measurable and brief. On `/products`, immediately after the load
 * event the document held four `product-link` elements — the two real cards plus
 * two inert copies inside that hidden container — and settled on two within
 * 150ms, with no console output and no hydration mismatch. A shopper never sees
 * the copies: they are `display: none`, unfocusable and absent from the
 * accessibility tree.
 *
 * `getByTestId` counts hidden elements, so a locator used straight after a
 * navigation can resolve twice and fail strict mode over markup nobody can see.
 * `getByRole` ignores it, which is why role- and heading-based assertions never
 * tripped on the same pages.
 *
 * Waiting here rather than at each locator keeps every assertion in these specs
 * describing what is actually on screen, and does not depend on React's internal
 * segment ids — only on the rule that inert markup is hidden.
 *
 * The same race reached the login form: two identical email inputs, both inert
 * copies of one field. Waiting for the buffers to empty covers it, and covers the
 * client pages too, whose streamed HTML is buffered the same way.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForFunction(settled, undefined, { timeout: 10_000 });
}

/** Navigates, then waits for the streamed render to settle. See {@link settle}. */
export async function goto(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await settle(page);
}
