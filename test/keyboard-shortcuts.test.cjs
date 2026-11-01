const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function createShortcuts(navigator = {}) {
  const values = new Map();
  const events = [];
  const window = {
    navigator,
    localStorage: {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); },
    },
    dispatchEvent(event) { events.push(event); },
  };
  const document = { addEventListener() {}, querySelector() { return null; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/keyboard-shortcut-settings.js"), "utf8"), {
    window, document, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    Set, Map, Object, Array, String, Number, JSON, RegExp,
  });
  return { api: window.SupaKeyboardShortcuts, values, events };
}

function assertUniqueBindings(bindings) {
  const values = [
    ...Object.values(bindings.w).flat(), ...Object.values(bindings.b).flat(),
    bindings.replay.previous, bindings.replay.next, ...bindings.corrections, bindings.closeProfile,
  ];
  assert.equal(new Set(values).size, values.length);
}

test("AZERTY, QWERTY and QWERTZ presets map the grade shortcuts to matching key positions", () => {
  const { api } = createShortcuts();
  assert.equal(api.currentLayout(), "azerty");
  assert.deepEqual(JSON.parse(JSON.stringify(api.buildPreset("azerty").w.brilliant)), ["a", "z"]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.buildPreset("qwerty").w.brilliant)), ["q", "w"]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.buildPreset("qwerty").w.best)), ["a", "s"]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.buildPreset("qwertz").w["very-good"])), ["y", "x"]);
  for (const layout of ["azerty", "qwerty", "qwertz"]) assertUniqueBindings(api.buildPreset(layout));
  assert.equal(api.buildPreset("unknown"), null);
});

test("applying a preset persists it, dispatches updated bindings, and reports the active grid", () => {
  const { api, values, events } = createShortcuts();
  assert.equal(api.applyPreset("qwerty").ok, true);
  assert.equal(api.currentLayout(), "qwerty");
  assert.deepEqual(JSON.parse(values.get(api.STORAGE_KEY)).w.brilliant, ["q", "w"]);
  assert.equal(events.at(-1).type, "supachess:shortcuts-changed");
  assertUniqueBindings(api.getBindings());
});

test("custom edits are marked, duplicate keys are rejected, and reset restores the original preset", () => {
  const { api } = createShortcuts();
  api.applyPreset("qwertz");
  const duplicate = api.saveBinding("grade:w:best:0", "q");
  assert.equal(duplicate.ok, false);
  assert.equal(api.currentLayout(), "qwertz");
  assert.equal(api.saveBinding("grade:w:best:0", "5").ok, true);
  assert.equal(api.currentLayout(), "custom");
  assert.equal(api.resetBindings(), true);
  assert.equal(api.currentLayout(), "azerty");
  assert.deepEqual(JSON.parse(JSON.stringify(api.getBindings().w.brilliant)), ["a", "z"]);
});

test("layout detection identifies AZERTY, QWERTY and QWERTZ from physical key mappings", () => {
  const { api } = createShortcuts();
  const map = (entries) => new Map(Object.entries(entries));
  assert.equal(api.detectLayoutFromMap(map({ KeyA: "q", KeyQ: "a", KeyY: "y", KeyZ: "w" })), "azerty");
  assert.equal(api.detectLayoutFromMap(map({ KeyA: "a", KeyQ: "q", KeyY: "y", KeyZ: "z" })), "qwerty");
  assert.equal(api.detectLayoutFromMap(map({ KeyA: "a", KeyQ: "q", KeyY: "z", KeyZ: "y" })), "qwertz");
  assert.equal(api.detectLayoutFromMap(new Map()), null);
});

test("first visit applies the detected keyboard grid, while a manual choice made during detection is preserved", async () => {
  const qwertyMap = new Map([["KeyA", "a"], ["KeyQ", "q"], ["KeyY", "y"], ["KeyZ", "z"]]);
  const { api, values } = createShortcuts({ language: "fr-FR", keyboard: { getLayoutMap: () => Promise.resolve(qwertyMap) } });
  await api.ready;
  assert.equal(api.currentLayout(), "qwerty");
  assert.deepEqual(JSON.parse(values.get(api.STORAGE_KEY)).w.brilliant, ["q", "w"]);

  const delayed = createShortcuts({ language: "en-US", keyboard: { getLayoutMap: () => new Promise((resolve) => setTimeout(() => resolve(qwertyMap), 10)) } });
  assert.equal(delayed.api.applyPreset("qwertz").ok, true);
  await delayed.api.ready;
  assert.equal(delayed.api.currentLayout(), "qwertz");
});
