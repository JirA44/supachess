const { test, expect } = require('@playwright/test');

const gamePgn = '[Event "ACPL gap test"]\n[White "Joueur"]\n[Black "Stockfish"]\n[Result "1-0"]\n\n1. e4 e5 *';

test('game history shows ACPL per side and the difference after PGN analysis', async ({ page }) => {
  await page.addInitScript((pgn) => {
    localStorage.setItem('supachess_games', JSON.stringify([{
      id: 'acpl-game-1', date: '2026-11-06T10:00:00.000Z', pgn, result: '1-0',
      accuracyW: 90, accuracyB: 91, userColor: 'w', engineName: 'Stockfish 19', stats: { moves: 2 }, moveGrades: [],
    }]));
    localStorage.setItem('supachess_reviewed_pgns', JSON.stringify([{
      id: 'acpl-analysis-1', pgn,
      moveGrades: [
        { ply: 1, color: 'w', lossCp: 12 }, { ply: 2, color: 'w', lossCp: 8 },
        { ply: 3, color: 'b', lossCp: 4 }, { ply: 4, color: 'b', lossCp: 8 },
      ],
    }]));
  }, gamePgn);
  await page.route('https://www.gstatic.com/firebasejs/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.route('**/js/engine.js', (route) => route.fulfill({
    status: 200, contentType: 'text/javascript',
    body: 'class StockfishEngine { constructor(){this.engineName="Test";this.ready=Promise.resolve()} async analyze(){return {bestmove:null,lines:[]}} } function parseInfoLine(){return null}',
  }));
  await page.goto('/index.html');
  const row = page.locator('.game-row[data-id="acpl-game-1"]');
  await expect(row).toContainText('ACPL B/N : 10,0 / 6,0 cp · écart : 4,0 cp (Noirs plus précis)');
});

test('per-game analysis ACPL comparison distinguishes both sides and lower loss', async ({ page }) => {
  await page.route('https://www.gstatic.com/firebasejs/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.route('**/js/engine.js', (route) => route.fulfill({
    status: 200, contentType: 'text/javascript',
    body: 'class StockfishEngine { constructor(){this.engineName="Test";this.ready=Promise.resolve()} async analyze(){return {bestmove:null,lines:[]}} } function parseInfoLine(){return null}',
  }));
  await page.goto('/index.html');
  const metrics = await page.evaluate(() => window.SupaChessReviewAcplMetrics([
    { color: 'w', lossCp: 12 }, { color: 'w', lossCp: 8 },
    { color: 'b', lossCp: 4 }, { color: 'b', lossCp: 8 },
  ]));
  expect(metrics).toEqual({ white: 10, black: 6, difference: 4, moreAccurateColor: 'b' });
});