const { test, expect } = require('@playwright/test');

test('level diagnostic locks candidate and legal-move hints until ten new PGNs are analyzed', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('level-diagnostic-e2e-seeded')) return;
    localStorage.clear();
    localStorage.setItem('supachess-show-candidate-dots', 'true');
    localStorage.setItem('supachess-show-legal-move-dots', 'true');
    sessionStorage.setItem('level-diagnostic-e2e-seeded', 'true');
  });
  await page.goto('/index.html');
  const panel = page.locator('#review-insights-panel');
  const toggle = panel.locator('[data-level-diagnostic-toggle]');
  await expect(toggle).toHaveText('Diagnostic actif — arrêter');
  await expect(page.locator('#level-diagnostic-banner')).toContainText('activé par défaut');
  await expect(page.locator('#level-diagnostic-banner')).toContainText('0/10');
  await expect(panel.locator('[data-level-diagnostic-status]')).toContainText('0/10');
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(page.locator('#btn-move-dots')).toBeDisabled();
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(page.locator('#btn-move-dots')).toBeDisabled();
  await expect(panel.locator('[data-level-diagnostic-status]')).toContainText('0/10');
  const hiddenHints = await page.evaluate(() => {
    boardUI.dots = [{ square: 'e4', label: '★1', quality: 'best' }];
    boardUI.legalTargets = ['e4'];
    boardUI.render(state.chess);
    return {
      bubbles: document.querySelectorAll('.cdot').length,
      legalPoints: document.querySelectorAll('.legal-hint').length,
      candidateSetting: boardUI.showDots,
      legalSetting: boardUI.showMoveDots,
    };
  });
  expect(hiddenHints).toEqual({ bubbles: 0, legalPoints: 0, candidateSetting: false, legalSetting: false });

  await page.reload();
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(page.locator('#btn-move-dots')).toBeDisabled();
  await expect(panel.locator('[data-level-diagnostic-status]')).toContainText('0/10');
  await page.evaluate(() => {
    const diagnostic = JSON.parse(localStorage.getItem('supachess-level-diagnostic'));
    const analysis = { version: 1, players: [{ ratedMoves: 20 }] };
    const analyzedAt = new Date(Date.parse(diagnostic.startedAt) + 1000).toISOString();
    const games = Array.from({ length: 10 }, (_, index) => ({
      id: 'diagnostic-' + index,
      pgn: 'diagnostic game ' + index,
      analysis,
      analyzedAt,
    }));
    localStorage.setItem('supachess_reviewed_pgns', JSON.stringify(games));
    reviewHistoryRender();
  });
  await expect(panel.locator('[data-level-diagnostic-status]')).toContainText('Diagnostic terminé sur 10 parties');
  await expect(page.locator('#btn-dots')).toBeEnabled();
  await expect(page.locator('#btn-move-dots')).toBeEnabled();
  await expect(page.locator('#btn-dots')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#btn-move-dots')).toHaveAttribute('aria-pressed', 'true');

  await toggle.click();
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(toggle).toHaveText('Diagnostic actif — arrêter');
  await toggle.click();
  await expect(page.locator('#btn-dots')).toBeEnabled();
  await expect(page.locator('#btn-move-dots')).toBeEnabled();
  await expect(panel.locator('[data-level-diagnostic-status]')).toContainText('interrompu');
});
