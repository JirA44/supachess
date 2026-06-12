/* E2E mode manuel (auto-entraînement) :
   (a) sélection Manuel → 1.e4 → l'engine NE répond PAS,
   (b) coup noir sous-optimal (...a5) joué à la main → accepté SANS interception,
   (c) les dots réapparaissent pour les Blancs. */
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:8777";
const SHOTS = new URL("../screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(name) { await page.screenshot({ path: SHOTS + name, fullPage: true }); }

try {
  await page.goto(BASE + "/index.html", { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("supachess_games"));
  await page.waitForSelector("body[data-engine-ready='1']", { timeout: 60000 });
  await page.waitForSelector(".cdot", { timeout: 45000 });

  // (a) Sélection du mode manuel + nouvelle partie
  await page.selectOption("#sel-elo", "manual");
  await page.click("#btn-new");
  await page.waitForSelector(".cdot", { timeout: 45000 });
  const status0 = await page.textContent("#status-line");
  results.push(["A. Statut mode manuel affiché", /Mode manuel/.test(status0), `status="${status0}"`]);

  // 1.e4 (camp utilisateur) — l'engine ne doit PAS répondre
  await page.click("[data-square='e2']");
  await page.click("[data-square='e4']");
  await page.waitForTimeout(1500);
  if (await page.locator("#coach-panel:not(.hidden)").count()) await page.click("#btn-force");
  // analyse pour les Noirs (au trait) : dots doivent réapparaître
  await page.waitForSelector(".cdot", { timeout: 45000 });
  await page.waitForTimeout(4000); // laisser le temps à un éventuel coup engine (il ne doit pas venir)
  const mvsAfterE4 = await page.locator("#move-history .mv").count();
  const statusB = await page.textContent("#status-line");
  results.push(["B. 1.e4 joué, engine NE répond PAS", mvsAfterE4 === 1,
    `demi-coups=${mvsAfterE4} status="${statusB}"`]);
  const okOppStatus = /Mode manuel/.test(statusB) && /Noirs/.test(statusB) && /pas d'interception/.test(statusB);
  results.push(["B2. Statut 'au trait: Noirs (coup adverse: pas d'interception)'", okOppStatus, `status="${statusB}"`]);
  await shot("20_manual_after_e4.png");

  // (b) Coup noir clairement sous-optimal : 1...a5 — accepté SANS interception
  await page.click("[data-square='a7']");
  await page.click("[data-square='a5']");
  await page.waitForFunction(() => document.querySelectorAll("#move-history .mv").length >= 2, { timeout: 30000 });
  const coachShown = await page.locator("#coach-panel:not(.hidden)").count();
  const mvsAfterA5 = await page.locator("#move-history .mv").count();
  const hist = await page.textContent("#move-history");
  results.push(["C. ...a5 (sous-optimal) accepté sans interception", coachShown === 0 && mvsAfterA5 === 2 && /a5/.test(hist),
    `coach=${coachShown} demi-coups=${mvsAfterA5} hist="${hist.trim()}"`]);
  await shot("21_manual_black_a5_no_intercept.png");

  // (c) Dots réapparaissent pour les Blancs
  await page.waitForSelector(".cdot", { timeout: 45000 });
  const dots = await page.locator(".cdot").count();
  const statusC = await page.textContent("#status-line");
  results.push(["D. Dots réapparus pour les Blancs", dots >= 3 && /Blancs/.test(statusC),
    `dots=${dots} status="${statusC}"`]);
  await shot("22_manual_dots_back_white.png");

  // (e) Auto-save : les coups des deux camps sont enregistrés
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("supachess_games") || "[]"));
  const last = stored[stored.length - 1] || {};
  results.push(["E. Auto-save des deux camps (e4 + a5)", /e4/.test(last.pgn || "") && /a5/.test(last.pgn || ""),
    `pgn="${last.pgn || ""}"`]);

  // (f) Retour sur un Elo en cours de partie → l'engine reprend la main (au trait: Blancs ≠ engine,
  //     donc on rejoue 1 coup blanc puis l'engine doit répondre). On bascule d'abord.
  await page.selectOption("#sel-elo", "1320");
  await page.waitForSelector(".cdot", { timeout: 45000 });
  await page.click("[data-square='d2']");
  await page.click("[data-square='d4']");
  await page.waitForTimeout(1500);
  if (await page.locator("#coach-panel:not(.hidden)").count()) await page.click("#btn-force");
  await page.waitForFunction(() => document.querySelectorAll("#move-history .mv").length >= 4, { timeout: 60000 });
  const mvsF = await page.locator("#move-history .mv").count();
  results.push(["F. Sortie du mode manuel → l'engine rejoue", mvsF >= 4, `demi-coups=${mvsF}`]);
  await shot("23_manual_exit_engine_replies.png");
} catch (e) {
  results.push(["EXCEPTION", false, String(e)]);
  await shot("29_manual_failure.png").catch(() => {});
}

console.log("\n=== RÉSULTATS (mode manuel) ===");
let pass = true;
for (const [name, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? "  [" + detail + "]" : ""}`);
  if (!ok) pass = false;
}
await browser.close();
process.exit(pass ? 0 : 1);
