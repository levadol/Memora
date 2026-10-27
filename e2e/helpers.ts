import type { Page } from "@playwright/test";

export type Difficulty = "easy" | "medium" | "hard";

/**
 * Click a game card, select the difficulty in the DifficultyPicker, and press Start.
 * Defaults to medium difficulty.
 * @param startButtonName - Text of the Start button (use localized value for non-English locales)
 */
export async function openGame(
  page: Page,
  cardName: string | RegExp,
  difficulty: Difficulty = "medium",
  startButtonName: string = "Start"
): Promise<void> {
  await page.getByText(cardName).first().click();
  // DifficultyPicker: wait for it to appear
  await page.getByRole("button", { name: startButtonName, exact: true }).waitFor({ timeout: 5000 });
  // Select difficulty via keyboard shortcut (1=easy, 2=medium, 3=hard)
  const key = difficulty === "easy" ? "1" : difficulty === "medium" ? "2" : "3";
  await page.keyboard.press(key);
  await page.getByRole("button", { name: startButtonName, exact: true }).click();
}
