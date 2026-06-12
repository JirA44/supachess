/* E2E SupaChess — 5 tests obligatoires avec captures de preuve. */
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:8777";
const SHOTS = new URL("../screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

async function shot(name) { await page.screenshot({ path: SHOTS + name, fullPage: false }); }

try {
  // Test 1 : chargement sans erreur console
  await page.goto(BASE + "/index.html", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const fatal = errors.filter((e) => !/favicon/i.test(e));
  results.push(["1. Page charge sans erreur console", fatal.length === 0, fatal.join(" | ")]);

  // Test 2 : moteur initialisé (indicateur prêt)
  await page.waitForSelector("body[data-engine-ready='1']", { timeout: 60000 });
  const label = await page.textContent("#engine-label");
  results.push(["2. Moteur initialisé (readyok)", /prêt/.test(label), label]);
  await shot("01_engine_ready.png");

  // Test 3 : dots après analyse initiale
  await page.waitForSelector(".cdot", { timeout: 30000 });
  const dots = await page.locator(".cdot").count();
  results.push(["3. Dots candidats affichés", dots >= 3, `${dots} dots`]);
  await shot("02_dots.png");

  // Test 4 : mauvais coup (1.a4) → panneau coach
  await page.click("[data-square='a2']");
  await page.click("[data-square='a4']");
  await page.waitForSelector("#coach-panel:not(.hidden)", { timeout: 30000 });
  const msg = await page.textContent("#coach-message");
  const nbCands = await page.locator("#coach-ranking .cand").count();
  const nbPros = await page.locator("#coach-ranking .arg-pro").count();
  const nbCons = await page.locator("#coach-ranking .arg-con").count();
  const ok4 = /ne joue pas/i.test(msg) && nbCands >= 5 && nbPros > 0 && nbCons > 0;
  results.push(["4. Interception + coach (ranking, pour/contre)", ok4,
    `msg="${msg}" cands=${nbCands} pros=${nbPros} cons=${nbCons}`]);
  await shot("03_coach_intercept.png");

  // Test 5 : cliquer un coup du ranking → le coup se joue, l'engine répond
  const histBefore = await page.textContent("#move-history");
  await page.locator("#coach-ranking .cand").first().click();
  await page.waitForFunction(
    (prev) => {
      const h = document.getElementById("move-history").textContent;
      const mvs = document.querySelectorAll("#move-history .mv").length;
      return h !== prev && mvs >= 2; // coup joueur + réponse engine
    },
    histBefore,
    { timeout: 45000 }
  );
  const mvs = await page.locator("#move-history .mv").count();
  const coachHidden = await page.locator("#coach-panel.hidden").count();
  results.push(["5. Coup du ranking joué + réponse engine", mvs >= 2 && coachHidden === 1, `${mvs} demi-coups`]);
  // attendre la ré-analyse pour une belle capture finale
  await page.waitForSelector(".cdot", { timeout: 30000 }).catch(() => {});
  await shot("04_after_engine_reply.png");

  // Test 6 : précision moyenne affichée pour chaque joueur après 2 demi-coups
  await page.waitForFunction(
    () => {
      const t = document.getElementById("stat-accuracy")?.textContent || "";
      return (t.match(/%/g) || []).length >= 2;
    },
    { timeout: 45000 }
  );
  const accStat = await page.textContent("#stat-accuracy");
  const accBadge = await page.textContent("#accuracy-badge");
  const ok6 = (accStat.match(/%/g) || []).length >= 2 && /Blancs/.test(accStat)
    && /Noirs/.test(accStat) && (accBadge.match(/%/g) || []).length >= 2;
  results.push(["6. Précision moyenne par joueur affichée", ok6,
    `stat="${accStat.trim()}" badge="${accBadge.trim()}"`]);
  await shot("05_accuracy.png");

  // Test 7 : explications comparatives + riposte adverse
  // 7a — cartes candidats : "vs" (comparatif) + "Riposte" pour >= 3 candidats
  await page.waitForSelector("#candidates-list .cl-card", { timeout: 30000 });
  const nbCmp = await page.locator("#candidates-list .cl-cmp").count();
  const nbReply = await page.locator("#candidates-list .cl-reply").count();
  const candListTxt = await page.textContent("#candidates-list");
  const ok7a = nbCmp >= 3 && nbReply >= 3 && /Riposte/.test(candListTxt) && /Mieux que/.test(candListTxt);
  await shot("06_candidates_details.png");
  // 7b — interception de 1.a4 (nouvelle partie) : le coach montre la riposte du coup refusé
  await page.click("#btn-new");
  await page.waitForSelector(".cdot", { timeout: 45000 });
  await page.click("[data-square='a2']");
  await page.click("[data-square='a4']");
  await page.waitForSelector("#coach-panel:not(.hidden)", { timeout: 30000 });
  const coachMsg = await page.textContent("#coach-message");
  const coachTxt = await page.textContent("#coach-ranking");
  const ok7b = /l'adversaire répond/.test(coachMsg) && /Riposte attendue/.test(coachTxt);
  results.push(["7. Comparatif + riposte adverse (cartes + coup refusé)", ok7a && ok7b,
    `cmp=${nbCmp} reply=${nbReply} msg="${coachMsg.slice(0, 160)}"`]);
  await shot("07_riposte_refused_move.png");
} catch (e) {
  results.push(["EXCEPTION", false, String(e)]);
  await shot("99_failure.png").catch(() => {});
}

console.log("\n=== RÉSULTATS ===");
let pass = true;
for (const [name, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? "  [" + detail + "]" : ""}`);
  if (!ok) pass = false;
}
if (errors.length) console.log("Console errors:", errors.join("\n"));
await browser.close();
process.exit(pass ? 0 : 1);
