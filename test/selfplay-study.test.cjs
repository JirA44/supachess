const assert = require("node:assert/strict");
const test = require("node:test");
const { Chess } = require("chess.js");
const { buildEngineGameEntries, storeGeneratedEngineGame } = require("../js/selfplay-study.js");

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
}

test("generated engine match is validated, numbered, and available to the study reader", () => {
  const chess = new Chess();
  for (const san of ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6"]) assert.ok(chess.move(san));
  const storage = memoryStorage({ supachess_game_sequence_v1: "8" });
  const entry = storeGeneratedEngineGame({
    ChessCtor: Chess, chess, storage, result: "1/2-1/2", white: "Stockfish 19", black: "Berserk 14",
    engineName: "Stockfish 19 vs Berserk 14", termination: "Nulle technique à la limite", date: new Date("2026-11-16T12:00:00Z")
  });

  assert.equal(entry.gameNumber, 9);
  assert.match(entry.pgn, /\[SupaChessSelfPlayMode "supa-vs-supa"\]/);
  const replay = new Chess();
  assert.notEqual(replay.load_pgn(entry.pgn), false);
  assert.equal(replay.history().length, 8);
  assert.equal(JSON.parse(storage.getItem("supachess_games"))[0].result, "1/2-1/2");
  assert.equal(storage.getItem("supachess_game_sequence_v1"), "9");

  const positions = buildEngineGameEntries([entry], Chess);
  assert.equal(positions.length, 8);
  assert.equal(positions[0].kind, "selfplay");
  assert.equal(positions[0].sourceEngineName, "Supa contre Supa · Stockfish 19 vs Berserk 14");
});

test("invalid or unfinished engine result is never stored", () => {
  const chess = new Chess();
  chess.move("e4");
  const storage = memoryStorage();
  assert.throws(() => storeGeneratedEngineGame({ ChessCtor: Chess, chess, storage, result: "*", white: "SF", black: "Berserk", engineName: "SF vs Berserk" }), /résultat/);
  assert.equal(storage.getItem("supachess_games"), null);
});
