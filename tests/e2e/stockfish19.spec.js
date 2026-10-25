const { test, expect } = require('@playwright/test');

test('runs the bundled Stockfish 19 worker and produces a legal move', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');
  const result = await page.evaluate(async () => {
    const analysis = await state.engine.analyze({ fen:new Chess().fen(), multipv:1, movetime:100, elo:0 });
    return { name:state.engine.engineName, bestmove:analysis.bestmove, pv:analysis.lines[0]?.pv || [] };
  });
  expect(result.name).toMatch(/Stockfish 19/i);
  expect(result.bestmove).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
  expect(result.pv[0]).toBe(result.bestmove);
  expect(errors).toEqual([]);
});

