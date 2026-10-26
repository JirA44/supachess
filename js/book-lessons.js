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
        { side: "user", uci: "a1a7", explanation: "La tour barre la septième rangée et réduit les cases du roi noir." },
        { side: "book", uci: "h8g8" },
        { side: "user", uci: "h1g2", explanation: "Le roi rejoint la tour: les deux pièces coopèrent pour repousser le roi adverse." },
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
        { side: "user", uci: "f4e4", explanation: "Le roi gagne une case centrale tout en gardant le pion e2 sous protection." },
        { side: "book", uci: "f6e6" },
        { side: "user", uci: "e2e3", explanation: "Le pion avance maintenant pour libérer la route du roi et rester défendu." },
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
  ];

  function setupGame(lesson, ChessClass) {
    const game = new ChessClass(lesson.fen);
    for (const san of lesson.setup || []) {
      if (!game.move(san)) throw new Error("Coup de mise en place illégal dans " + lesson.id + ": " + san);
    }
    return game;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { LESSONS, setupGame };
  }

  if (typeof document === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const STORE_KEY = "supachess-book-lessons-v1";
  const boardUI = new BoardUI($("lesson-board"), onSquareClick);
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
    LESSONS.forEach((lesson, index) => {
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
      state.textContent = progress[lesson.id] && progress[lesson.id].completed ? "Terminée · à revoir quand tu veux" : "À découvrir";
      button.append(title, meta, state);
      button.addEventListener("click", () => loadLesson(index));
      catalog.appendChild(button);
    });
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
    clearSelection();
    boardUI.lastMove = { from: move.from, to: move.to, san: move.san };
    appendMove(move.san, "Toi");
    $("lesson-feedback").textContent = expected.explanation;
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
    progress[lesson.id] = {
      completed: true,
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
    $("lesson-next").textContent = lessonIndex + 1 < LESSONS.length ? "Leçon suivante" : "Rejouer la première leçon";
    updateProgressLabel();
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
  $("lesson-hint").addEventListener("click", showHint);
  $("lesson-restart").addEventListener("click", () => loadLesson(lessonIndex));
  $("lesson-next").addEventListener("click", () => loadLesson((lessonIndex + 1) % LESSONS.length));
  renderCatalog();
  loadLesson(0);
})(typeof window !== "undefined" ? window : globalThis);
