import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function createServer() {
  return http.createServer((req, res) => {
    let requestPath;
    try { requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
    catch { res.writeHead(400).end("Bad request"); return; }
    if (requestPath === "/favicon.ico") { res.writeHead(204).end(); return; }
    const file = path.resolve(root, `.${requestPath === "/" ? "/index.html" : requestPath}`);
    if (file !== path.join(root, "index.html") && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(file, (error, contents) => {
      if (error) { res.writeHead(404).end("Not found"); return; }
      const type = file.endsWith(".js") || file.endsWith(".mjs") ? "text/javascript"
        : file.endsWith(".css") ? "text/css"
          : file.endsWith(".json") ? "application/json" : "text/html";
      res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }).end(contents);
    });
  });
}

function engineStub() {
  return `class StockfishEngine {
    constructor() { this.engineName = "Stockfish test isolé"; this.ready = Promise.resolve(); }
    async analyze() { return { bestmove: null, lines: [] }; }
  }
  function parseInfoLine() { return null; }`;
}

const server = createServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ headless: true });
const report = { checks: [], consoleErrors: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.consoleErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push(message.text()); });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseUrl).origin) return route.continue();
    if (/\.(js|mjs)(\?|$)/i.test(url.href)) return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
    return route.abort();
  });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("supachess-level-diagnostic", JSON.stringify({ active: false, defaultActivation: false }));
  });
  await page.route("**/js/engine.js*", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: engineStub() }));
  await page.goto(baseUrl);
  await page.waitForFunction(() => document.body.dataset.engineReady === "1", { timeout: 10000 });

  const routineButton = page.locator("#btn-daily-routine");
  await routineButton.waitFor({ state: "visible" });
  assert.match(await routineButton.innerText(), /Routine du Jour/);
  assert.equal(await page.locator("#daily-routine-panel").isVisible(), false, "Le panneau reste fermé au chargement.");
  await routineButton.click();
  await page.locator("#daily-routine-panel").waitFor({ state: "visible" });
  assert.equal(await page.locator(".routine-step").count(), 3, "La routine doit proposer trois étapes.");
  assert.match(await page.locator('[data-routine-detail="lesson"]').innerText(), /Leçon du jour : .+ — /,
    "L’étape 1 doit afficher une leçon tirée du curriculum.");
  assert.match(await page.locator('[data-routine-detail="woodpecker"]').innerText(), /Puzzle 1\/50/,
    "L’étape 2 doit afficher le premier puzzle du lot.");
  assert.match(await page.locator('[data-routine-detail="slowgame"]').innerText(), /Partie lente 10\+5/,
    "L’étape 3 doit proposer la cadence 10+5 par défaut.");
  const timers = await page.locator(".routine-timer").allInnerTexts();
  assert.deepEqual(timers, ["15:00", "15:00", "15:00"], "Chaque étape doit démarrer à 15:00.");
  report.checks.push("Panneau Routine du Jour : ouverture, trois étapes, minuteurs à 15:00");

  await page.locator('[data-routine-action="lesson-skip"]').click();
  await page.waitForFunction(() => document.querySelector('[data-routine-step="lesson"]').classList.contains("is-done"));
  assert.match(await page.locator("#daily-routine-summary").innerText(), /Woodpecker/,
    "L’étape suivante doit devenir le Woodpecker.");
  await page.locator('[data-routine-action="woodpecker-skip"]').click();
  await page.waitForFunction(() => document.querySelector('[data-routine-step="woodpecker"]').classList.contains("is-done"));
  assert.match(await page.locator("#daily-routine-summary").innerText(), /Partie lente/);
  report.checks.push("Passage d’étape : leçon puis Woodpecker, progression affichée");

  const shield = page.locator("#btn-anti-blunder-shield");
  assert.match(await shield.innerText(), /Bouclier Anti-Gaffe : OFF/);
  await shield.click();
  assert.match(await shield.innerText(), /Bouclier Anti-Gaffe : ON/);
  assert.equal(await shield.getAttribute("aria-checked"), "true");
  await shield.click();
  assert.match(await shield.innerText(), /Bouclier Anti-Gaffe : OFF/);
  assert.equal(await shield.getAttribute("aria-checked"), "false");
  report.checks.push("Bouclier Anti-Gaffe : activation et désactivation depuis l’interface");

  const increment = page.locator("#sel-clock-increment");
  await increment.selectOption("10");
  await page.locator("#sel-clock-white").selectOption("10");
  await page.locator("#sel-clock-black").selectOption("10");
  assert.equal(await increment.inputValue(), "10");
  assert.equal(await page.locator("#sel-clock-white").inputValue(), "10");
  report.checks.push("Pendules : cadences 10 minutes et incrément +10 s sélectionnables");

  const storage = await page.evaluate(() => ({
    routine: localStorage.getItem("supachess-daily-routine-v1"),
    shield: localStorage.getItem("supachess-anti-blunder-shield-v1"),
    clocks: localStorage.getItem("supachess-player-clocks-v1"),
  }));
  assert.ok(storage.routine && JSON.parse(storage.routine).dayKey, "La routine doit être enregistrée localement.");
  assert.equal(storage.shield, "false", "L’état du bouclier doit rester enregistré.");
  assert.equal(JSON.parse(storage.clocks).increment, "10", "L’incrément doit être mémorisé.");
  report.checks.push("Persistance locale : routine, bouclier et cadences");

  await shield.click();
  assert.match(await shield.innerText(), /Bouclier Anti-Gaffe : ON/);
  await page.evaluate(() => {
    const state = window.SupaChessGameState;
    state.chess = new Chess("k2r4/8/8/8/8/8/3B4/K2Q4 w - - 0 1");
    state.phase = "userTurn";
    state.userColor = "w";
    state.candidates = [];
    window.SupaChessRenderBoard();
  });
  await page.locator('#board .sq[data-square="d2"]').click();
  await page.locator('#board .sq[data-square="c3"]').click();
  await page.locator("#anti-blunder-alert").waitFor({ state: "visible", timeout: 5000 });
  assert.match(await page.locator("#anti-blunder-alert-message").innerText(), /en prise/,
    "Le bouclier doit signaler la pièce laissée en prise.");
  assert.equal(await page.locator("#anti-blunder-alert").getAttribute("aria-hidden"), "false");
  await page.locator("#anti-blunder-replay").click();
  await page.locator("#anti-blunder-alert").waitFor({ state: "hidden" });
  const playedAfterReplay = await page.evaluate(() => window.SupaChessGameState.chess.history());
  assert.deepEqual(playedAfterReplay, [], "Le coup doit rester bloqué après « Revérifier et rejouer ».");
  await page.locator('#board .sq[data-square="d2"]').click();
  await page.locator('#board .sq[data-square="c3"]').click();
  await page.locator("#anti-blunder-alert").waitFor({ state: "visible", timeout: 5000 });
  await page.locator("#anti-blunder-play-anyway").click();
  await page.locator("#anti-blunder-alert").waitFor({ state: "hidden" });
  const playedAfterAnyway = await page.evaluate(() => window.SupaChessGameState.chess.history());
  assert.deepEqual(playedAfterAnyway, ["Bc3"], "« Jouer quand même » doit jouer le coup warned.");
  report.checks.push("Bouclier en partie : coup bloqué, alerte affichée, reprise ou passage forcé");

  const offlineNoise = report.consoleErrors.filter((message) => !/services de compte ne sont pas disponibles|profile initialization failed/i.test(message));
  assert.deepEqual(offlineNoise, [], `Aucune erreur JavaScript navigateur n’est attendue : ${offlineNoise.join(" | ")}`);
  report.checks.push("Console navigateur sans erreur JavaScript (hors services de compte hors ligne)");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
