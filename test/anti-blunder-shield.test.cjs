/* Run with: node --test test/anti-blunder-shield.test.cjs
   chess.js 0.13.x is the same version pinned by SupaChess. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
global.Chess = Chess;
const shield = require("../js/anti-blunder-shield.js");

test("a legal move that keeps every piece protected raises no alert", () => {
  const fen = "k2r4/8/8/8/8/8/3B4/K2Q4 w - - 0 1";
  const report = shield.diagnoseMove(fen, "d1e1");
  assert.equal(report.status, "OK");
  assert.equal(report.alert, false);
  assert.equal(report.findings.length, 0);
});

test("a move that opens a file on an undefended queen is reported as a capture", () => {
  const fen = "k2r4/8/8/8/8/8/3B4/K2Q4 w - - 0 1";
  const report = shield.diagnoseMove(fen, "d2c3");
  assert.equal(report.status, "OK");
  assert.equal(report.alert, true);
  const finding = report.findings.find((entry) => entry.code === "PIECE_NON_DEFENDUE_ATTAQUEE");
  assert.ok(finding);
  assert.equal(finding.square, "d1");
  assert.equal(finding.piece, "q");
  assert.equal(finding.severity, "alerte_importante");
  assert.match(finding.text, /d1/);
  assert.ok(finding.suggestedHabit.length > 0);
  assert.match(report.message, /en prise/);
});

test("a piece already attacked before the move is not blamed on the new move", () => {
  const fen = "k2r4/8/8/8/8/8/3B4/K2Q4 w - - 0 1";
  const shielded = new Chess(fen);
  shielded.move({ from: "d1", to: "e1" });
  const stillShielded = shield.diagnoseMove(shielded.fen(), "a1b1");
  assert.equal(stillShielded.alert, false);
});

test("a move that allows mate in one is reported with the mating move", () => {
  const fen = "1r2k3/8/8/8/8/8/6PP/RQ5K w - - 0 1";
  const report = shield.diagnoseMove(fen, "a1a4");
  assert.equal(report.status, "OK");
  assert.equal(report.alert, true);
  const mate = report.findings.find((entry) => entry.code === "MAT_EN_UN_ADVERSE");
  assert.ok(mate);
  assert.equal(mate.mateSan, "Rxb1#");
  assert.match(report.message, /mat en un/);
});

test("an illegal or unknown move is refused without any claim", () => {
  const fen = "k2r4/8/8/8/8/8/3B4/K2Q4 w - - 0 1";
  assert.equal(shield.diagnoseMove(fen, "e2e4").status, "INVALID_MOVE");
  assert.equal(shield.diagnoseMove(fen, "zzzz").status, "INVALID_MOVE");
  assert.equal(shield.diagnoseMove("not a fen", "a1a2").status, "INVALID_FEN");
  assert.equal(shield.diagnoseMove(fen, "a1a2").alert, false);
});

test("the shield stays inactive when it is switched off", () => {
  const status = shield.evaluateContext({ enabled: false });
  assert.equal(status.active, false);
  assert.match(status.reason, /désactivé/);
});

test("the shield never measures a diagnostic game", () => {
  const status = shield.evaluateContext({ enabled: true, diagnosticActive: true });
  assert.equal(status.active, false);
  assert.match(status.reason, /Diagnostic/);
});

test("the shield never interferes with an unassisted game", () => {
  const status = shield.evaluateContext({ enabled: true, unassistedGame: true });
  assert.equal(status.active, false);
});

test("the shield stays off in blitz and rapid games", () => {
  const blitz = shield.evaluateContext({ enabled: true, gameMode: "vs-engine", clocksEnabled: true, whiteMinutes: 3, blackMinutes: 3 });
  assert.equal(blitz.active, false);
  assert.match(blitz.reason, /blitz|rapide/);
});

test("the shield is active in a training game with a slow clock", () => {
  const status = shield.evaluateContext({ enabled: true, gameMode: "vs-engine", clocksEnabled: true, whiteMinutes: 10, blackMinutes: 10 });
  assert.equal(status.active, true);
  assert.match(status.reason, /entraînement/);
});

test("the shield is active in an untimed training game", () => {
  const status = shield.evaluateContext({ enabled: true, gameMode: "vs-engine", clocksEnabled: false });
  assert.equal(status.active, true);
});
