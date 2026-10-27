import { test, expect } from "@playwright/test";

async function openBlitzGame(page: import("@playwright/test").Page) {
  await page.getByText("Arithmetic Blitz").click();
  // Go through difficulty picker — click "Start" (exact, not "Start Daily Training")
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  // Skip tutorial if it appears (first play with empty localStorage)
  const skipBtn = page.getByRole("button", { name: "Skip" });
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
  }
}

test.describe("Arithmetic Blitz game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows Arithmetic Blitz card under Mental Arithmetic heading", async ({
    page,
  }) => {
    await expect(page.getByText("Mental Arithmetic")).toBeVisible();
    await expect(page.getByText("Arithmetic Blitz")).toBeVisible();
    await expect(page.getByText("Mental calculation speed")).toBeVisible();
  });

  test("clicking Arithmetic Blitz opens the game with timer and score after difficulty picker", async ({
    page,
  }) => {
    await openBlitzGame(page);
    // Wait for game phase — stat labels "Correct" and "Time" are visible in GameShell header
    await expect(page.getByText(/Correct/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Time/i)).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    await openBlitzGame(page);
    // Wait for playing state (data-answer present in E2E mode)
    await page.waitForSelector("[data-answer]", { timeout: 10000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    await openBlitzGame(page);
    await page.waitForSelector("[data-answer]", { timeout: 10000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("plays one correct answer using keyboard and asserts Correct!", async ({ page }) => {
    await openBlitzGame(page);

    // Wait for playing phase (data-answer is present in E2E mode)
    await page.waitForSelector("[data-answer]", { timeout: 10000 });

    const answer = await page.getAttribute("[data-answer]", "data-answer");
    expect(answer).toBeTruthy();

    // Type the answer using keyboard — auto-submit fires on last digit
    await page.keyboard.type(answer!);

    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 3000 });
  });

  test("plays one correct answer using on-screen keypad and asserts Correct!", async ({
    page,
  }) => {
    await openBlitzGame(page);
    await page.waitForSelector("[data-answer]", { timeout: 10000 });

    const answer = await page.getAttribute("[data-answer]", "data-answer");
    expect(answer).toBeTruthy();

    for (const char of answer!) {
      if (char === "-") {
        await page.getByRole("button", { name: "minus" }).click();
      } else {
        await page.getByRole("button", { name: `Digit ${char}` }).click();
      }
    }

    await expect(page.getByText("Correct!")).toBeVisible({ timeout: 3000 });
  });

  test("full session: answer 5 correct + 1 wrong, assert score=5 and accuracy ~83%", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await openBlitzGame(page);

    // Answer 5 problems correctly
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector("[data-answer]", { timeout: 10_000 });
      const prevAnswer = await page.getAttribute("[data-answer]", "data-answer");
      await page.keyboard.type(prevAnswer!);
      // Wait for next problem (data-answer changes) or feedback before next loop
      await page.waitForFunction(
        (prev) => {
          const el = document.querySelector("[data-answer]");
          return !el || el.getAttribute("data-answer") !== prev;
        },
        prevAnswer,
        { timeout: 5_000 }
      );
    }

    // Answer 1 problem wrong: read correct answer, add 1 to it
    await page.waitForSelector("[data-answer]", { timeout: 10_000 });
    const correctAnswer = await page.getAttribute("[data-answer]", "data-answer");
    const wrongAnswer = String(parseInt(correctAnswer!) + 1);
    await page.keyboard.type(wrongAnswer);
    // If wrong answer has same digit count as correct, it auto-submits.
    // Otherwise press Enter.
    if (wrongAnswer.length !== correctAnswer!.length) {
      await page.keyboard.press("Enter");
    }

    // Wait for session to complete (E2E mode: 60 ticks × 100ms = ~6 real seconds)
    await expect(page.getByText("Session Complete")).toBeVisible({ timeout: 15_000 });

    // Assert score = 5 (the "Score" stat shows correctCount)
    const scoreParent = page.getByText("Score").locator("..");
    await expect(scoreParent.locator(".ltr-nums")).toContainText("5");

    // Assert accuracy ≈ 83% (5/6 = 83.3% → rounds to 83)
    await expect(page.getByText("83%")).toBeVisible();
  });
});
