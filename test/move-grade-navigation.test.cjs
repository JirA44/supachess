const test = require("node:test");
const assert = require("node:assert/strict");
const { MOVE_GRADE_SHORTCUTS, moveGradeTargetPly, normalizeCategory } = require("../js/move-grade-navigation.js");

test("grade navigation starts at the first matching half-move and cycles only within its side and type", () => {
  const grades = [
    { ply: 2, color: "b", category: "best" },
    { ply: 1, color: "w", category: "brilliant" },
    { ply: 5, color: "w", category: "brilliant" },
    { ply: 7, color: "w", category: "brilliant" },
    { ply: 4, color: "w", category: "error" },
  ];
  assert.equal(moveGradeTargetPly(grades, "w", "brilliant", "first", 7), 1);
  assert.equal(moveGradeTargetPly(grades, "w", "brilliant", "previous", 5), 1);
  assert.equal(moveGradeTargetPly(grades, "w", "brilliant", "next", 5), 7);
  assert.equal(moveGradeTargetPly(grades, "w", "brilliant", "next", 7), 1);
  assert.equal(moveGradeTargetPly(grades, "b", "brilliant", "first", 0), null);
  assert.equal(moveGradeTargetPly(grades, "b", "best", "first", 0), 2);
});

test("review mistake labels normalize to the same error category shown in the counters", () => {
  assert.equal(normalizeCategory("mistake"), "error");
  assert.equal(moveGradeTargetPly([{ ply: 8, color: "b", category: "mistake" }], "b", "error", "first"), 8);
});

test("player shortcuts match the requested keyboard pairs for the eight rated move types", () => {
  assert.deepEqual(MOVE_GRADE_SHORTCUTS.w, {
    brilliant: ["a", "z"], best: ["q", "s"], "very-good": ["w", "x"], good: ["e", "r"],
    ok: ["d", "f"], inaccuracy: ["c", "v"], error: ["t", "y"], blunder: ["g", "h"],
  });
  assert.deepEqual(MOVE_GRADE_SHORTCUTS.b, {
    brilliant: ["b", "n"], best: ["u", "i"], "very-good": ["j", "k"], good: [",", ";"],
    ok: ["o", "p"], inaccuracy: ["l", "m"], error: [":", "!"], blunder: ["^", "$"],
  });
  const assigned = [...Object.values(MOVE_GRADE_SHORTCUTS.w), ...Object.values(MOVE_GRADE_SHORTCUTS.b)].flat();
  assert.equal(new Set(assigned).size, 32, "each shortcut should identify one side, type, and direction");
});
