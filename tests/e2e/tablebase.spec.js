const { test, expect } = require("@playwright/test");

test("tablebase lookup shows exact outcomes and each legal alternative", async ({ page }) => {
  let requestedUrl = "";
  await page.route("https://tablebase.lichess.org/standard?*", async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        category: "win",
        moves: [
          { uci: "g7f7", san: "Kf7", category: "loss", dtz: -3 },
          { uci: "h7h8q", san: "h8=Q+", category: "loss", dtz: -4 },
          { uci: "g7g8", san: "Kg8", category: "draw", dtz: 0 }
        ]
      })
    });
  });
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => state.chess.load("4k3/6KP/8/8/8/8/7p/8 w - - 0 1"));
  await page.getByRole("button", { name: "Vérifier cette position" }).click();

  await expect(page.locator("#tablebase-summary")).toContainText("Blancs au trait : gain prouvé");
  await expect(page.locator("#tablebase-moves li")).toHaveCount(3);
  await expect(page.locator("#tablebase-moves li").first()).toContainText("Kf7");
  await expect(page.locator("#tablebase-moves li").first()).toContainText("défaite prouvée");
  expect(decodeURIComponent(requestedUrl)).toContain("4k3/6KP/8/8/8/8/7p/8_w_-_-_0_1");
});

test("tablebase refuses positions outside complete seven-piece scope without querying", async ({ page }) => {
  let requestCount = 0;
  await page.route("https://tablebase.lichess.org/standard?*", async (route) => {
    requestCount++;
    await route.fulfill({ status: 404, body: "{}" });
  });
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => state.chess.reset());
  await page.getByRole("button", { name: "Vérifier cette position" }).click();
  await expect(page.locator("#tablebase-status")).toContainText("Hors couverture complète : 32 pièces");
  expect(requestCount).toBe(0);
});

test("tablebase refuses castling and en-passant rights", async ({ page }) => {
  await page.goto("/index.html");
  const reasons = await page.evaluate(() => [
    SupaTablebase.eligibilityMessage("4k3/8/8/8/8/8/4K3/R7 w Q - 0 1"),
    SupaTablebase.eligibilityMessage("4k3/8/8/8/8/8/4K3/R7 w - e6 0 1")
  ]);
  expect(reasons[0]).toContain("droit au roque");
  expect(reasons[1]).toContain("prise en passant");
});
