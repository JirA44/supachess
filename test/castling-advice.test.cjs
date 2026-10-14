const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const context = vm.createContext({ console });
const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
vm.runInContext(`${read("vendor/chess.js")}\nglobalThis.Chess = Chess;`, context);
context.scoreValue = (line) => line.mate !== null
  ? (line.mate > 0 ? 100000 - line.mate * 100 : -100000 - line.mate * 100)
  : line.scoreCp;
context.formatScore = (line, white) => `${white ? "" : ""}${(line.scoreCp / 100).toFixed(2)}`;
vm.runInContext(read("js/coach.js"), context);

const { Chess, buildArguments } = vm.runInContext("({ Chess, buildArguments })", context);

function positionAfterOpponentKingSideCastle() {
  const game = new Chess();
  for (const san of ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5", "Nc3", "O-O"]) {
    assert.ok(game.move(san), `expected legal move ${san}`);
  }
  return game;
}

test("explains a kingside castle as a rook attack plan after the opponent castles kingside", () => {
  const game = positionAfterOpponentKingSideCastle();
  const move = { pv: ["e1g1"], scoreCp: 0, mate: null };
  const result = buildArguments(game.fen(), move, move, [], game.history({ verbose: true }));

  assert.ok(result.pros.some((reason) => reason.includes("possible doublement des tours sur cette aile")));
});

test("keeps the general castling explanation when the move history has no opponent kingside castle", () => {
  const game = positionAfterOpponentKingSideCastle();
  const move = { pv: ["e1g1"], scoreCp: 0, mate: null };
  const historyWithoutCastle = game.history({ verbose: true }).filter((entry) => entry.san !== "O-O");
  const result = buildArguments(game.fen(), move, move, [], historyWithoutCastle);

  assert.ok(result.pros.includes("Roque : met le roi en sécurité et connecte les tours"));
  assert.ok(!result.pros.some((reason) => reason.includes("doublement des tours")));
});
