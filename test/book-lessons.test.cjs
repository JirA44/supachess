const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
const { LESSONS, setupGame, buildEngineChoices, engineHintForMove, methodPathLessonIndices, nextMethodPathLessonIndex } = require("../js/book-lessons.js");

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
    assert.ok(lesson.program, `${lesson.id} should belong to a reinforcement program`);
    assert.ok(lesson.pitfall, `${lesson.id} should explain what to avoid`);
    assert.equal(lesson.choices.filter((choice) => choice.correct).length, 1, `${lesson.id} should have one correct principle`);
    assert.ok(lesson.sequence.some((action) => action.side === "user"));
    for (const action of lesson.sequence) assert.ok(action.explanation, `${lesson.id} ${action.uci} needs a half-move explanation`);
  }
  assert.deepEqual([...new Set(LESSONS.map((lesson) => lesson.level))], ["Débutant", "Intermédiaire", "Avancé", "Expert"]);
  assert.equal(LESSONS.filter((lesson) => lesson.kind !== "anticipation").length, 129, "the academy contains 129 guided lessons");
  assert.equal(LESSONS.filter((lesson) => lesson.kind === "reinforcement").length, 53, "53 legal application lessons reinforce the four methods");
  assert.equal(LESSONS.filter((lesson) => lesson.kind === "anticipation").length, 79, "opponent-reply drills remain counted separately");
  assert.equal(LESSONS.length, 208, "guided lessons and anticipation drills are separate catalog entries");
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
});

test("method paths include all their lessons in progressive level order", () => {
  const programs = [
    "Carlsen · amélioration et conversion",
    "Fischer · préparation et précision",
    "Capablanca · fondamentaux et principes",
    "Tal · tactique et sacrifices à calculer",
    "Kasparov · coups candidats et calcul",
  ];
  const ranks = { Débutant: 0, Intermédiaire: 1, Avancé: 2, Expert: 3 };
  for (const program of programs) {
    const indices = methodPathLessonIndices(program);
    const expected = LESSONS.map((lesson, index) => ({ lesson, index }))
      .filter(({ lesson }) => lesson.program === program)
      .sort((a, b) => ranks[a.lesson.level] - ranks[b.lesson.level] || a.index - b.index)
      .map(({ index }) => index);
    assert.ok(indices.length > 0, program + " should contain lessons");
    assert.deepEqual(indices, expected, program + " should retain all lessons in level order");
    const pathRanks = indices.map((index) => ranks[LESSONS[index].level]);
    assert.deepEqual(pathRanks, [...pathRanks].sort((a, b) => a - b), program + " should progress from easier to harder levels");
    for (let i = 0; i < indices.length; i++) {
      assert.equal(nextMethodPathLessonIndex(indices[i], program), indices[(i + 1) % indices.length],
        program + " should continue to its next lesson");
    }
  }
});

test("each player and Stockfish path has a clearly attributed original starter lesson", () => {
  const starters = [
    ["method-fischer-preparer-d4", "Fischer · préparation et précision", "Fischer"],
    ["method-carlsen-roi-actif", "Carlsen · amélioration et conversion", "Carlsen"],
    ["method-tal-calcul-sacrifice", "Tal · tactique et sacrifices à calculer", "Tal"],
    ["method-kasparov-coups-candidats", "Kasparov · coups candidats et calcul", "Kasparov"],
    ["method-stockfish-comparer-lignes", "Stockfish · comparer et vérifier", "Stockfish 19"],
  ];
  for (const [id, program, sourceLabel] of starters) {
    const lesson = LESSONS.find((entry) => entry.id === id);
    assert.ok(lesson, program + " needs a dedicated starter lesson");
    assert.equal(lesson.program, program);
    assert.equal(lesson.author, "SupaChess Académie");
    assert.ok(lesson.book.includes(sourceLabel));
    assert.ok(methodPathLessonIndices(program).includes(LESSONS.indexOf(lesson)));
  }
  const capablanca = LESSONS.find((entry) => entry.id === "capablanca-development-tempo");
  assert.ok(capablanca, "the Capablanca book path needs a sourced entry lesson");
  assert.equal(capablanca.program, "Capablanca · fondamentaux et principes");
  assert.equal(capablanca.author, "J. R. Capablanca");
  assert.ok(methodPathLessonIndices(capablanca.program).includes(LESSONS.indexOf(capablanca)));
});

test("Stockfish process exercises teach mate search, principal variations, and score interpretation", () => {
  const ids = [
    "stockfish-forced-mate",
    "stockfish-read-principal-variation",
    "stockfish-interpret-evaluation",
  ];
  for (const id of ids) {
    const lesson = LESSONS.find((entry) => entry.id === id);
    assert.ok(lesson, id + " should be present as a playable exercise");
    assert.equal(lesson.program, "Stockfish · comparer et vérifier");
    assert.equal(lesson.author, "SupaChess Académie");
    assert.ok(methodPathLessonIndices(lesson.program).includes(LESSONS.indexOf(lesson)));
  }
  const mate = LESSONS.find((entry) => entry.id === "stockfish-forced-mate");
  const game = setupGame(mate, Chess);
  for (const action of mate.sequence) {
    const move = game.move({ from: action.uci.slice(0, 2), to: action.uci.slice(2, 4) });
    assert.ok(move, "the forced-mate exercise must remain legal");
  }
  assert.equal(game.in_checkmate(), true, "the forced-mate exercise must end in checkmate");
});

test("TCEC computer-game examples are source-linked and use documented Stockfish decisions", () => {
  const examples = [
    "tcec18-stockfish-question-bishop",
    "tcec18-stockfish-anticipate-f5",
    "tcec18-stockfish-rook-sacrifice",
  ];
  for (const id of examples) {
    const lesson = LESSONS.find((entry) => entry.id === id);
    assert.ok(lesson, id + " should be playable");
    assert.equal(lesson.program, "Stockfish · comparer et vérifier");
    assert.equal(lesson.author, "SupaChess Académie");
    assert.equal(lesson.sourceUrl, "https://github.com/TCEC-Chess/tcecgames");
    assert.ok(lesson.reference.includes("TCEC") || lesson.reference.includes("partie"));
  }
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

test("each application lesson offers only legal move choices from its position", () => {
  const toEnglish = (san) => san
    .replace(/^([CFDRT])(?=x?[a-h])/, (piece) => ({ C: "N", F: "B", D: "Q", R: "K", T: "R" })[piece])
    .replace(/=([CFDRT])([+#]?)$/, (_match, piece, suffix) => "=" + ({ C: "N", F: "B", D: "Q", R: "K", T: "R" })[piece] + suffix);
  for (const lesson of LESSONS.filter((item) => item.kind === "reinforcement")) {
    const game = setupGame(lesson, Chess);
    for (const choice of lesson.choices) {
      const san = choice.text.replace(/^Jouer /, "");
      assert.ok(game.moves().includes(toEnglish(san)), lesson.id + " has illegal answer option " + san);
    }
  }
});

test("move hints describe observable chess facts without claiming Stockfish's private reasoning", () => {
  assert.match(engineHintForMove({ flags: "n" }, "r"), /colonnes ouvertes/);
  assert.match(engineHintForMove({ flags: "c" }, "n"), /recaptures/);
  assert.match(engineHintForMove({ flags: "p" }, "p"), /promotion/);
});
