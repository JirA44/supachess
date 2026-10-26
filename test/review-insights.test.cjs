const assert = require("node:assert/strict");
const test = require("node:test");
const ReviewInsights = require("../js/review-insights.js");

const openingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const middlegameFen = "r1b2rk1/pp3ppp/2n1pn2/2bp4/3P4/2P1PN2/PP3PPP/RNBQR1K1 w - - 0 12";
const endgameFen = "8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 35";

test("buildGameSummary records player grades, phases, diagnostic themes and issue samples", () => {
  const summary = ReviewInsights.buildGameSummary({
    headers: { White: "Alice", Black: "Bob" },
    accuracyW: 81.5,
    accuracyB: 74,
    fens: [openingFen, openingFen, middlegameFen, endgameFen],
    moves: [{ san: "e4" }, { san: "e5" }, { san: "Qh5" }, { san: "Kf3" }],
    rows: [
      { color: "w", n: 1, san: "e4", lossCp: 0, classification: "best" },
      { color: "b", n: 1, san: "e5", lossCp: 80, classification: "mistake",
        diagnostics: [{ code: "PIECE_EN_PRISE_EN_UN_COUP", suggestedHabit: "Vérifier les prises." }] },
      { color: "w", n: 2, san: "Qh5", lossCp: 40, classification: "inaccuracy" },
      { color: "b", n: 18, san: "Kf3", lossCp: 220, classification: "blunder" },
    ],
  });

  assert.equal(summary.version, 1);
  assert.equal(summary.players[0].name, "Alice");
  assert.equal(summary.players[0].grades.best, 1);
  assert.equal(summary.players[0].grades.inaccuracy, 1);
  assert.equal(summary.players[0].phases.opening.moves, 2);
  assert.equal(summary.players[1].diagnostics.PIECE_EN_PRISE_EN_UN_COUP.count, 1);
  assert.equal(summary.players[1].worstMoves[0].lossCp, 220);
});

test("aggregate groups the same player across selected PGNs and reports skipped legacy analyses", () => {
  const first = ReviewInsights.buildGameSummary({
    headers: { White: "Alice", Black: "Bob" }, accuracyW: 80, accuracyB: 60,
    fens: [openingFen], moves: [{ san: "e4" }],
    rows: [{ color: "w", n: 1, san: "e4", lossCp: 0, classification: "best" }],
  });
  const second = ReviewInsights.buildGameSummary({
    headers: { White: "Alice", Black: "Chloé" }, accuracyW: 90, accuracyB: 70,
    fens: [openingFen], moves: [{ san: "d4" }],
    rows: [{ color: "w", n: 1, san: "d4", lossCp: 35, classification: "inaccuracy" }],
  });
  const report = ReviewInsights.aggregate([
    { analysis: first, white: "Alice", black: "Bob" },
    { analysis: second, white: "Alice", black: "Chloé" },
    { pgn: "legacy" },
  ]);

  const alice = report.profiles.find((profile) => profile.name === "Alice");
  assert.equal(report.analyzedGames, 2);
  assert.equal(report.skippedGames, 1);
  assert.equal(alice.games, 2);
  assert.equal(alice.ratedMoves, 2);
  assert.equal(alice.accuracy, 85);
  assert.equal(alice.grades.best, 1);
  assert.equal(alice.grades.inaccuracy, 1);
});

test("phase labels use move count for opening and board material for endgame", () => {
  assert.equal(ReviewInsights.phaseOf(openingFen, 10), "opening");
  assert.equal(ReviewInsights.phaseOf(middlegameFen, 12), "middlegame");
  assert.equal(ReviewInsights.phaseOf(endgameFen, 35), "endgame");
});

