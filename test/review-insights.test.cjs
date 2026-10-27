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


test("PGN collection import separates and legally validates all Event games", () => {
  const source = '[Event "One"]\n[White "A"]\n[Black "B"]\n\n1. e4 e5 *\n\n' +
    '[Event "Two"]\n[White "A"]\n[Black "C"]\n\n1. d4 d5 *';
  const parsed = ReviewInsights.validatePgnCollection(source);
  assert.equal(ReviewInsights.splitPgnCollection(source).length, 2);
  assert.equal(parsed.valid.length, 2);
  assert.equal(parsed.valid[0].plies, 2);
  assert.equal(parsed.valid[1].headers.Event, "Two");
  assert.equal(parsed.invalid.length, 0);
});

test("personalized recommendations retain sample-size uncertainty and map phase weaknesses to lessons", () => {
  const profile = {
    name: "Alice", games: 2, ratedMoves: 8,
    grades: { inaccuracy: 2, mistake: 1, blunder: 0 },
    diagnostics: { PIECE_EN_PRISE_EN_UN_COUP: { count: 2 } },
    phases: { opening: { moves: 4, issues: 1 }, middlegame: { moves: 4, issues: 2 }, endgame: { moves: 0, issues: 0 } },
  };
  const path = ReviewInsights.personalizedPath(profile);
  assert.equal(path[0].program, "Anti-erreurs · anticiper l’adversaire");
  assert.ok(path.some((item) => item.program === "Kasparov · coups candidats et calcul"));
  assert.ok(path.some((item) => item.program === "Stockfish · comparer et vérifier"));
  assert.ok(path.every((item) => /faible/.test(item.confidence)));
});


test("FIDE-like performance needs confirmed FIDE tags and at least ten rated opponent results", () => {
  const base = ReviewInsights.buildGameSummary({
    headers: { White: "Alice", Black: "Opponent" }, accuracyW: 99, accuracyB: 1,
    fens: [openingFen], moves: [{ san: "e4" }],
    rows: [{ color: "w", n: 1, san: "e4", lossCp: 0, classification: "best" }],
  });
  const games = Array.from({ length: 10 }, (_, index) => ({
    analysis: base, white: "Alice", black: "Opponent", whiteElo: "2200", blackElo: "2000",
    result: index < 6 ? "1-0" : "0-1", date: "2026.01." + String(index + 1).padStart(2, "0"),
  }));
  const profile = ReviewInsights.aggregate(games).profiles[0];
  assert.equal(ReviewInsights.fideLikePerformance(profile, false).status, "confirm_rating_pool");
  const estimate = ReviewInsights.fideLikePerformance(profile, true);
  assert.equal(estimate.status, "indicative_performance_only");
  assert.equal(estimate.games, 10);
  assert.equal(estimate.averageOpponentElo, 2000);
  assert.ok(estimate.estimate > 2000);
  assert.equal(ReviewInsights.fideLikePerformance(
    ReviewInsights.aggregate(games.slice(0, 9)).profiles[0], true
  ).status, "insufficient_games");
});

test("progress compares error rates only across enough analyzed games at the same time control", () => {
  const games = Array.from({ length: 6 }, (_, index) => {
    const summary = ReviewInsights.buildGameSummary({
      headers: { White: "Alice", Black: "Opponent" }, accuracyW: 80, accuracyB: 80,
      fens: Array.from({ length: 20 }, () => openingFen),
      moves: Array.from({ length: 20 }, () => ({ san: "e4" })),
      rows: Array.from({ length: 20 }, (_, move) => ({
        color: "w", n: move + 1, san: "e4",
        lossCp: move < (index < 3 ? 4 : 1) ? 70 : 0,
        classification: move < (index < 3 ? 4 : 1) ? "mistake" : "best",
      })),
    });
    return { analysis: summary, white: "Alice", black: "Opponent", result: "1/2-1/2",
      timeControl: "600+0", date: "2026.02." + String(index + 1).padStart(2, "0") };
  });
  const profile = ReviewInsights.aggregate(games).profiles[0];
  const trend = ReviewInsights.compareProgress(profile);
  assert.equal(trend.status, "measured_trend_not_causal_proof");
  assert.equal(trend.before.mistake, 20);
  assert.equal(trend.after.mistake, 5);
  assert.equal(ReviewInsights.compareProgress(ReviewInsights.aggregate(games.slice(0, 5)).profiles[0]).status,
    "need_comparable_games");
});


test("level diagnostic counts only completed PGN analyses started after activation", () => {
  const startedAt = "2026-10-27T10:00:00.000Z";
  const state = { active: true, startedAt };
  const items = [
    { analysis: { version: 1, players: [{ ratedMoves: 1 }] }, analyzedAt: "2026-10-27T10:00:01.000Z" },
    { analysis: { version: 1, players: [{ ratedMoves: 1 }] }, analyzedAt: "2026-10-27T09:59:59.000Z" },
    { analysis: null, analyzedAt: "2026-10-27T10:00:02.000Z" },
    { analysis: { version: 2 }, analyzedAt: "2026-10-27T10:00:03.000Z" },
  ];
  const progress = ReviewInsights.levelDiagnosticProgress(state, items);
  assert.equal(progress.active, true);
  assert.equal(progress.analyzedGames, 1);
  assert.equal(progress.remainingGames, 9);
  assert.equal(progress.complete, false);
  const complete = ReviewInsights.levelDiagnosticProgress(state, Array.from({ length: 10 }, () => ({
    analysis: { version: 1, players: [{ ratedMoves: 1 }] }, analyzedAt: "2026-10-27T10:01:00.000Z"
  })));
  assert.equal(complete.complete, true);
  assert.equal(complete.remainingGames, 0);
});

test("Stockfish estimate uses only completed games with tracked engine settings", () => {
  const result = ReviewInsights.stockfishPerformanceEstimate([
    ...Array.from({ length: 10 }, (_, index) => ({
      id: "sf-" + index,
      engineName: "Stockfish 19 NNUE",
      stockfishRatingSource: "supachess-engine-setting-v1",
      stockfishRatingEstimate: 2400,
      userColor: index < 5 ? "w" : "b",
      result: index < 5 ? "1-0" : "0-1",
    })),
    { id: "unfinished", engineName: "Stockfish 19", stockfishRatingSource: "supachess-engine-setting-v1",
      stockfishRatingEstimate: 2400, userColor: "w", result: "*" },
    { id: "legacy", engineName: "Stockfish 19", userColor: "w", result: "1-0" },
    { id: "human", engineName: "Opponent", stockfishRatingSource: "supachess-engine-setting-v1",
      stockfishRatingEstimate: 2400, userColor: "w", result: "1-0" },
  ]);
  assert.equal(result.status, "provisional_engine_relative");
  assert.equal(result.games, 10);
  assert.equal(result.score, 10);
  assert.equal(result.estimate, 2930);
});

test("Stockfish estimate waits for ten unique completed engine games", () => {
  const base = {
    engineName: "Stockfish 19",
    stockfishRatingSource: "supachess-engine-setting-v1",
    stockfishRatingEstimate: 2500,
    userColor: "w",
    result: "1/2-1/2",
  };
  const result = ReviewInsights.stockfishPerformanceEstimate([
    ...Array.from({ length: 9 }, (_, index) => ({ ...base, id: "same" + index })),
    { ...base, id: "same0" },
    { ...base, id: "full-power", stockfishRatingSource: null },
  ]);
  assert.equal(result.status, "insufficient_games");
  assert.equal(result.games, 9);
  assert.equal(result.minimumGames, 10);
});
