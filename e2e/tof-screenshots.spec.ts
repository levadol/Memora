import { test } from "@playwright/test";
import { openGame } from "./helpers";

const VIEWPORTS = [
  { name: "360", width: 360, height: 800 },
  { name: "1280", width: 1280, height: 800 },
];

const LOCALES = ["en", "ru", "he"];
const GAME_NAMES: Record<string, string> = {
  en: "True or False",
  ru: "Правда или ложь",
  he: "נכון או לא נכון",
};
const START_BTNS: Record<string, string> = {
  en: "Start",
  ru: "Начать",
  he: "התחל",
};
const SKIP_BTNS: Record<string, string> = {
  en: "Skip",
  ru: "Пропустить",
  he: "דלג",
};

for (const locale of LOCALES) {
  for (const vp of VIEWPORTS) {
    test(`tof-game-${locale}-${vp.name}`, async ({ page }) => {
      test.setTimeout(30_000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${locale}`);
      await openGame(page, GAME_NAMES[locale], "easy", START_BTNS[locale]);
      const skip = page.getByRole("button", { name: SKIP_BTNS[locale] });
      if (await skip.isVisible({ timeout: 800 }).catch(() => false)) await skip.click();
      await page.waitForSelector("[data-is-true]", { timeout: 10_000 });
      await page.screenshot({ path: `docs/tof-game-${locale}-${vp.name}.png`, fullPage: false });
    });
  }
}
