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
const profileContent = { innerHTML: "", querySelectorAll() { return []; }, querySelector() { return null; } };
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
      setAttribute(name, value) { this.attributes = this.attributes || {}; this.attributes[name] = String(value); },
      querySelectorAll() { return []; },
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
  accuracyW, accuracyB, userColor, result, trainingAidsUsed: false,
  pgn: '[SupaChessUserColor "' + userColor + '"]\n[SupaChessTrainingAidsUsed "false"]',
  moveGrades: Array.from({ length: moves }, () => ({ color: userColor, noTrainingAids: true })),
  stats: { moves },
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
  assert.match(html, /Précision moyenne/);
  assert.match(html, /Tout l’historique/);
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
  assert.match(profileContent.innerHTML, /Précision moyenne/);
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


test("mastery summary renders five spaced, labelled rows with clickable lesson and puzzle counts", () => {
  const html = window.SupaProfiles.renderLocalLearningPanel({});
  assert.equal((html.match(/class="profile-mastery-link"/g) || []).length, 5);
  assert.match(html, /class="profile-mastery-link" href="https:\/\/jira44\.github\.io\/supachess\/book-lessons\.html\?next=1" aria-label="Leçons maîtrisées : \d+"/);
  assert.match(html, /class="profile-mastery-link" href="https:\/\/jira44\.github\.io\/supachess-web\/TRAINING_TACTICS\.html" aria-label="Problèmes résolus : \d+"/);
  assert.match(html, /class="profile-mastery-link" href="https:\/\/jira44\.github\.io\/supachess-web\/TRAINING_ENDGAMES\.html" aria-label="Fondamentaux des finales : \d+"/);
  assert.equal((html.match(/class="profile-resume-link"/g) || []).length, 4);
  assert.equal((html.match(/class="profile-resume-card"/g) || []).length, 4);
  assert.match(html, /class="profile-resume-link" href="https:\/\/jira44\.github\.io\/supachess\/index\.html\?open-review=1"/);
  assert.match(html, /class="profile-resume-link" href="https:\/\/jira44\.github\.io\/supachess\/book-lessons\.html\?next=1"/);
  assert.match(html, /class="profile-resume-link" href="https:\/\/jira44\.github\.io\/supachess-web\/TRAINING_OPENINGS\.html"/);
});

test("profile shows exercise charts from saved correction data without a completed diagnostic", () => {
  values.set("supachess_reviewed_pgns", JSON.stringify([{
    correctionExercises: Array.from({ length: 42 }, () => ({ classification: "inaccuracy" })),
  }]));
  values.delete("supachess-level-diagnostic");
  const html = window.SupaProfiles.renderLocalLearningPanel({});
  assert.match(html, /Graphiques de mes exercices/);
  assert.match(html, /42 exercices de correction enregistrés/);
  assert.equal((html.match(/class="profile-exercise-chart"/g) || []).length, 3);
  assert.match(html, /Radar · part des exercices/);
  assert.match(html, /Vue 3D · mêmes nombres/);
});

test("profile reports move-type percentages averaged equally across completed games", () => {
  const moves = (category, count, color = "w") => Array.from({ length: count }, () => ({ category, color, noTrainingAids: true }));
  values.set("supachess_games", JSON.stringify([
    {
      id: "game-short",
      result: "1-0",
      userColor: "w",
      trainingAidsUsed: false,
      pgn: '[SupaChessUserColor "w"]\n[SupaChessTrainingAidsUsed "false"]',
      moveGrades: [...moves("brilliant", 1), ...moves("good", 1), ...moves("brilliant", 1, "b")],
    },
    {
      id: "game-long",
      result: "0-1",
      userColor: "w",
      trainingAidsUsed: false,
      pgn: '[SupaChessUserColor "w"]\n[SupaChessTrainingAidsUsed "false"]',
      moveGrades: [...moves("brilliant", 1), ...moves("blunder", 9)],
    },
    { id: "unfinished", result: "*", userColor: "w", moveGrades: moves("brilliant", 8) },
    { id: "abandoned", result: "0-1", userColor: "w", abandoned: true, moveGrades: moves("blunder", 8) },
  ]));
  values.delete("supachess-level-diagnostic");

  const html = window.SupaProfiles.renderLocalLearningPanel({});
  assert.match(html, /Moyenne calculée sur 2 parties terminées sans aides, avec coups classés/);
  assert.match(html, /Moyenne calculée sur 2 parties terminées sans aides/);
  assert.match(html, /Coups brillants/);
  assert.match(html, /30,0 %/);
  assert.match(html, /Bons coups/);
  assert.match(html, /25,0 %/);
  assert.match(html, /Gaffes/);
  assert.match(html, /45,0 %/);
});

test("lesson progression filters retain cumulative counts across six time ranges", () => {
  const now = Date.UTC(2026, 10, 1, 12);
  const day = 86400000;
  const timestamps = [now - 364 * day, now - 89 * day, now - 29 * day, now - 6 * day, now - 3600000, now + day];
  const expected = { day: [1, 4], week: [2, 3], month: [3, 2], quarter: [4, 1], year: [5, 0], all: [5, 0] };
  for (const [range, [visible, baseline]] of Object.entries(expected)) {
    const series = window.SupaProfiles.lessonProgressSeries(timestamps, range, now);
    assert.equal(series.points.length, visible, range + " visible lessons");
    assert.equal(series.baseline, baseline, range + " cumulative baseline");
    assert.equal(series.total, 5, range + " total completed lessons");
  }
});

test("lesson progression range buttons redraw the graph and update their pressed state", () => {
  const now = Date.now();
  const chart = { innerHTML: "" };
  const makeButton = (range) => ({
    attrs: { "data-lesson-range": range, "aria-pressed": String(range === "all") },
    style: {},
    listeners: {},
    getAttribute(name) { return this.attrs[name] || null; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    addEventListener(name, handler) { this.listeners[name] = handler; },
  });
  const buttons = [makeButton("day"), makeButton("all")];
  const section = {
    getAttribute(name) { return name === "data-lesson-timestamps" ? String(now - 100 * 86400000) : null; },
    querySelectorAll() { return buttons; },
    querySelector() { return chart; },
  };
  window.SupaProfiles.bindLessonProgressRangeControls({ querySelectorAll() { return [section]; } });

  buttons[0].listeners.click();
  assert.equal(buttons[0].attrs["aria-pressed"], "true");
  assert.equal(buttons[1].attrs["aria-pressed"], "false");
  assert.equal(buttons[0].style.background, "#214b38");
  assert.equal(buttons[0].style.borderColor, "#69e7a1");
  assert.equal(buttons[1].style.background, "#202b3d");
  assert.equal(buttons[1].style.borderColor, "#52657d");
  assert.match(chart.innerHTML, /Aucune leçon validée dans cette période/);

  buttons[1].listeners.click();
  assert.equal(buttons[0].attrs["aria-pressed"], "false");
  assert.equal(buttons[1].attrs["aria-pressed"], "true");
  assert.equal(buttons[1].style.background, "#214b38");
  assert.equal(buttons[1].style.borderColor, "#69e7a1");
  assert.match(chart.innerHTML, /<svg class="profile-learning-chart"/);
});

test("profile lesson progression renders the six period buttons when completion history exists", () => {
  values.set("supachess-book-lessons-v1", JSON.stringify({
    "lesson-one": { completed: true, completedAt: new Date(Date.now() - 86400000).toISOString() },
  }));
  const html = window.SupaProfiles.renderLocalLearningPanel({});
  assert.equal((html.match(/data-lesson-range=/g) || []).length, 6);
  assert.match(html, /Dernières 24 heures/);
  assert.match(html, /Derniers 7 jours/);
  assert.match(html, /Derniers 30 jours/);
  assert.match(html, /Derniers 3 mois/);
  assert.match(html, /Derniers 12 mois/);
  assert.match(html, /Tout l’historique/);
});

test("centipawn-loss rate averages the percentage of measured player half-moves per completed game", () => {
  const summary = window.SupaProfiles.summarizeCentipawnLossGames([
    { ...game(1, 80, 70, "w", "1-0"), moveGrades: [
      { ply: 1, color: "w", lossCp: 12, noTrainingAids: true },
      { ply: 2, color: "b", lossCp: 40, noTrainingAids: true },
      { ply: 3, color: "w", lossCp: 0, noTrainingAids: true },
    ] },
    { ...game(2, 80, 70, "w", "0-1"), moveGrades: [
      { ply: 1, color: "w", lossCp: 5, noTrainingAids: true },
      { ply: 2, color: "w", lossCp: 0, noTrainingAids: true },
      { ply: 3, color: "w", lossCp: 0, noTrainingAids: true },
    ] },
    { ...game(1, 80, 70, "w", "*"), moveGrades: [{ ply: 1, color: "w", lossCp: 20 }] },
    { ...game(1, 80, 70, "w", "1-0"), moveGrades: [{ ply: 1, color: "w", category: "best" }] },
  ], "all", now);

  assert.equal(summary.games, 2);
  assert.equal(summary.moves, 5);
  assert.equal(summary.losingMoves, 2);
  assert.equal(summary.average, (50 + 100 / 3) / 2);
});

test("duplicate played and reviewed PGNs merge measured centipawn losses without double-counting", () => {
  const merged = window.SupaProfiles.mergeProfileAnalysisGames([
    { id: "played-1", pgn: '[Event "Live"]\n1. e4 e5 1-0', result: "1-0", userColor: "w",
      moveGrades: [{ ply: 1, color: "w", category: "best", lossCp: 4 }] },
  ], [
    { id: "review-1", pgn: '[Event "Imported"]\n1. e4 e5 1-0', result: "1-0", userColor: "w",
      moveGrades: [{ ply: 1, color: "w", category: "best", lossCp: null }, { ply: 2, color: "b", lossCp: null }] },
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].moveGrades.length, 2);
  assert.equal(merged[0].moveGrades[0].lossCp, 4);
});
