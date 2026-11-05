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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", window.SupaProfiles.renderLocalLearningPanel({}));
  });

  const report = page.locator(".profile-diagnostic-report");
  await expect(report.locator("svg")).toHaveCount(6);
  const chartFontSizes = await report.locator("svg text").evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("font-size"))));
  expect(Math.min(...chartFontSizes)).toBeGreaterThanOrEqual(12);
  await expect(report).toContainText("Moyenne par partie selon le type de coup");
  const perGameTable = report.locator('table[aria-label="Moyenne par partie en pourcentage par type de coup"]');
  await expect(perGameTable).toHaveCount(1);
  await expect(perGameTable).toContainText("Gaffes");
  await expect(perGameTable).toContainText("10,0%");
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


test("profile activity heatmap counts dated events and switches years on mobile", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("supachess_games", JSON.stringify([
      { id: "game-2026", date: "2026-01-05T12:00:00.000Z", userColor: "w", moveGrades: [] },
      { id: "game-2025", date: "2025-01-02T12:00:00.000Z", userColor: "w", moveGrades: [] },
    ]));
    localStorage.setItem("supachess_reviewed_pgns", JSON.stringify([
      { id: "analysis-2026", pgn: "[Event \"Test\"]", analyzedAt: "2026-01-06T12:00:00.000Z" },
    ]));
    localStorage.setItem("supachess-book-lessons-v1", JSON.stringify({
      "lesson-2026": { completed: true, completedAt: "2026-01-05T12:00:00.000Z" },
    }));
    localStorage.setItem("supachess-correction-progress-v1", JSON.stringify({
      "game-2026:12": { gameId: "game-2026", ply: 12, category: "blunder", completedAt: "2026-01-07T12:00:00.000Z" },
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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  await page.evaluate(() => {
    window.__profileActivityBaselinePageWidth = document.documentElement.scrollWidth;
    document.body.insertAdjacentHTML("beforeend", window.SupaProfiles.renderLocalLearningPanel({}));
  });

  const chart = page.locator(".profile-activity-section");
  await expect(chart.getByRole("button", { name: "Les 12 derniers mois" })).toHaveAttribute("aria-pressed", "true");
  await expect(chart).toContainText("Activité SupaChess");
  await expect(chart.locator(".profile-activity-summary")).toContainText("4 activités");
  await expect(chart.locator(".profile-activity-summary")).toContainText("3 jours actifs");
  await expect(chart.locator('[data-activity-day="2026-01-05"]')).toHaveAttribute("data-level", "2");
  await expect(chart.locator('[data-activity-day="2026-01-06"]')).toHaveAttribute("data-level", "1");
  await expect(chart.locator('[data-activity-day="2026-01-07"]')).toHaveAttribute("data-level", "1");

  await chart.getByRole("button", { name: "2025" }).click();
  await expect(chart.getByRole("button", { name: "2025" })).toHaveAttribute("aria-pressed", "true");
  await expect(chart.locator(".profile-activity-summary")).toContainText("1 activité");
  await expect(chart.locator(".profile-activity-summary")).toContainText("1 jour actif");
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    baselinePage: window.__profileActivityBaselinePageWidth,
    page: document.documentElement.scrollWidth,
    section: document.querySelector(".profile-activity-section").getBoundingClientRect().width,
    scroll: document.querySelector(".profile-activity-scroll").clientWidth,
    graphContent: document.querySelector(".profile-activity-scroll").scrollWidth,
  }));
  expect(widths.section).toBeLessThanOrEqual(widths.viewport);
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);
  expect(widths.page).toBeLessThanOrEqual(Math.max(widths.viewport, widths.baselinePage));
  expect(widths.graphContent).toBeGreaterThan(widths.scroll);
  await expect(chart.locator(".profile-activity-note")).toContainText("ne sont pas répartis artificiellement");
});
