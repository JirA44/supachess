/* Structural validation and original transfer exercises for course-derived content. */
(function (root) {
  "use strict";

  const LEVELS = new Set(["Débutant", "Intermédiaire", "Avancé", "Expert"]);

  function uciMove(position, uci) {
    if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(uci)) return null;
    return position.move({
      from: uci.slice(0, 2).toLowerCase(),
      to: uci.slice(2, 4).toLowerCase(),
      promotion: uci.slice(4).toLowerCase() || "q",
    });
  }

  function validateLesson(lesson, ChessClass) {
    const issues = [];
    if (!lesson || typeof lesson !== "object") return { valid: false, issues: ["Entrée de leçon absente ou invalide."], fen: "" };
    if (!lesson.id) issues.push("Identifiant manquant.");
    if (!LEVELS.has(lesson.level)) issues.push("Niveau absent ou non reconnu.");
    if (!lesson.program || !lesson.title || !lesson.question) issues.push("Titre, question ou parcours manquant.");
    if (!Array.isArray(lesson.choices) || lesson.choices.filter((choice) => choice && choice.correct).length !== 1)
      issues.push("La question doit avoir exactement une réponse correcte.");
    if (!Array.isArray(lesson.sequence) || lesson.sequence.length === 0) issues.push("Ligne de coups absente.");
    if (lesson.sequence && lesson.sequence.some((action) => !action || !action.explanation)) issues.push("Explication manquante pour au moins un demi-coup.");
    if (!ChessClass) return { valid: false, issues: issues.concat("Moteur de règles non disponible."), fen: "" };

    let position;
    try {
      position = new ChessClass(lesson.fen || undefined);
      for (const san of lesson.setup || []) {
        if (!position.move(san)) throw new Error("mise en place illégale : " + san);
      }
    } catch (error) {
      issues.push("FEN ou mise en place invalide : " + error.message);
      return { valid: false, issues, fen: "" };
    }
    const learnerColor = lesson.color || position.turn();
    if (position.turn() !== learnerColor) issues.push("Le camp au trait ne correspond pas à la couleur de l’élève.");
    for (let index = 0; index < (lesson.sequence || []).length; index++) {
      const action = lesson.sequence[index];
      const expectedColor = action.side === "user" ? learnerColor : action.side === "book" ? (learnerColor === "w" ? "b" : "w") : "?";
      if (position.turn() !== expectedColor) {
        issues.push("Ordre des camps incohérent avant le demi-coup " + (index + 1) + ".");
        break;
      }
      const move = uciMove(position, action.uci);
      if (!move) {
        issues.push("Demi-coup illégal ou UCI invalide à l’étape " + (index + 1) + ": " + String(action.uci || "manquant") + ".");
        break;
      }
    }
    if (lesson.author && (!lesson.book || !lesson.reference)) issues.push("Attribution de la source incomplète.");
    return { valid: issues.length === 0, issues, fen: position.fen() };
  }

  function validatePuzzle(puzzle, ChessClass) {
    const issues = [];
    if (!puzzle || !puzzle.id) issues.push("Identifiant du puzzle manquant.");
    const fen = puzzle && (puzzle.fen || (puzzle.board && (puzzle.board + " " + (puzzle.turn || "w") + " - - 0 1")));
    let position;
    try {
      if (!ChessClass) throw new Error("moteur de règles non disponible");
      position = new ChessClass(fen || undefined);
    } catch (error) {
      return { valid: false, issues: ["FEN du puzzle invalide : " + error.message], fen: "" };
    }
    const answer = puzzle.answerUci || puzzle.answer || puzzle.solutionUci || "";
    if (!uciMove(new ChessClass(position.fen()), answer)) issues.push("Le premier coup de solution est illégal ou manquant.");
    const line = puzzle.solutionLine || puzzle.line || [];
    if (Array.isArray(line)) {
      const replay = new ChessClass(position.fen());
      for (let index = 0; index < line.length; index++) {
        const uci = typeof line[index] === "string" ? line[index] : line[index] && line[index].uci;
        if (index === 0 && uci && answer && String(uci).toLowerCase() !== String(answer).toLowerCase())
          issues.push("Le premier demi-coup de la variante ne correspond pas à la réponse annoncée.");
        if (!uciMove(replay, uci)) {
          issues.push("La variante du puzzle devient illégale à l’étape " + (index + 1) + ".");
          break;
        }
      }
    }
    return { valid: issues.length === 0, issues, fen: position.fen(), answerUci: answer };
  }

  function verifyEngineAnswer(puzzle, analysis, ChessClass, minimumGapCp = 35) {
    const structural = validatePuzzle(puzzle, ChessClass);
    if (!structural.valid) return { status: "invalid", issues: structural.issues };
    const best = analysis && analysis.choices && analysis.choices[0];
    const second = analysis && analysis.choices && analysis.choices[1];
    if (!best || !best.uci) return { status: "unverified", reason: "Stockfish n’a pas fourni de premier coup exploitable." };
    if (String(best.uci).toLowerCase() !== String(structural.answerUci).toLowerCase())
      return { status: "disagrees", reason: "La solution publiée diffère du premier coup Stockfish dans cette recherche." };
    if (!second || !Number.isFinite(second.deltaCp) || second.deltaCp < minimumGapCp)
      return { status: "ambiguous", reason: "Plusieurs candidats restent proches; garder l’exercice comme comparaison, pas comme solution unique." };
    return { status: "verified", reason: "Réponse légale et conforme au premier coup de cette recherche Stockfish.", gapCp: second.deltaCp };
  }

  function flipUci(uci) {
    if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(uci)) return "";
    const flipSquare = (square) => square[0] + (9 - Number(square[1]));
    return flipSquare(uci.slice(0, 2)) + flipSquare(uci.slice(2, 4)) + uci.slice(4).toLowerCase();
  }

  function mirrorPosition(position, ChessClass) {
    const board = position.board();
    const rows = board.slice().reverse().map((row) => row.map((piece) => {
      if (!piece) return "1";
      const symbol = piece.type;
      return piece.color === "w" ? symbol : symbol.toUpperCase();
    }).join("").replace(/1+/g, (empty) => String(empty.length))).join("/");
    const fields = position.fen().split(/\s+/);
    const turn = fields[1] === "w" ? "b" : "w";
    const rights = new Set((fields[2] || "-").split("").map((right) => right === "K" ? "k" : right === "Q" ? "q" : right === "k" ? "K" : right === "q" ? "Q" : ""));
    const castling = "KQkq".split("").filter((right) => rights.has(right)).join("") || "-";
    const ep = fields[3] && fields[3] !== "-" ? fields[3][0] + (9 - Number(fields[3][1])) : "-";
    const fen = [rows, turn, castling, ep, fields[4] || "0", fields[5] || "1"].join(" ");
    return new ChessClass(fen);
  }

  function positionKey(fen) { return String(fen || "").split(/\s+/).slice(0, 4).join(" "); }

  function buildCourseTransfers(courseLessons, ChessClass) {
    const generatedLessons = [];
    const generatedExercises = [];
    const rejected = [];
    const seen = new Set((courseLessons || []).filter((lesson) => lesson && lesson.fen).map((lesson) => positionKey(lesson.fen)));
    const eligible = (courseLessons || []).filter((lesson) => lesson && /^Cours · /.test(lesson.program || "") && lesson.sequence && lesson.sequence.length >= 2);
    for (const source of eligible) {
      const validation = validateLesson(source, ChessClass);
      if (!validation.valid) { rejected.push({ id: source.id, issues: validation.issues }); continue; }
      try {
        const original = new ChessClass(source.fen || undefined);
        for (const san of source.setup || []) original.move(san);
        const mirrored = mirrorPosition(original, ChessClass);
        const fen = mirrored.fen();
        const key = positionKey(fen);
        if (seen.has(key)) continue;
        seen.add(key);
        const mirroredSequence = source.sequence.map((action) => ({
          side: action.side,
          uci: flipUci(action.uci),
          explanation: "Demi-coup de la variante miroir : après l’avoir joué, vérifie la réponse adverse la plus résistante et réévalue l’avantage.",
        }));
        const sourceName = source.reference || source.book || "thème pédagogique du cours fourni";
        const lesson = {
          id: "course-transfer-" + source.id,
          kind: "method",
          level: source.level,
          title: "Transférer le principe · " + source.title,
          category: "Transfert de connaissances · " + (source.category || "position miroir"),
          program: source.program,
          author: "SupaChess Académie",
          book: "Leçon et position miroir originales",
          reference: "Thème inspiré du cours fourni (" + sourceName + "); nouvelle formulation et position miroir, sans reprise de texte ni de diagramme.",
          sourceCourseId: source.id,
          fen,
          color: mirrored.turn(),
          movePrompt: "Applique le principe à cette position miroir, joue la ligne d’étude puis compare les meilleures réponses avec Stockfish.",
          question: "Comment transférer l’idée au camp qui joue ici, sans mémoriser seulement la position d’origine ?",
          choices: [
            { text: "Repartir des forces, faiblesses et menaces de cette position, calculer la meilleure réponse adverse puis adapter le plan.", correct: true },
            { text: "Jouer les mêmes cases qu’avant sans vérifier les couleurs, le trait ni les menaces.", correct: false },
            { text: "Supposer que le thème de la leçon garantit que la ligne indiquée est la seule réponse correcte.", correct: false },
          ],
          principle: "Un principe se transfère par les indices qu’il décrit, pas par la mémorisation des cases. La position miroir change le camp au trait : recommence l’évaluation et calcule les réponses adverses.",
          transfer: "Résous d’abord sans indice, explique le signal positionnel, puis compare plusieurs candidats et les défenses Stockfish. Refais ensuite la leçon source pour vérifier que tu peux changer de perspective.",
          pitfall: "Ne confonds pas la suite pédagogique avec une preuve de coup unique : une partie ou un thème de cours ne remplace pas la comparaison moteur.",
          hints: ["Regarde à nouveau le trait, les pièces attaquées et les faiblesses des deux camps.", "Le principe est le même; la position, les couleurs et les réponses possibles ont changé."],
          sequence: mirroredSequence,
        };
        const checkedLesson = validateLesson(lesson, ChessClass);
        if (!checkedLesson.valid) { rejected.push({ id: lesson.id, issues: checkedLesson.issues }); continue; }
        generatedLessons.push(lesson);

        const prefix = new ChessClass(fen);
        for (let index = 0; index < mirroredSequence.length; index++) {
          const action = mirroredSequence[index];
          if (action.side === "book" && index > 0 && mirroredSequence[index - 1].side === "user") {
            const replyPosition = new ChessClass(prefix.fen());
            const expected = uciMove(replyPosition, action.uci);
            if (expected) {
              const responseSequence = [{ side: "user", uci: action.uci, explanation: "Réponse de la ligne miroir à examiner; trouve aussi les autres défenses légales." }];
              const next = mirroredSequence[index + 1];
              if (next) responseSequence.push({ side: "book", uci: next.uci, explanation: "Continuation pédagogique : réévalue les menaces et le plan après la réponse." });
              const exercise = {
                id: lesson.id + "-response-" + index,
                kind: "anticipation",
                level: lesson.level,
                title: "Exercice de transfert · prévoir la réponse · " + source.title,
                category: "Exercice de cours · défense et meilleure réponse adverse",
                program: lesson.program,
                author: "SupaChess Académie",
                book: "Exercice généré depuis une leçon miroir validée",
                reference: "Position miroir originale; réponse de la ligne à comparer à Stockfish, pas une prédiction du choix adverse.",
                fen: prefix.fen(),
                setup: [],
                color: prefix.turn(),
                question: "Quelle réponse de la ligne peux-tu calculer ici, et quelles autres défenses doivent être vérifiées ?",
                choices: [
                  { text: "Jouer " + expected.san + ", puis chercher la réponse adverse la plus forte.", correct: true },
                  { text: "Supposer que le coup de la ligne est forcé sans comparer les autres réponses.", correct: false },
                  { text: "Ignorer la menace précédente et jouer le premier coup naturel.", correct: false },
                ],
                principle: "Cet exercice teste le transfert du thème dans une position transformée. La réponse affichée appartient à la ligne étudiée; elle n’est pas présentée comme la seule défense possible.",
                transfer: "Après ta réponse, compare la variante aux alternatives légales de Stockfish et explique les conséquences de chacune.",
                pitfall: "Ne confonds pas « réponse présente dans la ligne » et « unique meilleur coup »; seule l’analyse comparative peut trancher, dans les limites de la recherche.",
                hints: ["Repère d’abord ce que le dernier demi-coup attaque ou prépare.", "Calcule la suite et vérifie si une autre réponse défend mieux."],
                sequence: responseSequence,
                anticipatedMove: action.uci,
                previousMove: mirroredSequence[index - 1].uci,
                sourceCourseId: source.id,
              };
              if (validateLesson(exercise, ChessClass).valid) generatedExercises.push(exercise);
            }
          }
          if (!uciMove(prefix, action.uci)) break;
        }
      } catch (error) {
        rejected.push({ id: source.id, issues: ["Génération miroir échouée : " + error.message] });
      }
    }
    return { generatedLessons, generatedExercises, rejected, sourceCount: eligible.length };
  }

  const api = { validateLesson, validatePuzzle, verifyEngineAnswer, flipUci, mirrorPosition, buildCourseTransfers };
  root.SupaChessCourseContentPipeline = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
