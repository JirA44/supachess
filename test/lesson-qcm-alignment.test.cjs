const test = require("node:test");
const assert = require("node:assert/strict");
const { collectProblems } = require("../scripts/check_lesson_qcm_alignment.cjs");

test("chaque QCM sur coup correspond au premier coup attendu de la leçon", () => {
  const result = collectProblems();
  const detail = result.problems.map((item) => item.id + " : " + item.message).join("\n");
  assert.deepEqual(result.problems, [], detail);
  assert.ok(result.checked > 100, "le contrôle doit couvrir les QCM sur coup");
});
