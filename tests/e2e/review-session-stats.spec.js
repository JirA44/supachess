const { test, expect } = require("@playwright/test");

test("analyzed PGN populates session progress without inventing unavailable ranks", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  const rendered = await page.evaluate(() => {
    if (typeof reviewBuildSessionStats !== "function" || typeof renderStats !== "function") return false;
    reviewState.sessionStats = reviewBuildSessionStats([
      { color: "w", rank: 1, accuracy: 100 },
      { color: "b", rank: 2, accuracy: 70 },
      { color: "w", rank: null, accuracy: 55 },
      { color: "b", rank: 1, accuracy: null },
    ]);
    renderStats();
    return true;
  });

  expect(rendered).toBe(true);
  await expect(page.locator("#stat-moves")).toHaveText("Blancs 2 · Noirs 2");
  await expect(page.locator("#stat-top1")).toHaveText("Blancs 50 % (1/2) · Noirs 50 % (1/2)");
  await expect(page.locator("#stat-top3")).toHaveText("Blancs ≥ 50 % (1/2) · Noirs ≥ 100 % (2/2)");
  await expect(page.locator("#stat-top50")).toHaveAttribute("title", /deux premières lignes Stockfish/);
  await expect(page.locator("#stat-accuracy-60")).toHaveText("Blancs 50 % (1/2) · Noirs 100 % (1/1)");
  await expect(page.locator("#stat-intercepts")).toHaveText("—");
  await expect(page.locator("#stat-forced")).toHaveText("—");
});
