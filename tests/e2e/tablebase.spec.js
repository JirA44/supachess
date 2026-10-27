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
          { uci: "h7h8q", san: "h8=Q+", category: "loss", dtz: -4 },
          { uci: "g7f6", san: "Kf6", category: "loss", dtz: -3 },
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
  await expect(page.locator("#tablebase-moves li").first()).toContainText("h8=Q+");
  await expect(page.locator("#tablebase-moves li").first()).toContainText("défaite prouvée");
  expect(decodeURIComponent(requestedUrl)).toContain("4k3/6KP/8/8/8/8/7p/8_w_-_-_0_1");
});

test("tablebase refuses positions beyond the OP1 nine-piece query scope without querying", async ({ page }) => {
  let requestCount = 0;
  await page.route("https://tablebase.lichess.org/standard?*", async (route) => {
    requestCount++;
    await route.fulfill({ status: 404, body: "{}" });
  });
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => state.chess.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1"));
  await page.getByRole("button", { name: "Vérifier cette position" }).click();
  await expect(page.locator("#tablebase-status")).toContainText("Hors couverture : 32 pièces");
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

test("tablebase result is cleared when the board moves to another position", async ({ page }) => {
  await page.route("https://tablebase.lichess.org/standard?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ category: "win", moves: [{ uci: "h7h8q", san: "h8=Q+", category: "loss" }] })
    });
  });
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => state.chess.load("4k3/6KP/8/8/8/8/7p/8 w - - 0 1"));
  await page.getByRole("button", { name: "Vérifier cette position" }).click();
  await expect(page.locator("#tablebase-result")).toBeVisible();
  await page.evaluate(() => state.chess.load("4k3/8/8/8/8/8/4K3/R7 w - - 0 1"));
  await expect(page.locator("#tablebase-result")).toBeHidden();
  await expect(page.locator("#tablebase-status")).toContainText("La position a changé");
});

test("tablebase requests partial OP1 data for eligible eight-piece positions", async ({ page }) => {
  let requestedUrl = "";
  await page.route("https://tablebase.lichess.org/standard?*", async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        category: "maybe-win",
        dtc: 8,
        moves: [{ uci: "a8a7", san: "Ra7", category: "maybe-loss", dtc: -4 }]
      })
    });
  });
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => state.chess.load("R7/8/8/8/7q/2K1B2p/7P/2Bk4 w - - 0 1"));
  await page.getByRole("button", { name: "Vérifier cette position" }).click();

  await expect(page.locator("#tablebase-summary")).toContainText("gain possible");
  await expect(page.locator("#tablebase-summary")).toContainText("recherche OP1 partielle (8 pièces)");
  await expect(page.locator("#tablebase-summary")).toContainText("DTC 8");
  await expect(page.locator("#tablebase-moves li").first()).toContainText("DTC -4");
  expect(new URL(requestedUrl).searchParams.get("dtc")).toBe("auxiliary");
});

test("tablebase labels ten-piece positions as unsupported", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator("#tablebase-status")).toContainText("jusqu’à 7 pièces");
  const message = await page.evaluate(() =>
    SupaTablebase.eligibilityMessage("4k3/8/8/8/8/8/PPPPPPPP/4K3 w - - 0 1")
  );
  expect(message).toContain("Hors couverture : 10 pièces");
});
