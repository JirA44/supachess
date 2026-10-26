const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const KEY = "supachess_reviewed_pgns";
const pgn = '[Event "Club night"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 *';
const storage = new Map();

function createContext() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        innerHTML: "", textContent: "", addEventListener() {},
        classList: { add() {}, remove() {}, toggle() {} },
      });
      return elements.get(id);
    },
    querySelectorAll() { return []; },
  };
  const context = vm.createContext({
    document,
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, value); },
    },
    Date,
    Math,
    esc: (value) => String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char])),
    sanFr: String,
    reviewState: { grades: [] },
    state: { replayIdx: 0 },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../js/review.js"), "utf8"), context);
  return { context, elements };
}

test("successfully analyzed PGNs are saved, deduplicated, and rendered after reload", () => {
  storage.clear();
  const first = createContext();
  vm.runInContext(`reviewHistorySave(${JSON.stringify(pgn)}, { White: "Alice", Black: "Bob", Result: "1-0", Event: "Club night" })`, first.context);

  const saved = JSON.parse(storage.get(KEY));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].pgn, pgn);
  assert.match(first.elements.get("review-history-list").innerHTML, /Alice vs Bob/);
  assert.match(first.elements.get("review-history-list").innerHTML, /Analyser à nouveau/);

  const second = createContext();
  assert.equal(second.elements.get("review-history-list").innerHTML, first.elements.get("review-history-list").innerHTML);

  vm.runInContext(`reviewHistorySave(${JSON.stringify(pgn.replace(/\n/g, "\r\n"))}, { White: "Alice", Black: "Bob" })`, second.context);
  assert.equal(JSON.parse(storage.get(KEY)).length, 1);
});
