const { test, expect } = require('@playwright/test');

test('searches chess concepts and opens related academy lessons', async ({ page }) => {
  await page.goto('/book-lessons.html');
  const glossary = page.locator('#lesson-concept-glossary');
  await expect(glossary).toBeVisible();
  await glossary.locator('summary').click();
  await expect(page.locator('#lesson-concept-card-list .lesson-concept-card')).toHaveCount(16);

  await page.locator('#lesson-concept-search').fill('développement');
  await expect(page.locator('#lesson-concept-card-list .lesson-concept-card:visible')).toHaveCount(1);
  await page.locator('#lesson-concept-card-list [data-lesson-concept-search="Développement"]').click();
  await expect(page.locator('#lesson-search')).toHaveValue('Développement');
  await expect(page.locator('#lesson-catalog .lesson-catalog-button')).not.toHaveCount(0);
});
