import { test, expect } from "@playwright/test";
import { openGame } from "./helpers";

test.describe("Arithmetic True or False", () => {
  test("home page shows True or False card under Mental Arithmetic", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Mental Arithmetic")).toBeVisible();
    await expect(page.getByText("True or False")).toBeVisible();
    await expect(page.getByText("Verify arithmetic at speed")).toBeVisible();
  });

  test("full 30-item session with mixed answers, assert hits and false alarms on result", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/en");
    await openGame(page, "True or False", "easy");
    const skipBtn = page.getByRole("button", { name: "Skip" });
    if (await skipBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await skipBtn.click();
    }

    let hits = 0;
    let falseAlarms = 0;

    // Play all 30 items using keyboard shortcuts (T/F) which are ignored outside "showing" phase
    for (let i = 0; i < 30; i++) {
      // Wait for showing phase: [data-is-true] must be in the DOM
      await page.waitForSelector("[data-is-true]", { timeout: 15_000 });
      const isTrue = (await page.getAttribute("[data-is-true]", "data-is-true")) === "true";

      // Alternate answers: correct for first 20, wrong for last 10 (to get mixed counts)
      let pressTrue: boolean;
      if (i < 20) {
        pressTrue = isTrue; // correct answer
        if (isTrue) hits++;
        // else: correct rejection — no increment
      } else {
        pressTrue = !isTrue; // wrong answer
        if (!isTrue) falseAlarms++; // true on false item → false alarm
      }

      // Keyboard shortcuts fire handleAnswer only during "showing" phase
      await page.keyboard.press(pressTrue ? "t" : "f");

      // Wait for the showing phase to end ([data-is-true] detaches when not in showing)
      await page.waitForSelector("[data-is-true]", { state: "detached", timeout: 5000 });
    }

    // Should now be on result screen
    await expect(page.getByText("Session Complete")).toBeVisible({ timeout: 10_000 });

    // Assert hit and false alarm counts are visible
    await expect(page.getByText("Hits")).toBeVisible();
    await expect(page.getByText(String(hits), { exact: true })).toBeVisible();
    await expect(page.getByText("False alarms")).toBeVisible();
    await expect(page.getByText(String(falseAlarms), { exact: true })).toBeVisible();

    // Mean RT should be shown
    await expect(page.getByText("Mean RT")).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    test.setTimeout(20_000);
    await page.goto("/en");
    await openGame(page, "True or False", "easy");
    const skipBtn = page.getByRole("button", { name: "Skip" });
    if (await skipBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.waitForSelector("[data-is-true]", { timeout: 10_000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("RTL: ArrowRight picks the visual-right button on /he", async ({ page }) => {
    test.setTimeout(30_000);

    // Open in Hebrew locale
    await page.goto("/he");
    await openGame(page, "נכון או לא נכון", "easy", "התחל");
    const skipBtnHe = page.getByRole("button", { name: "דלג" });
    if (await skipBtnHe.isVisible({ timeout: 500 }).catch(() => false)) {
      await skipBtnHe.click();
    }

    await page.waitForSelector("[data-is-true]", { timeout: 10_000 });
    const isTrue = (await page.getAttribute("[data-is-true]", "data-is-true")) === "true";

    // In RTL (Hebrew): DOM order is [True]["לא נכון"] but visually mirrored to [False left][True right]
    // ArrowRight should press the visual-right button, which is True ("נכון")
    // Keyboard handler is on window, no focus step needed
    await page.keyboard.press("ArrowRight");

    // Verify correct behaviour: if isTrue, ArrowRight pressed True → correct feedback
    // if !isTrue, ArrowRight pressed True → incorrect feedback (false alarm)
    if (isTrue) {
      await expect(page.getByText("נכון!")).toBeVisible({ timeout: 3000 });
    } else {
      await expect(page.getByText("לא נכון", { exact: true })).toBeVisible({ timeout: 3000 });
    }
  });
});
