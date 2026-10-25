const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: "", addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} } });
    return elements.get(id);
  },
  querySelectorAll() { return []; },
};
const context = vm.createContext({ document, esc: String, sanFr: String, reviewState: { grades: [] }, state: { replayIdx: 0 } });
const source = fs.readFileSync(path.join(__dirname, "../js/review.js"), "utf8");
vm.runInContext(source, context);

function classify(lossCp, options = {}) {
  return vm.runInContext(`reviewClassOf(${JSON.stringify({ lossCp, ...options })}, ${JSON.stringify(options.grade || {})})`, context);
}

test("classifies best and brilliant moves separately from centipawn loss errors", () => {
  assert.equal(classify(0, { bestMove: true, grade: { brilliant: true } }), "brilliant");
  assert.equal(classify(0, { bestMove: true }), "best");
  assert.equal(classify(10), "very-good");
  assert.equal(classify(11), "good");
  assert.equal(classify(20), "good");
  assert.equal(classify(29), "ok");
  assert.equal(classify(30), "inaccuracy");
  assert.equal(classify(60), "mistake");
  assert.equal(classify(200), "blunder");
  assert.equal(classify(null), "unrated");
});

test("renders two player cards with symbols, separate counts, and clickable half-moves", () => {
  const rows = [
    { n: 1, color: "w", san: "e4", bestMove: true, lossCp: 0, delta: 0, tag: "" },
    { n: 1, color: "b", san: "e5", lossCp: 80, delta: 0.8, tag: "?" },
  ];
  vm.runInContext(`reviewRenderLocal(${JSON.stringify(rows)}, 98, 94, { White: "White", Black: "Black", Result: "1-0"})`, context);
  const html = elements.get("review-report").innerHTML;
  assert.equal((html.match(/class="review-player-card/g) || []).length, 2);
  assert.match(html, /review-grade-best[\s\S]*?★[\s\S]*?1 coup/);
  assert.match(html, /review-grade-mistake[\s\S]*?\?[^?][\s\S]*?1 coup/);
  assert.match(html, /data-review-ply="1"[^>]*aria-label="Aller à la position après 1\. e4"/);
  assert.match(html, /data-review-ply="2"[^>]*aria-label="Aller à la position après 1\.\.\. e5"/);
});
