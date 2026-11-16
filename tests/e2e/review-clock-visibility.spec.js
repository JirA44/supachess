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


test('starting a self-play game clears the previously loaded PGN replay', async ({ page }) => {
  await page.goto('/index.html');
  await expect.poll(() => page.locator('body').getAttribute('data-engine-ready'), { timeout: 30000 }).toBe('1');

  await page.evaluate(() => {
    const start = new Chess().fen();
    const after = new Chess();
    after.move('e4');
    reviewState.fens = [start, after.fen()];
    reviewState.moves = [{ san: 'e4', from: 'e2', to: 'e4', color: 'w' }];
    reviewState.grades = [{ category: 'best' }];
    reviewState.moveGrades = [{ ply: 1, color: 'w', san: 'e4', category: 'best' }];
    reviewState.correctionExercises = [{ ply: 1 }];
    reviewState.currentHeaders = { White: 'Ancien joueur', Black: 'Ancien adversaire' };
    reviewState.gameSummary = { headers: reviewState.currentHeaders, players: [] };
    reviewState.sessionStats = { moves: 1 };
    reviewState.returnState = { state: {}, boardUI: {} };
    reviewState.variation = { basePly: 0, moves: [] };
    document.querySelector('#review-panel').classList.remove('hidden');
    document.querySelector('#replay-bar').classList.remove('hidden');
    document.querySelector('#review-report').textContent = 'Ancienne partie';
    document.querySelector('#btn-replay-game').classList.remove('hidden');
    window.SupaReplayHistory = { moves: ['e4'], currentPly: 1 };
  });

  await page.getByRole('button', { name: 'Jouer contre soi-même' }).click();
  await expect(page.locator('#review-panel')).toBeHidden();
  await expect(page.locator('#replay-bar')).toBeHidden();
  await expect.poll(() => page.evaluate(() => ({
    gameMode: state.gameMode,
    fen: state.chess.fen(),
    reviewFens: reviewState.fens.length,
    replayMoves: reviewState.moves.length,
    replayState: reviewState.returnState,
    replayHistory: window.SupaReplayHistory
  }))).toEqual({
    gameMode: 'self-play',
    fen: new Chess().fen(),
    reviewFens: 0,
    replayMoves: 0,
    replayState: null,
    replayHistory: null
  });
});
