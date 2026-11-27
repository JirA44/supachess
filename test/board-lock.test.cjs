const test = require("node:test");
const assert = require("node:assert/strict");
const { BoardUI } = require("../js/board.js");

function stubElement() {
  const classes = new Set();
  const attributes = new Map();
  return {
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const next = force === undefined ? !classes.has(name) : Boolean(force);
        if (next) classes.add(name); else classes.delete(name);
        return next;
      },
    },
    attributes,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
    addEventListener: () => {},
    contains: () => true,
  };
}

test("l'échiquier se verrouille puis se déverrouille à la demande", () => {
  const el = stubElement();
  const board = new BoardUI(el, () => {});
  assert.equal(board.locked, false);

  board.setLocked(true);
  assert.equal(board.locked, true);
  assert.equal(el.classList.contains("is-locked"), true);
  assert.equal(el.getAttribute("aria-disabled"), "true");
  assert.equal(board.selected, null);
  assert.deepEqual(board.legalTargets, []);

  board.setLocked(false);
  assert.equal(board.locked, false);
  assert.equal(el.classList.contains("is-locked"), false);
  assert.equal(el.getAttribute("aria-disabled"), "false");
});

test("un échiquier verrouillé ignore le glisser-déposer", () => {
  const el = stubElement();
  let clicks = 0;
  const board = new BoardUI(el, () => { clicks++; });
  board.setLocked(true);
  board._onPointerDown({ pointerId: 1, clientX: 10, clientY: 10, button: 0, isPrimary: true, target: { closest: () => null } });
  assert.equal(board.pointerGesture, null);
  assert.equal(clicks, 0);
});
