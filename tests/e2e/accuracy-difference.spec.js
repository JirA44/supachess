const { test, expect } = require("@playwright/test");

test("precision comparison shows the point gap in session and game report", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForFunction(() => document.body.dataset.engineReady === "1");
  const result = await page.evaluate(() => {
    const headers = { White: "HeyoAP", Black: "EGMoon", Result: "*" };
    reviewState.gameSummary = {
      headers,
      players: [{ color: "w", accuracy: 85.2 }, { color: "b", accuracy: 89.9 }],
    };
    renderAccuracy();
    const rows = [
      { n: 1, color: "w", san: "e4", delta: 0, lossCp: 0, tag: "", diagnostics: [], centipawns: { status: "OK", lossCp: 0, explanation: "Coup proche du meilleur.", observations: [] } },
      { n: 1, color: "b", san: "e5", delta: 0, lossCp: 0, tag: "", diagnostics: [], centipawns: { status: "OK", lossCp: 0, explanation: "Coup proche du meilleur.", observations: [] } },
    ];
    reviewState.grades = rows.map(() => ({ deltaCp: 0, brilliant: false, category: "best", evaluation: "0.00" }));
    reviewRenderLocal(rows, 85.2, 89.9, headers);
    return {
      session: document.getElementById("stat-accuracy").textContent,
      report: document.querySelector(".review-accuracy-difference")?.textContent || "",
    };
  });

  expect(result.session).toContain("Écart de précision : 4,70 points (EGMoon)");
  expect(result.report).toContain("Écart de précision : 4,70 points (en faveur de EGMoon)");
});
