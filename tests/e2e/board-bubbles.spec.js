const { test, expect } = require('@playwright/test');

async function preparePracticeMode(page) {
  await page.addInitScript(() => {
    localStorage.setItem('supachess-level-diagnostic', JSON.stringify({
      active: false, completed: true, analyzedGamesAtCompletion: 10
    }));
  });
}

test('several candidate moves on one square stay distinct and do not overlap', async ({ page }) => {
  await preparePracticeMode(page);
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
          evaluation: bubble.querySelector('.board-bubble-eval')?.textContent, fontSize: getComputedStyle(bubble).fontSize };
      });
      const squareRect = square.getBoundingClientRect();
      const originalDots = boardUI.dots;
      boardUI.dots = [originalDots[0]];
      boardUI.render(state.chess);
      const singleFontSize = getComputedStyle(document.querySelector(".sq[data-square='e4'] .cdot")).fontSize;
      boardUI.dots = originalDots;
      boardUI.render(state.chess);
      return { boxes, singleFontSize, square: { top: squareRect.top, bottom: squareRect.bottom, left: squareRect.left, right: squareRect.right } };
    });
    expect(layout.boxes).toHaveLength(3);
    expect(layout.boxes.map((box) => box.label)).toEqual(['★10', '✓8', '?!6']);
    expect(layout.boxes.map((box) => box.evaluation)).toEqual(['+0.11', '+0.05', '-0.03']);
    expect(layout.boxes.map((box) => box.fontSize)).toEqual(Array(3).fill(layout.singleFontSize));
    for (let i = 1; i < layout.boxes.length; i++) {
      expect(layout.boxes[i].top).toBeGreaterThanOrEqual(layout.boxes[i - 1].bottom);
    }
    expect(layout.boxes[0].left).toBeGreaterThanOrEqual(layout.square.left);
  }
});


test('candidate bubbles toggle off and on, and preference survives reload', async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto('/index.html');
  const toggle = page.getByRole('button', { name: 'Bulles candidates : ON' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => {
    boardUI.dots = [{ square: 'e4', label: '★10', evaluation: '+0.11', quality: 'best', title: 'Best move' }];
    boardUI.render(state.chess);
  });
  await expect(page.locator(".sq[data-square='e4'] .cdot-stack .cdot")).toHaveCount(1);
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Bulles candidates : OFF' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.cdot-stack')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Bulles candidates : OFF' })).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => {
    boardUI.dots = [{ square: 'e4', label: '★10', evaluation: '+0.11', quality: 'best', title: 'Best move' }];
    boardUI.render(state.chess);
  });
  await expect(page.locator('.cdot-stack')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bulles candidates : OFF' }).click();
  await expect(page.locator(".sq[data-square='e4'] .cdot-stack .cdot")).toHaveCount(1);
});


test('board stylesheet cache key includes the full-size stacked bubble styles', async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto('/index.html');
  const stylesheet = page.locator('link[href*="css/style.css"]');
  await expect(stylesheet).toHaveAttribute('href', /live-move-grade-counts-20261026/);
});


test("evaluation bar keeps centipawn precision", async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto("/index.html");
  await page.evaluate(() => updateEvalBar({ scoreCp: 10, mate: null }));
  await expect(page.locator("#evalbar-label")).toHaveText("+0.10");
  await page.evaluate(() => updateEvalBar({ scoreCp: -3, mate: null }));
  await expect(page.locator("#evalbar-label")).toHaveText("-0.03");
});


test("hovering a candidate bubble shows the move to play beside it", async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => {
    state.gen++;
    state.phase = "userTurn";
    boardUI.showDots = true;
    boardUI.dots = candidateDotsFromGroups(new Map([["e4", [
      { san: "Nf3", label: "★10", evaluation: "+0.10", grade: { tone: "best" } },
    ]]]));
    boardUI.render(state.chess);
  });
  const candidate = page.locator(".sq[data-square=\"e4\"] .cdot");
  await candidate.hover();
  const tooltip = page.locator("#candidate-move-tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText("À jouer : Nf3");
  const bounds = await tooltip.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(1440);
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
});


test("each recorded half-move reports its change to the running precision average", async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1" && state.phase === "userTurn");
  const deltas = await page.evaluate(() => {
    state.gen++;
    state.phase = "userTurn";
    state.chess = new Chess();
    state.chess.load_pgn("1. e4 e5 2. Nf3 Nc6");
    state.evalHistory = [];
    recordAccuracy("w", 0, -2, 1);
    recordAccuracy("w", 0, -100, 3);
    const white = state.accuracy.lastMove.delta;
    recordAccuracy("b", 0, -2, 2);
    recordAccuracy("b", 0, -100, 4);
    const history = [...document.querySelectorAll(".move-accuracy-note")].map(note => ({
      ply: note.dataset.ply, text: note.textContent
    }));
    return { white, black: state.accuracy.lastMove.delta, history };
  });
  const formatDelta = value => Math.abs(value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  await expect(page.locator("#stat-accuracy")).toContainText("Blancs (toi)");
  await expect(page.locator("#stat-accuracy")).toContainText("−" + formatDelta(deltas.white) + "% de précision moyenne sur ce demi-coup");
  await expect(page.locator("#stat-accuracy")).toContainText("Noirs (SF)");
  await expect(page.locator("#stat-accuracy")).toContainText("−" + formatDelta(deltas.black) + "% de précision moyenne sur ce demi-coup");
  expect(deltas.history).toHaveLength(4);
  expect(deltas.history.map(note => note.ply)).toEqual(["1", "2", "3", "4"]);
  expect(deltas.history[0].text).toContain("(départ)");
  expect(deltas.history[1].text).toContain("(départ)");
  expect(deltas.history[2].text).toContain("−" + formatDelta(deltas.white) + " pp");
  expect(deltas.history[3].text).toContain("−" + formatDelta(deltas.black) + " pp");
  await page.evaluate(() => resetAccuracy());
  await expect(page.locator("#stat-accuracy")).not.toContainText("de précision moyenne sur ce demi-coup");
});


test("selecting a piece shows independent hot and cold move points and a chosen move works", async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto('/index.html');
  await page.waitForFunction(() => document.body.dataset.engineReady === '1' && state.phase === 'userTurn');
  const move = await page.evaluate(() => ({ from: state.candidates[0].uci.slice(0, 2), to: state.candidates[0].uci.slice(2, 4) }));
  await page.locator(`[data-square="${move.from}"]`).click();
  const target = page.locator(`[data-square="${move.to}"] .legal-hint`);
  await expect(target).toBeVisible();
  await expect(target).toHaveAttribute('aria-label', /coup|evaluation/i);
  await expect(target).toHaveClass(/q-best/);
  await expect(page.locator('.legal-hint')).toHaveCount(await page.evaluate(() => boardUI.legalTargets.length));

  await page.getByRole('button', { name: 'Points chauds/froids : ON' }).click();
  await expect(page.locator('.legal-hint')).toHaveCount(0);
  await expect(page.locator('.cdot-stack').first()).toBeVisible();
  await page.getByRole('button', { name: 'Points chauds/froids : OFF' }).click();
  await expect(target).toBeVisible();
  await page.getByRole('button', { name: 'Bulles candidates : ON' }).click();
  await expect(page.locator('.cdot-stack')).toHaveCount(0);
  await expect(target).toBeVisible();
  await page.getByRole('button', { name: 'Bulles candidates : OFF' }).click();
  await expect(page.locator('.cdot-stack').first()).toBeVisible();

  await page.locator(`[data-square="${move.to}"]`).click();
  await page.waitForFunction(() => state.chess.history().length >= 2 && state.phase === 'userTurn', { timeout: 45000 });

  await page.evaluate(({ from, to }) => {
    boardUI.lastMove = { from, to, san: 'Test', grade: moveGrade(80), evaluation: '-0.80' };
    boardUI.render(state.chess);
  }, move);
  await expect(page.locator(`[data-square="${move.to}"].bad-move .bad-move-marker`)).toHaveText('!');
});


test('move grade dots use eight distinct colors and brilliant is sky blue', async ({ page }) => {
  await preparePracticeMode(page);
  await page.goto('/index.html');
  const result = await page.evaluate(() => {
    const categories = ['brilliant', 'best', 'very-good', 'good', 'ok', 'inaccuracy', 'error', 'blunder'];
    boardUI.dots = categories.map((category) => ({
      square: 'e4', label: category, evaluation: '+0.00', quality: 'best', category
    }));
    boardUI.lastMove = {
      from: 'e2', to: 'e4', san: 'e4', evaluation: '+0.00',
      grade: moveGrade(5, true)
    };
    boardUI.render(state.chess);
    state.moveGradeHistory = categories.map((category, index) => ({
      ply: index + 1, color: 'w', category
    }));
    renderMoveGradeSummary();

    window.isBrilliantCandidate = (_fen, candidate) => candidate.brilliantFixture === true;
    const losses = [5, 0, 5, 15, 25, 30, 60, 200];
    state.candidates = categories.map((category, index) => ({
      rank: category === 'brilliant' ? 2 : index === 1 ? 1 : index + 1,
      uci: 'g1f3', san: 'Nf3', deltaCp: losses[index],
      brilliantFixture: category === 'brilliant',
      args: { pros: [], cons: [] }, line: { scoreCp: 0, mate: null },
      bd: null, cmp: null, reply: null
    }));
    renderCandidatesList();

    const square = document.querySelector(".sq[data-square='e4']");
    return {
      categories,
      candidateColors: [...square.querySelectorAll('.cdot-stack .cdot')].map((dot) => getComputedStyle(dot).backgroundColor),
      playedColor: getComputedStyle(square.querySelector('.played-move-bubble')).backgroundColor,
      listColors: [...document.querySelectorAll('#candidates-list .cl-dot')].map((dot) => getComputedStyle(dot).backgroundColor),
      summaryColors: categories.map((category) => getComputedStyle(
        document.querySelector('.move-grade-count-row.grade-' + category + ' .move-grade-count-dot')
      ).backgroundColor),
      brilliantCategory: moveGradeCategory(20, true, false)
    };
  });

  expect(result.candidateColors).toHaveLength(8);
  expect(new Set(result.candidateColors).size).toBe(8);
  expect(result.candidateColors[0]).toBe('rgb(192, 132, 252)');
  expect(result.candidateColors[2]).toBe('rgb(163, 230, 53)');
  expect(result.candidateColors[3]).toBe('rgb(45, 212, 191)');
  expect(result.candidateColors[4]).toBe('rgb(250, 204, 21)');
  expect(result.playedColor).toBe('rgb(192, 132, 252)');
  expect(result.summaryColors).toEqual(result.candidateColors);
  expect(result.listColors).toHaveLength(8);
  expect(new Set(result.listColors).size).toBe(8);
  expect(result.listColors).toEqual(result.candidateColors);
  expect(result.brilliantCategory).toBe('brilliant');
});
