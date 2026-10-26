const { test, expect } = require('@playwright/test');

test('live move-grade counters update for both players and roll back on undo', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready', '1', { timeout: 30000 });
  const counts = page.locator('#move-grade-summary [data-color] [data-grade-count]');
  await expect(page.locator('#move-grade-summary')).toBeVisible();
  await expect.poll(async () => (await counts.allTextContents()).reduce((sum, value) => sum + Number(value), 0)).toBe(0);

  await page.evaluate(() => {
    const best = { rank: 1, uci: 'e2e4', san: 'e4', deltaCp: 0,
      line: { scoreCp: 0, mate: null, pv: ['e2e4'], depth: 1 } };
    state.userColor = 'w';
    state.chess = new Chess();
    state.phase = 'userTurn';
    state.candidates = [best];
    commitUserMove({ from: 'e2', to: 'e4' }, best, false);
  });
  await expect(page.locator('#move-grade-summary [data-color="w"][data-grade="best"] [data-grade-count]')).toHaveText('1');
  await expect.poll(async () => (await page.locator('#move-grade-summary [data-color="b"] [data-grade-count]').allTextContents())
    .reduce((sum, value) => sum + Number(value), 0), { timeout: 30000 }).toBe(1);

  await page.locator('#btn-undo').click();
  await expect.poll(async () => (await counts.allTextContents()).reduce((sum, value) => sum + Number(value), 0)).toBe(0);
});
