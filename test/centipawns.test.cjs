const test=require("node:test");
const assert=require("node:assert/strict");
const {Chess}=require("chess.js");
global.Chess=Chess;
global.ChessBlindspots=require("../js/blindspots.js");
const {explain}=require("../js/centipawn-explanations.js");

test("a normal move can be +0 cp loss even when raw white evaluation shifts",()=>{
  const c=new Chess();const before=c.fen();c.move("e4");
  const r=explain({fenBefore:before,fenAfter:c.fen(),uci:"e2e4",
    bestBefore:{scoreCp:30,mate:null,depth:18,pv:["e2e4"]},
    bestAfter:{scoreCp:-30,mate:null,depth:18,pv:["e7e5"]}});
  assert.equal(r.status,"OK");
  assert.equal(r.lossCp,0);
  assert.equal(r.swingWhiteCp,0);
});
test("centipawn loss uses same mover perspective before and after",()=>{
  const c=new Chess();c.move("e4");const before=c.fen();c.move("e5");
  const r=explain({fenBefore:before,fenAfter:c.fen(),uci:"e7e5",
    bestBefore:{scoreCp:-20,mate:null,depth:18,pv:["c7c5"]},
    bestAfter:{scoreCp:100,mate:null,depth:18,pv:["g1f3"]}});
  assert.equal(r.lossCp,80);
  assert.equal(r.swingWhiteCp,80);
  assert.match(r.explanation,/c5/);
});
test("a missed engine-preferred check is explained as a candidate, not a universal rule",()=>{
  const before="4k3/8/8/8/8/8/4R3/4K3 w - - 0 1";
  const c=new Chess(before);c.move("Kd1");
  const r=explain({fenBefore:before,fenAfter:c.fen(),uci:"e1d1",
    bestBefore:{scoreCp:250,mate:null,depth:18,pv:["e2e7"]},
    bestAfter:{scoreCp:-100,mate:null,depth:18,pv:["e8d7"]}});
  assert.equal(r.status,"OK");
  assert.equal(r.principles[0].code,"LOOK_FOR_CHECKS");
  assert.equal(r.principles[0].confidence,"candidate");
  assert.match(r.principles[0].caveat,/ne prouve pas que tout échec est bon/);
});
test("checkmate is not represented as fake centipawns",()=>{
  const c=new Chess();c.move("f3");c.move("e5");c.move("g4");const before=c.fen();c.move("Qh4#");
  const r=explain({fenBefore:before,fenAfter:c.fen(),uci:"d8h4",
    bestBefore:{scoreCp:null,mate:1,depth:20,pv:["d8h4"]},bestAfter:null});
  assert.equal(r.status,"MATE_EVALUATION");
  assert.equal(r.lossCp,null);
});
test("missing engine evaluation is not replaced with fabricated 0",()=>{
  const c=new Chess();const before=c.fen();c.move("d4");
  const r=explain({fenBefore:before,fenAfter:c.fen(),uci:"d2d4",
    bestBefore:null,bestAfter:null});
  assert.equal(r.status,"UNKNOWN_CP");
  assert.equal(r.lossCp,null);
});
test("illegal UCI refused",()=>{
  const r=explain({fenBefore:new Chess().fen(),fenAfter:new Chess().fen(),
    uci:"e2e5",bestBefore:null,bestAfter:null});
  assert.equal(r.status,"INVALID_MOVE");
});

test("explains a checking reply found in the engine line and exposes the cause catalog",()=>{
  const before="7k/4q3/8/8/8/8/8/2K5 w - - 0 1";
  const c=new Chess(before);assert.ok(c.move("Kb1"));
  const r=explain({fenBefore:before,fenAfter:c.fen(),uci:"c1b1",
    bestBefore:{scoreCp:50,mate:null,depth:12,pv:["c1b1"]},
    bestAfter:{scoreCp:100,mate:null,depth:14,pv:["e7e1"]}});
  assert.ok(r.observations.some(x=>x.code==="OPPONENT_CHECK"));
  assert.ok(r.causeCatalog.length>=20);
});

test("explains an engine-preferred attack with a three-to-one pressure count",()=>{
  const before="8/8/4k3/Q3r3/2N5/8/8/4R2K w - - 0 1";
  const played=new Chess(before);assert.ok(played.move("Qb5"));
  const r=explain({fenBefore:before,fenAfter:played.fen(),uci:"a5b5",
    bestBefore:{scoreCp:500,mate:null,depth:18,pv:["h1g1"]},
    bestAfter:{scoreCp:-100,mate:null,depth:18,pv:["e6e7"]}});
  assert.ok(r.observations.some(x=>x.code==="BEST_MOVE_OUTNUMBERED_ATTACK"&&/3 attaquants contre 1 défenseur/.test(x.text)));
});
