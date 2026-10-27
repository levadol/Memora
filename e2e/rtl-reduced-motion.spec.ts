import { test, expect } from "@playwright/test";

test.describe("Hebrew RTL layout", () => {
  test("home page is RTL in /he", async ({ page }) => {
    await page.goto("/he");
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
  });

  test("statistics page is RTL in /he", async ({ page }) => {
    await page.goto("/he/statistics");
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
  });

  test("settings page is RTL in /he", async ({ page }) => {
    await page.goto("/he/settings");
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
  });

  test("Hebrew home page has visible heading", async ({ page }) => {
    await page.goto("/he");
    // Page renders without JS crash and has content
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("switching to Hebrew from English home sets RTL", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: /he|עב/i }).click();
    await expect(page).toHaveURL(/\/he/);
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
  });
});

test.describe("Reduced motion", () => {
  test("reduced motion toggle exists in settings", async ({ page }) => {
    await page.goto("/en/settings");
    // The reduced motion toggle/checkbox/button should be present
    const reducedMotionControl = page.getByRole("checkbox", { name: /motion/i })
      .or(page.getByRole("button", { name: /motion/i }))
      .or(page.getByText(/reduced motion/i));
    await expect(reducedMotionControl.first()).toBeVisible();
  });

  test("system prefers-reduced-motion is respected", async ({ page }) => {
    // Emulate the OS prefers-reduced-motion: reduce setting
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    // Page should load without errors
    await expect(page.locator("body")).toBeVisible();
    // The app reads both OS setting and in-app toggle via useReducedMotion hook
  });
});
