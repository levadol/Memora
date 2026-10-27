const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const widths = [360, 768, 1280];

  for (const width of widths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: width < 600 ? 780 : 900 });
    await page.goto('http://localhost:3000/he', { waitUntil: 'networkidle', timeout: 30000 });

    try {
      const blitzCard = page.getByText('בזק חשבוני').first();
      if (await blitzCard.isVisible({ timeout: 3000 })) {
        await blitzCard.click();
        await page.waitForTimeout(600);
        await page.keyboard.press('2');
        const startBtn = page.getByRole('button', { name: 'התחל', exact: true })
          .or(page.getByRole('button', { name: 'Start', exact: true }));
        if (await startBtn.first().isVisible({ timeout: 3000 })) await startBtn.first().click();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `docs/keypad-blitz-he-${width}.png`, fullPage: false });
        console.log(`  keypad-blitz-he-${width}.png`);
      }
    } catch (e) {
      console.log(`  SKIP he-${width}: ${e.message.slice(0, 80)}`);
    }
    await page.close();
  }

  await browser.close();
  console.log('Hebrew blitz screenshots done');
})();
