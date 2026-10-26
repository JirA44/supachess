const { test, expect } = require("@playwright/test");

test("lesson catalog search scales to a larger catalog", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await expect(page.locator("#lesson-catalog-count")).toHaveText("6 leçons disponibles");
  await page.locator("#lesson-search").fill("capablanca");
  await expect(page.locator(".lesson-catalog-button")).toHaveCount(5);
  await expect(page.locator("#lesson-catalog-count")).toHaveText("5 / 6 leçons");
  await page.locator("#lesson-search").fill("introuvable");
  await expect(page.locator(".lesson-catalog-empty")).toHaveText("Aucune leçon ne correspond à cette recherche.");
});

test("Capablanca lesson asks for the principle, then plays the line on the board", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/book-lessons.html");
  await expect(page.locator(".lesson-catalog-button")).toHaveCount(6);
  await expect(page.locator("#lesson-board .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Limiter l’espace du roi adverse sur la rangée" }).click();
  await page.locator('.sq[data-square="a1"]').click();
  await page.locator('.sq[data-square="a7"]').click();
  await expect(page.locator("#lesson-move-list")).toContainText("Toi : Ra7");
  await expect(page.locator("#lesson-move-list")).toContainText("Ligne du livre : Kg8");
  await page.locator('.sq[data-square="h1"]').click();
  await page.locator('.sq[data-square="g2"]').click();
  await expect(page.locator("#lesson-deep-dive")).toContainText("Pourquoi Kg2 ?");
  await expect(page.locator("#lesson-deep-dive")).toContainText("Pourquoi pas Kh2");
  await page.locator("#lesson-compare").click();
  await expect.poll(async () => page.locator("#lesson-comparison li > strong").allTextContents(), { timeout: 110000 })
    .toEqual(expect.arrayContaining([expect.stringMatching(/^Kg2 ·/), expect.stringMatching(/^Kh2 ·/)]));
  const totalLegal = Number(await page.locator("#lesson-comparison").getAttribute("data-legal-moves"));
  await expect(page.locator("#lesson-comparison li")).toHaveCount(totalLegal);
  for (const [from, to] of [["g2", "f3"], ["f3", "e4"], ["e4", "d5"], ["d5", "d6"], ["a7", "c7"], ["d6", "c6"], ["c6", "b6"], ["c7", "c8"]]) {
    await page.locator(`.sq[data-square="${from}"]`).click();
    await page.locator(`.sq[data-square="${to}"]`).click();
    if (!(from === "c7" && to === "c8")) await page.waitForTimeout(600);
  }
  await expect(page.locator("#lesson-status")).toContainText("Leçon réussie");
  await expect(page.locator("#lesson-next")).toBeVisible();
});

test("Larsen lesson starts from the cited position, can flip, and accepts the central break", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await expect(page.locator(".lesson-catalog-button")).toHaveCount(6);
  await page.locator(".lesson-catalog-button").nth(2).click();
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

test("finishing the last lesson keeps a next-lesson button and chooses an unmastered lesson", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await page.evaluate(() => localStorage.setItem("supachess-book-lessons-v1", JSON.stringify({
    "capablanca-rook-king": { mastered: true },
  })));
  await page.reload();
  await page.locator(".lesson-catalog-button").nth(2).click();
  await page.locator("#lesson-choices").getByRole("button", { name: "Ouvrir le centre par …d5" }).click();
  for (const [from, to] of [["d7", "d5"], ["f6", "g4"], ["f8", "c5"]]) {
    await page.locator(`.sq[data-square="${from}"]`).click();
    await page.locator(`.sq[data-square="${to}"]`).click();
    if (from !== "f8") await page.waitForTimeout(500);
  }
  await expect(page.locator("#lesson-status")).toContainText("Leçon réussie");
  await expect(page.locator("#lesson-next")).toHaveText("Leçon suivante");
  await page.locator("#lesson-next").click();
  await expect(page.locator("#lesson-title")).toHaveText("Activer le roi avant la tour");
});
