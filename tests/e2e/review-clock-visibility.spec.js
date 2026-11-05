const { test, expect } = require('@playwright/test');

test('hides player clocks in PGN review and restores them for a new game', async ({ page }) => {
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  await page.evaluate(() => reviewStart('[Event "Clock visibility"]\n[White "A"]\n[Black "B"]\n\n1. e4 e5 *'));
  await expect(page.locator('.player-clocks')).toBeHidden();
  await expect(page.locator('.player-clocks')).toHaveCSS('display', 'none');

  await page.evaluate(() => reviewHideModal());
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await expect(page.locator('.player-clocks')).toBeVisible();
});

test('colors white and black player names in both accuracy summaries', async ({ page }) => {
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  await page.evaluate(() => reviewStart('', { White: 'WIDBIFS', Black: 'Javokhir_Sindarov05' }));

  for (const selector of ['#accuracy-badge', '#stat-accuracy']) {
    await expect(page.locator(selector).locator('.accuracy-player-w')).toContainText('(Blanc) WIDBIFS');
    await expect(page.locator(selector).locator('.accuracy-player-b')).toContainText('(Noir) Javokhir_Sindarov05');
    await expect(page.locator(selector).locator('.accuracy-player-dot-w')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator(selector).locator('.accuracy-player-dot-w')).toHaveCSS('border-top-color', 'rgb(0, 0, 0)');
    await expect(page.locator(selector).locator('.accuracy-player-dot-b')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.locator(selector).locator('.accuracy-player-dot-b')).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
  }
});
