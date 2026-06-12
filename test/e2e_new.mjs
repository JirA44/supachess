/* E2E nouveaux — (a) pour/contre + micro-points par candidat,
   (b) analyse PGN collé → requête /review + rapport,
   (c) auto-enregistrement localStorage + panneau Parties après reload. */
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:8777";
const SHOTS = new URL("../screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.context().clearCookies();

async function shot(name) { await page.screenshot({ path: SHOTS + name, fullPage: true }); }
async function ready() {
  await page.waitForSelector("body[data-engine-ready='1']", { timeout: 60000 });
  await page.waitForSelector(".cdot", { timeout: 45000 });
}

try {
  await page.goto(BASE + "/index.html", { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("supachess_games"));
  await ready();

  // (a) Carte candidat dépliée : pour/contre + micro-points
  await page.waitForSelector("#candidates-list .cl-card.open", { timeout: 30000 });
  const openCard = page.locator("#candidates-list .cl-card.open").first();
  const nbPros = await openCard.locator(".arg-pro").count();
  const bdTxt = await openCard.locator(".cl-bd").textContent().catch(() => "");
  const okBd = /Matériel/.test(bdTxt) && /Dynamique/.test(bdTxt) && /Centre/.test(bdTxt);
  // les cartes non-ouvertes ne montrent pas les args (compactes)
  const closedArgs = await page.locator("#candidates-list .cl-card:not(.open) .arg-pro").count();
  results.push(["A. Candidat déplié: pour/contre + micro-points", nbPros >= 1 && okBd && closedArgs === 0,
    `pros=${nbPros} bd="${(bdTxt || "").trim().slice(0, 110)}" closedArgs=${closedArgs}`]);
  await shot("10_candidate_breakdown.png");

  // (b) Analyse PGN collé → /review part + rapport affiché
  const pgn = `[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *`;
  await page.click("#btn-analyze-pgn");
  await page.fill("#pgn-input", pgn);
  const reviewReq = page.waitForRequest((r) => r.url().includes("/review"), { timeout: 120000 })
    .then(() => true).catch(() => false);
  await page.click("#btn-run-review");
  await page.waitForSelector("#review-report .review-local", { timeout: 120000 });
  const reportTxt = await page.textContent("#review-report");
  const reqSent = await reviewReq;
  const okReport = /Bilan Stockfish/.test(reportTxt) && /Précision/.test(reportTxt);
  results.push(["B. PGN collé analysé: rapport + requête /review", okReport && reqSent,
    `reqSent=${reqSent} report="${reportTxt.trim().slice(0, 120)}"`]);
  // bouton Rejouer visible
  const replayBtn = await page.locator("#btn-replay-game:not(.hidden)").count();
  results.push(["B2. Bouton 'Rejouer cette partie' proposé", replayBtn === 1, `visible=${replayBtn}`]);
  await shot("11_pgn_review_report.png");

  // (c) Auto-enregistrement : nouvelle partie, jouer 1 coup + réponse engine
  await page.click("#btn-new");
  await ready();
  await page.click("[data-square='e2']");
  await page.click("[data-square='e4']");
  // si interception (improbable pour e4), forcer
  await page.waitForTimeout(2000);
  if (await page.locator("#coach-panel:not(.hidden)").count()) await page.click("#btn-force");
  await page.waitForFunction(() => document.querySelectorAll("#move-history .mv").length >= 2, { timeout: 60000 });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("supachess_games") || "[]"));
  const okStore = stored.length >= 1 && /e4/.test(stored[stored.length - 1].pgn);
  results.push(["C. Partie auto-enregistrée dans localStorage", okStore,
    `n=${stored.length} pgn="${(stored[stored.length - 1] || {}).pgn || ""}"`]);
  await shot("12_autosave_localstorage.png");

  // reload → la partie apparaît dans le panneau Parties
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#games-list .game-row", { timeout: 30000 });
  const rows = await page.locator("#games-list .game-row").count();
  const rowTxt = await page.textContent("#games-list");
  results.push(["C2. Panneau Parties après reload", rows >= 1 && /préc\./.test(rowTxt), `rows=${rows}`]);
  await shot("13_games_panel_after_reload.png");
} catch (e) {
  results.push(["EXCEPTION", false, String(e)]);
  await shot("19_new_failure.png").catch(() => {});
}

console.log("\n=== RÉSULTATS (nouveaux) ===");
let pass = true;
for (const [name, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? "  [" + detail + "]" : ""}`);
  if (!ok) pass = false;
}
await browser.close();
process.exit(pass ? 0 : 1);
