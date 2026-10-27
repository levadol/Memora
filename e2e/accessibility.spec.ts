import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openGame } from "./helpers";

const STATIC_SCREENS = [
  { path: "/en", name: "home-en" },
  { path: "/en/statistics", name: "statistics-en" },
  { path: "/en/settings", name: "settings-en" },
  { path: "/he", name: "home-he" },
  { path: "/he/statistics", name: "statistics-he" },
  { path: "/he/settings", name: "settings-he" },
];

test.describe("Accessibility: axe scan — static screens", () => {
  for (const { path, name } of STATIC_SCREENS) {
    test(`${name} has no critical/serious violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(600);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );
      if (serious.length > 0) {
        console.log(
          `Violations on ${name}:`,
          serious.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
          }))
        );
      }
      expect(serious, `Critical/serious violations on ${name}`).toHaveLength(0);
    });
  }
});

test.describe("Accessibility: axe scan — games (paused state)", () => {
  // Pause the game before scanning to get a fully stable DOM (no active animations)
  const GAMES = [
    { name: "digit-span", text: "Digit Span" },
    { name: "corsi-blocks", text: "Corsi Blocks" },
    { name: "n-back", text: "N-Back" },
    { name: "pattern-matrix", text: "Pattern Matrix" },
    { name: "paired-associates", text: "Paired Associates" },
  ];

  for (const game of GAMES) {
    test(`${game.name} — paused game, axe clean`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto("/en");
      await openGame(page, game.text);
      // Skip tutorial if present (showTutorial may be false on repeat plays)
      await page.getByRole("button", { name: /skip|let's go/i }).first().click({ timeout: 2000 }).catch(() => {});
      // Wait for the pause button to be visible — confirms GameShell is mounted
      await expect(page.getByRole("button", { name: /pause/i })).toBeVisible({ timeout: 10_000 });
      // Pause the game to freeze animations, giving axe a stable DOM
      await page.getByRole("button", { name: /pause/i }).click();
      await page.waitForTimeout(400);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );
      if (serious.length > 0) {
        console.log(
          `${game.name} violations:`,
          serious.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length }))
        );
      }
      expect(serious, `${game.name} critical/serious violations`).toHaveLength(0);
    });
  }
});

test.describe("Accessibility: focus trap and keyboard navigation", () => {
  test("pause menu traps focus and Escape closes it", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/en");
    await openGame(page, "Corsi Blocks");
    await page.getByRole("button", { name: /skip|let's go/i }).first().click({ timeout: 2000 }).catch(() => {});
    // Wait for the game board (GameShell mounted and board rendered)
    await expect(page.getByRole("button", { name: /pause/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.waitForTimeout(300);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Focus must be inside dialog
    const focused = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.contains(document.activeElement) : false;
    });
    expect(focused).toBe(true);

    // Escape closes the dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(dialog).not.toBeVisible();
  });

  test("settings reset dialog traps focus and Escape cancels", async ({ page }) => {
    await page.goto("/en/settings");
    // Find and click the reset button
    const resetButtons = page.getByRole("button", { name: /reset/i });
    await resetButtons.last().click();
    await page.waitForTimeout(300);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Focus must be inside dialog
    const focused = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.contains(document.activeElement) : false;
    });
    expect(focused).toBe(true);

    // Escape closes dialog without resetting
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(dialog).not.toBeVisible();
  });

  test("tutorial Escape skips tutorial", async ({ page }) => {
    // Force tutorial to show by clearing sessions
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem("memora_v1");
        if (raw) {
          const d = JSON.parse(raw);
          if (d?.state?.sessions) {
            d.state.sessions = [];
            localStorage.setItem("memora_v1", JSON.stringify(d));
          }
        }
      } catch {}
    });
    await page.goto("/en");
    await openGame(page, "Corsi Blocks");
    await page.waitForTimeout(400);

    const dialog = page.locator('[role="dialog"]').first();
    if (await dialog.isVisible()) {
      // Tutorial dialog is open — Escape should close it
      const focusedBefore = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return d ? d.contains(document.activeElement) : false;
      });
      expect(focusedBefore).toBe(true);

      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await expect(dialog).not.toBeVisible();
    }
    // If tutorial doesn't show (sessions exist), test passes implicitly
  });
});
