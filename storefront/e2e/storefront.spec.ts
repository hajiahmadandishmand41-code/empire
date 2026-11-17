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
  // TEMPORARY DIAGNOSTIC — remove once the duplicated catalog card is explained.
  // Right after goto the DOM holds two links and only one matches the demo name,
  // yet the click below has resolved to two matching links and a third overall.
  // So a card appears later. This records when: a count timeline, the console
  // (React hydration mismatches are logged there), and the DOM again after the
  // click has failed. The final assertion is meant to fail — the annotation step
  // is the only way to read any of it, since runner logs are not retrievable.
  const logs: string[] = [];
  page.on("console", (message) => logs.push(`${message.type()}: ${message.text().slice(0, 180)}`));
  page.on("pageerror", (error) => logs.push(`pageerror: ${String(error).slice(0, 180)}`));

  const probe = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="product-link"]')).map((element) => {
        const node = element as HTMLElement;
        const chain: string[] = [];
        let parent = node.parentElement;
        for (let depth = 0; depth < 5 && parent; depth += 1) {
          const testId = parent.getAttribute("data-testid");
          chain.push(parent.tagName + (testId ? `[${testId}]` : ""));
          parent = parent.parentElement;
        }
        const text = (node.textContent ?? "").replace(/\s+/g, " ").slice(0, 42);
        return `${node.getAttribute("href")} :: ${text} :: ${chain.join("<")}`;
      }),
    );

  await page.goto("/products");
  const timeline: string[] = [];
  for (let step = 0; step < 10; step += 1) {
    const links = await probe();
    timeline.push(`t+${step * 300}ms n=${links.length}`);
    if (step === 9) timeline.push(...links.map((row, index) => `  #${index} ${row}`));
    await page.waitForTimeout(300);
  }

  let clickOutcome = "CLICK OK";
  try {
    await page
      .getByTestId("product-link")
      .filter({ hasText: "سبد دست‌باف نمایشی Empire" })
      .click({ timeout: 5000 });
  } catch (cause) {
    clickOutcome = `CLICK FAILED: ${String(cause).split("\n").slice(0, 4).join(" | ")}`;
    const after = await probe();
    timeline.push(`after-failed-click n=${after.length}`, ...after.map((row, index) => `  #${index} ${row}`));
  }

  const report = `${clickOutcome}\nTIMELINE\n${timeline.join("\n")}\nCONSOLE ${logs.length}\n${logs.slice(0, 10).join("\n")}`;
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
