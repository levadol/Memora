/**
 * Video recording spec: records key scenarios for Block 2/3 visual review.
 * Videos are saved to docs/videos/ after each scenario.
 *
 * Requires NEXT_PUBLIC_E2E=1 (already set in webServer command).
 */
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const DOCS_VIDEOS = path.join(process.cwd(), "docs", "videos");

test.use({
  video: "on",
  viewport: { width: 1280, height: 800 },
});

async function saveVideo(page: import("@playwright/test").Page, name: string) {
  const vid = await page.video()?.path();
  if (!vid) return;
  fs.mkdirSync(DOCS_VIDEOS, { recursive: true });
  const dest = path.join(DOCS_VIDEOS, `${name}.webm`);
  fs.copyFileSync(vid, dest);
  console.log(`Saved: ${dest}`);
}

// ── 1. Open and close Corsi game from Home ─────────────────────────────────
test("open and close a game from Home", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Corsi Blocks")).toBeVisible();
  await page.getByText("Corsi Blocks").click();
  await expect(page.getByRole("group", { name: "Corsi blocks" })).toBeVisible({ timeout: 8000 });

  await page.getByRole("button", { name: /pause/i }).click();
  await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  await page.getByRole("button", { name: /quit/i }).click();
  await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  await saveVideo(page, "01-open-close-game");
});

// ── 2. One correct + one incorrect round in Corsi ──────────────────────────
test("correct and incorrect round", async ({ page }) => {
  await page.goto("/en");
  await page.getByText("Corsi Blocks").click();
  await expect(page.getByRole("group", { name: "Corsi blocks" })).toBeVisible({ timeout: 8000 });

  // Correct round
  await page.waitForSelector("[data-sequence]", { timeout: 12000 });
  const seq1 = JSON.parse((await page.getAttribute("[data-sequence]", "data-sequence"))!);
  for (const idx of seq1) {
    await page.getByRole("button", { name: `Block ${(idx as number) + 1}` }).click();
  }
  await expect(page.getByText("Correct!")).toBeVisible({ timeout: 5000 });

  // Incorrect round — click a block that is not the expected first block
  await page.waitForSelector("[data-sequence]", { timeout: 12000 });
  const seq2 = JSON.parse((await page.getAttribute("[data-sequence]", "data-sequence"))!);
  const wrongIdx = (seq2[0] as number) === 0 ? 1 : 0;  // guaranteed to differ from seq2[0]
  await page.getByRole("button", { name: `Block ${wrongIdx + 1}` }).click();
  // "Incorrect" (no exclamation mark in translations)
  await expect(page.getByText("Incorrect")).toBeVisible({ timeout: 5000 });
  await saveVideo(page, "02-correct-incorrect-round");
});

// ── 3. Results screen — use N-Back (fast in E2E mode) ─────────────────────
test("results screen", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/en");
  // Open N-Back position
  await page.getByText("N-Back").click();
  // Wait for the game to appear (grid for position mode)
  await page.waitForSelector("[data-nback-phase]", { timeout: 10000 });

  // N-Back in E2E mode runs ~130ms/trial × 7 trials × 5 rounds ≈ 5 seconds total.
  // Just wait for the result screen — all non-responses are correct rejections.
  await expect(page.getByText(/play again/i)).toBeVisible({ timeout: 45000 });
  await saveVideo(page, "03-results-screen");
});

// ── 4. Navigation between Home, Statistics, Settings ──────────────────────
test("navigation between three pages", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();

  await page.getByRole("link", { name: "Statistics" }).click();
  await expect(page.getByRole("heading", { name: /statistics/i })).toBeVisible({ timeout: 5000 });

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({ timeout: 5000 });

  // Home link is the app title "Memora"
  await page.getByRole("link", { name: "Memora" }).click();
  await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible({ timeout: 5000 });
  await saveVideo(page, "04-navigation-three-pages");
});

// ── 5. Same navigation on /he (RTL) ───────────────────────────────────────
test("navigation in Hebrew locale /he", async ({ page }) => {
  await page.goto("/he");
  await expect(page.locator("h1, h2").first()).toBeVisible();

  // Hebrew nav uses translated strings
  await page.getByRole("link", { name: "סטטיסטיקה" }).click();
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });

  await page.getByRole("link", { name: "הגדרות" }).click();
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });

  // Home link is always "Memora"
  await page.getByRole("link", { name: "Memora" }).click();
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
  await saveVideo(page, "05-navigation-he-rtl");
});

// ── 6. Reduced motion enabled ─────────────────────────────────────────────
test("reduced motion on — open game, play round, close", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.getByText("Corsi Blocks")).toBeVisible();

  await page.getByText("Corsi Blocks").click();
  await expect(page.getByRole("group", { name: "Corsi blocks" })).toBeVisible({ timeout: 8000 });

  await page.waitForSelector("[data-sequence]", { timeout: 12000 });
  const seq = JSON.parse((await page.getAttribute("[data-sequence]", "data-sequence"))!);
  for (const idx of seq) {
    await page.getByRole("button", { name: `Block ${(idx as number) + 1}` }).click();
  }
  await expect(page.getByText("Correct!")).toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: /pause/i }).click();
  await page.getByRole("button", { name: /quit/i }).click();
  await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  await saveVideo(page, "06-reduced-motion");
});
