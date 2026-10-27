const { test, expect } = require('@playwright/test');

test('tracks finished Stockfish games separately from official FIDE-tagged PGNs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  const saved = await page.evaluate(() => {
    document.getElementById('sel-elo').value = '2400';
    document.getElementById('sel-movetime').value = '3000';
    state.userColor = 'w';
    state.chess = new Chess();
    gamesNewEntry();
    state.chess.move('e4');
    gamesAutoSave();
    return gamesLoad().at(-1);
  });
  expect(saved.engineName).toMatch(/Stockfish/i);
  expect(saved.userColor).toBe('w');
  expect(saved.stockfishRatingEstimate).toBe(2400);
  expect(saved.stockfishRatingSource).toBe('supachess-engine-setting-v1');
  expect(saved.pgn).toContain('[SupaChessOpponentRatingEstimate "2400"]');
  expect(saved.pgn).not.toContain('[WhiteElo "2400"]');

  await page.evaluate(() => {
    const samples = Array.from({ length: 10 }, (_, index) => ({
      id: 'sf-sample-' + index,
      pgn: '[Event "Stockfish sample"]',
      engineName: 'Stockfish 19',
      stockfishRatingSource: 'supachess-engine-setting-v1',
      stockfishRatingEstimate: 2400,
      userColor: index < 5 ? 'w' : 'b',
      result: index < 3 ? '1-0' : index < 5 ? '0-1' : index < 7 ? '0-1' : '1-0',
    }));
    samples.push(
      { id: 'legacy', result: '1-0', pgn: '[Event "Old game"]' },
      { id: 'unfinished', engineName: 'Stockfish 19', stockfishRatingSource: 'supachess-engine-setting-v1',
        stockfishRatingEstimate: 2400, userColor: 'w', result: '*' }
    );
    localStorage.setItem('supachess_games', JSON.stringify(samples));
    gamesRenderPanel();
  });
  await expect(page.locator('#stockfish-performance-estimate')).toContainText('Estimation provisoire : 2 400 FIDE-like');
  await expect(page.locator('#stockfish-performance-estimate')).toContainText('10 parties terminées');
  await expect(page.locator('#stockfish-performance-estimate')).toContainText('non calibré officiellement FIDE');
  expect(errors).toEqual([]);
});
