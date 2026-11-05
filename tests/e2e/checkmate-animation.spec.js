const { test, expect } = require('@playwright/test');

async function showCheckmate(page, moves, flipped, kingSquare, direction, statusText) {
  await page.goto('/index.html');
  await page.waitForFunction(() => document.body.dataset.engineReady === '1');
  await page.evaluate(({ moves, flipped }) => {
    state.gen++;
    try { state.engine?.stop?.(); } catch (_) {}
    state.chess.reset();
    for (const san of moves) {
      if (!state.chess.move(san)) throw new Error('Invalid setup move: ' + san);
    }
    if (!state.chess.in_checkmate()) throw new Error('Setup position is not checkmate');
    boardUI.setFlipped(flipped);
    boardUI.mateFall = null;
    boardUI.mateFallAnimated = false;
    checkGameOver();
  }, { moves, flipped });

  const king = page.locator(`.sq[data-square="${kingSquare}"] .piece.checkmate-king`);
  await expect(king).toHaveClass(new RegExp(`checkmate-king-fall-${direction}`));
  await expect(king).toHaveCSS('animation-name', `supa-king-topple-${direction}`);
  await expect(page.locator('#status')).toContainText(statusText);
}

test('mated white king falls toward the white side', async ({ page }) => {
  await showCheckmate(
    page,
    ['f3', 'e5', 'g4', 'Qh4#'],
    false,
    'e1',
    'bottom',
    'échec et mat, vous avez perdu'
  );
});

test('mated black king falls toward the black side', async ({ page }) => {
  await showCheckmate(
    page,
    ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'],
    false,
    'e8',
    'top',
    'échec et mat, vous avez gagné'
  );
});

test('mated king settles without motion when reduced motion is enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');
  await page.waitForFunction(() => document.body.dataset.engineReady === '1');
  await page.evaluate(() => {
    state.gen++;
    try { state.engine?.stop?.(); } catch (_) {}
    state.chess.reset();
    for (const san of ['f3', 'e5', 'g4', 'Qh4#']) state.chess.move(san);
    boardUI.setFlipped(false);
    checkGameOver();
  });
  const king = page.locator('.sq[data-square="e1"] .piece.checkmate-king');
  await expect(king).toHaveCSS('animation-name', 'none');
  await expect(king).toHaveClass(/checkmate-king-fall-bottom/);
});
