/* Interactive lessons adapted from Capablanca and Larsen chess books. */
(function (root) {
  "use strict";

  const LARSEN_PDF = "https://masterinchess.com/Media/2024/07/Larsen%20Best%20Move%20Guide.pdf";
  const LESSONS = [
    {
      id: "capablanca-rook-king",
      title: "Couper le roi avec la tour",
      category: "Finale · Tour et roi contre roi",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      reference: "Première partie, chapitre I, exemple 1, p. 11",
      fen: "7k/8/8/8/8/8/8/R6K w - - 0 1",
      color: "w",
      question: "Quel est l’objectif du premier coup de la tour ?",
      choices: [
        { text: "Limiter l’espace du roi adverse sur la rangée", correct: true },
        { text: "Échanger immédiatement la tour", correct: false },
        { text: "Avancer le roi blanc sans regarder le roi adverse", correct: false },
      ],
      principle: "La tour coupe d’abord le roi adverse; ensuite, le roi blanc vient aider la tour à le repousser.",
      hints: ["Cherche une rangée qui empêche le roi noir de descendre vers le centre.", "Le coup de tour du livre est Ra7."],
      sequence: [
        { side: "user", uci: "a1a7", explanation: "La tour barre la septième rangée : le roi noir reste enfermé sur la huitième. La tour ne cherche pas un échec; elle réduit d’abord l’espace adverse.", compare: [{ uci: "a1a8", title: "Pourquoi pas Ra8 ?", text: "Sur la huitième rangée, la tour ne coupe pas le roi noir de la même façon. Ra7 lui retire toute la septième rangée et rend le plan de mat plus direct." }] },
        { side: "book", uci: "h8g8" },
        { side: "user", uci: "h1g2", explanation: "Capablanca insiste sur la coopération du roi et de la tour. Après ...Kg8, Kg2 place les deux rois sur la colonne g; le roi blanc quitte aussi le bord et gagne des cases d’approche. Il pourra accompagner la tour pour repousser le roi noir, au lieu de laisser la tour agir seule.", compare: [{ uci: "h1h2", title: "Pourquoi pas Kh2 ?", text: "Kh2 est légal, mais laisse le roi blanc sur la colonne de bord h et ne l’aligne pas avec le roi noir en g8. Kg2 suit le principe du livre : rapprocher les rois sur la même colonne, puis centraliser le roi blanc pour qu’il aide la tour. Kh2 n’est pas automatiquement une gaffe; Stockfish permet de comparer l’écart concret dans cette position." }] },
        { side: "book", uci: "g8f8" },
        { side: "user", uci: "g2f3", explanation: "Le roi avance vers le centre tout en restant sur la colonne f du roi noir. Il participe à la coupure au lieu de poursuivre le roi au hasard." },
        { side: "book", uci: "f8e8" },
        { side: "user", uci: "f3e4", explanation: "Le roi blanc gagne le centre. La tour garde la barrière sur la septième rangée pendant que le roi prend les cases de fuite une à une." },
        { side: "book", uci: "e8d8" },
        { side: "user", uci: "e4d5", explanation: "Le roi blanc avance sans abandonner la coordination avec la tour; le roi noir est forcé de reculer vers le coin." },
        { side: "book", uci: "d8c8" },
        { side: "user", uci: "d5d6", explanation: "Au sixième rang, Capablanca recommande la colonne voisine côté centre plutôt que la même colonne que le roi adverse. Le roi blanc couvre les sorties centrales et prépare le rapprochement final." },
        { side: "book", uci: "c8b8" },
        { side: "user", uci: "a7c7", explanation: "La tour change de rangée pour fermer encore plus le roi noir. Le roi blanc et la tour travaillent maintenant ensemble pour le conduire vers a8." },
        { side: "book", uci: "b8a8" },
        { side: "user", uci: "d6c6", explanation: "Le roi blanc contrôle les cases de sortie pendant que la tour conserve la coupure." },
        { side: "book", uci: "a8b8" },
        { side: "user", uci: "c6b6", explanation: "Le roi blanc prend l’opposition et laisse au roi noir une seule case dans le coin." },
        { side: "book", uci: "b8a8" },
        { side: "user", uci: "c7c8", explanation: "La tour donne le mat parce que le roi blanc contrôle les cases de fuite. Le mat vient de la coordination des deux pièces, pas d’un échec isolé." },
      ],
    },
    {
      id: "capablanca-king-pawn",
      title: "Activer le roi avant le pion",
      category: "Finale · Roi et pion",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      reference: "Première partie, chapitre I, p. 15",
      fen: "8/8/5k2/8/5K2/8/4P3/8 w - - 0 1",
      color: "w",
      question: "Que faut-il améliorer avant d’avancer le pion ?",
      choices: [
        { text: "La position du roi, tout en gardant le pion défendu", correct: true },
        { text: "La vitesse du pion, même s’il n’est plus protégé", correct: false },
        { text: "La position du roi adverse en échangeant les rois", correct: false },
      ],
      principle: "En finale, le roi est une pièce active. Fais-le progresser tant que le pion reste en sécurité; pousse le pion quand la position l’exige.",
      hints: ["Le roi blanc peut avancer vers le centre sans abandonner la défense du pion e2.", "Le premier coup illustré est Ke4."],
      sequence: [
        { side: "user", uci: "f4e4", explanation: "Le roi s’avance de deux rangées devant son pion, comme le recommande Capablanca. Il prend de l’espace avant de pousser le pion; la poussée n’est pas encore urgente." },
        { side: "book", uci: "f6e6" },
        { side: "user", uci: "e2e3", explanation: "Le roi noir barre la route du roi blanc. Le pion avance d’une case pour obliger le roi noir à céder du terrain; après e3, le roi blanc en e4 protège le pion." },
        { side: "book", uci: "e6f6" },
        { side: "user", uci: "e4d5", explanation: "Maintenant que le roi noir s’est écarté, le roi blanc passe devant son pion et gagne une case centrale." },
        { side: "book", uci: "f6e7" },
        { side: "user", uci: "d5e5", explanation: "Le roi blanc continue de se rapprocher de la case de promotion tout en restant devant le pion." },
        { side: "book", uci: "e7d7" },
        { side: "user", uci: "e5f6", explanation: "Le roi blanc repousse le roi noir et ouvre la voie au pion. Le roi est la pièce principale de cette finale." },
        { side: "book", uci: "d7e8" },
        { side: "user", uci: "e3e4", explanation: "La poussée devient utile : le pion avance pendant que le roi blanc peut le rejoindre et le protéger." },
        { side: "book", uci: "e8d7" },
        { side: "user", uci: "e4e5", explanation: "Le pion atteint une case protégée par le roi f6. Le roi blanc et le pion progressent ensemble vers la promotion." },
      ],
    },
    {
      id: "larsen-center-break",
      title: "Trouver le moment de jouer …d5",
      category: "Milieu de jeu · Plan et centre",
      author: "Bent Larsen",
      book: "Bent Larsen’s Good Move Guide",
      reference: "Part III, game 12, pp. 74–75",
      url: LARSEN_PDF,
      setup: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nxc6", "bxc6", "Bd3"],
      color: "b",
      question: "Après Bd3, quel plan noir conteste le centre blanc ?",
      choices: [
        { text: "Ouvrir le centre par …d5", correct: true },
        { text: "Reculer toutes les pièces vers la dernière rangée", correct: false },
        { text: "Échanger le fou actif contre un pion de l’aile", correct: false },
      ],
      principle: "Quand l’adversaire installe un centre de pions, un coup central au bon moment peut éviter de subir son espace.",
      hints: ["Le pion d7 peut avancer de deux cases et attaquer le centre.", "La ligne du livre commence par …d5, puis répond à e5 par …Ng4."],
      sequence: [
        { side: "user", uci: "d7d5", explanation: "Le pion noir conteste immédiatement le centre au lieu d’attendre que les Blancs le consolident." },
        { side: "book", uci: "e4e5" },
        { side: "user", uci: "f6g4", explanation: "Après la fermeture du centre, le cavalier prend une case active et met la pression sur le camp blanc." },
        { side: "book", uci: "c1f4" },
        { side: "user", uci: "f8c5", explanation: "Le fou se développe sur une diagonale active, conformément à la suite de Larsen." },
      ],
    },
    {
      id: "capablanca-rook-king-center-first",
      title: "Activer le roi avant la tour",
      category: "Finale · Tour et roi contre roi",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      reference: "Première partie, chapitre I, exemple 2, pp. 11–12",
      fen: "8/8/8/3k4/8/8/8/4K2R w - - 0 1",
      color: "w",
      question: "Pourquoi le roi blanc avance-t-il avant de mettre la tour en jeu ?",
      choices: [
        { text: "Pour centraliser son roi et participer à la coupure", correct: true },
        { text: "Parce que la tour ne peut pas bouger dans cette position", correct: false },
        { text: "Pour poursuivre le roi noir sans plan", correct: false },
      ],
      principle: "Quand le roi adverse est au centre et que la tour n’est pas encore active, rapproche d’abord ton roi. La tour pourra ensuite limiter les cases du roi adverse pendant que ton roi le poursuit.",
      hints: ["Le roi blanc est loin du centre, tandis que le roi noir y est déjà.", "Capablanca commence par Ke2, puis Ke3."],
      sequence: [
        { side: "user", uci: "e1e2", explanation: "Ke2 active le roi vers le centre. La tour h1 n’a pas encore de coup de coupure urgent; le roi doit d’abord se rapprocher." },
        { side: "book", uci: "d5d6" },
        { side: "user", uci: "e2e3", explanation: "Ke3 garde le roi sur le flanc du roi noir et gagne une nouvelle case centrale avant que la tour n’intervienne." },
        { side: "book", uci: "d6c5" },
        { side: "user", uci: "h1h5", explanation: "La tour entre en jeu maintenant. Elle limite les cases du roi noir sur la cinquième rangée tandis que le roi blanc s’est déjà rapproché." },
        { side: "book", uci: "c5c4" },
        { side: "user", uci: "h5h4", explanation: "La tour continue de réduire l’espace du roi noir, sans l’éloigner du roi blanc." },
      ],
    },
    {
      id: "capablanca-bishop-pair-corner",
      title: "Les deux fous repoussent le roi au coin",
      category: "Finale · Deux fous contre roi",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      reference: "Première partie, chapitre I, exemple 3, pp. 12–13",
      fen: "7k/8/8/8/8/8/8/2B1KB2 w - - 0 1",
      color: "w",
      question: "Quel est le plan avec deux fous contre un roi seul ?",
      choices: [
        { text: "Réduire ses cases avec les fous, puis amener le roi pour le mater", correct: true },
        { text: "Échanger un fou contre le roi", correct: false },
        { text: "Promouvoir un pion avant de coordonner les pièces", correct: false },
      ],
      principle: "Les fous seuls ne suffisent pas : ils repoussent le roi vers le coin et réduisent ses cases, tandis que le roi blanc doit s’approcher pour rendre le mat possible.",
      hints: ["Le roi noir est déjà dans un coin; cherche à lui retirer des cases de fuite.", "Le livre commence par Bd3, puis place l’autre fou sur g5."],
      sequence: [
        { side: "user", uci: "f1d3", explanation: "Bd3 commence à contrôler les cases autour du coin et prépare l’entrée du second fou." },
        { side: "book", uci: "h8g7" },
        { side: "user", uci: "c1g5", explanation: "Bg5 coordonne l’autre diagonale. Les deux fous prennent des cases de fuite différentes au lieu de se gêner." },
        { side: "book", uci: "g7f7" },
        { side: "user", uci: "d3f5", explanation: "Bf5 resserre encore le filet. Le roi noir a déjà moins de cases; la suite du plan consiste à avancer le roi blanc et à forcer le mat sans pat." },
      ],
    },
    {
      id: "capablanca-pawn-opposition-draw",
      title: "Tenir l’opposition devant le pion",
      category: "Finale · Opposition et nulle",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      reference: "Première partie, chapitre II, exemple 5, p. 14",
      fen: "8/8/8/8/4k3/4P3/3K4/8 b - - 0 1",
      color: "b",
      question: "Quel principe permet au roi noir de tenir la nulle ?",
      choices: [
        { text: "Rester devant le pion et répondre à l’approche du roi par l’opposition", correct: true },
        { text: "S’éloigner du pion pour courir vers le bord", correct: false },
        { text: "Attaquer le roi blanc sans regarder le pion", correct: false },
      ],
      principle: "Le roi défenseur doit rester devant le pion. Quand le roi adverse s’approche, l’opposition empêche son passage et maintient la nulle.",
      hints: ["Le roi noir se trouve déjà devant le pion e3.", "Capablanca joue ...Ke5, puis ...Kd5 après Kd3."],
      sequence: [
        { side: "user", uci: "e4e5", explanation: "Ke5 conserve le roi noir devant le pion et s’oppose à l’approche du roi blanc. Le but est de bloquer la progression, pas de gagner le pion à tout prix." },
        { side: "book", uci: "d2d3" },
        { side: "user", uci: "e5d5", explanation: "Kd5 garde l’opposition : les rois se font face avec une case entre eux et le roi blanc ne peut pas passer. Cette défense suffit à annuler la finale." },
      ],
    },
  ];

  function setupGame(lesson, ChessClass) {
    const game = new ChessClass(lesson.fen);
    for (const san of lesson.setup || []) {
      if (!game.move(san)) throw new Error("Coup de mise en place illégal dans " + lesson.id + ": " + san);
    }
    return game;
  }

  function nextLessonIndex(lessons, progress, currentIndex) {
    for (let offset = 1; offset < lessons.length; offset++) {
      const index = (currentIndex + offset) % lessons.length;
      if (!progress[lessons[index].id]?.mastered) return index;
    }
    return (currentIndex + 1) % lessons.length;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { LESSONS, setupGame, nextLessonIndex };
  }

  if (typeof document === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const STORE_KEY = "supachess-book-lessons-v1";
  const boardUI = new BoardUI($("lesson-board"), onSquareClick);
  const lessonEngine = new StockfishEngine("vendor/stockfish-18-lite-single.js");
  let lessonIndex = 0;
  let game = null;
  let sequenceIndex = 0;
  let selectedSquare = null;
  let attempts = 0;
  let hintsUsed = 0;
  let principleAnswered = false;
  let waitingForBook = false;
  let flipped = false;
  let bookReplyTimer = null;
  let progress = readProgress();
  let catalogQuery = "";
  let lessonCompare = null;
  let comparingMoves = false;

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch (_) { return {}; }
  }

  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); }
    catch (_) { /* Lessons still work when browser storage is unavailable. */ }
  }

  function renderCatalog() {
    const catalog = $("lesson-catalog");
    catalog.textContent = "";
    const visibleLessons = LESSONS.map((lesson, index) => ({ lesson, index }))
      .filter(({ lesson }) => `${lesson.title} ${lesson.category} ${lesson.author} ${lesson.book}`
        .toLocaleLowerCase("fr").includes(catalogQuery));
    $("lesson-catalog-count").textContent = catalogQuery
      ? `${visibleLessons.length} / ${LESSONS.length} leçons`
      : `${LESSONS.length} leçon${LESSONS.length === 1 ? "" : "s"} disponibles`;
    visibleLessons.forEach(({ lesson, index }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-catalog-button";
      button.setAttribute("aria-current", index === lessonIndex ? "true" : "false");
      const title = document.createElement("span");
      title.className = "lesson-catalog-title";
      title.textContent = (index + 1) + ". " + lesson.title;
      const meta = document.createElement("span");
      meta.className = "lesson-catalog-meta";
      meta.textContent = lesson.author + " · " + lesson.category;
      const state = document.createElement("span");
      state.className = "lesson-catalog-state";
      const lessonProgress = progress[lesson.id];
      state.textContent = lessonProgress?.mastered ? "Maîtrisée · à revoir quand tu veux"
        : lessonProgress?.completed ? "Terminée · encore à consolider" : "À découvrir";
      button.append(title, meta, state);
      button.addEventListener("click", () => loadLesson(index));
      catalog.appendChild(button);
    });
    if (!visibleLessons.length) {
      const empty = document.createElement("p");
      empty.className = "lesson-catalog-empty";
      empty.textContent = "Aucune leçon ne correspond à cette recherche.";
      catalog.appendChild(empty);
    }
  }

  function renderSource(lesson) {
    const source = $("lesson-source");
    source.textContent = lesson.author + " · " + lesson.book + " · " + lesson.reference;
    if (lesson.url) {
      const link = document.createElement("a");
      link.href = lesson.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = " Ouvrir le livre";
      source.appendChild(link);
    }
  }

  function loadLesson(index) {
    if (bookReplyTimer !== null) {
      root.clearTimeout(bookReplyTimer);
      bookReplyTimer = null;
    }
    lessonIndex = index;
    const lesson = LESSONS[lessonIndex];
    game = setupGame(lesson, Chess);
    sequenceIndex = 0;
    selectedSquare = null;
    attempts = 0;
    hintsUsed = 0;
    principleAnswered = false;
    waitingForBook = false;
    flipped = lesson.color === "b";
    boardUI.setFlipped(flipped);
    boardUI.flipped = flipped;
    boardUI.selected = null;
    boardUI.legalTargets = [];
    boardUI.lastMove = null;
    $("lesson-title").textContent = lesson.title;
    $("lesson-goal").textContent = "Observe la position. Choisis d’abord le principe qui s’applique, puis joue les coups sur l’échiquier.";
    $("lesson-question").textContent = lesson.question;
    $("lesson-principle").disabled = false;
    $("lesson-feedback").textContent = "";
    $("lesson-explanation").hidden = true;
    $("lesson-explanation").textContent = "";
    $("lesson-deep-dive").hidden = true;
    $("lesson-deep-dive").textContent = "";
    $("lesson-compare").disabled = true;
    $("lesson-comparison").hidden = true;
    $("lesson-comparison").textContent = "";
    delete $("lesson-comparison").dataset.legalMoves;
    lessonCompare = null;
    $("lesson-move-list").textContent = "";
    $("lesson-next").hidden = true;
    $("lesson-hint").disabled = false;
    $("lesson-flip").setAttribute("aria-pressed", String(flipped));
    renderSource(lesson);
    renderChoices(lesson);
    renderCatalog();
    renderBoard();
    updateProgressLabel();
    $("lesson-status").textContent = "À toi de jouer les " + (lesson.color === "w" ? "Blancs" : "Noirs") + ".";
  }

  function renderChoices(lesson) {
    const wrap = $("lesson-choices");
    wrap.textContent = "";
    lesson.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-choice";
      button.textContent = choice.text;
      button.addEventListener("click", () => answerPrinciple(button, choice));
      wrap.appendChild(button);
    });
  }

  function answerPrinciple(button, choice) {
    if (principleAnswered) return;
    const lesson = LESSONS[lessonIndex];
    if (!choice.correct) {
      attempts++;
      button.classList.add("incorrect");
      $("lesson-feedback").textContent = "Pas encore. Regarde les pièces actives et ce que l’adversaire menace.";
      updateProgressLabel();
      return;
    }
    principleAnswered = true;
    button.classList.add("correct");
    for (const option of $("lesson-choices").querySelectorAll("button")) option.disabled = true;
    $("lesson-feedback").textContent = "Oui. Maintenant, trouve le coup qui met ce principe en pratique.";
    $("lesson-goal").textContent = "Joue le meilleur coup de la leçon sur l’échiquier.";
    $("lesson-status").textContent = "Principe trouvé : joue un coup.";
    if (lesson.choices.length < 1) $("lesson-principle").disabled = true;
  }

  function onSquareClick(square) {
    if (!game || !principleAnswered || waitingForBook || sequenceIndex >= LESSONS[lessonIndex].sequence.length) return;
    const lesson = LESSONS[lessonIndex];
    if (game.turn() !== lesson.color) return;
    const piece = game.get(square);
    if (!selectedSquare) {
      if (piece && piece.color === lesson.color) {
        selectedSquare = square;
        boardUI.selected = square;
        boardUI.legalTargets = game.moves({ square, verbose: true }).map((move) => move.to);
        renderBoard();
      }
      return;
    }
    if (selectedSquare === square) {
      clearSelection();
      renderBoard();
      return;
    }
    const beforeFen = game.fen();
    const move = game.move({ from: selectedSquare, to: square, promotion: "q" });
    if (!move) {
      if (piece && piece.color === lesson.color) {
        selectedSquare = square;
        boardUI.selected = square;
        boardUI.legalTargets = game.moves({ square, verbose: true }).map((candidate) => candidate.to);
      } else clearSelection();
      renderBoard();
      return;
    }
    const expected = lesson.sequence[sequenceIndex];
    const uci = move.from + move.to + (move.promotion || "");
    if (expected.side !== "user" || uci !== expected.uci) {
      game.undo();
      attempts++;
      clearSelection();
      renderBoard();
      $("lesson-feedback").textContent = "Coup légal, mais ce n’est pas l’idée travaillée ici. Prends un temps pour repérer le plan.";
      updateProgressLabel();
      return;
    }
    sequenceIndex++;
    lessonCompare = { fen: beforeFen, move: move.san, color: move.color };
    $("lesson-compare").disabled = false;
    clearSelection();
    boardUI.lastMove = { from: move.from, to: move.to, san: move.san };
    appendMove(move.san, "Toi");
    $("lesson-feedback").textContent = expected.explanation;
    renderMoveInsight(expected, move.san, beforeFen);
    renderBoard();
    updateProgressLabel();
    advanceSequence();
  }

  function advanceSequence() {
    const lesson = LESSONS[lessonIndex];
    if (sequenceIndex >= lesson.sequence.length) {
      finishLesson();
      return;
    }
    const action = lesson.sequence[sequenceIndex];
    if (action.side === "book") {
      waitingForBook = true;
      $("lesson-status").textContent = "Réponse de la ligne du livre…";
      bookReplyTimer = root.setTimeout(() => {
        bookReplyTimer = null;
        if (!waitingForBook || !game) return;
        const move = game.move({ from: action.uci.slice(0, 2), to: action.uci.slice(2, 4), promotion: action.uci.slice(4) || "q" });
        if (!move) {
          $("lesson-status").textContent = "Cette ligne ne peut pas être rejouée dans la position chargée.";
          waitingForBook = false;
          return;
        }
        sequenceIndex++;
        boardUI.lastMove = { from: move.from, to: move.to, san: move.san };
        appendMove(move.san, "Ligne du livre");
        $("lesson-status").textContent = "À toi : joue la suite.";
        waitingForBook = false;
        renderBoard();
        advanceSequence();
      }, 420);
      return;
    }
    $("lesson-status").textContent = "À toi : continue la ligne.";
  }

  function appendMove(san, who) {
    const item = document.createElement("li");
    item.textContent = who + " : " + san;
    $("lesson-move-list").appendChild(item);
  }

  function finishLesson() {
    const lesson = LESSONS[lessonIndex];
    const previous = progress[lesson.id] || {};
    const cleanCompletions = (previous.cleanCompletions || 0) + (attempts === 0 && hintsUsed === 0 ? 1 : 0);
    progress[lesson.id] = {
      completed: true,
      completions: (previous.completions || 0) + 1,
      cleanCompletions,
      mastered: Boolean(previous.mastered || cleanCompletions >= 2),
      attempts: attempts,
      hintsUsed: hintsUsed,
      completedAt: new Date().toISOString(),
      bestAttempts: previous.bestAttempts === undefined ? attempts : Math.min(previous.bestAttempts, attempts),
    };
    saveProgress();
    renderCatalog();
    $("lesson-status").textContent = "Leçon réussie.";
    const userMoves = lesson.sequence.filter((action) => action.side === "user");
    const finalMove = userMoves[userMoves.length - 1];
    $("lesson-feedback").textContent = "Tu as joué la ligne pédagogique. " + (finalMove ? finalMove.explanation : "");
    const explanation = $("lesson-explanation");
    explanation.textContent = "Principe à retenir : " + lesson.principle;
    explanation.hidden = false;
    $("lesson-next").hidden = false;
    $("lesson-next").textContent = "Leçon suivante";
    updateProgressLabel();
  }

  function renderMoveInsight(action, san, beforeFen) {
    const panel = $("lesson-deep-dive");
    panel.textContent = "";
    const heading = document.createElement("h4");
    heading.textContent = "Pourquoi " + san + " ?";
    const explanation = document.createElement("p");
    explanation.textContent = action.explanation;
    panel.append(heading, explanation);
    for (const alternative of action.compare || []) {
      const gameBefore = new Chess(beforeFen);
      const alternativeMove = gameBefore.move({ from: alternative.uci.slice(0, 2), to: alternative.uci.slice(2, 4), promotion: alternative.uci.slice(4) || "q" });
      const alternativeHeading = document.createElement("h5");
      alternativeHeading.textContent = alternative.title.replace("Kh2", alternativeMove?.san || "Kh2").replace("Ra8", alternativeMove?.san || "Ra8");
      const alternativeText = document.createElement("p");
      alternativeText.textContent = alternative.text;
      panel.append(alternativeHeading, alternativeText);
    }
    panel.hidden = false;
  }

  function formatMoverScore(line) {
    if (line.mate !== null) {
      const mate = line.mate;
      return mate > 0 ? "mat en " + mate : "mat subi en " + Math.abs(mate);
    }
    const pawns = line.scoreCp / 100;
    return (pawns > 0 ? "+" : "") + pawns.toFixed(2);
  }

  function pvToSan(fen, pv) {
    const variation = new Chess(fen);
    const sans = [];
    for (const uci of pv || []) {
      const move = variation.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || "q" });
      if (!move) break;
      sans.push(move.san);
    }
    return sans.join(" ");
  }

  async function compareAllMoves() {
    if (!lessonCompare || comparingMoves) return;
    comparingMoves = true;
    const comparison = lessonCompare;
    const button = $("lesson-compare");
    const panel = $("lesson-comparison");
    button.disabled = true;
    panel.hidden = false;
    panel.textContent = "Stockfish analyse tous les coups légaux de la position avant " + comparison.move + "…";
    try {
      await lessonEngine.ready;
      if (lessonCompare !== comparison) return;
      const position = new Chess(comparison.fen);
      const legalMoves = position.moves({ verbose: true });
      panel.dataset.legalMoves = String(legalMoves.length);
      const entries = [];
      for (let index = 0; index < legalMoves.length; index++) {
        const move = legalMoves[index];
        const uci = move.from + move.to + (move.promotion || "");
        const after = new Chess(comparison.fen);
        after.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
        panel.textContent = "Stockfish compare les coups légaux " + (index + 1) + " / " + legalMoves.length + "…";
        let line;
        const isCheckmate = typeof after.isCheckmate === "function" ? after.isCheckmate() : after.in_checkmate();
        const isDraw = typeof after.isDraw === "function" ? after.isDraw() : after.in_draw();
        if (isCheckmate) line = { scoreCp: null, mate: 1, pv: [uci] };
        else if (isDraw) line = { scoreCp: 0, mate: null, pv: [uci] };
        else {
          const result = await lessonEngine.analyze({ fen: after.fen(), multipv: 1, movetime: 500, elo: 0 });
          if (lessonCompare !== comparison) return;
          const reply = result.lines[0];
          line = reply ? {
            scoreCp: reply.scoreCp === null ? null : -reply.scoreCp,
            mate: reply.mate === null ? null : -reply.mate,
            pv: [uci, ...reply.pv],
          } : null;
        }
        entries.push({ move, line });
      }
      entries.sort((a, b) => {
        if (!a.line) return 1;
        if (!b.line) return -1;
        return scoreValue(b.line) - scoreValue(a.line);
      });
      panel.textContent = "";
      const title = document.createElement("h4");
      title.textContent = "Tous les coups légaux — Stockfish, " + (comparison.color === "w" ? "point de vue des Blancs" : "point de vue des Noirs");
      const note = document.createElement("p");
      note.textContent = "Position avant " + comparison.move + ". Temps identique par coup; les évaluations restent indicatives. Chaque variante montre la réponse calculée par Stockfish.";
      const list = document.createElement("ol");
      const bestValue = entries.length && entries[0].line ? scoreValue(entries[0].line) : null;
      for (const entry of entries) {
        const item = document.createElement("li");
        if (entry.move.san === comparison.move) item.classList.add("lesson-line-played");
        const score = document.createElement("strong");
        score.textContent = entry.move.san + " · " + (entry.line ? formatMoverScore(entry.line) : "évaluation indisponible");
        const variation = document.createElement("span");
        const pv = entry.line ? pvToSan(comparison.fen, entry.line.pv) : "";
        variation.textContent = "Variante : " + (pv || entry.move.san);
        item.append(score, variation);
        if (entry.line && entry.line.mate === null && entries[0].line?.mate === null && bestValue !== null) {
          const loss = document.createElement("small");
          loss.textContent = "Écart au meilleur de cette analyse : " + Math.max(0, Math.round(bestValue - scoreValue(entry.line))) + " cp";
          item.appendChild(loss);
        }
        list.appendChild(item);
      }
      panel.dataset.legalMoves = String(legalMoves.length);
      panel.append(title, note, list);
      if (!entries.length) panel.textContent = "Aucun coup légal n’a été trouvé dans cette position.";
    } catch (error) {
      panel.textContent = "Comparaison indisponible : " + (error?.message || "Stockfish n’a pas démarré.");
    } finally {
      comparingMoves = false;
      button.disabled = !lessonCompare;
    }
  }

  function showHint() {
    if (!game) return;
    const lesson = LESSONS[lessonIndex];
    const hint = lesson.hints[Math.min(hintsUsed, lesson.hints.length - 1)];
    hintsUsed++;
    attempts++;
    $("lesson-feedback").textContent = "Indice : " + hint;
    updateProgressLabel();
  }

  function updateProgressLabel() {
    $("lesson-progress").textContent = "Essais : " + attempts + " · Indices utilisés : " + hintsUsed;
  }

  function clearSelection() {
    selectedSquare = null;
    boardUI.selected = null;
    boardUI.legalTargets = [];
  }

  function renderBoard() {
    if (game) boardUI.render(game);
  }

  $("lesson-flip").addEventListener("click", () => {
    flipped = !flipped;
    boardUI.setFlipped(flipped);
    boardUI.flipped = flipped;
    $("lesson-flip").setAttribute("aria-pressed", String(flipped));
    renderBoard();
  });
  $("lesson-search").addEventListener("input", (event) => {
    catalogQuery = event.target.value.trim().toLocaleLowerCase("fr");
    renderCatalog();
  });
  $("lesson-hint").addEventListener("click", showHint);
  $("lesson-compare").addEventListener("click", compareAllMoves);
  $("lesson-restart").addEventListener("click", () => loadLesson(lessonIndex));
  $("lesson-next").addEventListener("click", () => loadLesson(nextLessonIndex(LESSONS, progress, lessonIndex)));
  renderCatalog();
  loadLesson(0);
})(typeof window !== "undefined" ? window : globalThis);
