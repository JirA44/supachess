const { test, expect } = require('@playwright/test');

test('several candidate moves on one square stay distinct and do not overlap', async ({ page }) => {
  await page.goto('/index.html');
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


test('candidate dots toggle off and on, and preference survives reload', async ({ page }) => {
  await page.goto('/index.html');
  const toggle = page.getByRole('button', { name: 'Dots : ON' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => {
    boardUI.dots = [{ square: 'e4', label: '★10', evaluation: '+0.11', quality: 'best', title: 'Best move' }];
    boardUI.render(state.chess);
  });
  await expect(page.locator(".sq[data-square='e4'] .cdot-stack .cdot")).toHaveCount(1);
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Dots : OFF' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.cdot-stack')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Dots : OFF' })).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => {
    boardUI.dots = [{ square: 'e4', label: '★10', evaluation: '+0.11', quality: 'best', title: 'Best move' }];
    boardUI.render(state.chess);
  });
  await expect(page.locator('.cdot-stack')).toHaveCount(0);
  await page.getByRole('button', { name: 'Dots : OFF' }).click();
  await expect(page.locator(".sq[data-square='e4'] .cdot-stack .cdot")).toHaveCount(1);
});
