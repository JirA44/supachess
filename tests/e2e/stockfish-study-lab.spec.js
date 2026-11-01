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
  await expect.poll(async () => status.textContent(), { timeout: 300000 }).toMatch(/Audit (terminé|interrompu)/);
  await expect(status).toContainText("Audit terminé");
  await expect(page.locator("[data-sf-status]")).toContainText("40 position(s) distincte(s) analysée(s)");
  const createExercise = page.getByRole("button", { name: "Créer et jouer cet exercice" }).first();
  await expect(createExercise).toBeVisible();
  await createExercise.click();
  await expect(page.locator("#lesson-title")).toContainText("Maîtrise moteur");
  await expect(page.locator("#lesson-board .sq")).toHaveCount(64);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("supachess-stockfish-derived-lessons-v1") || "[]").length)).toBe(1);
  expect(errors).toEqual([]);
});
