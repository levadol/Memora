import { test, expect } from "@playwright/test";

test.describe("Statistics page", () => {
  test("shows empty state when no sessions", async ({ page }) => {
    await page.goto("/en/statistics");
    await expect(
      page.getByText("No sessions yet. Play a game to see your statistics.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("page title is visible", async ({ page }) => {
    await page.goto("/en/statistics");
    await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible(
      { timeout: 5000 }
    );
  });

  test("statistics link in nav navigates to statistics page", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: /statistics/i }).click();
    await page.waitForURL(/\/statistics/, { timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: "Statistics" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("statistics page shows in Hebrew with RTL layout", async ({ page }) => {
    await page.goto("/he/statistics");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl", { timeout: 5000 });
    await expect(page.getByText("אין עדיין סשנים")).toBeVisible({
      timeout: 5000,
    });
  });

  test("statistics page shows in Russian", async ({ page }) => {
    await page.goto("/ru/statistics");
    await expect(page.getByRole("heading", { name: "Статистика" })).toBeVisible(
      { timeout: 5000 }
    );
    await expect(page.getByText("Сессий пока нет")).toBeVisible({
      timeout: 5000,
    });
  });
});
