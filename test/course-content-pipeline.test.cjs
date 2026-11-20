const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
const courses = require("../js/provided-course-lessons.js");
const pipeline = require("../js/course-content-pipeline.js");

test("course autogenerator creates legal mirror lessons and response exercises", () => {
  const result = pipeline.buildCourseTransfers(courses, Chess);
  assert.equal(result.sourceCount, 22);
  assert.equal(result.generatedLessons.length, 20);
  assert.equal(result.generatedExercises.length, 21);
  assert.equal(result.rejected.length, 0);
  const ids = new Set();
  for (const item of [...result.generatedLessons, ...result.generatedExercises]) {
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    const validation = pipeline.validateLesson(item, Chess);
    assert.deepEqual(validation.issues, [], `${item.id}: ${validation.issues.join(" ")}`);
    const game = new Chess(item.fen);
    assert.equal(game.turn(), item.color, `${item.id}: side to move`);
    for (const action of item.sequence) {
      const move = game.move({ from: action.uci.slice(0, 2), to: action.uci.slice(2, 4), promotion: action.uci.slice(4) || "q" });
      assert.ok(move, `${item.id}: illegal move ${action.uci}`);
    }
  }
});

test("lesson and puzzle validators reject illegal or underspecified content", () => {
  const good = courses[0];
  assert.equal(pipeline.validateLesson(good, Chess).valid, true);
  assert.equal(pipeline.validateLesson({ ...good, sequence: [{ side: "user", uci: "a1a8", explanation: "test" }] }, Chess).valid, false);
  assert.equal(pipeline.validatePuzzle({ id: "bad", fen: "not a fen", answerUci: "a1a2" }, Chess).valid, false);
  assert.equal(pipeline.validatePuzzle({ id: "bad-move", fen: "8/8/8/8/8/8/8/K6k w - - 0 1", answerUci: "a1a8" }, Chess).valid, false);
  assert.equal(pipeline.validatePuzzle({ id: "line-mismatch", fen: "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1", answerUci: "b5c7", solutionLine: ["e1f1"] }, Chess).valid, false);
});

test("Stockfish autoverifier distinguishes unique, ambiguous, and mismatched puzzle answers", () => {
  const puzzle = { id: "fork", fen: "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1", answerUci: "b5c7" };
  const unique = pipeline.verifyEngineAnswer(puzzle, { choices: [{ uci: "b5c7" }, { uci: "e1f1", deltaCp: 42 }] }, Chess);
  assert.equal(unique.status, "verified");
  const ambiguous = pipeline.verifyEngineAnswer(puzzle, { choices: [{ uci: "b5c7" }, { uci: "e1f1", deltaCp: 12 }] }, Chess);
  assert.equal(ambiguous.status, "ambiguous");
  const mismatch = pipeline.verifyEngineAnswer(puzzle, { choices: [{ uci: "e1f1" }, { uci: "b5c7", deltaCp: 90 }] }, Chess);
  assert.equal(mismatch.status, "disagrees");
});
