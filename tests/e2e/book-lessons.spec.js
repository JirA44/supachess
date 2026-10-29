const { test, expect } = require("@playwright/test");

test("Rook cutoff lesson asks for the principle, then plays the line on the board", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await expect(page.locator("h1")).toHaveText("Leçons");
  await expect(page.locator(".lesson-subtitle")).toHaveText("La route vers l’excellence");
  expect(await page.locator(".lesson-catalog-button").count()).toBeGreaterThanOrEqual(100);
  await expect(page.locator("#lesson-board .sq")).toHaveCount(64);
  await page.locator(".lesson-catalog-button:not(.anticipation-exercise)").filter({ hasText: "Couper le roi avec la tour" }).first().click();
  const firstPrinciple = page.locator("#lesson-choices .lesson-choice").first();
  await expect(firstPrinciple).toContainText("Réduire l’espace du roi adverse");
  await firstPrinciple.click();
  await page.locator('.sq[data-square="a1"]').click();
  await page.locator('.sq[data-square="a7"]').click();
  await expect(page.locator("#lesson-move-list")).toContainText("Toi : Ra7");
  await expect(page.locator("#lesson-move-list")).toContainText("Ligne du livre : Kg8");
  await page.locator('.sq[data-square="h1"]').click();
  await page.locator('.sq[data-square="g2"]').click();
  await expect(page.locator("#lesson-feedback")).toContainText("Le roi blanc avance pour soutenir la tour");
  await expect(page.locator("#lesson-explanation")).toContainText("Ce que tu viens d’apprendre");
  await expect(page.locator("#lesson-explanation")).toContainText("À réutiliser dans tes parties");
  await expect(page.locator("#lesson-next-preview")).toBeVisible();
  await expect(page.locator("#lesson-next")).toBeVisible();
});


test("filtered lesson numbers are consecutive and completed lessons open in view", async ({ page }) => {
  const { LESSONS } = require("../../js/book-lessons.js");
  const target = LESSONS.find((lesson) => lesson.title === "Activer le roi avant le pion");
  expect(target).toBeTruthy();
  await page.addInitScript((id) => {
    localStorage.setItem("supachess-book-lessons-v1", JSON.stringify({ [id]: { completed: true } }));
  }, target.id);
  await page.goto("/book-lessons.html");
  await page.locator("#lesson-program-filter").selectOption(target.program);

  const cards = page.locator(".lesson-catalog-button");
  const titles = await cards.locator(".lesson-catalog-title").allTextContents();
  expect(titles.length).toBeGreaterThan(3);
  expect(titles.slice(0, 4).map((title) => Number(title.match(/^(\d+)\./)?.[1]))).toEqual([1, 2, 3, 4]);

  const completed = cards.filter({ hasText: "Activer le roi avant le pion" });
  await expect(completed).toContainText("Terminée · à revoir quand tu veux");
  await completed.click();
  await expect(page.locator("#lesson-title")).toHaveText("Activer le roi avant le pion");
  await expect(page.locator(".lesson-workspace")).toBeInViewport();
  await expect(page.locator("#lesson-status")).toContainText("À toi de jouer");
});

test("Larsen lesson starts from the cited position, can flip, and accepts the central break", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await page.locator(".lesson-catalog-button:not(.anticipation-exercise)").filter({ hasText: "Trouver le moment de jouer …d5" }).filter({ hasText: "Bent Larsen" }).click();
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


test('profile link opens the first lesson not yet completed',async({page})=>{
  const {LESSONS}=require('../../js/book-lessons.js');
  const target='capablanca-king-pawn';
  const saved=Object.fromEntries(LESSONS.filter((lesson)=>lesson.id!==target).map((lesson)=>[lesson.id,{completed:true}]));
  await page.addInitScript((progress)=>localStorage.setItem('supachess-book-lessons-v1',JSON.stringify(progress)),saved);
  await page.goto('/book-lessons.html?next=1');
  await expect(page.locator('#lesson-catalog .lesson-catalog-button[aria-current="true"]')).toContainText('Activer le roi avant le pion');
});


test("home header has a prominent lessons button beside SupaChess Coach IA", async ({ page }) => {
  await page.goto("/index.html");
  const brand = page.locator(".brand-navigation");
  await expect(brand.locator(".brand")).toContainText("SupaChess");
  await expect(brand.locator(".brand")).toContainText("Coach IA");
  const lessons = brand.getByRole("link", { name: "Leçons" });
  await expect(lessons).toHaveAttribute("href", "book-lessons.html");
  await lessons.click();
  await expect(page).toHaveURL(/book-lessons\.html/);
  await expect(page.locator("h1")).toHaveText("Leçons");
  await expect(page.locator(".lesson-subtitle")).toHaveText("La route vers l’excellence");
});


test("catalog filters and random exercise explicitly train opponent replies in green learning mode", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await expect(page.locator("#lesson-surprise")).toHaveText("Exercice au hasard");
  expect(await page.locator(".lesson-catalog-button").count()).toBeGreaterThanOrEqual(100);
  await expect(page.locator(".lesson-intro .lesson-eyebrow")).toContainText("mode apprentissage");
  await page.selectOption("#lesson-program-filter", "Anti-erreurs · anticiper l’adversaire");
  await expect(page.locator(".lesson-catalog-button.anticipation-exercise").first()).toBeVisible();
  await page.locator("#lesson-program-filter").selectOption("Carlsen · amélioration et conversion");
  await page.click("#lesson-surprise");
  await expect(page.locator("#lesson-title")).toHaveText("Exercice au hasard");
  await expect(page.locator(".lesson-workspace")).toBeInViewport();
  await expect(page.locator("#lesson-program-filter")).toHaveValue("");
  await expect(page.locator(".lesson-catalog-button.anticipation-exercise[aria-current=true]")).toBeVisible();
  await expect(page.locator("#lesson-source")).toContainText("thème révélé après la résolution");
  await expect(page.locator("#lesson-anticipate")).toHaveAttribute("aria-pressed", "false");
  await page.click("#lesson-anticipate");
  await expect(page.locator("#lesson-anticipate")).toHaveAttribute("aria-pressed", "true");
  const green = await page.locator("#lesson-surprise").evaluate((node) => getComputedStyle(node).backgroundColor);
  const [red, greenChannel, blue] = green.match(/\d+/g).map(Number);
  expect(greenChannel).toBeGreaterThan(red);
  expect(greenChannel).toBeGreaterThan(blue);
});


test("eight learning paths explain their progression and open matching lessons", async ({ page }) => {
  await page.goto("/book-lessons.html");
  await expect(page.locator("#method-paths-title")).toHaveText("Huit parcours d’apprentissage");
  await expect(page.locator("#lesson-catalog-count")).toContainText("leçons originales +");
  await expect(page.locator("#lesson-catalog-count")).toContainText("exercices d’anticipation");
  await expect(page.locator("#lesson-catalog-count")).toContainText("entrées au total");
  const cards = page.locator(".method-path");
  await expect(cards).toHaveCount(8);

  const paths = [
    ["Carlsen · amélioration et conversion", "Explorer les leçons Carlsen"],
    ["Fischer · préparation et précision", "Explorer les leçons Fischer"],
    ["Capablanca · fondamentaux et principes", "Explorer le parcours Capablanca"],
    ["Lasker · mobilisation et principes", "Explorer le parcours Lasker"],
    ["Edward Lasker · calcul et stratégie", "Explorer le parcours Edward Lasker"],
    ["Tal · tactique et sacrifices à calculer", "Explorer les leçons Tal"],
    ["Kasparov · coups candidats et calcul", "Explorer les leçons Kasparov"],
  ];
  for (const [program, action] of paths) {
    const card = page.locator(`[data-method-path="${program}"]`);
    await expect(card.locator("[data-method-count]")).toContainText("leçons du parcours");
    await card.getByRole("button", { name: action }).click();
    await expect(page.locator("#lesson-program-filter")).toHaveValue(program);
    await expect(page.locator("#lesson-catalog .lesson-catalog-button").first()).toHaveAttribute("data-program", program);
    const visibleTitles = page.locator("#lesson-catalog .lesson-catalog-button .lesson-catalog-title");
    const expectedTitle = (await visibleTitles.first().innerText()).replace(/^\d+\.\s*/, "");
    await expect(page.locator("#lesson-title")).toHaveText(expectedTitle);
    await expect(page.locator(".lesson-workspace")).toBeInViewport();
    const levels = await page.locator("#lesson-catalog .lesson-catalog-button .lesson-catalog-meta").allTextContents();
    const levelOrder = { "Débutant": 0, "Intermédiaire": 1, "Avancé": 2, "Expert": 3 };
    const ranks = levels.map((meta) => levelOrder[meta.split(" · ")[0]]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    if (program === "Carlsen · amélioration et conversion") {
      const { LESSONS, methodPathLessonIndices } = require("../../js/book-lessons.js");
      const pathLessons = methodPathLessonIndices(program).map((index) => LESSONS[index]);
      expect(pathLessons.length).toBeGreaterThan(1);
      const first = pathLessons[0];
      const correctChoice = first.choices.find((choice) => choice.correct);
      await page.locator("#lesson-choices .lesson-choice").filter({ hasText: correctChoice.text }).click();
      for (let i = 0; i < first.sequence.length; i++) {
        const action = first.sequence[i];
        if (action.side !== "user") continue;
        await page.locator(".sq[data-square=\"" + action.uci.slice(0, 2) + "\"]").click();
        await page.locator(".sq[data-square=\"" + action.uci.slice(2, 4) + "\"]").click();
        if (first.sequence[i + 1]?.side === "book") {
          await expect(page.locator("#lesson-status")).toContainText("À toi : continue la ligne.");
        }
      }
      const second = pathLessons[1];
      await expect(page.locator("#lesson-next-preview")).toContainText(second.title);
      await expect(page.locator("#lesson-next-preview")).toContainText(second.level);
      await page.locator("#lesson-next").click();
      await expect(page.locator("#lesson-title")).toHaveText(second.title);
      await expect(page.locator("#lesson-program-filter")).toHaveValue(program);
    }
  }

  const stockfish = page.locator('[data-method-path="Stockfish · comparer et vérifier"]');
  await expect(stockfish).toContainText("Stockfish explore des variantes");
  await expect(stockfish.locator("[data-method-count]")).toContainText("positions de leçons analysables");
  await page.locator("#lesson-program-filter").selectOption("Stockfish · comparer et vérifier");
  const historicGameLesson = page.locator("#lesson-catalog .lesson-catalog-button")
    .filter({ hasText: "Partie TCEC · Mettre le fou b4 à l’épreuve" });
  await expect(historicGameLesson).toBeVisible();
  await historicGameLesson.click();
  await expect(page.locator("#lesson-title")).toHaveText("Partie TCEC · Mettre le fou b4 à l’épreuve");
  await expect(page.locator("#lesson-source a")).toHaveAttribute("href", "https://github.com/TCEC-Chess/tcecgames");

  await stockfish.getByRole("button", { name: "Commencer sur une position" }).click();
  await expect(page.locator("#lesson-program-filter")).toHaveValue("");
  await expect(page.locator("#lesson-title")).toHaveText("Stockfish · Repérer le mat forcé");
  await expect(page.locator("#lesson-catalog .lesson-catalog-button:not(.anticipation-exercise)").first()).toBeVisible();
  await expect(page.locator("#lesson-reflection")).toBeVisible();
  await expect(page.locator("#lesson-engine-analyze")).toBeHidden();
  await page.locator("#lesson-reflection-submit").click();
  await expect(page.locator("#lesson-reflection-status")).toContainText("Note ton coup candidat");
  await page.locator("#lesson-reflection-candidate").fill("Je développe avec tempo");
  await page.locator("#lesson-reflection-reply").fill("Je vérifie la menace adverse et une riposte");
  await page.locator("#lesson-reflection-submit").click();
  await expect(page.locator("#lesson-engine-analyze")).toBeVisible();
  await expect(stockfish).toHaveAttribute("aria-current", "true");

  await page.locator("#lesson-engine-analyze").click();
  await expect(page.locator("#lesson-engine-lines .lesson-engine-line").first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#lesson-reflection-review")).toBeVisible();
  await page.locator("#lesson-review-save").click();
  await expect(page.locator("#lesson-review-status")).toContainText("Position ajoutée");
  await expect(page.locator("#lesson-review-queue")).toContainText("Positions à revoir : 1");

  await page.setViewportSize({ width: 390, height: 844 });
  const cardBox = await page.locator(".method-path-grid").boundingBox();
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(390);
  await expect(cards).toHaveCount(8);
});


test("profile opens inside the game page and remains available from lessons", async ({ page }) => {
  await page.goto("/index.html");
  const gameProfile = page.getByRole("link", { name: "Ouvrir mon profil" });
  await expect(gameProfile).toBeVisible();
  await expect(gameProfile).toHaveAttribute("href", "#profile");
  await gameProfile.click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator("#profile-modal")).toBeVisible();
  await expect(page.locator("#profile-modal [data-profile-form]")).toBeVisible({ timeout: 15000 });

  await page.goto("/book-lessons.html");
  const lessonProfile = page.getByRole("link", { name: "Ouvrir mon profil" });
  await expect(lessonProfile).toBeVisible();
  await expect(lessonProfile).toHaveAttribute("href", "#profile");
  await lessonProfile.click();
  await expect(page).toHaveURL(/book-lessons\.html$/);
  await expect(page.locator("#profile-modal")).toBeVisible();
  await expect(page.locator("#profile-modal [data-profile-form]")).toBeVisible({ timeout: 15000 });
});
