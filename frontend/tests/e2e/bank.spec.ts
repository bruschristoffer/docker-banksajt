import { test, expect } from "@playwright/test";

test.describe("Banksajten E2E", () => {
  const generateUser = () => {
    return `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  test("1. Oinloggad besökare omdirigeras från skyddad sida", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto("/transactions");
    await expect(page).toHaveURL("/login");
  });

  test("2. Skapa användare, logga in och sätt in pengar", async ({ page }) => {
    const username = generateUser();
    const password = "testpassword";

    await page.goto("/register");
    await page.locator('input[type="text"]').fill(username);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /skapa/i }).click();

    await page.goto("/login");
    await page.locator('input[type="text"]').fill(username);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /logga in/i }).click();

    await expect(page).toHaveURL(/.*\/account/);
    await expect(page.getByText("0 kr")).toBeVisible();

    await page.locator("#amount").fill("500");
    await page.getByRole("button", { name: /sätt in pengar/i }).click();

    await expect(page.getByText("500 kr")).toBeVisible();

    await page.getByRole("link", { name: /transaktioner/i }).click();
    await expect(page).toHaveURL(/.*\/transactions/);

    await expect(page.getByText("500.00 kr")).toBeVisible();
    await expect(page.getByText("Insättning")).toBeVisible();
  });

  test("3. Historik finns kvar efter omladdning och ogiltigt belopp nekas", async ({
    page,
  }) => {
    const username = generateUser();
    const password = "testpassword";

    await page.goto("/register");
    await page.locator('input[type="text"]').fill(username);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /skapa/i }).click();

    await page.goto("/login");
    await page.locator('input[type="text"]').fill(username);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /logga in/i }).click();

    await page.locator("#amount").fill("300");
    await page.getByRole("button", { name: /sätt in pengar/i }).click();
    await expect(page.getByText("300 kr")).toBeVisible();

    await page.locator("#amount").fill("0");
    await page.getByRole("button", { name: /sätt in pengar/i }).click();
    await expect(page.getByText("300 kr")).toBeVisible();

    await page.goto("/transactions");
    await expect(page.getByText("300.00 kr")).toBeVisible();

    await page.goto("/transactions");
    await expect(page.getByText("300.00 kr")).toBeVisible();

    await page.reload();
    await expect(page.getByText("300.00 kr")).toBeVisible();
  });
});
