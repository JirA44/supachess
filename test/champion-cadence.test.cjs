const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "js", "champion-metrics.js"), "utf8");

function makeElement() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    dataset: {},
    attributes: {},
    children: [],
    listeners: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; },
    addEventListener(type, handler) { (this.listeners[type] = this.listeners[type] || []).push(handler); },
    appendChild(child) { this.children.push(child); return child; },
    querySelectorAll() { return this.children; },
    focus() {},
    select() {},
  };
}

function record(name, accuracy, acpl, ratedMoves, cadence) {
  return {
    name,
    accuracy,
    acpl,
    ratedMoves,
    cadence,
    gamesAnalyzed: 5,
    candidateGames: 5,
    averageDepth: 18,
    engine: "Stockfish",
    movetime: 300,
    completedAt: "2026-11-27T00:00:00.000Z",
  };
}

function loadModule(results) {
  const elements = new Map();
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Date,
    JSON,
    Math,
    document: {
      readyState: "complete",
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, makeElement());
        return elements.get(id);
      },
      createElement: () => makeElement(),
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    localStorage: {
      getItem: () => JSON.stringify(results || {}),
      setItem: () => {},
      removeItem: () => {},
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);
  return { sandbox, elements };
}

test("les repères de cadence regroupent les analyses locales par cadence", () => {
  const { sandbox, elements } = loadModule({
    carlsen: record("Magnus Carlsen", 92, 12, 100, "blitz"),
    fischer: record("Robert James Fischer", 88, 20, 100, "blitz"),
    anand: record("Viswanathan Anand", 80, 40, 50, "classical"),
  });
  const body = elements.get("champion-cadence-body");
  const status = elements.get("champion-cadence-status");
  sandbox.window.SupaChampionMetrics.renderCadenceReferences();
  assert.match(body.innerHTML, /Blitz · 3 min \+ 2 s/);
  assert.match(body.innerHTML, /Classique · 15 min \+ 10 s/);
  assert.match(status.textContent, /3 analyse\(s\)/);
});

test("le filtre de cadence limite les lignes affichées", () => {
  const { sandbox, elements } = loadModule({
    carlsen: record("Magnus Carlsen", 92, 12, 100, "blitz"),
    anand: record("Viswanathan Anand", 80, 40, 50, "classical"),
  });
  const body = elements.get("champion-cadence-body");
  const filter = elements.get("champion-cadence-filter");
  filter.value = "classical";
  sandbox.window.SupaChampionMetrics.renderCadenceReferences();
  assert.match(body.innerHTML, /Classique/);
  assert.doesNotMatch(body.innerHTML, /Blitz/);
});
