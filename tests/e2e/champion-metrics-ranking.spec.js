const { test, expect } = require("@playwright/test");

async function analyze(page, player, pgn) {
  await page.locator("#champion-player").selectOption(player);
  await page.locator("#champion-movetime").selectOption("150");
  await page.locator("#champion-game-limit").selectOption("5");
  await page.locator("#champion-pgn").fill(pgn);
  await page.locator("#champion-analyze").click();
  await expect(page.locator("#champion-analysis-status")).toHaveAttribute("data-state", "success", { timeout: 30000 });
}

test("champion page ranks analyzed players for every comparable metric", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("supachess-champion-metrics-v1"));
  await page.goto("/champion-metrics.html");
  await expect(page.getByRole("heading", { name: "Top ranking · chaque indicateur calculé" })).toBeVisible();

  await analyze(page, "carlsen", '[Event "Ranking test"]\n[White "Magnus Carlsen"]\n[Black "Opponent A"]\n[Result "1/2-1/2"]\n\n1. e4 e5 2. Nf3 Nc6 1/2-1/2');
  await analyze(page, "kasparov", '[Event "Ranking test"]\n[White "Garry Kasparov"]\n[Black "Opponent B"]\n[Result "1/2-1/2"]\n\n1. d4 d5 2. c4 e6 1/2-1/2');

  await expect(page.locator("#champion-ranking-status")).toContainText("2 joueur(s) classé(s)");
  await expect(page.locator("#champion-ranking-body tr")).toHaveCount(2);
  for (const metric of ["accuracy", "acpl", "gamesAnalyzed", "ratedMoves", "averageDepth"]) {
    await page.locator("#champion-ranking-metric").selectOption(metric);
    await expect(page.locator("#champion-ranking-body tr")).toHaveCount(2);
    await expect(page.locator("#champion-ranking-caption")).toContainText(await page.locator("#champion-ranking-metric option:checked").textContent().then(t => t.split(" · ")[0]));
  }
});
