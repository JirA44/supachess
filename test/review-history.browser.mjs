import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pgn = '[Event "Browser history test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 *';
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!file.startsWith(root + path.sep) && file !== path.join(root, "index.html")) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, content) => {
    if (error) { res.writeHead(404).end("Not found"); return; }
    const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html";
    res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }).end(content);
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route("**/js/engine.js", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: `class StockfishEngine { constructor() { this.engineName = "Test Engine"; this.ready = Promise.resolve(); }
      async analyze() { return { bestmove: null, lines: [] }; } }
      function parseInfoLine() { return null; }`,
  }));
  await page.route("http://localhost:8778/**", (route) => route.fulfill({
    status: 503, contentType: "application/json", body: "{}",
  }));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.evaluate(() => localStorage.removeItem("supachess_reviewed_pgns"));

  await page.click("#btn-analyze-pgn");
  await page.fill("#pgn-input", pgn);
  await page.click("#btn-run-review");
  await page.waitForSelector("#review-history-list .review-history-row");
  assert.match(await page.locator("#review-history-list").innerText(), /Alice vs Bob/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("supachess_reviewed_pgns")).length), 1);

  await page.evaluate(() => {
    const items = JSON.parse(localStorage.getItem("supachess_reviewed_pgns"));
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const analysis = ReviewInsights.buildGameSummary({
      headers: { White: "Alice", Black: "Chloé" }, accuracyW: 90, accuracyB: 80,
      fens: [fen], moves: [{ san: "d4" }],
      rows: [{ color: "w", n: 1, san: "d4", lossCp: 0, classification: "best" }],
    });
    items.push({ id: "second-game", pgn: '[Event "Second game"]\n1. d4 d5 *',
      white: "Alice", black: "Chloé", event: "Second game", analysis });
    localStorage.setItem("supachess_reviewed_pgns", JSON.stringify(items));
  });

  await page.reload();
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  await page.waitForSelector("#review-history-list .review-history-row");
  assert.match(await page.locator("#review-history-list").innerText(), /Alice vs Bob/);
  assert.equal(await page.locator("#review-history-list input[data-review-insights-id]").count(), 2);
  await page.locator("#review-history-list input[data-review-insights-id]").nth(0).check();
  await page.locator("#review-history-list input[data-review-insights-id]").nth(1).check();
  await page.click("#review-insights-panel [data-review-insights-run]");
  assert.match(await page.locator("#review-insights-report").innerText(), /Bilan calculé sur 2 partie/);
  assert.match(await page.locator("#review-insights-report").innerText(), /Alice/);
  assert.match(await page.locator("#review-insights-report").innerText(), /Forces mesurées/);
  await page.click('#review-history-list [data-review-history-act="open"]');
  assert.equal(await page.locator("#pgn-input").inputValue(), pgn);
  await page.click("#btn-close-pgn");
  await page.click('#review-history-list [data-review-history-act="delete"]');
  assert.match(await page.locator("#review-history-list").innerText(), /Aucun PGN analysé/);
  console.log("Browser check passed: analysis is listed, persists after reload, can be reopened, and can be deleted.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
