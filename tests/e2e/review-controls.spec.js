const { test, expect } = require('@playwright/test');

test('analyzed PGN populates move counters and the best-move button plays a replay variation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supachess-level-diagnostic', JSON.stringify({ active: false, completed: true })));
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready', '1', { timeout: 30000 });

  await page.evaluate(() => {
    // Simulate an unassisted game mode still set while the user opens a PGN review.
    state.unassistedGame = true;
    window.__engineMoves = [];
    state.engine.analyze = async ({ fen }) => {
      const position = new Chess(fen);
      const move = position.moves({ verbose: true })[0];
      if (!move) return { lines: [] };
      const uci = move.from + move.to + (move.promotion || '');
      window.__engineMoves.push({ fen, uci });
      return { lines: [{ pv: [uci], scoreCp: 0, mate: null, depth: 8 }], bestmove: uci };
    };
    reviewAskSupa = async () => {};
  });

  await page.click('#btn-analyze-pgn');
  await page.fill('#pgn-input', '[Event "Replay controls"]\n[White "Alice"]\n[Black "Bob"]\n[Result "*"]\n\n1. e4 e5 *');
  await page.click('#btn-run-review');

  await expect.poll(() => page.evaluate(() => !reviewState.running && state.replayIdx === 2), { timeout: 15000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => state.moveGradeHistory.length)).toBe(2);
  const countTotal = () => page.locator('#move-grade-summary [data-color] [data-grade-count]').allTextContents()
    .then(values => values.reduce((sum, value) => sum + Number(value.replace('+', '')), 0));
  await expect.poll(countTotal).toBe(2);
  await expect(page.locator('#accuracy-badge')).toBeVisible();
  await expect(page.locator('#accuracy-badge')).toContainText('(Blanc) Alice');
  await expect(page.locator('#accuracy-badge')).toContainText('(Noir) Bob');
  await expect(page.locator('#accuracy-badge .accuracy-player-dot-w')).toBeVisible();
  await expect(page.locator('#accuracy-badge .accuracy-player-dot-b')).toBeVisible();

  const firstReplayMove = page.locator('#move-history [data-replay-ply="1"]');
  await firstReplayMove.click();
  await expect.poll(() => page.evaluate(() => state.replayIdx)).toBe(1);
  await expect(firstReplayMove).toHaveClass(/active/);
  await expect(firstReplayMove.locator('.mv-san')).toHaveText('e4');
  await expect(firstReplayMove.locator('.mv-quality')).toBeVisible();

  await expect(page.locator('#btn-best-move')).toBeEnabled();
  await page.click('#btn-best-move');
  await expect.poll(() => page.evaluate(() => reviewState.variation?.moves?.length || 0), { timeout: 15000 }).toBe(1);
  await expect(page.locator('#replay-label')).toContainText('Variante Stockfish');
  const played = await page.evaluate(() => {
    const item = reviewState.variation.moves[0];
    const before = new Chess(reviewState.fens[item && reviewState.variation.basePly]);
    const move = before.move({ from: item.from, to: item.to, promotion: item.promotion });
    return Boolean(move) && state.chess.fen() === before.fen();
  });
  expect(played).toBe(true);
  expect(await page.evaluate(() => reviewState.variation.moves[0].uci)).toBeTruthy();
});
