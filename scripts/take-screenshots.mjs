import { chromium } from '../node_modules/playwright/index.js';
import { mkdirSync } from 'fs';

mkdirSync('docs', { recursive: true });

const browser = await chromium.launch();

const pages = [
  { url: 'http://localhost:3000/en', suffix: 'en' },
  { url: 'http://localhost:3000/he', suffix: 'he' },
];

const widths = [360, 768, 1280];

for (const { url, suffix } of pages) {
  for (const width of widths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: width < 600 ? 780 : 900 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `docs/keypad-home-${suffix}-${width}.png`, fullPage: false });
    console.log(`  keypad-home-${suffix}-${width}.png`);

    // Navigate to Blitz game
    try {
      const blitzCard = page.getByText('Arithmetic Blitz').first();
      if (await blitzCard.isVisible({ timeout: 3000 })) {
        await blitzCard.click();
        await page.waitForTimeout(600);
        await page.keyboard.press('2'); // medium difficulty
        const startBtn = page.getByRole('button', { name: 'Start', exact: true });
        if (await startBtn.isVisible({ timeout: 3000 })) await startBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `docs/keypad-blitz-${suffix}-${width}.png`, fullPage: false });
        console.log(`  keypad-blitz-${suffix}-${width}.png`);
      }
    } catch (e) {
      console.log(`  SKIP blitz-${suffix}-${width}: ${e.message.slice(0, 80)}`);
    }
    await page.close();
  }
}

await browser.close();
console.log('All screenshots done');
