const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateStandings, rebuildResultsFromStudyGames } = require("../js/engine-tournament.js");

test("engine tournament ratings use pairwise scores and separate time controls", () => {
  const rows = [
    { date: "2026-11-21T10:00:00.000Z", whiteId: "sf18", blackId: "sf19", result: "1-0", thinkMs: 300 },
    { date: "2026-11-21T10:01:00.000Z", whiteId: "sf19", blackId: "sf18", result: "1-0", thinkMs: 300 },
    { date: "2026-11-21T10:02:00.000Z", whiteId: "berserk14", blackId: "sf19", result: "1/2-1/2", thinkMs: 300 },
    { date: "2026-11-21T10:03:00.000Z", whiteId: "sf18", blackId: "berserk14", result: "1-0", thinkMs: 100 },
  ];
  const standard = calculateStandings(rows, 300);
  const stockfish18 = standard.find((entry) => entry.id === "sf18");
  const stockfish19 = standard.find((entry) => entry.id === "sf19");
  const berserk = standard.find((entry) => entry.id === "berserk14");
  assert.deepEqual([stockfish18.wins, stockfish18.draws, stockfish18.losses, stockfish18.played], [1, 0, 1, 2]);
  assert.equal(stockfish18.scorePercent, 50);
  assert.equal(stockfish18.winLossRatio, 1);
  assert.equal(stockfish19.draws, 1);
  assert.equal(berserk.winLossRatio, "—");
  assert.equal(standard.every((entry) => entry.played !== 1 || entry.id !== "sf18"), true);
  const rapid = calculateStandings(rows, 100);
  assert.equal(rapid.find((entry) => entry.id === "sf18").played, 1);
  assert.equal(rapid.find((entry) => entry.id === "sf18").winLossRatio, "∞");
  const general = calculateStandings(rows, "all");
  const general18 = general.find((entry) => entry.id === "sf18");
  assert.deepEqual([general18.wins, general18.draws, general18.losses, general18.played], [2, 0, 1, 3]);
  assert.equal(general18.winLossRatio, 2);
  assert.equal(general18.scorePercent, 66.7);
});

test("rebuilds a local general engine ranking from completed tournament PGNs", () => {
  const recovered = rebuildResultsFromStudyGames([{
    id: "engine-study-1",
    gameNumber: 101,
    date: "2026-11-21T12:00:00.000Z",
    generatedStudyGame: true,
    result: "1-0",
    pgn: '[White "Stockfish 18"]\n[Black "Berserk 14"]\n[Result "1-0"]\n\n1. e4 e5 1-0',
  }]);
  assert.equal(recovered.length, 1);
  assert.deepEqual([recovered[0].whiteId, recovered[0].blackId, recovered[0].result, recovered[0].thinkMs], ["sf18", "berserk14", "1-0", null]);
  const general = calculateStandings(recovered, "all");
  assert.equal(general.find((entry) => entry.id === "sf18").wins, 1);
  assert.equal(general.find((entry) => entry.id === "berserk14").losses, 1);
  assert.equal(calculateStandings(recovered, 300).find((entry) => entry.id === "sf18").played, 0);
  assert.equal(rebuildResultsFromStudyGames([{ generatedStudyGame: true, result: "1-0", pgn: '[White "Human"]\n[Black "Unknown"]' }]).length, 0);
});
