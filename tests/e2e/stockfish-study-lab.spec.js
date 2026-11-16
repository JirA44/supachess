const { test, expect } = require("@playwright/test");

test("Supa-vs-Supa games become local Stockfish-reviewed exercises", async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    localStorage.removeItem("supachess-stockfish-study-audit-v1");
    localStorage.removeItem("supachess-stockfish-derived-lessons-v1");
    localStorage.removeItem("supachess-book-lessons-v1");
    localStorage.setItem("supachess_games", JSON.stringify([{
      id: "browser-selfplay-test", gameNumber: 902, selfPlayMode: "supa-vs-supa",
      engineName: "Supa contre Supa · Stockfish 19", result: "1-0", stopped: false, abandoned: false,
      pgn: '[White "Supa Blancs"]\n[Black "Supa Noirs"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0'
    }, {
      id: "browser-stockfish-test", gameNumber: 903, selfPlayMode: null,
      engineName: "Stockfish 19", result: "0-1", stopped: false, abandoned: false,
      pgn: '[White "Joueur"]\n[Black "Stockfish 19"]\n[SupaChessOpponent "Stockfish 19"]\n[Result "0-1"]\n\n1. d4 d5 2. c4 e6 0-1'
    }]));
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/book-lessons.html");
  await page.getByRole("button", { name: "Analyser les parties contre un moteur" }).click();
  const status = page.locator("[data-sf-status]");
  await expect.poll(async () => status.textContent(), { timeout: 120000 }).toMatch(/exercice\(s\) créé\(s\)|exercice\(s\) sauvegardé\(s\)/i);
  const audit = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("supachess-stockfish-study-audit-v1") || "{}"))
    .filter((record) => record.kind === "selfplay" || record.kind === "engine-game"));
  expect(audit).toHaveLength(8);
  expect(audit[0].sourceGameNumber).toBe(902);
  expect(audit[0].playedSan).toBeTruthy();
  const generated = await page.evaluate(() => JSON.parse(localStorage.getItem("supachess-stockfish-derived-lessons-v1") || "[]")
    .filter((lesson) => lesson.reference && lesson.reference.includes("Partie contre Stockfish 19 n°903")));
  expect(generated.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("Stockfish audits the full Academy and tactic corpus, then creates a legal mastery exercise", async ({ page }) => {
  test.setTimeout(300000);
  await page.addInitScript(() => {
    localStorage.removeItem("supachess-stockfish-study-audit-v1");
    localStorage.removeItem("supachess-stockfish-derived-lessons-v1");
    localStorage.removeItem("supachess-book-lessons-v1");
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/book-lessons.html");
  await expect(page.getByRole("heading", { name: "Atelier Stockfish · audit et nouvelles maîtrises" })).toBeVisible();
  await page.getByRole("button", { name: "Auditer tout le corpus" }).click();
  const status = page.locator("[data-sf-status]");
  await expect.poll(async () => status.textContent(), { timeout: 300000 }).toMatch(/exercice\(s\) créé\(s\)|exercice\(s\) sauvegardé\(s\)|aucun exercice automatique/i);
  const audited = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("supachess-stockfish-study-audit-v1") || "{}")).filter(record => Array.isArray(record.choices)));
  expect(audited.filter(record => record.kind === "puzzle")).toHaveLength(40);
  expect(audited.length).toBeGreaterThan(40);
  const generated = await page.evaluate(() => JSON.parse(localStorage.getItem("supachess-stockfish-derived-lessons-v1") || "[]"));
  expect(generated.length).toBeGreaterThan(0);
  await expect(page.locator("#lesson-title")).toBeVisible();
  await expect(page.locator("#lesson-board .sq")).toHaveCount(64);
  expect(await page.locator("#lesson-title").textContent()).toMatch(/Analyse comparative|Maîtrise moteur/);
  expect(errors).toEqual([]);
});

