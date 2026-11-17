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
  await page.goto("/products");
  // TEMPORARY DIAGNOSTIC — remove once the duplicated catalog card is explained.
  // The server-rendered HTML has exactly two cards with distinct hrefs, yet this
  // locator resolves to two links for the demo product alone, so the extra link
  // appears in the browser and not in the markup. This dumps what the DOM really
  // holds: counts, each link's href, its text, and its ancestor chain, which says
  // which part of the page each one belongs to. The assertion is meant to fail;
  // the failure annotation is how the dump reaches us.
  const dump = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('[data-testid="product-link"]'));
    const cards = document.querySelectorAll('[data-testid="product-card"]').length;
    const mains = document.querySelectorAll("main").length;
    const rows = links.map((element, index) => {
      const node = element as HTMLElement;
      const chain: string[] = [];
      let parent = node.parentElement;
      for (let depth = 0; depth < 7 && parent; depth += 1) {
        const testId = parent.getAttribute("data-testid");
        const classes = String(parent.className).trim().split(/\s+/).slice(0, 2).join(".");
        chain.push(parent.tagName + (testId ? `[${testId}]` : "") + (classes ? `.${classes}` : ""));
        parent = parent.parentElement;
      }
      const text = (node.textContent ?? "").replace(/\s+/g, " ").slice(0, 60);
      return `#${index} href=${node.getAttribute("href")} text="${text}" chain=${chain.join(" < ")}`;
    });
    return `TOTAL_LINKS=${links.length} CARDS=${cards} MAINS=${mains} URL=${location.href}\n${rows.join("\n")}`;
  });
  expect(dump, `DIAGNOSTIC catalog DOM\n${dump}`).toBe("__diagnostic__");
  await page.getByTestId("product-link").filter({ hasText: "سبد دست‌باف نمایشی Empire" }).click();
  await expect(page).toHaveURL(/\/products\/empire-demo-handmade-basket/);
  await expect(page.getByTestId("product-title")).toHaveText("سبد دست‌باف نمایشی Empire");
  await expect(page.getByTestId("product-price")).toContainText("۱٬۲۰");
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
