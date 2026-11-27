/* Contrôle d'alignement du QCM sur le premier coup attendu de chaque leçon.
   Usage : node scripts/check_lesson_qcm_alignment.cjs
   Contrôle les leçons du curriculum (js/curriculum.js) ET les leçons construites
   dans js/book-lessons.js (LESSONS exporté) : quand le QCM porte sur un coup,
   la bonne réponse doit être exactement le premier coup attendu de la leçon
   (coup du joueur ou riposte adverse selon la leçon).
   Les QCM conceptuels (réponse rédigée, pas un coup) sont ignorés.
   Le site affiche la notation française (C, F, D, R, T) ; les deux notations sont
   acceptées à la lecture, mais la réponse doit désigner le coup attendu.
   Sortie : une ligne par écart, code de sortie 1 si un écart est détecté. */
"use strict";
const path = require("path");
const { Chess } = require("chess.js");
const curriculum = require(path.join(__dirname, "..", "js", "curriculum.js"));
const bookLessons = require(path.join(__dirname, "..", "js", "book-lessons.js"));

const frenchSanToEngine = (san) => String(san).replace(/([CFDRT])(?=x?[a-h])/g,
  (piece) => ({ C: "N", F: "B", D: "Q", R: "K", T: "R" })[piece]);

const MOVE_TOKEN = /(?:\.\.\.)?\b(?:O-O-O|O-O|[KQRBN][a-h1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x?[a-h][1-8](?:=[QRBN])?|[a-h][1-8]x[a-h][1-8](?:=[QRBN])?)[+#]?\b/;
const MOVE_ONLY = /^(?:\.\.\.)?(?:O-O-O|O-O|[KQRBN][a-h1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x?[a-h][1-8](?:=[QRBN])?|[a-h][1-8]x[a-h][1-8](?:=[QRBN])?)[+#]?$/;
const ANTICIPATION = /^Anticiper\s+((?:\.\.\.)?(?:O-O-O|O-O|[KQRBN][a-h1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x?[a-h][1-8](?:=[QRBN])?|[a-h][1-8]x[a-h][1-8](?:=[QRBN])?)[+#]?)\b/i;
const FRENCH_MOVE_TOKEN = /(?:\.\.\.)?\b(?:O-O-O|O-O|[CFRDT][a-h1-8]?x?[a-h][1-8](?:=[CDRT])?|[a-h]x?[a-h][1-8](?:=[CDRT])?|[a-h][1-8]x[a-h][1-8](?:=[CDRT])?)[+#]?\b/;

function extractMoveToken(text) {
  const match = String(text || "").replace(/[!?]/g, "").match(MOVE_TOKEN) ||
    String(text || "").replace(/[!?]/g, "").match(FRENCH_MOVE_TOKEN);
  return match ? match[0].replace(/^\.\.\./, "") : null;
}

/* Nature de la bonne réponse : "move" (le coup attendu) ou "conceptuel"
   (texte rédigé qui ne désigne pas un coup précis : hors périmètre du contrôle). */
function classifyAnswer(text) {
  const stripped = String(text || "").replace(/^Jouer\s+/i, "").trim();
  if (MOVE_ONLY.test(stripped)) return { kind: "move", token: stripped.replace(/^\.\.\./, "") };
  const anticipation = stripped.match(ANTICIPATION);
  if (anticipation) return { kind: "move", token: anticipation[1].replace(/^\.\.\./, "") };
  const leading = stripped.match(MOVE_TOKEN) || stripped.match(FRENCH_MOVE_TOKEN);
  if (leading && leading.index === 0 && /^\s/.test(stripped.slice(leading[0].length))) {
    return { kind: "move", token: leading[0].replace(/^\.\.\./, "") };
  }
  return { kind: "conceptuel", token: extractMoveToken(stripped) };
}

/* Résout un libellé de coup dans une position : notation française prioritaire,
   notation internationale acceptée en repli. */
function resolveUci(fen, san) {
  const attempts = [frenchSanToEngine(san), san];
  const legal = [];
  for (const attempt of attempts) {
    const position = new Chess(fen);
    let move = null;
    try { move = position.move(attempt); } catch (error) { move = null; }
    if (!move) continue;
    const uci = move.from + move.to + (move.promotion || "");
    if (!legal.includes(uci)) legal.push(uci);
  }
  return legal;
}

/* Premier coup attendu de la leçon (utilisateur ou adversaire selon la leçon). */
function firstExpectedMove(lesson, side) {
  const game = bookLessons.setupGame(lesson, Chess);
  const actions = lesson.sequence || [];
  for (const action of actions) {
    const move = game.move({
      from: action.uci.slice(0, 2),
      to: action.uci.slice(2, 4),
      promotion: action.uci.slice(4) || "q",
    });
    if (!move) return { error: "suite illégale: " + action.uci };
    const isTarget = side === "book" ? action.side === "book" : true;
    if (isTarget) return { uci: action.uci, san: move.san, side: action.side };
  }
  return { error: "aucun coup " + (side || "") + " dans la séquence" };
}

const problems = [];
const checked = [];
let skippedConceptual = 0;
/* 1. Curriculum : la réponse déclarée doit correspondre au premier coup de la ligne. */
for (const lesson of curriculum.lessons || []) {
  const position = new Chess();
  if (!position.load_pgn(frenchSanToEngine(lesson.setup))) { problems.push([lesson.id, "PGN de mise en place invalide"]); continue; }
  const fen = position.fen();
  const learnerColor = position.turn();
  const working = new Chess(fen);
  let expected = null;
  for (const san of lesson.line || []) {
    const move = working.move(frenchSanToEngine(san));
    if (!move) { problems.push([lesson.id, "suite illégale: " + san]); expected = { error: true }; break; }
    if (move.color === learnerColor) { expected = { uci: move.from + move.to + (move.promotion || ""), san: move.san }; break; }
  }
  if (!expected || expected.error) continue;
  if (!(lesson.choices || []).includes(lesson.answer)) {
    problems.push([lesson.id, "la réponse " + lesson.answer + " n'est pas dans les choix " + JSON.stringify(lesson.choices)]);
  }
  const answerUci = resolveUci(fen, lesson.answer);
  if (!answerUci.length) problems.push([lesson.id, "réponse QCM illégale dans la position de départ: " + lesson.answer]);
  else if (!answerUci.includes(expected.uci)) {
    problems.push([lesson.id, "réponse QCM " + lesson.answer + " ≠ premier coup attendu " + expected.san]);
  }
  checked.push("curriculum:" + lesson.id);
}

/* 2. Leçons de book-lessons.js : le choix correct doit être le premier coup attendu. */
for (const lesson of bookLessons.LESSONS || []) {
  if (!lesson.choices || !lesson.choices.length) continue;
  const correct = lesson.choices.find((choice) => choice.correct);
  if (!correct) { problems.push([lesson.id, "aucun choix correct dans le QCM"]); continue; }
  const text = String(correct.text || "").replace(/^Jouer\s+/i, "").trim();
  const answer = classifyAnswer(text);
  if (answer.kind === "conceptuel") { skippedConceptual++; continue; }
  const expected = firstExpectedMove(lesson, null);
  if (expected.error) { problems.push([lesson.id, expected.error]); continue; }
  const game = bookLessons.setupGame(lesson, Chess);
  const answerUci = resolveUci(game.fen(), answer.token);
  if (!answerUci.length) {
    problems.push([lesson.id, "réponse QCM « " + text + " » : coup « " + answer.token + " » illégal dans la position de départ"]);
  } else if (!answerUci.includes(expected.uci)) {
    problems.push([lesson.id, "réponse QCM « " + text + " » (" + answer.token + ") ≠ premier coup attendu " + expected.san + " (" + expected.side + ")"]);
  }
  checked.push("lesson:" + lesson.id);
}

/* API réutilisée par le test automatisé (test/lesson-qcm-alignment.test.cjs). */
function collectProblems() {
  return {
    problems: problems.map(([id, message]) => ({ id, message })),
    checked: checked.length,
    skippedConceptual,
  };
}

module.exports = { collectProblems };

if (require.main === module) {
  if (!problems.length) {
    console.log("ALIGNEMENT OK — " + checked.length + " QCM sur coup contrôlé(s), " + skippedConceptual + " QCM conceptuel(s) ignorés : la réponse correspond au premier coup attendu.");
    process.exit(0);
  }
  for (const [id, message] of problems) console.log("ECART " + id + " : " + message);
  console.log("ECARTS=" + problems.length);
  process.exit(1);
}
