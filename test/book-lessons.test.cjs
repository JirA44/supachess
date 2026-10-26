const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
const { LESSONS, setupGame, nextLessonIndex } = require("../js/book-lessons.js");

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
    if (lesson.id === "capablanca-rook-king") assert.equal(game.in_checkmate(), true, "the rook lesson should end in checkmate");
  }
});

test("each lesson asks for a principle and cites its source", () => {
  for (const lesson of LESSONS) {
    assert.ok(lesson.question);
    assert.ok(lesson.choices.some((choice) => choice.correct));
    assert.ok(lesson.principle);
    assert.ok(lesson.author && lesson.book && lesson.reference);
    assert.ok(lesson.sequence.some((action) => action.side === "user"));
  }
});

test("the rook lesson explains Kg2 against Kh2 and the catalog has more source-based lessons", () => {
  const rookLesson = LESSONS.find((lesson) => lesson.id === "capablanca-rook-king");
  const kingMove = rookLesson.sequence.find((action) => action.uci === "h1g2");
  assert.ok(kingMove.explanation.includes("colonne g"));
  assert.ok(kingMove.compare.some((alternative) => alternative.uci === "h1h2"));
  assert.ok(LESSONS.length >= 6);
  assert.ok(LESSONS.some((lesson) => lesson.id === "capablanca-pawn-opposition-draw"));
});

test("next lesson skips mastered lessons and cycles for review after the course is mastered", () => {
  const progress = {
    [LESSONS[0].id]: { mastered: true },
    [LESSONS[1].id]: { completed: true, mastered: true },
  };
  assert.equal(nextLessonIndex(LESSONS, progress, 0), 2);
  LESSONS.forEach((lesson) => { progress[lesson.id] = { mastered: true }; });
  assert.equal(nextLessonIndex(LESSONS, progress, 2), 3);
});
