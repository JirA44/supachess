const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, "js", "vip-config.js"), "utf8");
const MANAGER_SOURCE = fs.readFileSync(path.join(ROOT, "js", "vip-manager.js"), "utf8");

function readPage(name) {
  return fs.readFileSync(path.join(ROOT, name), "utf8");
}

test("la configuration VIP propose trois offres et aucun lien de paiement actif", () => {
  const sandbox = { window: {} };
  vm.runInNewContext(CONFIG_SOURCE, sandbox);
  const config = sandbox.window.SupaVipConfig;
  assert.ok(config, "SupaVipConfig doit être exposé");
  assert.equal(config.offers.length, 3);
  assert.deepEqual(Array.from(config.offers, (offer) => offer.id), ["monthly", "yearly", "lifetime"]);
  assert.equal(config.offers[0].price, "4,99 € / mois");
  assert.equal(config.offers[1].price, "34,99 € / an");
  assert.equal(config.offers[2].price, "60 €");
  ["monthly", "yearly", "lifetime"].forEach((id) => {
    const url = config.checkout[id];
    assert.match(
      url,
      /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/,
      "le lien de paiement " + id + " doit pointer vers un Payment Link Stripe valide",
    );
  });
  const ids = ["monthly", "yearly", "lifetime"].map((id) => config.checkout[id]);
  assert.equal(new Set(ids).size, 3, "les trois offres doivent pointer vers des liens distincts");
});

test("le gestionnaire VIP lit le statut sans écrire et n'ouvre aucun paiement sans lien", () => {
  assert.match(MANAGER_SOURCE, /db\.collection\("users"\)\.doc\(user\.uid\)\.get\(\)/);
  assert.doesNotMatch(MANAGER_SOURCE, /\.set\(|\.update\(|\.add\(/, "le navigateur ne doit jamais écrire le statut VIP");
  assert.match(MANAGER_SOURCE, /window\.isUserVip/);
  assert.match(MANAGER_SOURCE, /user-is-vip/);
});

test("les fonctions avancées protégées sont balisées dans le HTML", () => {
  const index = readPage("index.html");
  assert.match(index, /data-setting="detailedMetrics"[^>]*data-vip-required="detailed-metrics"/);
  assert.match(index, /data-setting="showArrows"[^>]*data-vip-required="engine-arrows"/);
  const champion = readPage("champion-metrics.html");
  assert.match(champion, /data-vip-required="champion-metrics"/);
  assert.match(index, /js\/vip-config\.js/);
  assert.match(index, /js\/vip-manager\.js/);
  assert.match(champion, /js\/vip-manager\.js/);
});

test("les mentions légales signalent les parties à compléter", () => {
  const legal = readPage("mentions-legales.html");
  assert.match(legal, /\[A COMPLETER/);
  assert.match(legal, /Conditions générales de vente/);
  assert.match(legal, /RGPD/);
  assert.match(legal, /4,99 € \/ mois/);
  assert.match(legal, /34,99 € \/ an/);
  assert.match(legal, /60 €/);
});
