const { test, expect } = require('@playwright/test');

test('Supa vs Supa shows the position evaluation and grades each played half-move', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supachess-level-diagnostic', JSON.stringify({ active: false, completed: true })));
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  await page.evaluate(() => {
    state.engine.analyze = async ({ fen }) => {
      const position = new Chess(fen);
      const move = position.moves({ verbose: true })[0];
      if (!move) return { lines: [], bestmove: '(none)' };
      const uci = move.from + move.to + (move.promotion || '');
      return { lines: [{ pv: [uci], scoreCp: position.turn() === 'w' ? 100 : -100, mate: null, depth: 8 }], bestmove: uci };
    };
    window.SupaChessStartSupaVsSupa();
  });

  await expect.poll(() => page.evaluate(() => state.moveGradeHistory.find((entry) => entry.ply === 1)?.category), { timeout: 15000 }).toBe('best');
  await expect(page.locator('#evalbar-label')).toHaveText('Blancs +1.00');
  await expect(page.locator('#move-grade-summary')).toBeVisible();
  await expect(page.locator('#move-grade-summary [data-grade-count]')).not.toHaveText('0');
  await expect(page.locator('#move-history .mv-quality')).toContainText('★');
  await page.evaluate(() => stopCurrentGame());
});

