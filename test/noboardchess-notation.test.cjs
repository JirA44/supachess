const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Chess } = require("chess.js");

const HTML = fs.readFileSync(path.join(__dirname, "..", "noboardchess.html"), "utf8");
const INLINE_SCRIPTS = Array.from(HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)).map((match) => match[1]);

function makeElement() {
  const element = {
    tagName: "div",
    textContent: "",
    innerHTML: "",
    hidden: false,
    disabled: false,
    value: "",
    dataset: {},
    attributes: {},
    children: [],
    listeners: {},
    className: "",
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; },
    addEventListener(type, handler) { (this.listeners[type] = this.listeners[type] || []).push(handler); },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren() { this.children = []; },
    querySelectorAll() { return this.children; },
    focus() {},
    select() {},
  };
  return element;
}

function loadGameScript() {
  const elements = new Map();
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Date,
    JSON,
    Math,
    Chess,
    document: {
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, makeElement());
        return elements.get(id);
      },
      createElement: () => makeElement(),
      querySelectorAll: () => [],
    },
    StockfishEngine: class {
      constructor() {
        this.ready = Promise.resolve();
      }
      stop() {}
      async analyze() { return { bestmove: "e2e4" }; }
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(INLINE_SCRIPTS[0], sandbox);
  const evaluate = (code) => vm.runInContext(code, sandbox);
  return { sandbox, elements, evaluate };
}

test("la notation française est convertie en notation internationale", () => {
  const { evaluate } = loadGameScript();
  assert.equal(evaluate("frenchSanToEnglish('Cf3')"), "Nf3");
  assert.equal(evaluate("frenchSanToEnglish('Ff3')"), "Bf3");
  assert.equal(evaluate("frenchSanToEnglish('Tf3')"), "Rf3");
  assert.equal(evaluate("frenchSanToEnglish('Df3')"), "Qf3");
  assert.equal(evaluate("frenchSanToEnglish('e8=D')"), "e8=Q");
  assert.equal(evaluate("frenchSanToEnglish('0-0')"), "O-O");
  assert.equal(evaluate("frenchSanToEnglish('e4')"), "e4");
});

test("un coup saisi en notation française est accepté par l'échiquier", () => {
  const { evaluate } = loadGameScript();
  const san = evaluate("parseUserMove('Cf3').san");
  assert.equal(san, "Nf3");
  evaluate("game.undo()");
  assert.equal(evaluate("parseUserMove('e4').san"), "e4");
});

test("l'inventaire annonce les pièces restantes de la partie", () => {
  const { elements, evaluate } = loadGameScript();
  const inventory = elements.get("piece-inventory");
  evaluate("gameStarted = true");
  evaluate("renderInventory()");
  assert.match(inventory.textContent, /Blancs/);
  assert.match(inventory.textContent, /Noirs/);
  assert.match(inventory.textContent, /P8|8 P/);
});

test("l'aperçu de position se masque après 2 secondes", async () => {
  const { elements, evaluate } = loadGameScript();
  const flash = elements.get("position-flash");
  evaluate("gameStarted = true");
  evaluate("flashPosition()");
  assert.equal(flash.hidden, false);
  assert.match(flash.textContent, /Aperçu \(2 s\)/);
  await new Promise((resolve) => setTimeout(resolve, 2200));
  assert.equal(flash.hidden, true);
});
