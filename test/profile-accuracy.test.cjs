const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const values = new Map();
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/profile.js"), "utf8"), {
  window,
  localStorage: {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  },
  Date,
  Number,
  Math,
  JSON,
  Object,
  Array,
  String,
  Promise,
});

const now = Date.UTC(2026, 9, 28, 12);
const game = (daysAgo, accuracyW, accuracyB, userColor = "w", result = "1-0", moves = 10) => ({
  date: new Date(now - daysAgo * 86400000).toISOString(),
  accuracyW, accuracyB, userColor, result, stats: { moves },
});

test("summarizeAccuracyGames averages completed player moves and compares rolling periods", () => {
  const summary = window.SupaProfiles.summarizeAccuracyGames([
    game(1, 80, 5),
    game(10, 70, 5),
    game(28, 60, 5),
    game(48, 50, 5),
    game(2, 99, 40, "b", "0-1"),
    game(3, 100, 100, "w", "*"),
    { ...game(3, null, null), userColor: undefined },
  ], now);

  assert.equal(summary.all.average, 60);
  assert.equal(summary.all.games, 5);
  assert.equal(summary.week.current.average, 60);
  assert.equal(summary.week.previous.average, 70);
  assert.equal(summary.week.delta, -10);
  assert.equal(summary.month.current.average, 60);
  assert.equal(summary.month.previous.average, 50);
  assert.equal(summary.month.delta, 10);
});

test("summary keeps missing periods unavailable and renders French profile indicators", () => {
  const recent = game(1, 87.5, 10);
  values.set("supachess_games", JSON.stringify([recent]));
  const summary = window.SupaProfiles.summarizeAccuracyGames([recent], now);

  assert.equal(summary.week.delta, null);
  assert.equal(summary.month.delta, null);
  const html = window.SupaProfiles.renderLocalLearningPanel({});
  assert.match(html, /Précision moyenne du joueur/);
  assert.match(html, /Toutes les parties/);
  assert.match(html, /7 derniers jours/);
  assert.match(html, /30 derniers jours/);
  assert.match(html, /Évolution indisponible/);
  assert.match(html, /87,5/);
});
