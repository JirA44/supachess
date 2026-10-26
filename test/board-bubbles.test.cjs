const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function makeElement(tagName) {
  const element = {
    tagName,
    children: [],
    dataset: {},
    attributes: {},
    className: "",
    classList: { add(name) { this.owner.className += (this.owner.className ? " " : "") + name; } },
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  element.classList.owner = element;
  return element;
}

function renderBubble({ dots = [], lastMove = null, previewDot = null, legalTargets = [], legalTargetHints = {}, showMoveDots = true }) {
  const root = makeElement("div");
  const context = vm.createContext({ document: { createElement: makeElement } });
  const source = fs.readFileSync(path.join(__dirname, "../js/board.js"), "utf8");
  vm.runInContext(`${source}\nglobalThis.BoardUI = BoardUI;`, context);
  const board = new context.BoardUI(root, () => {});
  board.dots = dots;
  board.lastMove = lastMove;
  board.previewDot = previewDot;
  board.legalTargets = legalTargets;
  board.legalTargetHints = legalTargetHints;
  board.showMoveDots = showMoveDots;
  board.render({ board: () => Array.from({ length: 8 }, () => Array(8).fill(null)) });
  const square = root.children.find((cell) => cell.dataset.square === "e4");
  return square;
}

function bubbleLines(bubble) {
  return bubble.children.map((child) => child.textContent);
}

test("candidate bubble shows the rating above the evaluation without /10", () => {
  const square = renderBubble({ dots: [{ square: "e4", label: "?3", evaluation: "+0.11", quality: "bad" }] });
  const bubble = square.children.find((child) => child.className.includes("cdot-stack")).children[0];
  assert.deepEqual(bubbleLines(bubble), ["?3", "+0.11"]);
  assert.doesNotMatch(bubbleLines(bubble).join(" "), /\/10/);
});

test("candidate moves landing on the same square get separate stacked bubbles", () => {
  const square = renderBubble({ dots: [
    { square: "e4", label: "★10", evaluation: "+0.11", quality: "best", title: "Nf6" },
    { square: "e4", label: "✓8", evaluation: "+0.05", quality: "good", title: "Nc6" },
  ] });
  const stack = square.children.find((child) => child.className.includes("cdot-stack"));
  assert.match(stack.className, /multiple/);
  assert.equal(stack.children.length, 2);
  assert.deepEqual(stack.children.map((bubble) => bubble.children[0].textContent), ["★10", "✓8"]);
  assert.deepEqual(stack.children.map((bubble) => bubble.children[1].textContent), ["+0.11", "+0.05"]);
  assert.deepEqual(stack.children.map((bubble) => bubble.attributes["aria-label"]), ["Nf6", "Nc6"]);
});

test("candidate grouping keeps every move that shares a destination", () => {
  const context = vm.createContext({});
  const source = fs.readFileSync(path.join(__dirname, "../js/board.js"), "utf8");
  vm.runInContext(`${source}\nglobalThis.candidateDotsFromGroups = candidateDotsFromGroups;`, context);
  const dots = context.candidateDotsFromGroups(new Map([["d3", [
    { san: "Nbd3", label: "★10", evaluation: "+0.11", grade: { tone: "best" } },
    { san: "Nfd3", label: "✓8", evaluation: "+0.05", grade: { tone: "good" } },
  ]]]));
  assert.deepEqual(Array.from(dots, (dot) => dot.square), ["d3", "d3"]);
  assert.deepEqual(Array.from(dots, (dot) => dot.label), ["★10", "✓8"]);
  assert.deepEqual(Array.from(dots, (dot) => dot.title), ["Nbd3: ★10 · +0.11", "Nfd3: ✓8 · +0.05"]);
});

test("played-move bubble keeps the rating and evaluation on separate lines", () => {
  const square = renderBubble({ lastMove: {
    from: "e2", to: "e4", san: "e4", evaluation: "+0.11",
    grade: { symbol: "?", rating: 3, label: "Erreur", tone: "bad" },
  } });
  const bubble = square.children.find((child) => child.className.includes("played-move-bubble"));
  assert.deepEqual(bubbleLines(bubble), ["?3", "+0.11"]);
});

test("preview bubble also shows the evaluation beneath its rating", () => {
  const square = renderBubble({ previewDot: {
    square: "e4", label: "?3", evaluation: "+0.11", quality: "bad", title: "Coup testé",
  } });
  const bubble = square.children.find((child) => child.className.includes("preview-move-bubble"));
  assert.deepEqual(bubbleLines(bubble), ["?3", "+0.11"]);
});


test("legal move dots are independent of candidate bubbles and use move quality", () => {
  const square = renderBubble({
    dots: [{ square: "e4", label: "★10", evaluation: "+0.11", quality: "best" }],
    legalTargets: ["e4"],
    legalTargetHints: { e4: { quality: "q-bad", capture: true, san: "Nxe4", evaluation: "-1.20" } },
  });
  const marker = square.children.find((child) => child.className.includes("legal-hint"));
  const bubbles = square.children.find((child) => child.className.includes("cdot-stack"));
  assert.match(marker.className, /q-bad/);
  assert.match(marker.className, /capture/);
  assert.equal(marker.title, "Nxe4 — -1.20");
  assert.ok(bubbles, "candidate evaluation bubble remains visible");

  const hiddenSquare = renderBubble({ legalTargets: ["e4"], showMoveDots: false });
  assert.equal(hiddenSquare.children.some((child) => child.className.includes("legal-hint")), false);
});

test("played mistake leaves a red marker on its destination square", () => {
  const square = renderBubble({ lastMove: {
    from: "e2", to: "e4", san: "Qe4", evaluation: "-1.20",
    grade: { symbol: "?", rating: 3, label: "Erreur", tone: "bad" },
  } });
  assert.match(square.className, /bad-move/);
  const marker = square.children.find((child) => child.className.includes("bad-move-marker"));
  assert.equal(marker.textContent, "!");
  assert.match(marker.title, /Erreur/);
});


test("a bad candidate preview marks its destination red before it is played", () => {
  const square = renderBubble({ previewDot: {
    square: "e4", label: "?3", evaluation: "-1.20", quality: "bad", title: "e4 — erreur",
  } });
  assert.match(square.className, /bad-move/);
  const marker = square.children.find((child) => child.className.includes("bad-move-marker"));
  assert.equal(marker.textContent, "!");
  assert.match(marker.title, /erreur/);
});
