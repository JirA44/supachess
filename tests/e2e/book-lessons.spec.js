const { test, expect } = require("@playwright/test");

test("Capablanca lesson asks for the principle, then plays the line on the board", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await expect(page.locator("h1")).toHaveText("La route vers l’excellence");
  await expect(page.locator(".lesson-catalog-button")).toHaveCount(15);
  await expect(page.locator("#lesson-board .sq")).toHaveCount(64);
  await page.locator(".lesson-catalog-button").filter({ hasText: "Couper le roi avec la tour" }).click();
  await page.getByRole("button", { name: "Limiter l’espace du roi adverse sur la rangée" }).click();
  await page.locator('.sq[data-square="a1"]').click();
  await page.locator('.sq[data-square="a7"]').click();
  await expect(page.locator("#lesson-move-list")).toContainText("Toi : Ra7");
  await expect(page.locator("#lesson-move-list")).toContainText("Ligne du livre : Kg8");
  await page.locator('.sq[data-square="h1"]').click();
  await page.locator('.sq[data-square="g2"]').click();
  await expect(page.locator("#lesson-feedback")).toContainText("Le roi rejoint la tour");
  await expect(page.locator("#lesson-explanation")).toContainText("Ce que tu viens d’apprendre");
  await expect(page.locator("#lesson-explanation")).toContainText("À réutiliser dans tes parties");
  await expect(page.locator("#lesson-next-preview")).toContainText("Trouver le moment de jouer …d5");
  await expect(page.locator("#lesson-next")).toBeVisible();
});

test("Larsen lesson starts from the cited position, can flip, and accepts the central break", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await page.locator(".lesson-catalog-button").filter({ hasText: "Trouver le moment de jouer …d5" }).click();
  await expect(page.locator("#lesson-board .sq").first()).toHaveAttribute("data-square", "h1");
  await expect(page.getByRole("link", { name: "Ouvrir le livre" })).toHaveAttribute("href", /Larsen%20Best%20Move%20Guide\.pdf/);
  await page.locator("#lesson-choices").getByRole("button", { name: "Ouvrir le centre par …d5" }).click();
  await page.locator('.sq[data-square="d7"]').click();
  await page.locator('.sq[data-square="d5"]').click();
  await expect(page.locator("#lesson-move-list")).toContainText("Toi : d5");
  await expect(page.locator("#lesson-move-list")).toContainText("Ligne du livre : e5");
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("#lesson-board")).toBeVisible();
  const boardBox = await page.locator("#lesson-board").boundingBox();
  expect(boardBox.width).toBeLessThanOrEqual(375);
});

test("Stockfish compares legal alternatives and previews a continuation on the board", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await page.getByRole("button", { name: "Comparer tous les coups avec Stockfish" }).click();
  await expect(page.locator("#lesson-engine-status")).toContainText("Stockfish a évalué", { timeout: 30000 });
  await expect(page.locator("#lesson-engine-lines .lesson-engine-line").first()).toContainText("meilleur de cette recherche");
  await expect(page.locator("#lesson-engine-lines .lesson-engine-line").first()).toContainText("Suite calculée");
  await page.locator("#lesson-engine-lines .lesson-engine-preview").first().click();
  await expect(page.locator("#lesson-engine-return")).toBeVisible();
  await page.locator("#lesson-engine-return").click();
  await expect(page.locator("#lesson-engine-return")).toBeHidden();
});
