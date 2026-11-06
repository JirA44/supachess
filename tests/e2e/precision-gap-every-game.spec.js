const { test, expect } = require("@playwright/test");

test("each saved game and analyzed PGN shows its precision gap", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => {
    localStorage.setItem("supachess_games", JSON.stringify([{
      id: "saved-1", date: "2026-11-05T12:00:00.000Z", pgn: "1. e4 e5 *",
      result: "1/2-1/2", accuracyW: 85.2, accuracyB: 89.9
    }]));
    localStorage.setItem("supachess_reviewed_pgns", JSON.stringify([{
      id: "reviewed-1", pgn: "1. e4 e5 *", white: "HeyoAP", black: "EGMoon",
      event: "Test", result: "1/2-1/2", analyzedAt: "2026-11-05T12:00:00.000Z",
      analysis: { version: 1, players: [
        { color: "w", accuracy: 85.2 }, { color: "b", accuracy: 89.9 }
      ] },
      correctionExercises: []
    }]));
    gamesRenderPanel();
    reviewHistoryRender();
  });

  await expect(page.locator(".game-row")).toContainText("écart 4,70 points (en faveur des Noirs)");
  await expect(page.locator(".review-history-row")).toContainText("Écart de précision : 4,70 points (en faveur de EGMoon)");
});
