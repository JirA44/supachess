const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const candidateList = { innerHTML: "" };
const document = {
  getElementById(id) { return id === "candidates-list" ? candidateList : { innerHTML: "", textContent: "", addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} } }; },
  querySelectorAll() { return []; },
};
const context = vm.createContext({ document, esc: String, sanFr: String, reviewState: { grades: [] }, state: { replayIdx: 0 } });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../js/review.js"), "utf8"), context);

test("builds exercises for measurable blunders, mistakes, and inaccuracies in game order", async () => {
  const rows = [
    { n: 2, color: "w", san: "f3", classification: "blunder", lossCp: 240 },
    { n: 2, color: "b", san: "Nf6", classification: "best", lossCp: 0 },
    { n: 2, color: "b", san: "Nc6", classification: "ok", lossCp: 4.2 },
    { n: 3, color: "w", san: "d3", classification: "inaccuracy", lossCp: 35 },
    { n: 3, color: "b", san: "Bc5", classification: "unrated", lossCp: null },
    { n: 4, color: "w", san: "g3", classification: "good", lossCp: 0 },
  ];
  const fens = ["fen-w-blunder", "fen-best", "fen-b-ok", "fen-w-inaccuracy", "fen-unrated", "fen-zero-loss"];
  const moves = [
    { from: "f2", to: "f3" },
    { from: "g8", to: "f6" },
    { from: "b8", to: "c6" },
    { from: "d2", to: "d3" },
    { from: "f8", to: "c5" },
    { from: "g2", to: "g3" },
  ];
  const lines = [
    { scoreCp: 25, mate: null, pv: ["e2e4"] },
    { scoreCp: 4, mate: null, pv: ["g8f6"] },
    { scoreCp: 7, mate: null, pv: ["d2d4"] },
    { scoreCp: 10, mate: null, pv: ["g1f3"] },
    { scoreCp: null, mate: null, pv: [] },
    { scoreCp: 15, mate: null, pv: ["g2g3"] },
  ];
  const result = await vm.runInContext(
    "reviewBuildCorrectionExercises(" + JSON.stringify(rows) + "," + JSON.stringify(fens) + "," + JSON.stringify(moves) + "," + JSON.stringify(lines) + ")",
    context
  );
  const plain = JSON.parse(JSON.stringify(result));
  assert.equal(plain.length, 3);
  assert.deepEqual(plain.map((item) => item.classification), ["blunder", "ok", "inaccuracy"]);
  assert.equal(plain[0].fen, "fen-w-blunder");
  assert.equal(plain[0].bestUci, "e2e4");
  assert.equal(plain[0].playedSan, "f3");
  assert.equal(plain[0].lossCp, 240);
  assert.equal(plain[1].bestUci, "d2d4");
  assert.equal(plain[1].lossCp, 4.2);
  assert.equal(plain[2].bestUci, "g1f3");
});

test("does not create exercises for the best played move or a missing engine PV", async () => {
  const rows = [
    { n: 1, color: "w", san: "e4", classification: "blunder", lossCp: 200 },
    { n: 1, color: "b", san: "e5", classification: "mistake", lossCp: 60 },
  ];
  const result = await vm.runInContext(
    'reviewBuildCorrectionExercises(' + JSON.stringify(rows) + ',["fen-1","fen-2"],[{from:"e2",to:"e4"},{from:"e7",to:"e5"}],[{pv:["e2e4"]},{pv:[]}])',
    context
  );
  assert.equal(result.length, 0);
});


test("hides live engine candidates and board dots while solving a correction", () => {
  context.reviewState.exercise = {};
  context.state.candidates = [{ uci: "d7d5" }];
  context.boardUI = { dots: [{ square: "d5" }] };

  vm.runInContext("reviewHideCorrectionCandidates()", context);

  assert.deepEqual(context.state.candidates, []);
  assert.deepEqual(context.boardUI.dots, []);
  assert.match(candidateList.innerHTML, /masqués pendant la correction/);
  context.reviewState.exercise = null;
});
