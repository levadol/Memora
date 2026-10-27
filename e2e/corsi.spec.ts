import { test, expect } from "@playwright/test";

test.describe("Corsi Blocks game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows Corsi Blocks card", async ({ page }) => {
    await expect(page.getByText("Corsi Blocks")).toBeVisible();
    await expect(page.getByText("Visuospatial memory")).toBeVisible();
  });

  test("clicking Corsi Blocks opens the game overlay", async ({ page }) => {
    await page.getByText("Corsi Blocks").click();
    await expect(page.getByRole("group", { name: "Corsi blocks" })).toBeVisible();
  });

  test("game shows round counter and score", async ({ page }) => {
    await page.getByText("Corsi Blocks").click();
    await expect(page.getByText(/Round/i)).toBeVisible();
    await expect(page.getByText(/Score/i)).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    await page.getByText("Corsi Blocks").click();
    // Wait for the board to appear — PAUSE now works from "ready" onwards
    await expect(page.getByRole("group", { name: "Corsi blocks" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    await page.getByText("Corsi Blocks").click();
    await expect(page.getByRole("group", { name: "Corsi blocks" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("plays one full round to feedback, then round counter advances", async ({ page }) => {
    await page.getByText("Corsi Blocks").click();

    // Wait until input phase — data-sequence is set on the game root (requires NEXT_PUBLIC_E2E=1)
    await page.waitForSelector("[data-sequence]", { timeout: 12000 });
    const rawSeq = await page.getAttribute("[data-sequence]", "data-sequence");
    const sequence: number[] = JSON.parse(rawSeq!);

    // Tap blocks in the correct order
    for (const blockIdx of sequence) {
      await page.getByRole("button", { name: `Block ${blockIdx + 1}` }).click();
    }

    // Correct answer → feedback shows "Correct!"
    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 3000 });

    // Round counter advances to 2
    await expect(page.getByText(/2\/10/)).toBeVisible({ timeout: 3000 });
  });
});
