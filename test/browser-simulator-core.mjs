import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storageKey = "supachess_reviewed_pgns";

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

function gameFixture() {
  const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const afterE4Fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  return [{
    id: "browser-simulator-fixture",
    pgn: '[Event "Browser simulator fixture"]\n[White "Test Blanc"]\n[Black "Test Noir"]\n\n1. e3 e5 *',
    white: "Test Blanc",
    black: "Test Noir",
    result: "*",
    event: "Browser simulator fixture",
    correctionExercises: [
      { fen: initialFen, bestUci: "e2e4", bestScoreCp: 24, bestMate: null, moveNumber: 1, color: "w", playedSan: "e3", classification: "mistake", lossCp: 60 },
      { fen: afterE4Fen, bestUci: "e7e5", bestScoreCp: 18, bestMate: null, moveNumber: 1, color: "b", playedSan: "c5", classification: "inaccuracy", lossCp: 35 },
    ],
    analysis: { version: 1 },
    analyzedAt: new Date(0).toISOString(),
  }];
}

function engineStub() {
  return `class StockfishEngine {
    constructor() { this.engineName = "Stockfish test isolé"; this.ready = Promise.resolve(); }
    async analyze() { return { bestmove: null, lines: [] }; }
  }
  function parseInfoLine() { return null; }`;
}

async function clickMove(page, from, to) {
  await page.locator(`#board .sq[data-square="${from}"]`).click();
  await page.locator(`#board .sq[data-square="${to}"]`).click();
}

export async function runBrowserSimulation({ chromium, executablePath, url } = {}) {
  assert.ok(chromium?.launch, "Passer l’objet chromium de Playwright est requis.");
  const server = url ? null : createServer();
  if (server) {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
  }
  const baseUrl = url || `http://127.0.0.1:${server.address().port}/index.html`;
  const baseOrigin = new URL(baseUrl).origin;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const report = { url: baseUrl, checks: [], viewports: [], warnings: [], consoleErrors: [], failedResponses: [] };
  const screenshotDir = path.join(path.dirname(fileURLToPath(import.meta.url)), ".scratch-browser-simulator");
  fs.mkdirSync(screenshotDir, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.consoleErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") report.consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.url().startsWith(baseOrigin) && response.status() >= 400) {
        report.failedResponses.push({ status: response.status(), url: response.url() });
      }
    });
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === baseOrigin) return route.continue();
      if (url.hostname === "localhost" && url.port === "8778") {
        return route.fulfill({ status: 200, contentType: "application/json", body: '{"report":null}' });
      }
      if (/\.(js|mjs)(\?|$)/i.test(url.href)) {
        return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
      }
      return route.abort();
    });
    await page.addInitScript(({ key, games }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify(games));
    }, { key: storageKey, games: gameFixture() });
    await page.route("**/js/engine.js*", (route) => route.fulfill({
      status: 200, contentType: "text/javascript", body: engineStub(),
    }));
    await page.goto(baseUrl);
    await page.waitForFunction(() => document.body.dataset.engineReady === "1", { timeout: 10000 })
      .catch((error) => { throw new Error(`${error.message}\nPage errors: ${report.consoleErrors.join(" | ") || "none"}`); });

    assert.equal(await page.locator("#board .sq").count(), 64, "La page doit rendre les 64 cases.");
    assert.equal(await page.locator("#review-history-list .review-history-row").count(), 1,
      "Seule la partie fictive de cette session doit apparaître.");
    report.checks.push("Chargement de la page et échiquier 8×8");

    for (const id of ["btn-dots", "btn-move-dots"]) {
      const control = page.locator(`#${id}`);
      const original = await control.getAttribute("aria-pressed");
      await control.click();
      assert.notEqual(await control.getAttribute("aria-pressed"), original, `${id} doit changer d’état.`);
      await control.click();
      assert.equal(await control.getAttribute("aria-pressed"), original, `${id} doit pouvoir revenir à son état initial.`);
    }
    report.checks.push("Commandes bulles candidates et points de coups");

    await page.locator('#review-history-list [data-review-history-act="exercise"]').click();
    const exercisePanel = page.locator("#review-exercise-panel");
    await exercisePanel.waitFor({ state: "visible" });
    assert.match(await page.locator("#review-exercise-heading").innerText(), /Exercice 1\/2/);
    const flip = page.locator("#btn-review-exercise-flip");
    await flip.click();
    assert.equal(await flip.getAttribute("aria-pressed"), "true", "Le bouton retourner doit refléter son état.");
    await flip.click();
    assert.equal(await flip.getAttribute("aria-pressed"), "false");

    const next = page.locator("#btn-review-exercise-next");
    assert.equal(await next.isEnabled(), false, "Le suivant reste désactivé avant la bonne réponse.");
    await clickMove(page, "e2", "e3");
    assert.match(await page.locator("#review-exercise-feedback").innerText(), /ne corrige pas encore/i,
      "Une réponse incorrecte doit être expliquée.");
    assert.equal(await next.isEnabled(), false, "Une réponse incorrecte ne doit pas débloquer la suite.");
    await clickMove(page, "e2", "e4");
    assert.match(await page.locator("#review-exercise-feedback").innerText(), /est le meilleur coup/i,
      "La bonne réponse doit être confirmée.");
    assert.equal(await next.isEnabled(), true, "La réponse correcte doit débloquer la suite.");
    report.checks.push("Correction: coup faux refusé, coup juste accepté, bouton suivant débloqué");

    await next.click();
    assert.match(await page.locator("#review-exercise-heading").innerText(), /Exercice 2\/2/,
      "La suite doit passer au deuxième exercice.");
    await clickMove(page, "e7", "e5");
    assert.match(await page.locator("#review-exercise-feedback").innerText(), /est le meilleur coup/i);
    assert.equal(await next.isEnabled(), true);
    await next.click();
    await exercisePanel.waitFor({ state: "hidden" });
    assert.equal(await page.locator("#review-history-list .review-history-row").count(), 1,
      "Quitter le parcours doit restaurer l’historique sans le modifier.");
    report.checks.push("Progression 2/2 et sortie du parcours");

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(100);
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        board: document.querySelector("#board")?.getBoundingClientRect().width || 0,
        gradeColumns: getComputedStyle(document.querySelector("#move-grade-summary")).gridTemplateColumns.split(" ").length,
        historyDirection: getComputedStyle(document.querySelector(".review-history-row")).flexDirection,
        historyActionsWrap: getComputedStyle(document.querySelector(".review-history-actions")).flexWrap,
      }));
      report.viewports.push({ width, ...dimensions });
      assert.ok(dimensions.board > 0, `L’échiquier doit rester visible à ${width}px.`);
      assert.ok(dimensions.document <= dimensions.viewport + 1,
        `La page dépasse horizontalement à ${width}px (${dimensions.document}px pour ${dimensions.viewport}px).`);
      if (width <= 420) {
        assert.equal(dimensions.gradeColumns, 1, "Les compteurs doivent passer sur une colonne sur petit écran.");
        assert.equal(dimensions.historyDirection, "column", "La ligne PGN doit empiler ses détails et boutons sur petit écran.");
        assert.equal(dimensions.historyActionsWrap, "wrap", "Les boutons PGN doivent pouvoir revenir à la ligne.");
      }
      await page.screenshot({ path: path.join(screenshotDir, `${width}px.png`), fullPage: true });
    }
    report.checks.push("Affichage mobile, tablette et ordinateur (375, 768, 1440 px) avec compteurs et actions PGN adaptés au mobile");
    assert.deepEqual(report.consoleErrors, [], `Aucune erreur JavaScript navigateur n’est attendue. Réponses: ${JSON.stringify(report.failedResponses)}`);
    assert.deepEqual(report.failedResponses, [], "Aucune ressource du site ne doit répondre en erreur.");
    report.checks.push("Console navigateur sans erreur JavaScript");
    report.checks.push("Ressources du site sans réponse 4xx/5xx");
    return report;
  } finally {
    await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

