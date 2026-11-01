const { test, expect } = require("@playwright/test");

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
