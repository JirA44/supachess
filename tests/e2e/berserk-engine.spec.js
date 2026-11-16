const { test, expect } = require("@playwright/test");

test("Berserk 14 loads its NNUE network and returns a legal browser move", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/test/berserk-smoke.html");
  await expect(page.locator("#engine-test-status")).toHaveAttribute("data-status", "pass", { timeout: 110000 });
  await expect(page.locator("#engine-test-status")).toContainText("Berserk 14 a joué légalement");
});
