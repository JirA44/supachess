const { test, expect } = require("@playwright/test");

test("home page exposes accessible replay controls and keyboard-operable PGN dialog", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.getByRole("heading", { level: 1, name: /SupaChess Coach IA/ })).toBeVisible();
  await expect(page.getByLabel("Colle la partie au format PGN")).toBeAttached();
  await expect(page.locator("#btn-replay-prev")).toHaveAttribute("aria-label", "Coup précédent");
  await expect(page.locator("#btn-replay-next")).toHaveAttribute("aria-label", "Coup suivant");

  const opener = page.locator("#btn-analyze-pgn");
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Analyser un PGN avec Supa" });
  const input = page.getByLabel("Colle la partie au format PGN");
  const close = page.getByRole("button", { name: "Fermer" });
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
