const { test, expect } = require('@playwright/test');

async function startDiagnostic(page) {
  await page.evaluate(() => {
    window.startLevelDiagnostic();
    window.dispatchEvent(new Event('supachess:level-diagnostic-change'));
  });
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(page.locator('#btn-move-dots')).toBeDisabled();
  await expect(page.locator('#btn-evalbar-toggle')).toBeDisabled();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('supachess-show-candidate-dots', 'true');
    localStorage.setItem('supachess-show-legal-move-dots', 'true');
    localStorage.setItem('supachess-evalbar-visible-v1', 'true');
    localStorage.setItem('supachess-level-diagnostic', JSON.stringify({
      active: true,
      defaultActivation: false,
      startedAt: new Date().toISOString(),
      restoreDots: true,
      restoreMoveDots: true,
      restoreEvalBar: true,
      aidsInitialized: false,
    }));
  });
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready', '1', { timeout: 30000 });
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(page.locator('#btn-move-dots')).toBeDisabled();
  await expect(page.locator('#btn-evalbar-toggle')).toBeDisabled();
});

test('entering PGN analysis ends diagnostic and restores aids', async ({ page }) => {
  await page.evaluate(() => window.reviewStart('1. e4 e5 *'));
  const diagnostic = await page.evaluate(() => JSON.parse(localStorage.getItem('supachess-level-diagnostic')));
  expect(diagnostic).toMatchObject({ active: false, endedEarly: true, autoDeactivatedReason: 'analyse PGN' });
  await expect(page.locator('#btn-dots')).toBeEnabled();
  await expect(page.locator('#btn-move-dots')).toBeEnabled();
  await expect(page.locator('#btn-evalbar-toggle')).toBeEnabled();
  await expect(page.locator('#candidates-panel')).not.toBeHidden();
});

test('entering replay ends diagnostic; a new diagnostic locks aids again', async ({ page }) => {
  await startDiagnostic(page);
  await page.evaluate(() => window.reviewBeginReplay());
  const diagnostic = await page.evaluate(() => JSON.parse(localStorage.getItem('supachess-level-diagnostic')));
  expect(diagnostic).toMatchObject({ active: false, endedEarly: true, autoDeactivatedReason: 'relecture' });
  await expect(page.locator('#btn-dots')).toBeEnabled();
  await expect(page.locator('#btn-move-dots')).toBeEnabled();
  await page.evaluate(() => window.reviewRestoreAfterReplay());

  await startDiagnostic(page);
  const active = await page.evaluate(() => JSON.parse(localStorage.getItem('supachess-level-diagnostic')));
  expect(active.active).toBe(true);
  await expect(page.locator('#btn-dots')).toBeDisabled();
  await expect(page.locator('#btn-move-dots')).toBeDisabled();
  await expect(page.locator('#btn-evalbar-toggle')).toBeDisabled();
});

test('entering correction ends diagnostic and restores aids', async ({ page }) => {
  await page.evaluate(() => { window.reviewRun = async () => true; });
  await page.evaluate(async () => { await window.reviewCorrectPgn('1. e4 e5 *'); });
  const diagnostic = await page.evaluate(() => JSON.parse(localStorage.getItem('supachess-level-diagnostic')));
  expect(diagnostic).toMatchObject({ active: false, endedEarly: true, autoDeactivatedReason: 'correction' });
  await expect(page.locator('#btn-dots')).toBeEnabled();
  await expect(page.locator('#btn-move-dots')).toBeEnabled();
  await expect(page.locator('#btn-evalbar-toggle')).toBeEnabled();
});
