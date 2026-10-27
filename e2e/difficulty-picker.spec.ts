import { test, expect } from "@playwright/test";

test.describe("Difficulty Picker", () => {
  test("shows picker when opening a game, defaults to settings difficulty", async ({ page }) => {
    await page.goto("/en");
    await page.getByText("Corsi Blocks").click();
    // Picker should be visible
    await expect(page.getByRole("main", { name: /choose difficulty/i })).toBeVisible({ timeout: 5000 });
    // Medium should be pre-selected (default)
    const mediumBtn = page.getByRole("button", { name: /medium/i }).first();
    await expect(mediumBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("keyboard 1/2/3 selects difficulty, Enter starts game", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/en");
    await page.getByText("Digit Span").click();
    await expect(page.getByRole("main", { name: /choose difficulty/i })).toBeVisible({ timeout: 5000 });
    // Press 1 to select easy
    await page.keyboard.press("1");
    const easyBtn = page.getByRole("button", { name: /easy/i }).first();
    await expect(easyBtn).toHaveAttribute("aria-pressed", "true");
    // Press Enter to start
    await page.keyboard.press("Enter");
    // Picker should be gone, pause button visible
    await expect(page.getByRole("button", { name: /pause/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("main", { name: /choose difficulty/i })).not.toBeVisible();
  });

  test("Escape on picker closes overlay and returns to home", async ({ page }) => {
    await page.goto("/en");
    await page.getByText("N-Back").click();
    await expect(page.getByRole("main", { name: /choose difficulty/i })).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    // Overlay should be gone, home content visible
    await expect(page.getByRole("main", { name: /choose difficulty/i })).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible({ timeout: 3000 });
  });

  test("daily training skips picker and uses default difficulty", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/en");
    // Click "Start Daily Training"
    const startBtn = page.getByRole("button", { name: /start daily training/i });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();
    // Picker should NOT appear — should go directly to game
    await expect(page.getByRole("button", { name: /pause/i })).toBeVisible({ timeout: 10_000 });
    // Difficulty picker main should not be visible
    await expect(page.getByRole("main", { name: /choose difficulty/i })).not.toBeVisible();
  });

  test("clicking Start button on picker starts game", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/en");
    await page.getByText("Pattern Matrix").click();
    await expect(page.getByRole("main", { name: /choose difficulty/i })).toBeVisible({ timeout: 5000 });
    // Click hard
    await page.getByRole("button", { name: /hard/i }).first().click();
    // Click Start
    await page.getByRole("button", { name: /^start$/i }).click();
    await expect(page.getByRole("button", { name: /pause/i })).toBeVisible({ timeout: 10_000 });
  });

  test("3 selects Hard difficulty", async ({ page }) => {
    await page.goto("/en");
    await page.getByText("Corsi Blocks").click();
    await expect(page.getByRole("main", { name: /choose difficulty/i })).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("3");
    const hardBtn = page.getByRole("button", { name: /hard/i }).first();
    await expect(hardBtn).toHaveAttribute("aria-pressed", "true");
  });
});
