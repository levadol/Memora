import { test, expect } from "@playwright/test";

async function openChainGame(page: import("@playwright/test").Page) {
  await page.getByText("Arithmetic Chain").click();
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  // Skip tutorial on first play
  const skipBtn = page.getByRole("button", { name: "Skip" });
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
  }
}

async function waitForAndEnterAnswer(page: import("@playwright/test").Page) {
  await page.waitForSelector("[data-answer]", { timeout: 10_000 });
  const answer = await page.getAttribute("[data-answer]", "data-answer");
  expect(answer).toBeTruthy();
  await page.keyboard.type(answer!);
  await page.keyboard.press("Enter");
  return answer!;
}

test.describe("Arithmetic Chain game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows Arithmetic Chain card under Mental Arithmetic heading", async ({ page }) => {
    await expect(page.getByText("Mental Arithmetic")).toBeVisible();
    await expect(page.getByText("Arithmetic Chain")).toBeVisible();
    await expect(page.getByText("Working memory arithmetic")).toBeVisible();
  });

  test("clicking Arithmetic Chain opens game with round and max chain stats", async ({ page }) => {
    await openChainGame(page);
    await expect(page.getByText(/Round/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Max chain/i)).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    test.setTimeout(20_000);
    await openChainGame(page);
    // Wait until the input phase so pause is meaningful
    await page.waitForSelector("[data-answer]", { timeout: 15_000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    test.setTimeout(20_000);
    await openChainGame(page);
    await page.waitForSelector("[data-answer]", { timeout: 15_000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("plays one correct round and asserts Correct!", async ({ page }) => {
    test.setTimeout(25_000);
    await openChainGame(page);
    await waitForAndEnterAnswer(page);
    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 5000 });
  });

  test("plays one wrong round and asserts Incorrect!", async ({ page }) => {
    test.setTimeout(25_000);
    await openChainGame(page);

    await page.waitForSelector("[data-answer]", { timeout: 15_000 });
    const answer = await page.getAttribute("[data-answer]", "data-answer");
    expect(answer).toBeTruthy();
    // Type a deliberately wrong answer: add 1 to correct answer
    const wrong = String(parseInt(answer!) + 1);
    await page.keyboard.type(wrong);
    await page.keyboard.press("Enter");

    await expect(page.getByText("Incorrect")).toBeVisible({ timeout: 5000 });
  });
});
