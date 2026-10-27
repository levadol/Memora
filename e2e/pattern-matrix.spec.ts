import { test, expect } from "@playwright/test";

test.describe("Pattern Matrix game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows Pattern Matrix card", async ({ page }) => {
    await expect(page.getByText("Pattern Matrix")).toBeVisible();
    await expect(page.getByText("Visual pattern memory")).toBeVisible();
  });

  test("clicking Pattern Matrix opens the game overlay with grid", async ({ page }) => {
    await page.getByText("Pattern Matrix").click();
    await expect(page.getByRole("grid", { name: "Pattern grid" })).toBeVisible({ timeout: 5000 });
  });

  test("game shows round counter, score and level", async ({ page }) => {
    await page.getByText("Pattern Matrix").click();
    await expect(page.getByText(/Round/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Score/i)).toBeVisible();
    await expect(page.getByText(/Level/i)).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    await page.getByText("Pattern Matrix").click();
    await expect(page.getByRole("grid", { name: "Pattern grid" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    await page.getByText("Pattern Matrix").click();
    await expect(page.getByRole("grid", { name: "Pattern grid" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("grid cells have accessible aria-label", async ({ page }) => {
    await page.getByText("Pattern Matrix").click();
    await page.waitForSelector("[data-pattern]", { timeout: 10000 });
    await expect(page.getByRole("button", { name: "Cell 1", exact: true })).toBeVisible();
  });

  test("plays one full round to feedback, then round counter advances", async ({ page }) => {
    await page.getByText("Pattern Matrix").click();

    // Wait until input phase — data-pattern is set on the game root
    await page.waitForSelector("[data-pattern]", { timeout: 10000 });
    const rawPattern = await page.getAttribute("[data-pattern]", "data-pattern");
    const pattern: number[] = JSON.parse(rawPattern!);

    // Click every cell that was in the pattern
    for (const cellIdx of pattern) {
      await page.getByRole("button", { name: `Cell ${cellIdx + 1}`, exact: true }).click();
    }

    // Correct answer → feedback shows "Correct!"
    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 3000 });

    // After feedback resolves, round counter increments to 2
    await expect(page.getByText(/2\/10/)).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Pattern Matrix — RTL keyboard navigation (/he)", () => {
  test("ArrowRight moves focus to the visually right cell in RTL", async ({ page }) => {
    await page.goto("/he");
    await page.getByText("מטריצת דפוסים").click();

    // Wait for input phase
    await page.waitForSelector("[data-pattern]", { timeout: 10000 });

    // Focus Cell 2 (index 1) programmatically — avoids triggering a click/tap
    await page.getByRole("button", { name: "תא 2", exact: true }).focus();

    // In RTL, ArrowRight should move to Cell 1 (index 0) — visually to the right
    await page.keyboard.press("ArrowRight");

    await expect(page.getByRole("button", { name: "תא 1", exact: true })).toBeFocused();
  });

  test("ArrowLeft moves focus to the visually left cell in RTL", async ({ page }) => {
    await page.goto("/he");
    await page.getByText("מטריצת דפוסים").click();

    await page.waitForSelector("[data-pattern]", { timeout: 10000 });

    // Focus Cell 1 (index 0) — the rightmost cell in row 0 in RTL
    await page.getByRole("button", { name: "תא 1", exact: true }).focus();

    // In RTL, ArrowLeft should move to Cell 2 (index 1) — visually to the left
    await page.keyboard.press("ArrowLeft");

    await expect(page.getByRole("button", { name: "תא 2", exact: true })).toBeFocused();
  });
});
