const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const values = new Map();
let currentOverlay = {
  querySelector() { return null; },
  remove() { this.removed = true; currentOverlay = null; },
};
const profileContent = { innerHTML: "" };
const document = {
  getElementById(id) {
    if (id === "profile-modal") return currentOverlay;
    if (id === "profile-content" && currentOverlay && currentOverlay.hasProfileContent) return profileContent;
    return null;
  },
  createElement() {
    const element = {
      style: {},
      listeners: {},
      addEventListener(name, callback) { this.listeners[name] = callback; },
      querySelector() { return { addEventListener() {} }; },
    };
    Object.defineProperty(element, "innerHTML", {
      set(value) { this.html = value; this.hasProfileContent = value.includes('id="profile-content"'); },
      get() { return this.html; },
    });
    element.remove = function () { currentOverlay = null; };
    return element;
  },
  body: { appendChild(element) { currentOverlay = element; } },
};
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/profile.js"), "utf8"), {
  window,
  document,
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
  assert.equal(summary.month.current.average, 62.5);
  assert.equal(summary.month.previous.average, 50);
  assert.equal(summary.month.delta, 12.5);
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

test("renderProfileModal replaces the loading dialog before filling profile content", () => {
  values.set("supachess_games", JSON.stringify([game(1, 87.5, 10)]));
  const loadingOverlay = currentOverlay;
  window.SupaProfiles.init({ currentUser: { uid: "player-1" } }, null);
  window.SupaProfiles.renderProfileModal({
    uid: "player-1",
    displayName: "Joueur test",
    email: "joueur@example.test",
    stats: {},
  });

  assert.equal(loadingOverlay.removed, true);
  assert.ok(currentOverlay.hasProfileContent);
  assert.match(profileContent.innerHTML, /Joueur test/);
  assert.match(profileContent.innerHTML, /Précision moyenne du joueur/);
  assert.match(profileContent.innerHTML, /Mon apprentissage/);
  assert.match(profileContent.innerHTML, /problèmes résolus/);
  assert.doesNotMatch(profileContent.innerHTML, /My learning|Puzzles solved|Resume my exercises/);
});

test("profile shows XP remaining before the next level", () => {
  values.set("chessnova_progress", JSON.stringify({ xp: 70, level: 1 }));
  const html = window.SupaProfiles.renderLocalLearningPanel({});
  assert.match(html, /XP restantes pour atteindre le niveau suivant : 30 XP/);
  assert.match(html, /prochain niveau à 100 XP/);
});
