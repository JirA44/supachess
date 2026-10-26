const { test, expect } = require('@playwright/test');

test('candidate dots toggle on and off for White and Black and retain the preference', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/index.html');
  await page.waitForSelector("body[data-engine-ready='1']", { timeout: 60000 });
  const toggle = page.locator('#btn-dots');
  await expect(toggle).toHaveText('Dots : ON');
  await page.waitForFunction(() => document.querySelectorAll('#board .cdot').length > 0, { timeout: 45000 });

  await toggle.click();
  await expect(toggle).toHaveText('Dots : OFF');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#board .cdot')).toHaveCount(0);
  await page.locator(".sq[data-square='e2']").click();
  await expect(page.locator('#board .legal-hint').first()).toBeVisible();
  await expect(page.locator('#board .cdot')).toHaveCount(0);
  await toggle.click();
  await page.waitForFunction(() => document.querySelectorAll('#board .cdot').length > 0);

  await page.selectOption('#sel-color', 'b');
  await page.waitForFunction(() => document.querySelectorAll('#move-history .mv').length >= 1, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('#board .cdot').length > 0, { timeout: 45000 });
  await toggle.click();
  await expect(page.locator('#board .cdot')).toHaveCount(0);
  await page.reload();
  await page.waitForSelector("body[data-engine-ready='1']", { timeout: 60000 });
  await expect(page.locator('#btn-dots')).toHaveText('Dots : OFF');
  await expect(page.locator('#board .cdot')).toHaveCount(0);
  await page.locator('#btn-dots').click();
  await page.waitForFunction(() => document.querySelectorAll('#board .cdot').length > 0, { timeout: 45000 });
});

test('several candidate moves on one square stay distinct and do not overlap', async ({ page }) => {
  await page.goto('/index.html');
  const coordinateSize = await page.locator('#board .coord').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  expect(coordinateSize).toBeGreaterThanOrEqual(12);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      boardUI.dots = [
        { square: 'e4', label: '★10', evaluation: '+0.11', quality: 'best', title: 'Nf6' },
        { square: 'e4', label: '✓8', evaluation: '+0.05', quality: 'good', title: 'Nc6' },
        { square: 'e4', label: '?!6', evaluation: '-0.03', quality: 'mid', title: 'd6' },
      ];
      boardUI.render(state.chess);
      const square = document.querySelector(".sq[data-square='e4']");
      const stack = square.querySelector('.cdot-stack');
      const boxes = [...stack.children].map((bubble) => {
        const rect = bubble.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
          label: bubble.querySelector('.board-bubble-grade')?.textContent,
          evaluation: bubble.querySelector('.board-bubble-eval')?.textContent };
      });
      const squareRect = square.getBoundingClientRect();
      return { boxes, square: { top: squareRect.top, bottom: squareRect.bottom, left: squareRect.left, right: squareRect.right } };
    });
    expect(layout.boxes).toHaveLength(3);
    expect(layout.boxes.map((box) => box.label)).toEqual(['★10', '✓8', '?!6']);
    expect(layout.boxes.map((box) => box.evaluation)).toEqual(['+0.11', '+0.05', '-0.03']);
    for (let i = 1; i < layout.boxes.length; i++) {
      expect(layout.boxes[i].top).toBeGreaterThanOrEqual(layout.boxes[i - 1].bottom);
    }
    expect(layout.boxes[0].left).toBeGreaterThanOrEqual(layout.square.left);
    expect(layout.boxes.at(-1).bottom).toBeLessThanOrEqual(layout.square.bottom);
  }
});
