const { test, expect } = require("@playwright/test");

test("profile diagnostic action starts a fresh ten-game assessment", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("profile-diagnostic-test-seeded")) return;
    sessionStorage.setItem("profile-diagnostic-test-seeded", "1");
    localStorage.setItem("supachess-level-diagnostic", JSON.stringify({
      active: false,
      completed: true,
      restoreDots: true,
      restoreMoveDots: true,
    }));
  });
  await page.route("https://www.gstatic.com/firebasejs/**", (route) => route.fulfill({
    status: 200, contentType: "text/javascript", body: "",
  }));
  await page.route("**/js/engine.js", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: `class StockfishEngine {
      constructor() { this.engineName = "Test Engine"; this.ready = Promise.resolve(); }
      async analyze() { return { bestmove: null, lines: [] }; }
    }
    function parseInfoLine() { return null; }`,
  }));

  await page.goto("/index.html");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", window.SupaProfiles.renderLocalLearningPanel({}));
  });
  await page.getByRole("button", { name: "🧭 Passer le diagnostic de niveau" }).click();

  await expect.poll(() => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("supachess-level-diagnostic") || "null");
    return value && value.active && value.defaultActivation === false && value.startedAt;
  })).toBeTruthy();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("supachess-level-diagnostic")).restoreDots
  )).toBe(true);
  await expect(page).toHaveURL(/#level-diagnostic-banner$/);
  await expect(page.locator("#btn-dots")).toBeDisabled();
  await expect(page.locator("#btn-move-dots")).toBeDisabled();
});
