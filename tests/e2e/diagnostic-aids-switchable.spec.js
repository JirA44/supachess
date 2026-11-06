const { test, expect } = require("@playwright/test");

test("diagnostic keeps aid controls switchable while coaching stays off", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("supachess-level-diagnostic", JSON.stringify({
      active: true,
      defaultActivation: true,
      startedAt: new Date(Date.now() - 1000).toISOString(),
      restoreDots: true,
      restoreMoveDots: true,
      restoreEvalBar: true,
      aidsInitialized: false
    }));
    localStorage.setItem("supachess-show-candidate-dots", "true");
    localStorage.setItem("supachess-show-legal-move-dots", "true");
    localStorage.setItem("supachess-evalbar-visible-v1", "true");
  });

  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");

  const controls = [
    ["btn-dots", "Bulles candidates : OFF"],
    ["btn-move-dots", "Points chauds/froids : OFF"],
    ["btn-evalbar-toggle", "Barre d’évaluation : OFF"]
  ];
  for (const [id, label] of controls) {
    const button = page.locator("#" + id);
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toHaveText(label);
  }
  await expect(page.locator("#btn-best-move")).toBeDisabled();
  await expect(page.locator("#coach-panel")).toBeHidden();
  await expect(page.locator("#candidates-panel")).not.toBeHidden();
  await expect(page.locator(".evalbar")).toBeHidden();

  await page.evaluate(() => {
    const original = window.gamesMarkTrainingAidUsed;
    window.__trainingAidMarkCalls = 0;
    window.gamesMarkTrainingAidUsed = () => {
      window.__trainingAidMarkCalls += 1;
      original();
    };
  });

  for (const [id] of controls) {
    const button = page.locator("#" + id);
    await button.click();
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toContainText("ON");
    await expect(page.locator("#btn-best-move")).toBeDisabled();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toContainText("OFF");
  }

  await expect.poll(() => page.evaluate(() => window.__trainingAidMarkCalls)).toBeGreaterThan(0);
  await expect(page.locator("#btn-best-move")).toBeDisabled();

  await page.evaluate(() => {
    const id = String(Date.now()) + "-aided";
    localStorage.setItem("supachess_games", JSON.stringify([{
      id,
      engineName: "Stockfish 19",
      stockfishRatingSource: "supachess-engine-setting-v1",
      result: "1-0",
      stats: { moves: 2 },
      trainingAidsUsed: true
    }]));
    refreshLevelDiagnosticProgress();
  });
  await expect(page.locator("#level-diagnostic-banner")).toContainText("0/10 parties terminées");
});
