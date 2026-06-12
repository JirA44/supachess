/* E2E SupaChess — intégration coach IA Supa (serveur local :8778). */
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:8777";
const SHOTS = new URL("../screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(name) { await page.screenshot({ path: SHOTS + name, fullPage: false }); }

try {
  await page.goto(BASE + "/index.html", { waitUntil: "load" });

  // Test 1 : indicateur header Supa connecté
  await page.waitForFunction(
    () => /connecté|hors-ligne/.test(document.getElementById("supa-label")?.textContent || ""),
    { timeout: 15000 }
  );
  const supaLabel = await page.textContent("#supa-label");
  results.push(["1. Indicateur Supa dans le header", /connecté/.test(supaLabel), supaLabel]);

  // Moteur prêt + dots
  await page.waitForSelector("body[data-engine-ready='1']", { timeout: 60000 });
  await page.waitForSelector(".cdot", { timeout: 30000 });

  // Test 2 : 1.a4 → interception → panneau coach
  await page.click("[data-square='a2']");
  await page.click("[data-square='a4']");
  await page.waitForSelector("#coach-panel:not(.hidden)", { timeout: 30000 });
  results.push(["2. Interception 1.a4 (panneau coach)", true, ""]);
  await shot("05_supa_intercept_heuristics.png");

  // Test 3 : la section 🤖 Supa apparaît dans les 60s
  await page.waitForSelector("#coach-ranking .supa-section", { timeout: 60000 });
  const nbSections = await page.locator("#coach-ranking .supa-section").count();
  const firstResume = await page.locator("#coach-ranking .supa-resume").first().textContent().catch(() => "");
  const model = await page.locator("#coach-ranking .supa-model").first().textContent().catch(() => "");
  results.push(["3. Section Supa IA dans le panneau (<60s)", nbSections >= 1,
    `${nbSections} section(s), modèle="${model}", résumé="${(firstResume || "").slice(0, 80)}"`]);
  await shot("06_supa_enriched.png");
} catch (e) {
  results.push(["EXCEPTION", false, String(e)]);
  await shot("99_supa_failure.png").catch(() => {});
}

console.log("\n=== RÉSULTATS SUPA ===");
let pass = true;
for (const [name, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? "  [" + detail + "]" : ""}`);
  if (!ok) pass = false;
}
await browser.close();
process.exit(pass ? 0 : 1);
