import { test, expect } from "@playwright/test";

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/settings");
  });

  test("shows settings title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows language, sound, accessibility, theme and reset sections", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Language" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sound" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accessibility" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reset all data" })).toBeVisible();
  });

  test("all three language buttons are shown", async ({ page }) => {
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Русский" })).toBeVisible();
    await expect(page.getByRole("button", { name: "עברית" })).toBeVisible();
  });

  test("switching language to Russian navigates to /ru/settings", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Русский" }).click();
    await expect(page).toHaveURL(/\/ru\/settings/, { timeout: 5000 });
  });

  test("switching language to Hebrew navigates to /he/settings and sets RTL", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "עברית" }).click();
    await expect(page).toHaveURL(/\/he\/settings/, { timeout: 5000 });
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl", { timeout: 5000 });
  });

  test("sound toggle is present and clickable", async ({ page }) => {
    const soundToggle = page.getByLabel("Enable sound");
    await expect(soundToggle).toBeVisible();
  });

  test("dark/light theme buttons are present", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Dark" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Light" })).toBeVisible();
  });

  test("reset confirmation dialog appears and can be cancelled", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Reset all data" }).click();
    await expect(
      page.getByText(
        "This will permanently delete all your progress. Continue?"
      )
    ).toBeVisible({ timeout: 3000 });
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByText(
        "This will permanently delete all your progress. Continue?"
      )
    ).not.toBeVisible();
  });

  test("settings page shows in Russian", async ({ page }) => {
    await page.goto("/ru/settings");
    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible({
      timeout: 5000,
    });
  });
});
