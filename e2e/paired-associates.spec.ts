import { test, expect } from "@playwright/test";

test.describe("Paired Associates game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows Paired Associates card", async ({ page }) => {
    await expect(page.getByText("Paired Associates")).toBeVisible();
    await expect(page.getByText("Associative memory")).toBeVisible();
  });

  test("clicking Paired Associates opens the game", async ({ page }) => {
    await page.getByText("Paired Associates").click();
    await page.waitForFunction(
      () => document.querySelector("[data-pa-phase]") !== null,
      { timeout: 8000 }
    );
    await expect(page.locator("[data-pa-phase]")).toBeVisible();
  });

  test("study phase shows phase label", async ({ page }) => {
    await page.getByText("Paired Associates").click();
    await page.waitForFunction(
      () => document.querySelector("[data-pa-phase=\"study\"]") !== null,
      { timeout: 8000 }
    );
    // Phase label "Pair 1 of N" should appear in the polite live region
    await expect(page.getByText(/Pair 1/i)).toBeVisible({ timeout: 3000 });
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    await page.getByText("Paired Associates").click();
    await page.waitForFunction(
      () => document.querySelector("[data-pa-phase]") !== null,
      { timeout: 8000 }
    );
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    await page.getByText("Paired Associates").click();
    await page.waitForFunction(
      () => document.querySelector("[data-pa-phase]") !== null,
      { timeout: 8000 }
    );
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("full round: auto-answer all questions correctly using data-pa-correct-word", async ({ page }) => {
    await page.goto("/en");
    await page.getByText("Paired Associates").click();

    // Wait for study phase
    await page.waitForFunction(
      () => document.querySelector("[data-pa-phase=\"study\"]") !== null,
      { timeout: 8000 }
    );

    // Wait for test phase (E2E timing: 300ms/pair × 5 pairs = 1.5s)
    await page.waitForFunction(
      () => document.querySelector("[data-pa-phase=\"test\"]") !== null,
      { timeout: 20000 }
    );

    // Answer all test trials in the round using the data attribute
    let answered = 0;
    const maxAttempts = 20;
    while (answered < maxAttempts) {
      const isTest = await page.evaluate(
        () => document.querySelector("[data-pa-phase=\"test\"]") !== null
      );
      if (!isTest) break;

      const correctWord = await page.evaluate(() => {
        const el = document.querySelector(
          "[data-pa-correct-word]"
        ) as HTMLElement | null;
        return el?.getAttribute("data-pa-correct-word") ?? null;
      });

      if (!correctWord) {
        // Might be in feedback, wait a bit
        await page.waitForTimeout(100);
        continue;
      }

      const btn = page.getByRole("button", { name: correctWord });
      await btn.waitFor({ state: "visible", timeout: 3000 });
      await btn.click();
      answered++;

      // Wait for feedback to pass (1500ms) and next trial or study phase
      await page.waitForFunction(
        () =>
          document.querySelector("[data-pa-phase=\"test\"]") !== null ||
          document.querySelector("[data-pa-phase=\"study\"]") !== null ||
          document.querySelector("[data-pa-phase=\"result\"]") !== null,
        { timeout: 5000 }
      );
    }

    expect(answered).toBeGreaterThan(0);
    // After answering all pairs in one round, score should increase
    await expect(page.getByText(/Score/i)).toBeVisible();
  });
});
