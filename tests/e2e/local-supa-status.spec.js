const { test, expect } = require('@playwright/test');

test('keeps the optional local Supa coach on demand and labels its status accurately', async ({ page }) => {
  const localRequests = [];
  page.on('request', (request) => {
    if (request.url().startsWith('http://localhost:8778/')) localRequests.push(request.url());
  });

  await page.goto('/index.html');
  await expect(page.locator('#supa-label')).toHaveText('Coach Supa local : à la demande');
  await expect(page.locator('#supa-dot')).not.toHaveClass(/loading/);
  await page.waitForTimeout(300);
  expect(localRequests).toEqual([]);

  const favicon = await page.request.get(new URL('favicon.svg', page.url()).toString());
  expect(favicon.status()).toBe(200);

  await page.evaluate(() => setSupaConnection(false));
  await expect(page.locator('#supa-label')).toHaveText('Coach Supa local : indisponible');
  await expect(page.locator('#supa-dot')).not.toHaveClass(/ready/);

  await page.evaluate(() => setSupaConnection(true, 'test-model'));
  await expect(page.locator('#supa-label')).toHaveText('Coach Supa local : connecté (test-model)');
  await expect(page.locator('#supa-dot')).toHaveClass(/ready/);
});
