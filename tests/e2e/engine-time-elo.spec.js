const { test, expect } = require('@playwright/test');

test('shows a time-sensitive FIDE-like estimate and gives the opponent the selected search time', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  const estimates = await page.evaluate(() => {
    const elo = document.getElementById('sel-elo');
    const time = document.getElementById('sel-movetime');
    elo.value = '0';
    time.value = '3000';
    updateOpponentFideEstimate();
    const deep = document.getElementById('opponent-fide-estimate').textContent;
    time.value = '800';
    updateOpponentFideEstimate();
    const quick = document.getElementById('opponent-fide-estimate').textContent;
    return { deep, quick };
  });
  expect(estimates.deep).toContain('3 500 Elo FIDE-like');
  expect(estimates.deep).toContain('3 s');
  expect(estimates.quick).toContain('3 430 Elo FIDE-like');
  expect(estimates.quick).toContain('0,8 s');
  expect(estimates.quick).not.toBe(estimates.deep);

  const engineTimes = await page.evaluate(async () => {
    document.getElementById('sel-elo').value = '0';
    document.getElementById('sel-movetime').value = '3000';
    const times = [];
    state.engine.analyze = async (options) => {
      times.push(options.movetime);
      const move = new Chess(options.fen).moves({ verbose: true })[0];
      const uci = move.from + move.to + (move.promotion || '');
      const line = { multipv: 1, depth: 8, scoreCp: 0, mate: null, pv: [uci] };
      return { bestmove: uci, lines: [line] };
    };
    window.startTurn = () => {};
    state.userColor = 'b';
    state.chess = new Chess();
    state.phase = 'userTurn';
    state.pendingMove = null;
    state.fenHistory = [fenKey(state.chess.fen())];
    state.evalHistory = [];
    state.accuracy = { w: [], b: [], pendingEngine: null };
    await playEngineMove();
    return times;
  });
  expect(engineTimes).toContain(1200); // Fast baseline used to grade the opponent's move.
  expect(engineTimes).toContain(3000); // Selected deep think time used for the opponent move.
  expect(errors).toEqual([]);
});


test('offers distinct 50-point Stockfish UCI levels and reports the running-accuracy change', async ({ page }) => {
  await page.goto('/index.html');
  const levels = await page.locator('#sel-elo option').evaluateAll(options =>
    options.map(option => Number(option.value)).filter(value => value >= 2400 && value <= 3150)
  );
  expect(levels).toEqual(Array.from({ length: 16 }, (_, index) => 2400 + index * 50));

  const result = await page.evaluate(() => {
    state.accuracy = { w: [], b: [], pendingEngine: null, lastMove: null };
    recordAccuracy('w', 0, -100);
    const previousAverage = avgAccuracy(state.accuracy.w);
    recordAccuracy('w', 0, -300);
    return {
      previousAverage,
      average: avgAccuracy(state.accuracy.w),
      delta: state.accuracy.lastMove.delta,
      badge: document.getElementById('accuracy-badge').textContent
    };
  });
  expect(result.delta).toBeCloseTo(result.average - result.previousAverage, 10);
  expect(result.badge).toContain('précision moyenne sur ce demi-coup');
  expect(result.badge).toContain('−' + Math.abs(result.delta).toFixed(2) + '%');
});
