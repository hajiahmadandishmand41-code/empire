import { test, expect } from "@playwright/test";

const buyerEmail = process.env.DEMO_BUYER_EMAIL || "demo.buyer@empire.test";
const buyerPassword = process.env.DEMO_BUYER_PASSWORD || "DemoBuyer123!";

test("home displays products fetched from the real Backend", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "با خیال آسوده از Empire خرید کنید" })).toBeVisible();
  await expect(page.getByTestId("product-card").first()).toBeVisible();
  await expect(page.getByTestId("api-error")).toHaveCount(0);
  await expect(page.getByTestId("product-card").filter({ hasText: "سبد دست‌باف نمایشی Empire" })).toBeVisible();
});

test("language selection changes direction and survives a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByLabel("زبان", { exact: true }).selectOption("en");
  await expect(page.getByRole("heading", { name: "Shop with confidence on Empire" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Shop with confidence on Empire" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("product details open from the Backend catalog", async ({ page }) => {
  // TEMPORARY DIAGNOSTIC — remove once the transient duplicate card is explained.
  // Established so far: right after goto the catalog holds FOUR product-links and
  // settles to two within 300ms, with no console message at all. Waiting out that
  // window makes the click succeed, so the failure is a transient duplicate, not
  // wrong data. What is still unknown is WHERE the two extra links live, which
  // decides whether this is our markup or the router's streaming buffer. So this
  // samples every 150ms and, for the first two samples that still show more than
  // two links, records each link's ancestor chain (flagging hidden ancestors), the
  // hidden/template containers in the document, and body's direct children.
  const probe = () =>
    page.evaluate(() => {
      const describe = (node: Element) => {
        const chain: string[] = [];
        let current: Element | null = node;
        for (let depth = 0; depth < 6 && current; depth += 1) {
          const testId = current.getAttribute("data-testid");
          const hidden = current.hasAttribute("hidden") || current.getAttribute("aria-hidden") === "true";
          chain.push(`${current.tagName}${testId ? `[${testId}]` : ""}${hidden ? "{hidden}" : ""}`);
          current = current.parentElement;
        }
        return chain.join("<");
      };
      const links = Array.from(document.querySelectorAll('[data-testid="product-link"]'));
      const hiddenContainers = Array.from(document.querySelectorAll("body [hidden], body template")).map(
        (element) => `${element.tagName}#${element.id}[${String(element.className).slice(0, 24)}]`,
      );
      return {
        n: links.length,
        mains: document.querySelectorAll("main").length,
        bodyChildren: Array.from(document.body.children).map(
          (element) => `${element.tagName}#${element.id}${element.hasAttribute("hidden") ? "{hidden}" : ""}`,
        ),
        hiddenContainers,
        rows: links.map((node) => `${node.getAttribute("href")} :: ${describe(node)}`),
      };
    });

  await page.goto("/products");
  const timeline: string[] = [];
  let detailed = 0;
  for (let step = 0; step < 8; step += 1) {
    const sample = await probe();
    timeline.push(`t+${step * 150}ms n=${sample.n} mains=${sample.mains}`);
    if (sample.n > 2 && detailed < 2) {
      detailed += 1;
      timeline.push(`  bodyChildren: ${sample.bodyChildren.join(" ")}`);
      timeline.push(`  hiddenContainers: ${sample.hiddenContainers.join(" ") || "none"}`);
      timeline.push(...sample.rows.map((row, index) => `  #${index} ${row}`));
    }
    await page.waitForTimeout(150);
  }

  const report = timeline.join("\n");
  expect(report, `DIAGNOSTIC\n${report}`).toBe("__diagnostic__");
});

test("add, increase, decrease and remove use persisted cart API operations", async ({ page }) => {
  await page.goto("/products/empire-demo-handmade-basket");
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByTestId("add-to-cart")).toHaveText("به سبد خرید اضافه شد");
  await page.goto("/cart");
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
  await expect(page.getByTestId("item-quantity")).toHaveText("1");
  await page.getByRole("button", { name: "افزایش تعداد" }).click();
  await expect(page.getByTestId("item-quantity")).toHaveText("2");
  await page.getByRole("button", { name: "کاهش تعداد" }).click();
  await expect(page.getByTestId("item-quantity")).toHaveText("1");
  await page.getByTestId("remove-item").click();
  await expect(page.getByText("سبد خرید شما خالی است", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("سبد خرید شما خالی است", { exact: true })).toBeVisible();
});

test("demo buyer signs in through the Store API", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("ایمیل", { exact: true }).fill(buyerEmail);
  await page.getByLabel("رمز عبور", { exact: true }).fill(buyerPassword);
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText(buyerEmail, { exact: true })).toBeVisible();
});

test("buyer places a COD order with a real address and delivery rate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("ایمیل", { exact: true }).fill(buyerEmail);
  await page.getByLabel("رمز عبور", { exact: true }).fill(buyerPassword);
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.goto("/products/empire-demo-handmade-basket");
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByTestId("add-to-cart")).toHaveText("به سبد خرید اضافه شد");
  await page.goto("/checkout");
  await page.getByLabel("نام", { exact: true }).fill("خریدار");
  await page.getByLabel("نام خانوادگی", { exact: true }).fill("نمایشی");
  await page.getByLabel("تلفن تماس (+۹۳)", { exact: true }).fill("+93700123456");
  await page.getByLabel("ولایت", { exact: true }).selectOption("کابل");
  await page.getByLabel("ولسوالی", { exact: true }).selectOption("کابل");
  await page.getByLabel("شهر", { exact: true }).fill("کابل");
  await page.getByLabel("نشانی کوچه و خیابان", { exact: true }).fill("کوچه آزمایشی Empire، خانه ۱");
  await page.getByRole("button", { name: "ذخیره", exact: true }).click();
  const delivery = page.getByLabel("شیوه ارسال", { exact: true }).first();
  await expect(delivery).toBeVisible();
  await delivery.selectOption({ index: 1 });
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.getByRole("radio").first().check();
  await page.getByTestId("place-order").click();
  await expect(page.getByTestId("order-success")).toBeVisible();
  await expect(page.getByTestId("api-error")).toHaveCount(0);
});
