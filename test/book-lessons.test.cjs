const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
const { LESSONS, setupGame, buildEngineChoices, engineHintForMove } = require("../js/book-lessons.js");

test("book lesson setups and user/book move sequences are legal", () => {
  for (const lesson of LESSONS) {
    const game = setupGame(lesson, Chess);
    assert.equal(game.turn(), lesson.color, `${lesson.id} should start with the learner to move`);
    for (const action of lesson.sequence) {
      const move = game.move({
        from: action.uci.slice(0, 2),
        to: action.uci.slice(2, 4),
        promotion: action.uci.slice(4) || "q",
      });
      assert.ok(move, `${lesson.id} contains an illegal move ${action.uci}`);
      if (action.side === "user") assert.equal(move.color, lesson.color, `${lesson.id} learner move has the wrong color`);
      else assert.notEqual(move.color, lesson.color, `${lesson.id} book reply has the wrong color`);
    }
  }
});

test("each lesson has a level, principle, transfer, source, and explanation for every half-move", () => {
  for (const lesson of LESSONS) {
    assert.ok(["Débutant", "Intermédiaire", "Avancé", "Expert"].includes(lesson.level), `${lesson.id} should have a level`);
    assert.ok(lesson.question);
    assert.ok(lesson.choices.some((choice) => choice.correct));
    assert.ok(lesson.principle);
    assert.ok(lesson.transfer, `${lesson.id} should tell the learner how to reuse the idea`);
    assert.ok(lesson.author && lesson.book && lesson.reference);
    assert.ok(lesson.sequence.some((action) => action.side === "user"));
    for (const action of lesson.sequence) assert.ok(action.explanation, `${lesson.id} ${action.uci} needs a half-move explanation`);
  }
  assert.deepEqual([...new Set(LESSONS.map((lesson) => lesson.level))], ["Débutant", "Intermédiaire", "Avancé", "Expert"]);
  assert.ok(LESSONS.length >= 100, `the academy should contain 100+ lessons and response drills, received ${LESSONS.length}`);
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
});

test("Stockfish alternatives are ranked, compared, and shown as legal SAN lines", () => {
  const fen = new Chess().fen();
  const result = buildEngineChoices(fen, [
    { multipv: 1, depth: 18, scoreCp: 34, mate: null, pv: ["e2e4", "e7e5"] },
    { multipv: 2, depth: 18, scoreCp: 19, mate: null, pv: ["d2d4", "d7d5"] },
  ], Chess);
  assert.equal(result.legalCount, 20);
  assert.equal(result.choices[0].san, "e4");
  assert.equal(result.choices[0].score, "+0.34");
  assert.equal(result.choices[0].sanLine.join(" "), "e4 e5");
  assert.equal(result.choices[1].san, "d4");
  assert.equal(result.choices[1].deltaCp, 15);
});

test("move hints describe observable chess facts without claiming Stockfish's private reasoning", () => {
  assert.match(engineHintForMove({ flags: "n" }, "r"), /colonnes ouvertes/);
  assert.match(engineHintForMove({ flags: "c" }, "n"), /recaptures/);
  assert.match(engineHintForMove({ flags: "p" }, "p"), /promotion/);
});
