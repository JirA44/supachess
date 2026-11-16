const { test, expect } = require('@playwright/test');

test('evaluation bar names the advantaged side and converts Stockfish perspective', async ({ page }) => {
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  await page.evaluate(() => {
    state.chess = new Chess();
    updateEvalBar({ scoreCp: 100, mate: null });
  });
  await expect(page.locator('#evalbar-label')).toHaveText('Blancs +1.00');

  await page.evaluate(() => {
    state.chess.move('e4');
    updateEvalBar({ scoreCp: 100, mate: null });
  });
  await expect(page.locator('#evalbar-label')).toHaveText('Noirs +1.00');

  await page.evaluate(() => updateEvalBar({ scoreCp: 0, mate: null }));
  await expect(page.locator('#evalbar-label')).toHaveText('Égalité 0.00');

  await page.evaluate(() => updateEvalBar({ scoreCp: 0, mate: 3 }));
  await expect(page.locator('#evalbar-label')).toHaveText('Mat en 3 pour Noirs');
});
