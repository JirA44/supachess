const test = require("node:test");
const assert = require("node:assert/strict");
const { Chess } = require("chess.js");
const { LESSONS, setupGame, buildEngineChoices, engineHintForMove, methodPathLessonIndices, nextMethodPathLessonIndex, createCompletedLessonRecord, lessonReviewKey, lessonReviewPartnerIndices, lessonReviewDifficultyOptions, lessonReviewProgressSummary, createLessonReviewRecord, lessonHeadingText } = require("../js/book-lessons.js");

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
  assert.equal(LESSONS.filter((lesson) => lesson.kind !== "anticipation").length, 225, "the academy contains 225 guided lessons after the precision routine");
  assert.equal(LESSONS.filter((lesson) => lesson.kind === "reinforcement").length, 71, "71 PGN and application lessons reinforce the methods");
  assert.equal(LESSONS.filter((lesson) => lesson.kind === "anticipation").length, 114, "the academy retains 114 opponent-reply drills");
  assert.equal(LESSONS.length, 339, "guided lessons and anticipation drills are separate catalog entries");
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
});

test("Stockfish curriculum adds progressive original lessons about its observable analysis", () => {
  const expected = [
    ["stockfish-evaluation-context", "Débutant"],
    ["stockfish-best-reply", "Intermédiaire"],
    ["stockfish-depth-stability", "Expert"],
  ];
  for (const [id, level] of expected) {
    const lesson = LESSONS.find((entry) => entry.id === id);
    assert.ok(lesson, id + " should be available");
    assert.equal(lesson.level, level);
    assert.equal(lesson.program, "Stockfish · comparer et vérifier");
    assert.equal(lesson.author, "SupaChess Académie");
    assert.ok(methodPathLessonIndices(lesson.program).includes(LESSONS.indexOf(lesson)));
  }
});

test("Project Gutenberg path adds 24 progressively leveled original, source-linked lessons", () => {
  const program = "Manuels classiques · principes et technique";
  const lessons = LESSONS.filter((lesson) => lesson.program === program);
  const expectedSources = [
    ["J. R. Capablanca", "Chess Fundamentals", "https://www.gutenberg.org/ebooks/33870"],
    ["Edward Lasker", "Chess Strategy", "https://www.gutenberg.org/ebooks/5614"],
    ["Howard Staunton", "The Blue Book of Chess", "https://www.gutenberg.org/ebooks/16377"],
  ];
  assert.equal(lessons.length, 24);
  for (const [author, book, url] of expectedSources) {
    const sourceLessons = lessons.filter((lesson) => lesson.author === author);
    assert.equal(sourceLessons.length, 8, author + " should contribute eight original lessons");
    assert.ok(sourceLessons.every((lesson) => lesson.book === book && lesson.url === url));
    assert.deepEqual(
      ["Débutant", "Intermédiaire", "Avancé", "Expert"].map((level) => sourceLessons.filter((lesson) => lesson.level === level).length),
      [2, 2, 2, 2],
      author + " lessons should progress evenly through the four levels",
    );
  }
  assert.ok(lessons.every((lesson) =>
    lesson.kind === "method" && lesson.sourceUrl && lesson.reference.includes("original") &&
    lesson.principle && lesson.transfer && lesson.pitfall &&
    lesson.sequence.every((action) => action.explanation),
  ));
  assert.equal(methodPathLessonIndices(program).length, 24);
});

test("method paths include all their lessons in progressive level order", () => {
  const programs = [
    "Carlsen · amélioration et conversion",
    "Fischer · préparation et précision",
    "Capablanca · fondamentaux et principes",
    "Lasker · mobilisation et principes",
    "Edward Lasker · calcul et stratégie",
    "Tal · tactique et sacrifices à calculer",
    "Kasparov · coups candidats et calcul",
    "Stockfish · comparer et vérifier",
    "Calcul profond · parties maîtresses",
    "Précision · jouer juste et vérifier",
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

test("a completed path continues at the first unfinished lesson of the next path", () => {
  const carlsenProgram = "Carlsen · amélioration et conversion";
  const kasparovProgram = "Kasparov · coups candidats et calcul";
  const carlsen = methodPathLessonIndices(carlsenProgram);
  const kasparov = methodPathLessonIndices(kasparovProgram);
  const completion = Object.fromEntries(kasparov.map((index) => [LESSONS[index].id, { completed: true, completions: 1 }]));
  const order = [carlsenProgram, kasparovProgram];

  assert.equal(nextMethodPathLessonIndex(kasparov.at(-1), kasparovProgram, completion, order), carlsen[0]);
  completion[LESSONS[carlsen[0]].id] = { completed: true, completions: 1 };
  assert.equal(nextMethodPathLessonIndex(kasparov.at(-1), kasparovProgram, completion, order), carlsen[1]);
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
  const lasker = LESSONS.find((entry) => entry.id === "lasker-mobilize-knight");
  assert.ok(lasker, "the Lasker book path needs a sourced entry lesson");
  assert.equal(lasker.program, "Lasker · mobilisation et principes");
  assert.equal(lasker.author, "Emanuel Lasker");
  assert.ok(lasker.book.includes("Common Sense in Chess"));
  assert.ok(methodPathLessonIndices(lasker.program).includes(LESSONS.indexOf(lasker)));
  const edwardLessons = LESSONS.filter((entry) => entry.program === "Edward Lasker · calcul et stratégie");
  assert.equal(edwardLessons.length, 3);
  assert.deepEqual(edwardLessons.map((entry) => entry.level), ["Débutant", "Intermédiaire", "Avancé"]);
  assert.ok(edwardLessons.every((entry) => entry.author === "Edward Lasker" && entry.book === "Chess Strategy"));
  assert.ok(edwardLessons.every((entry) => entry.url === "https://www.gutenberg.org/ebooks/5614"));
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


test("PGN-derived lessons cite their source games and keep move-play separate from engine judgment", () => {
  const lessons = LESSONS.filter((entry) => entry.sourcePgn);
  assert.equal(lessons.length, 18);
  assert.equal(new Set(lessons.map((entry) => entry.sourcePgn)).size, 17);
  assert.ok(lessons.every((entry) => entry.kind === "reinforcement"));
  assert.ok(lessons.every((entry) => entry.author === "SupaChess Académie"));
  assert.ok(lessons.every((entry) => entry.reference.includes("pas un verdict Stockfish")));
});

test("a completed lesson is recorded as validated and increments repeat counts", () => {
  const first = createCompletedLessonRecord({}, 3, 1, "2026-11-01T12:00:00.000Z");
  assert.deepEqual(first, {
    completed: true,
    completions: 1,
    attempts: 3,
    hintsUsed: 1,
    completedAt: "2026-11-01T12:00:00.000Z",
    bestAttempts: 3,
  });
  const repeated = createCompletedLessonRecord({ ...first, completions: 2, bestAttempts: 2 }, 4, 0, "2026-11-02T12:00:00.000Z");
  assert.equal(repeated.completed, true);
  assert.equal(repeated.completions, 3);
  assert.equal(repeated.bestAttempts, 2);
});

test("lesson title shows a green checkmark once validated", () => {
  assert.equal(lessonHeadingText(1, "Activer son roi", true, false), "✓ 1. Activer son roi");
  assert.equal(lessonHeadingText(1, "Activer son roi", false, false), "1. Activer son roi");
  assert.equal(lessonHeadingText(1, "Activer son roi", true, true), "Exercice au hasard");
});

test("18 deep-calculation lessons use legal, sourced historical positions from three master games", () => {
  const program = "Calcul profond · parties maîtresses";
  const lessons = LESSONS.filter((lesson) => lesson.program === program);
  assert.equal(lessons.length, 18);
  assert.equal(new Set(lessons.map((lesson) => lesson.sourceGame)).size, 3);
  assert.ok(lessons.every((lesson) => lesson.kind === "method" && (lesson.level === "Expert" || lesson.level === "Avancé")));
  assert.ok(lessons.every((lesson) => lesson.sequence.length >= 3 && lesson.sequence[0].side === "user"));
  assert.ok(lessons.every((lesson) => lesson.reference.includes("pas un verdict Stockfish")));
  assert.ok(lessons.every((lesson) => lesson.sourceUrl));
  for (const lesson of lessons) {
    const game = setupGame(lesson, Chess);
    for (const action of lesson.sequence) {
      const move = game.move({ from: action.uci.slice(0, 2), to: action.uci.slice(2, 4), promotion: action.uci.slice(4) || "q" });
      assert.ok(move, lesson.id + " line must be legal");
      assert.ok(action.explanation, lesson.id + " needs a half-move explanation");
    }
  }
});

test("15 original precision lessons progress from habit-building to independent review", () => {
  const program = "Précision · jouer juste et vérifier";
  const lessons = LESSONS.filter((lesson) => lesson.program === program);
  assert.equal(lessons.length, 15);
  assert.deepEqual(
    ["Débutant", "Intermédiaire", "Avancé", "Expert"].map((level) => lessons.filter((lesson) => lesson.level === level).length),
    [3, 4, 3, 5],
  );
  assert.ok(lessons.every((lesson) => lesson.kind === "method" && lesson.choices.filter((choice) => choice.correct).length === 1));
  assert.ok(lessons.some((lesson) => /100 %|100%/.test(lesson.principle + " " + lesson.question)));
  assert.ok(lessons.some((lesson) => /Stockfish/.test(lesson.transfer)));
  assert.ok(lessons.some((lesson) => /indice/.test(lesson.pitfall)));
  assert.ok(lessons.every((lesson) => lesson.sequence.length >= 3));
});


test("review partners keep the same theme and use a different legal lesson position", () => {
  const lessons = [
    { id: "a", category: "Anticipation · Ouverture · Développement", fen: "fen-a" },
    { id: "b", category: "Ouverture · Développement", fen: "fen-b" },
    { id: "same-position", category: "Ouverture · Développement", fen: "fen-a" },
    { id: "unrelated", category: "Finale · Roi et pion", fen: "fen-c" },
  ];
  assert.equal(lessonReviewKey(lessons[0]), lessonReviewKey(lessons[1]));
  assert.deepEqual(lessonReviewPartnerIndices(0, lessons), [1]);
});

test("review progress distinguishes passed lessons, due reviews, and demonstrated mastery", () => {
  const lessons = [
    { id: "a", category: "Tactique · Fourchette", fen: "fen-a" },
    { id: "b", category: "Tactique · Fourchette", fen: "fen-b" },
    { id: "c", category: "Finale · Roi et pion", fen: "fen-c" },
  ];
  const summary = lessonReviewProgressSummary(lessons, {
    a: { completed: true },
    c: { completed: true },
  }, Date.parse("2026-11-01T12:00:00.000Z"));
  assert.deepEqual(summary, { passed: 2, reviewable: 1, due: 1, integrated: 0, withoutPartner: 1, differentComplexity: 0 });
});

test("mastery requires three unassisted reviews spaced at one- and three-day intervals", () => {
  const base = { positionFen: "new-position", targetFen: "lesson-position", solved: true, attempts: 0, hintsUsed: 0 };
  const first = createLessonReviewRecord({}, { ...base, reviewedAt: "2026-11-01T12:00:00.000Z" });
  assert.equal(first.streak, 1);
  assert.equal(first.mastered, false);
  assert.equal(first.dueAt, "2026-11-02T12:00:00.000Z");

  const early = createLessonReviewRecord(first, { ...base, reviewedAt: "2026-11-01T14:00:00.000Z" });
  assert.equal(early.lastOutcome, "too-soon");
  assert.equal(early.streak, 1);

  const second = createLessonReviewRecord(first, { ...base, reviewedAt: "2026-11-02T12:00:01.000Z" });
  assert.equal(second.streak, 2);
  assert.equal(second.dueAt, "2026-11-05T12:00:01.000Z");

  const third = createLessonReviewRecord(second, { ...base, reviewedAt: "2026-11-05T12:00:02.000Z" });
  assert.equal(third.streak, 3);
  assert.equal(third.mastered, true);
  assert.equal(third.dueAt, "2026-11-12T12:00:02.000Z");
});

test("errors or hints reset the retention streak, while completing a lesson preserves review state", () => {
  const first = createLessonReviewRecord({}, {
    solved: true, attempts: 0, hintsUsed: 0, positionFen: "new", targetFen: "old",
    reviewedAt: "2026-11-01T12:00:00.000Z",
  });
  const afterHint = createLessonReviewRecord(first, {
    solved: true, attempts: 0, hintsUsed: 1, positionFen: "variant-2", targetFen: "old",
    reviewedAt: "2026-11-02T12:00:01.000Z",
  });
  assert.equal(afterHint.streak, 0);
  assert.equal(afterHint.lastOutcome, "needs-work");
  const completedAgain = createCompletedLessonRecord({ completed: true, completions: 1, review: first }, 1, 0, "2026-11-02T13:00:00.000Z");
  assert.deepEqual(completedAgain.review, first);
});


test("review exercises increase complexity by level when the same theme has harder positions", () => {
  const lessons = [
    { id: "base", category: "Calcul · Variante forcée", level: "Débutant", fen: "fen-base" },
    { id: "same-level", category: "Calcul · Variante forcée", level: "Débutant", fen: "fen-1" },
    { id: "intermediate", category: "Calcul · Variante forcée", level: "Intermédiaire", fen: "fen-2" },
    { id: "advanced", category: "Calcul · Variante forcée", level: "Avancé", fen: "fen-3" },
    { id: "expert", category: "Calcul · Variante forcée", level: "Expert", fen: "fen-4" },
  ];
  assert.deepEqual(lessonReviewDifficultyOptions(0, 0, "", lessons), { desiredLevel: "Débutant", candidateIndices: [1] });
  assert.deepEqual(lessonReviewDifficultyOptions(0, 1, "", lessons), { desiredLevel: "Intermédiaire", candidateIndices: [2] });
  assert.deepEqual(lessonReviewDifficultyOptions(0, 2, "", lessons), { desiredLevel: "Avancé", candidateIndices: [3] });
  assert.deepEqual(lessonReviewDifficultyOptions(0, 3, "", lessons), { desiredLevel: "Expert", candidateIndices: [4] });
  assert.deepEqual(lessonReviewDifficultyOptions(0, 2, "fen-3", lessons), { desiredLevel: "Avancé", candidateIndices: [4] });
});

test("review difficulty falls back to the closest available same-theme position", () => {
  const lessons = [
    { id: "expert-target", category: "Calcul · Variante forcée", level: "Expert", fen: "fen-a" },
    { id: "advanced-only", category: "Calcul · Variante forcée", level: "Avancé", fen: "fen-b" },
  ];
  assert.deepEqual(lessonReviewDifficultyOptions(0, 0, "", lessons), { desiredLevel: "Expert", candidateIndices: [1] });
});

test("the current lesson corpus includes multiple levels and different-complexity review positions", () => {
  const levels = new Set(LESSONS.map((lesson) => lesson.level));
  assert.deepEqual([...levels].sort(), ["Avancé", "Débutant", "Expert", "Intermédiaire"]);
  const differentLevelTargets = LESSONS.filter((lesson, index) =>
    lessonReviewPartnerIndices(index).some((partner) => LESSONS[partner].level !== lesson.level));
  assert.ok(differentLevelTargets.length >= 100);
  assert.ok(lessonReviewProgressSummary(LESSONS, Object.fromEntries(
    differentLevelTargets.map((lesson) => [lesson.id, { completed: true }])
  )).differentComplexity >= 100);
});
