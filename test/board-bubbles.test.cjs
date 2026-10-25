const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function makeElement(tagName) {
  return {
    tagName,
    children: [],
    dataset: {},
    attributes: {},
    className: "",
    classList: { add() {} },
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

function renderBubble({ dots = [], lastMove = null, previewDot = null }) {
  const root = makeElement("div");
  const context = vm.createContext({ document: { createElement: makeElement } });
  const source = fs.readFileSync(path.join(__dirname, "../js/board.js"), "utf8");
  vm.runInContext(`${source}\nglobalThis.BoardUI = BoardUI;`, context);
  const board = new context.BoardUI(root, () => {});
  board.dots = dots;
  board.lastMove = lastMove;
  board.previewDot = previewDot;
  board.render({ board: () => Array.from({ length: 8 }, () => Array(8).fill(null)) });
  const square = root.children.find((cell) => cell.dataset.square === "e4");
  return square.children.find((child) => /cdot|played-move-bubble/.test(child.className));
}

function bubbleLines(bubble) {
  return bubble.children.map((child) => child.textContent);
}

test("candidate bubble shows the rating above the evaluation without /10", () => {
  const bubble = renderBubble({ dots: [{ square: "e4", label: "?3", evaluation: "+0.11", quality: "bad" }] });
  assert.deepEqual(bubbleLines(bubble), ["?3", "+0.11"]);
  assert.doesNotMatch(bubbleLines(bubble).join(" "), /\/10/);
});

test("played-move bubble keeps the rating and evaluation on separate lines", () => {
  const bubble = renderBubble({ lastMove: {
    from: "e2", to: "e4", san: "e4", evaluation: "+0.11",
    grade: { symbol: "?", rating: 3, label: "Erreur", tone: "bad" },
  } });
  assert.deepEqual(bubbleLines(bubble), ["?3", "+0.11"]);
});

test("preview bubble also shows the evaluation beneath its rating", () => {
  const bubble = renderBubble({ previewDot: {
    square: "e4", label: "?3", evaluation: "+0.11", quality: "bad", title: "Coup testé",
  } });
  assert.deepEqual(bubbleLines(bubble), ["?3", "+0.11"]);
});

