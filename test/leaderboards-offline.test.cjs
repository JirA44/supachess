const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "js", "leaderboards.js"), "utf8");

function makeElement() {
  const element = {
    textContent: "",
    innerHTML: "",
    hidden: false,
    dataset: {},
    attributes: {},
    children: [],
    listeners: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; },
    addEventListener(type, handler) { (this.listeners[type] = this.listeners[type] || []).push(handler); },
    appendChild(child) { this.children.push(child); return child; },
    querySelectorAll() { return this.children.filter((child) => child.dataset && child.dataset.type); },
    dispatch(type) { (this.listeners[type] || []).forEach((handler) => handler()); },
  };
  return element;
}

function makeSandbox(options) {
  const elements = {
    "leaderboard-tabs": makeElement(),
    "leaderboard-output": makeElement(),
    "leaderboard-status": makeElement(),
    "leaderboard-title": makeElement(),
    "leaderboard-retry": makeElement(),
    "leaderboard-offline": makeElement(),
  };
  const storage = new Map(Object.entries(options.storage || {}));
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Date,
    JSON,
    document: {
      getElementById: (id) => elements[id] || null,
      createElement: () => makeElement(),
    },
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  };
  sandbox.window = sandbox;
  sandbox.SupaLeaderboardsConfig = { timeoutMs: options.timeoutMs || 40 };
  sandbox.SupaProfiles = { getTopRanking: options.getTopRanking };
  sandbox.SupaEngineTournament = options.tournament || null;
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);
  return { sandbox, elements, storage };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 120));

test("le classement en erreur affiche le message réel et le bouton Réessayer", async () => {
  const { elements } = makeSandbox({
    getTopRanking: () => Promise.reject(new Error("réseau indisponible")),
  });
  await tick();
  assert.match(elements["leaderboard-output"].innerHTML, /Classement indisponible/);
  assert.match(elements["leaderboard-output"].innerHTML, /réseau indisponible/);
  assert.equal(elements["leaderboard-retry"].hidden, false);
  assert.equal(elements["leaderboard-status"].textContent, "Erreur de chargement du classement.");
});

test("un délai dépassé bascule sur l'erreur et le repli Moteurs locaux", async () => {
  const { elements } = makeSandbox({
    timeoutMs: 30,
    getTopRanking: () => new Promise(() => {}),
    tournament: {
      getLocalStandings: () => [{ name: "Stockfish 19", played: 6, wins: 4, draws: 1, losses: 1, rating: 1560, peakRating: 1560, scorePercent: 75, winLossRatio: 4 }],
    },
  });
  await tick();
  assert.match(elements["leaderboard-output"].innerHTML, /Classement indisponible/);
  assert.match(elements["leaderboard-output"].innerHTML, /Moteurs locaux · repli hors ligne/);
  assert.equal(elements["leaderboard-retry"].hidden, false);
});

test("un classement en cache reste affiché quand l'actualisation échoue", async () => {
  const first = makeSandbox({
    getTopRanking: () => Promise.resolve([
      { displayName: "Alice", rating: 1500, peakRating: 1600, puzzlesSolved: 3, stats: { puzzle: { played: 4, wins: 3, draws: 1, losses: 0 } } },
    ]),
  });
  await tick();
  assert.match(first.elements["leaderboard-output"].innerHTML, /Alice/);
  const cached = first.storage.get("supachess-leaderboard-v1:puzzle");
  assert.ok(cached, "le classement réussi doit alimenter le cache local");

  const second = makeSandbox({
    storage: { "supachess-leaderboard-v1:puzzle": cached },
    getTopRanking: () => Promise.reject(new Error("service indisponible")),
  });
  await tick();
  assert.match(second.elements["leaderboard-output"].innerHTML, /Alice/);
  assert.match(second.elements["leaderboard-status"].textContent, /cache local/);
  assert.equal(second.elements["leaderboard-retry"].hidden, false);
});
