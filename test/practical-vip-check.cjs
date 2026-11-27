const { chromium } = require("playwright");
const path = require("node:path");

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  } catch (error) {
    console.log("EDGE_UNAVAILABLE:", error.message.split("\n")[0]);
    process.exit(2);
  }
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push("console: " + message.text()); });

  const url = "file:///" + path.join(__dirname, "..", "index.html").replace(/\\/g, "/");
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const trigger = await page.locator("[data-vip-open]").count();
  console.log("vip-trigger-count:", trigger);

  await page.locator("[data-vip-open]").first().click();
  await page.waitForTimeout(300);
  const modalVisible = await page.locator("#supachess-vip-modal").isVisible();
  const offers = await page.locator("[data-vip-offer]").count();
  const payDisabledBefore = await page.locator("[data-vip-pay]").isDisabled();
  await page.locator("[data-vip-terms]").check();
  const payDisabledAfter = await page.locator("[data-vip-pay]").isDisabled();
  await page.locator("[data-vip-pay]").click();
  await page.waitForTimeout(200);
  const status = (await page.locator("[data-vip-status]").textContent() || "").trim();
  console.log("modal-visible:", modalVisible);
  console.log("offers:", offers);
  console.log("pay-disabled-before-terms:", payDisabledBefore);
  console.log("pay-disabled-after-terms:", payDisabledAfter);
  console.log("status:", status);

  await page.locator("[data-vip-close]").click();
  const locked = await page.locator('[data-vip-locked="true"]').count();
  console.log("locked-elements:", locked);
  await page.locator("#analysis-preferences > summary").click();
  await page.waitForTimeout(200);
  await page.locator('[data-setting="detailedMetrics"]').click({ force: true });
  await page.waitForTimeout(200);
  console.log("modal-reopens-on-locked-feature:", await page.locator("#supachess-vip-modal").isVisible());
  const toggleState = await page.locator('[data-setting="detailedMetrics"]').getAttribute("aria-checked");
  console.log("toggle-unchanged-after-lock:", toggleState);

  console.log("page-errors:", errors.length ? errors.slice(0, 5) : "none");
  await browser.close();
})().catch((error) => { console.error("FAILED:", error.message); process.exit(1); });
