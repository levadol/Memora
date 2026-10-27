import { test, expect } from "@playwright/test";

test.describe("N-Back game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("home page shows N-Back card", async ({ page }) => {
    await expect(page.getByText("N-Back")).toBeVisible();
    await expect(page.getByText("Working memory updating")).toBeVisible();
  });

  test("clicking N-Back opens the game", async ({ page }) => {
    await page.getByText("N-Back").click();
    // "Match" button is unique to N-Back game
    await expect(page.getByRole("button", { name: /Match/i })).toBeVisible({ timeout: 5000 });
  });

  test("game shows block counter, score and level", async ({ page }) => {
    await page.getByText("N-Back").click();
    await expect(page.getByRole("button", { name: /Match/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Score/i)).toBeVisible();
    await expect(page.getByText(/\d-back/)).toBeVisible();
  });

  test("pause button opens pause menu with quit option", async ({ page }) => {
    await page.getByText("N-Back").click();
    await expect(page.getByRole("button", { name: /Match/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /quit/i })).toBeVisible();
  });

  test("quit from pause menu returns to home", async ({ page }) => {
    await page.getByText("N-Back").click();
    await expect(page.getByRole("button", { name: /Match/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /quit/i }).click();
    await expect(page.getByRole("heading", { name: "Daily Training" })).toBeVisible();
  });

  test("full block: auto-respond to all targets, expect 0 misses and 0 false alarms", async ({ page }) => {
    await page.goto("/en");
    await page.getByText("N-Back").click();

    // Wait until stimulus phase begins and the sequence is available
    await page.waitForFunction(
      () => {
        const el = document.querySelector("[data-nback-phase=\"stimulus\"]");
        return el !== null && el.hasAttribute("data-nback-sequence");
      },
      { timeout: 10000 }
    );

    // Read sequence (isTarget is immutable per block) and n
    const { sequence, n } = await page.evaluate(() => {
      const root = document.querySelector("[data-nback-phase=\"stimulus\"]") as HTMLElement;
      return {
        sequence: JSON.parse(root.getAttribute("data-nback-sequence")!) as Array<{ isTarget: boolean }>,
        n: Number(root.getAttribute("data-nback-n")),
      };
    });

    // Install MutationObserver: auto-click Match on every scorable target
    await page.evaluate(
      ({ sequence, n }) => {
        const root = document.querySelector("[data-nback-phase]") as HTMLElement;
        const observer = new MutationObserver(() => {
          if (root.getAttribute("data-nback-phase") !== "stimulus") return;
          const idxAttr = root.getAttribute("data-nback-current-index");
          if (idxAttr === null) return;
          const idx = Number(idxAttr);
          if (idx >= n && sequence[idx]?.isTarget) {
            const btn = document.querySelector("button[aria-label=\"Match\"]") as HTMLButtonElement | null;
            if (btn && !btn.disabled) btn.click();
          }
        });
        observer.observe(root, {
          attributes: true,
          attributeFilter: ["data-nback-current-index", "data-nback-phase"],
        });
      },
      { sequence, n }
    );

    // Wait for block to complete (phase → feedback)
    await page.waitForFunction(
      () => document.querySelector("[data-nback-phase=\"feedback\"]") !== null,
      { timeout: 15000 }
    );

    // Read block stats from the assertive live region's host element
    const stats = await page.evaluate(() => {
      const root = document.querySelector("[data-nback-block-stats]") as HTMLElement;
      return JSON.parse(root.getAttribute("data-nback-block-stats")!) as {
        hits: number;
        misses: number;
        falseAlarms: number;
        correctRejections: number;
      };
    });

    const scorable = sequence.slice(n);
    const expectedHits = scorable.filter((t) => t.isTarget).length;
    const expectedCR = scorable.filter((t) => !t.isTarget).length;

    expect(stats.hits).toBe(expectedHits);
    expect(stats.misses).toBe(0);
    expect(stats.falseAlarms).toBe(0);
    expect(stats.correctRejections).toBe(expectedCR);
  });
});
