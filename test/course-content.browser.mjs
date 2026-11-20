import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requests = [];
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  requests.push(pathname);
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(target, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    const type = target.endsWith(".wasm") ? "application/wasm" : target.endsWith(".js") ? "text/javascript" : target.endsWith(".css") ? "text/css" : target.endsWith(".json") ? "application/json" : "text/html";
    res.writeHead(200, { "Content-Type": type === "application/wasm" ? type : `${type}; charset=utf-8` }).end(data);
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  const wasmResponses = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", async (response) => {
    if (response.url().includes(".wasm")) wasmResponses.push({ url: response.url(), status: response.status(), contentType: response.headers()["content-type"] });
  });
  await page.route("**/*", (route) => new URL(route.request().url()).origin === `http://127.0.0.1:${server.address().port}` ? route.continue() : route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/book-lessons.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.SUPA_COURSE_CONTENT_REPORT && document.querySelectorAll("#lesson-board .sq").length === 64, { timeout: 15000 });
  const report = await page.evaluate(() => ({
    generatedLessons: window.SUPA_COURSE_CONTENT_REPORT.generatedLessons,
    generatedExercises: window.SUPA_COURSE_CONTENT_REPORT.generatedExercises,
    sourceCount: window.SUPA_COURSE_CONTENT_REPORT.sourceLessons,
    catalogCount: document.querySelectorAll("#lesson-catalog .lesson-catalog-button").length,
    transferId: window.SupaChessLessons.find((lesson) => lesson.id.startsWith("course-transfer-"))?.id,
  }));
  assert.equal(report.generatedLessons, 20);
  assert.equal(report.generatedExercises, 21);
  assert.ok(report.catalogCount >= report.generatedLessons + report.generatedExercises);
  assert.ok(report.transferId);
  const opened = await page.evaluate((id) => window.SupaChessAcademy.openLesson(id), report.transferId);
  assert.equal(opened, true);
  await page.waitForFunction(() => document.querySelector("#lesson-title")?.textContent.includes("Transférer le principe"));
  assert.equal(await page.locator("#lesson-board .sq").count(), 64);
  assert.equal(await page.locator("[data-sf-lessons]").innerText(), "Vérifier et créer leçons/exercices");
  assert.equal(await page.locator("[data-sf-puzzles]").innerText(), "Vérifier puzzles et créer des exercices");
  const hardLesson = await page.evaluate(() => {
    const lesson = window.SupaChessLessons.find((item) => item.program === "Calcul avancé · palier super-GM");
    return lesson && { id: lesson.id, uci: lesson.sequence[0].uci };
  });
  assert.ok(hardLesson?.id, "the hard study path should be present in the page catalogue");
  assert.equal(await page.evaluate((id) => window.SupaChessAcademy.openLesson(id), hardLesson.id), true);
  await page.waitForFunction(() => document.querySelector("#lesson-title")?.textContent.includes("super-GM"));
  assert.equal(await page.locator("#lesson-reflection").isVisible(), true);
  assert.equal(await page.locator("#lesson-engine-analyze").isVisible(), false);
  assert.equal(await page.locator("#lesson-engine-analysis").isVisible(), false);
  assert.equal(await page.locator("#lesson-move-list li").count(), 0);
  await page.locator("#lesson-choices button").filter({ hasText: "Nommer les changements" }).click();
  await page.locator("#lesson-reflection-candidate").fill("Je repère les pièces actives et propose un candidat de défense.");
  await page.locator("#lesson-reflection-reply").fill("Je vérifie la contre-menace adverse et calcule ma réponse.");
  await page.locator("#lesson-reflection-submit").click();
  assert.equal(await page.locator("#lesson-engine-analyze").isVisible(), false, "engine lines stay hidden until a move attempt");
  await page.locator(`#lesson-board .sq[data-square="${hardLesson.uci.slice(0, 2)}"]`).click();
  await page.locator(`#lesson-board .sq[data-square="${hardLesson.uci.slice(2, 4)}"]`).click();
  await page.waitForFunction(() => document.querySelectorAll("#lesson-move-list li").length === 1);
  assert.equal(await page.locator("#lesson-engine-analyze").isVisible(), true, "engine comparison opens after the first attempt");
  console.log(JSON.stringify({ checks: ["catalogue généré", "leçon miroir ouverte", "échiquier complet", "commandes de vérification visibles", "raisonnement écrit avant Stockfish", "ligne cachée jusqu’au premier essai", "aucune exception JavaScript"], report, wasmResponses }, null, 2));
  assert.deepEqual(pageErrors, [], JSON.stringify({ pageErrors, wasmResponses, wasmRequests: requests.filter((request) => request.includes("wasm")) }));
} finally {
  await browser.close();
  const closed = new Promise((resolve) => server.close(resolve));
  server.closeAllConnections?.();
  await closed;
}
