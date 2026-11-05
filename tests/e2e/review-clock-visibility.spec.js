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
