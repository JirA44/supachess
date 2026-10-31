const { test, expect } = require("@playwright/test");

test("profile diagnostic action starts a fresh ten-game assessment", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("profile-diagnostic-test-seeded")) return;
    sessionStorage.setItem("profile-diagnostic-test-seeded", "1");
    localStorage.setItem("supachess-level-diagnostic", JSON.stringify({
      active: false,
      completed: true,
      restoreDots: true,
      restoreMoveDots: true,
    }));
  });
  await page.route("https://www.gstatic.com/firebasejs/**", (route) => route.fulfill({
    status: 200, contentType: "text/javascript", body: "",
  }));
  await page.route("**/js/engine.js", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: `class StockfishEngine {
      constructor() { this.engineName = "Test Engine"; this.ready = Promise.resolve(); }
      async analyze() { return { bestmove: null, lines: [] }; }
    }
    function parseInfoLine() { return null; }`,
  }));

  await page.goto("/index.html");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", window.SupaProfiles.renderLocalLearningPanel({}));
  });
  await page.getByRole("button", { name: "🧭 Passer le diagnostic de niveau" }).click();

  await expect.poll(() => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("supachess-level-diagnostic") || "null");
    return value && value.active && value.defaultActivation === false && value.startedAt;
  })).toBeTruthy();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("supachess-level-diagnostic")).restoreDots
  )).toBe(true);
  await expect(page).toHaveURL(/#level-diagnostic-banner$/);
  await expect(page.locator("#btn-dots")).toBeDisabled();
  await expect(page.locator("#btn-move-dots")).toBeDisabled();
});


test("completed diagnostic profile renders labeled charts and legends in Chromium", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const started = Date.now() - 60_000;
    localStorage.setItem("supachess-level-diagnostic", JSON.stringify({
      active: false,
      completed: true,
      startedAt: new Date(started).toISOString(),
      analyzedGamesAtCompletion: 10,
    }));
    const pgn = '[Event "Diagnostic test"]\n[White "Joueur"]\n[Black "Stockfish"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 1-0';
    const games = Array.from({ length: 10 }, (_, gameIndex) => ({
      id: String(started + gameIndex * 1000) + "-radar",
      engineName: "Stockfish 19",
      result: "1-0",
      stats: { moves: 30 },
      userColor: "w",
      pgn,
      moveGrades: Array.from({ length: 20 }, (_, moveIndex) => ({
        ply: moveIndex + 1,
        color: "w",
        category: moveIndex % 11 === 0 ? "blunder" : moveIndex % 5 === 0 ? "inaccuracy" : "best",
      })),
    }));
    localStorage.setItem("supachess_games", JSON.stringify(games));
  });
  await page.route("https://www.gstatic.com/firebasejs/**", (route) => route.fulfill({
    status: 200, contentType: "text/javascript", body: "",
  }));
  await page.route("**/js/engine.js", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: `class StockfishEngine {
      constructor() { this.engineName = "Test Engine"; this.ready = Promise.resolve(); }
      async analyze() { return { bestmove: null, lines: [] }; }
    }
    function parseInfoLine() { return null; }`,
  }));

  await page.goto("/index.html");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", window.SupaProfiles.renderLocalLearningPanel({}));
  });

  const report = page.locator(".profile-diagnostic-report");
  await expect(report.locator("svg")).toHaveCount(5);
  await expect(report).toContainText("Catégorie de coup");
  await expect(report).toContainText("Part des demi-coups notés (%)");
  await expect(report).toContainText("Numéro de partie · ordre chronologique");
  await expect(report).toContainText("Profondeur : perspective visuelle");
  await expect(report.locator('ul[aria-label="Légende des catégories"]')).toHaveCount(2);
  await expect(report).toContainText("Légende");
  await testInfo.attach("diagnostic-charts.png", {
    body: await report.screenshot(),
    contentType: "image/png",
  });
});
