const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildLearningPath,
  classifyLearningTheme,
  startLearningCycle,
} = require("../js/learning-path");

function reviewedGame(id, color, ownAccuracy, themes, analyzedAt) {
  return {
    id,
    date: new Date(analyzedAt).toISOString(),
    userColor: color,
    review: { userColor: color, ownAccuracy, themes, analyzedAt },
  };
}

test("classifies repeated king safety and material errors into study themes", () => {
  assert.equal(classifyLearningTheme(["Affaiblit la structure de pions devant le roi"], 18), "king-safety");
  assert.equal(classifyLearningTheme(["Laisse Dame en prise en d5"], 20), "tactics");
  assert.equal(classifyLearningTheme(["Bloque un pion central et freine le développement"], 8), "development");
});

test("requires three analyzed player games before recommending a focus", () => {
  const games = [
    reviewedGame("1", "w", 74, ["king-safety"], 10),
    reviewedGame("2", "w", 78, ["king-safety"], 20),
    { id: "unreviewed", userColor: "w" },
    reviewedGame("missing-player", null, 99, ["tactics"], 30),
  ];

  const path = buildLearningPath(games, {});
  assert.equal(path.phase, "diagnosis");
  assert.equal(path.reviewedGames, 2);
  assert.equal(path.focus.id, "king-safety");
  assert.equal(path.focus.confidence, "low");
});

test("recommends a repeated weakness after the diagnostic sample is complete", () => {
  const games = [
    reviewedGame("1", "w", 74, ["king-safety"], 10),
    reviewedGame("2", "w", 78, ["king-safety"], 20),
    reviewedGame("3", "w", 80, ["king-safety", "tactics"], 30),
  ];
  const path = buildLearningPath(games, {});
  assert.equal(path.phase, "focus");
  assert.equal(path.focus.id, "king-safety");
  assert.equal(path.focus.confidence, "high");
});

test("counts only new reviewed games after starting the focus cycle", () => {
  const games = [
    reviewedGame("1", "w", 70, ["tactics"], 10),
    reviewedGame("2", "w", 75, ["tactics"], 20),
    reviewedGame("3", "w", 80, ["tactics"], 30),
    reviewedGame("4", "w", 82, [], 110),
    reviewedGame("5", "w", 84, [], 120),
  ];
  const cycle = startLearningCycle(games, 100);
  const path = buildLearningPath(games, cycle);
  assert.equal(path.phase, "practice");
  assert.equal(path.cycleGames, 2);
  assert.equal(path.baselineAccuracy, 75);
  assert.equal(path.currentAccuracy, 83);
});

test("completes the cycle after three new analyzed games", () => {
  const games = [
    reviewedGame("1", "w", 70, ["tactics"], 10),
    reviewedGame("2", "w", 75, ["tactics"], 20),
    reviewedGame("3", "w", 80, ["tactics"], 30),
    reviewedGame("4", "w", 82, [], 110),
    reviewedGame("5", "w", 84, [], 120),
    reviewedGame("6", "w", 86, [], 130),
  ];
  const path = buildLearningPath(games, startLearningCycle(games, 100));
  assert.equal(path.phase, "complete");
  assert.equal(path.cycleGames, 3);
  assert.equal(path.accuracyChange, 9);
});

test("does not learn a focus from errors belonging only to the other color", () => {
  const games = [
    reviewedGame("1", "w", 80, [{ id: "king-safety", color: "b" }], 10),
    reviewedGame("2", "w", 81, [{ id: "king-safety", color: "b" }], 20),
    reviewedGame("3", "w", 82, [{ id: "king-safety", color: "b" }], 30),
  ];
  assert.equal(buildLearningPath(games).focus.id, "calculation");
  assert.equal(buildLearningPath(games).focus.confidence, "provisional");
});

test("ignores missing accuracy instead of treating it as zero", () => {
  const games = [
    reviewedGame("1", "w", null, [], 10),
    reviewedGame("2", "w", null, [], 20),
    reviewedGame("3", "w", null, [], 30),
  ];
  const path = buildLearningPath(games, { startedAt: 5, baselineAccuracy: null });
  assert.equal(path.baselineAccuracy, null);
  assert.equal(path.currentAccuracy, null);
  assert.equal(path.accuracyChange, null);
});

