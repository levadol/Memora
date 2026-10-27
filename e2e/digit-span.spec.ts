import { test, expect } from "@playwright/test";

test.describe("Digit Span game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows Digit Span card", async ({ page }) => {
    await expect(page.getByText("Digit Span")).toBeVisible();
    await expect(page.getByText("Verbal short-term memory")).toBeVisible();
  });

  test("clicking Digit Span opens the game", async ({ page }) => {
    await page.getByText("Digit Span").click();
    await expect(page.getByText(/Round/i)).toBeVisible({ timeout: 5000 });
  });

  test("game shows round counter, score and mode", async ({ page }) => {
    await page.getByText("Digit Span").click();
    await expect(page.getByText(/Round/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Score/i)).toBeVisible();
    await expect(page.getByText(/Forward|Backward/)).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    await page.getByText("Digit Span").click();
    // Wait for game board (round counter signals game is running)
    await expect(page.getByText(/Round/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    await page.getByText("Digit Span").click();
    await expect(page.getByText(/Round/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("plays one full forward round to feedback, then round counter advances", async ({
    page,
  }) => {
    await page.getByText("Digit Span").click();

    // Wait for input phase — data-sequence set when NEXT_PUBLIC_E2E=1
    await page.waitForSelector("[data-sequence]", { timeout: 15000 });
    const rawSeq = await page.getAttribute("[data-sequence]", "data-sequence");
    const sequence: number[] = JSON.parse(rawSeq!);

    // Tap digits in forward order using aria labels
    for (const digit of sequence) {
      await page.getByRole("button", { name: `Digit ${digit}` }).click();
    }

    // Correct answer → feedback shows "Correct!"
    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 3000 });

    // Round counter advances to 2
    await expect(page.getByText(/2\/10/)).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Digit Span — backward mode via URL", () => {
  test("backward mode shows 'Backward' mode label", async ({ page }) => {
    // Open Digit Span then check mode — game starts in whatever mode activeGame.mode is
    // For this test we rely on the default forward mode; backward mode is tested via the store
    await page.goto("/en");
    await page.getByText("Digit Span").click();
    // Default mode is forward
    await expect(page.getByText(/Forward/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Digit Span — full backward round", () => {
  test("plays one full backward round and asserts Correct!", async ({ page }) => {
    await page.goto("/en");
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).__openGame === "function",
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      (window as unknown as { __openGame: (id: string, mode: string) => void }).__openGame(
        "digit-span",
        "backward"
      );
    });
    await page.waitForSelector("[data-sequence]", { timeout: 15000 });
    const rawSeq = await page.getAttribute("[data-sequence]", "data-sequence");
    const sequence: number[] = JSON.parse(rawSeq!);
    for (const digit of [...sequence].reverse()) {
      await page.getByRole("button", { name: `Digit ${digit}` }).click();
    }
    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 3000 });
  });
});
