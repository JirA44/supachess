/* Run with: node --test test/blindspots.test.cjs
   chess.js 0.13.x is the same version pinned by SupaChess. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
global.Chess = Chess;
const { tacticalMisses, analyzePgn } = require("../js/blindspots.js");

test("rejects illegal UCI, never guesses an error", () => {
  const r=tacticalMisses(new Chess().fen(), "e2e5");
  assert.equal(r.status,"INVALID_MOVE");
});

test("no unsupported alert after normal e4 from start", () => {
  const r=tacticalMisses(new Chess().fen(),"e2e4");
  assert.equal(r.status,"OK");
  assert.equal(r.diagnostics.length,0);
});

test("detects opponent's legal one-move capture of queen", () => {
  const fen="3rk3/8/8/8/8/8/P7/3QK3 w - - 0 1";
  const r=tacticalMisses(fen,"a2a3",{lossCp:100});
  assert.equal(r.status,"OK");
  const queen=r.diagnostics.find(d=>d.square==="d1");
  assert.ok(queen);
  assert.equal(queen.code,"PIECE_EN_PRISE_EN_UN_COUP");
  assert.match(queen.text,/d1/);
  assert.equal(queen.evidence,"CAPTURE_LEGALE_IMMEDIATE");
  assert.match(queen.caveat,/pas une perte nette/);
});

test("does not claim illegal capture through a blocking pawn", () => {
  const fen="3rk3/8/8/8/8/8/P2P4/3QK3 w - - 0 1";
  const r=tacticalMisses(fen,"a2a3");
  assert.equal(r.status,"OK");
  assert.equal(r.diagnostics.some(d=>d.square==="d1"),false);
});

test("PGN reports evidence separately for each player", () => {
  const pgn='[Event "Test"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *';
  // This game is intentionally unfinished: analysis accepts it.
  const r=analyzePgn(pgn);
  assert.equal(r.reports.length,4);
  assert.equal(r.byColor.w.moves,2);
  assert.equal(r.byColor.b.moves,2);
});

test("invalid PGN is refused",()=> assert.throws(()=>analyzePgn("not a legal pgn")));
