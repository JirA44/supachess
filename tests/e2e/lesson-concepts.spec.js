const { test, expect } = require('@playwright/test');

test('filters the chess concept glossary, validates a concept and opens related lessons', async ({ page }) => {
  await page.goto('/book-lessons.html');
  const glossary = page.locator('#lesson-concept-glossary');
  await expect(glossary).toBeVisible();
  await glossary.locator('summary').first().click();
  await expect(page.locator('#lesson-concept-card-list .lesson-concept-card')).toHaveCount(80);
  await expect(page.locator('#lesson-concept-count')).toContainText(/80 (?:concepts|concept\(s\))/);

  await page.locator('#lesson-concept-family-filter').selectOption('endgames');
  await expect(page.locator('#lesson-concept-card-list .lesson-concept-card:visible')).toHaveCount(8);
  await page.locator('#lesson-concept-family-filter').selectOption('');

  await page.locator('#lesson-concept-elo-filter').selectOption('expert');
  await expect(page.locator('#lesson-concept-card-list .lesson-concept-card:visible').first()).toBeVisible();
  await page.locator('#lesson-concept-elo-filter').selectOption('');

  await page.locator('#lesson-concept-search').fill('Développer les pièces');
  await expect(page.locator('#lesson-concept-card-list .lesson-concept-card:visible')).toHaveCount(1);
  const card = page.locator('#lesson-concept-card-list [data-concept-id="develop-pieces"]');
  await card.locator('.lesson-concept-quiz-start').click();
  await expect(card.locator('.lesson-concept-choice')).toHaveCount(3);
  await card.locator('.lesson-concept-choice[data-correct="true"]').click();
  await expect(card.locator('.lesson-concept-result.is-correct')).toBeVisible();
  await expect(page.locator('#lesson-concept-status')).toContainText('1/80 concepts réussis');

  await card.locator('[data-lesson-concept-search]').click();
  await expect(page.locator('#lesson-concept-filter')).toHaveValue('develop-pieces');
  await expect(page.locator('#lesson-search')).toHaveValue('Développement');
  await expect(page.locator('#lesson-catalog .lesson-catalog-button')).not.toHaveCount(0);

  await page.locator('#lesson-concept-filter').selectOption('pawn-break');
  await expect(page.locator('#lesson-search')).toHaveValue('Rupture centrale');
  await expect(page.locator('#lesson-catalog .lesson-catalog-button')).not.toHaveCount(0);
});
