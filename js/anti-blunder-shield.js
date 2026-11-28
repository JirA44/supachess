"use strict";

const SupaAntiBlunderShield = (() => {
  const STORAGE_KEY = "supachess-anti-blunder-shield-v1";
  const DIAGNOSTIC_KEY = "supachess-level-diagnostic";
  const pieceNames = { p: "pion", n: "cavalier", b: "fou", r: "tour", q: "dame", k: "roi" };
  const pieceWorth = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const files = "abcdefgh";
  const ranks = "87654321";
  const opposite = (color) => (color === "w" ? "b" : "w");

  function chessConstructor() {
    if (typeof Chess !== "undefined" && Chess) return Chess;
    if (typeof require === "function") return require("chess.js").Chess;
    return null;
  }

  function squareCoordinates(square) {
    return { file: files.indexOf(square[0]), rank: ranks.indexOf(square[1]) };
  }

  function attacksSquare(chess, from, target) {
    const piece = chess.get(from);
    if (!piece) return false;
    const origin = squareCoordinates(from);
    const destination = squareCoordinates(target);
    const fileDiff = destination.file - origin.file;
    const rankDiff = destination.rank - origin.rank;
    const absFile = Math.abs(fileDiff);
    const absRank = Math.abs(rankDiff);
    if (piece.type === "p") {
      const step = piece.color === "w" ? -1 : 1;
      return absFile === 1 && rankDiff === step;
    }
    if (piece.type === "n") return (absFile === 1 && absRank === 2) || (absFile === 2 && absRank === 1);
    if (piece.type === "k") return Math.max(absFile, absRank) === 1;
    const diagonal = absFile === absRank && absFile > 0;
    const straight = (fileDiff === 0 && rankDiff !== 0) || (rankDiff === 0 && fileDiff !== 0);
    if (piece.type === "b" && !diagonal) return false;
    if (piece.type === "r" && !straight) return false;
    if (piece.type === "q" && !diagonal && !straight) return false;
    if (!diagonal && !straight) return false;
    const stepFile = Math.sign(fileDiff);
    const stepRank = Math.sign(rankDiff);
    let file = origin.file + stepFile;
    let rank = origin.rank + stepRank;
    while (file !== destination.file || rank !== destination.rank) {
      if (chess.get(files[file] + ranks[rank])) return false;
      file += stepFile;
      rank += stepRank;
    }
    return true;
  }

  function piecesOf(chess) {
    return chess.board().flat().filter(Boolean);
  }

  function squaresControlledBy(chess, square, color, pieces) {
    const list = Array.isArray(pieces) ? pieces : piecesOf(chess);
    return list
      .filter((piece) => piece.color === color && piece.square !== square && attacksSquare(chess, piece.square, square))
      .map((piece) => ({ square: piece.square, type: piece.type }));
  }

  function parseCandidate(uci) {
    const text = String(uci || "").trim();
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(text)) return null;
    return {
      from: text.slice(0, 2),
      to: text.slice(2, 4),
      promotion: text.length === 5 ? text.slice(4, 5) : undefined,
    };
  }

  function mateInOneFor(chess) {
    const ChessClass = chessConstructor();
    if (!ChessClass) return null;
    const moves = chess.moves({ verbose: true });
    if (!moves.length) return null;
    const probe = new ChessClass(chess.fen());
    for (const move of moves) {
      const args = { from: move.from, to: move.to };
      if (move.promotion) args.promotion = move.promotion;
      const played = probe.move(args);
      if (!played) continue;
      const inCheck = typeof probe.in_check === "function" ? probe.in_check() : false;
      const mate = inCheck && probe.moves().length === 0;
      probe.undo();
      if (mate) return { san: played.san, uci: move.from + move.to + (move.promotion || "") };
    }
    return null;
  }

  function isPlausibleFen(fen) {
    const text = String(fen || "").trim();
    const parts = text.split(/\s+/);
    if (parts.length < 4) return false;
    if (!/^[rnbqkpRNBQKP1-8/]+$/.test(parts[0])) return false;
    const ranks = parts[0].split("/");
    if (ranks.length !== 8) return false;
    for (const rank of ranks) {
      let squares = 0;
      for (const character of rank) {
        squares += /\d/.test(character) ? Number(character) : 1;
      }
      if (squares !== 8) return false;
    }
    return /^[wb]$/.test(parts[1]);
  }

  function diagnoseMove(fenBefore, uci, options = {}) {
    const ChessClass = chessConstructor();
    if (!ChessClass) return { status: "NO_ENGINE", alert: false, findings: [], message: "" };
    if (!isPlausibleFen(fenBefore)) return { status: "INVALID_FEN", alert: false, findings: [], message: "" };
    let before;
    try {
      before = new ChessClass(fenBefore);
    } catch (_error) {
      return { status: "INVALID_FEN", alert: false, findings: [], message: "" };
    }
    const candidate = parseCandidate(uci);
    if (!candidate) return { status: "INVALID_MOVE", alert: false, findings: [], message: "" };
    const legal = before.moves({ verbose: true }).find((move) =>
      move.from === candidate.from && move.to === candidate.to &&
      (!candidate.promotion || move.promotion === candidate.promotion));
    if (!legal) return { status: "INVALID_MOVE", alert: false, findings: [], message: "" };
    const after = new ChessClass(fenBefore);
    const played = after.move({ from: candidate.from, to: candidate.to, promotion: candidate.promotion || "q" });
    if (!played) return { status: "INVALID_MOVE", alert: false, findings: [], message: "" };

    const mover = played.color;
    const findings = [];
    const exposed = [];
    const afterPieces = piecesOf(after);
    const beforePieces = piecesOf(before);
    for (const piece of afterPieces) {
      if (!piece || piece.color !== mover || piece.type === "k") continue;
      const attackers = squaresControlledBy(after, piece.square, opposite(mover), afterPieces);
      if (!attackers.length) continue;
      const defenders = squaresControlledBy(after, piece.square, mover, afterPieces);
      if (defenders.length) continue;
      const beforePiece = before.get(piece.square);
      const alreadyExposed = Boolean(beforePiece) && beforePiece.color === mover && beforePiece.type === piece.type &&
        squaresControlledBy(before, piece.square, opposite(mover), beforePieces).length > 0 &&
        squaresControlledBy(before, piece.square, mover, beforePieces).length === 0;
      if (alreadyExposed) continue;
      exposed.push({
        code: "PIECE_NON_DEFENDUE_ATTAQUEE",
        square: piece.square,
        piece: piece.type,
        pieceLabel: pieceNames[piece.type] || piece.type,
        materialPoints: pieceWorth[piece.type] || 0,
        attackers,
        attackerSquares: attackers.map((attacker) => attacker.square).join(" "),
        severity: pieceWorth[piece.type] >= 5 ? "alerte_importante" : "alerte_pedagogique",
        text: "Ta " + (pieceNames[piece.type] || piece.type) + " en " + piece.square + " est attaquée en " +
          attackers.map((attacker) => (pieceNames[attacker.type] || attacker.type) + " " + attacker.square).join(", ") +
          " et n'a plus de défenseur.",
        caveat: "Le contrôle geometric compte les pièces qui peuvent atteindre la case : vérifie les échanges et les pièces clouées dans la variante Stockfish.",
        suggestedHabit: "Avant de jouer : Échecs, Prises, Menaces — compte les défenseurs de chaque pièce que tu exposes.",
      });
    }
    findings.push(...exposed);

    const mate = mateInOneFor(after);
    if (mate) {
      findings.push({
        code: "MAT_EN_UN_ADVERSE",
        square: null,
        mateSan: mate.san,
        severity: "alerte_importante",
        text: "L'adversaire peut mater en un coup (" + mate.san + ") après ce demi-coup.",
        caveat: "Le mat en un est vérifié sur la position après ton coup ; une autre défense peut rester possible si la variante est mal calculée.",
        suggestedHabit: "Cherche d'abord les échecs, les prises forcées et les cases de fuite du roi adverse.",
      });
    }

    const message = buildMessage(findings);
    return {
      status: "OK",
      move: played.san,
      fenAfter: after.fen(),
      alert: findings.length > 0,
      findings,
      message,
      checkedAt: new Date().toISOString(),
    };
  }

  function buildMessage(findings) {
    if (!findings.length) return "";
    const piece = findings.find((finding) => finding.code === "PIECE_NON_DEFENDUE_ATTAQUEE");
    const mate = findings.find((finding) => finding.code === "MAT_EN_UN_ADVERSE");
    const prefix = "Vérifie : Échecs / Prises / Menaces — ";
    if (piece && mate) {
      return prefix + "une pièce est laissée en prise (" + piece.text + ") et un mat en un est possible pour l'adversaire (" + mate.mateSan + ").";
    }
    if (piece) return prefix + "une pièce est laissée en prise (" + piece.text + ").";
    return prefix + "un mat en un est possible pour l'adversaire (" + mate.mateSan + ").";
  }

  function evaluateContext(context = {}) {
    if (!context.enabled) {
      return { active: false, reason: "Bouclier Anti-Gaffe désactivé." };
    }
    if (context.diagnosticActive) {
      return { active: false, reason: "Diagnostic de niveau actif : le bouclier reste désactivé pour mesurer ton niveau sans aide." };
    }
    if (context.unassistedGame) {
      return { active: false, reason: "Partie sans aide : le bouclier reste désactivé." };
    }
    if (context.gameMode && context.gameMode !== "vs-engine") {
      return { active: false, reason: "Ce mode de jeu n'utilise pas le bouclier." };
    }
    const equalClocks = Boolean(context.clocksEnabled) && Number(context.whiteMinutes) === Number(context.blackMinutes);
    if (equalClocks && [1, 3, 5].includes(Number(context.whiteMinutes))) {
      return { active: false, reason: "Partie blitz/rapide : le bouclier est désactivé pour ne pas ralentir la partie." };
    }
    return {
      active: true,
      reason: "Bouclier actif : cette partie est une partie d'entraînement, elle sera marquée « avec aides » et ne peut pas alimenter le classement.",
    };
  }

  function readStorage(key) {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function isEnabled() {
    return readStorage(STORAGE_KEY) === "true";
  }

  function setEnabled(enabled) {
    writeStorage(STORAGE_KEY, enabled ? "true" : "false");
    renderToggle();
    return isEnabled();
  }

  function diagnosticActive() {
    try {
      const diagnostic = JSON.parse(readStorage(DIAGNOSTIC_KEY) || "null");
      return Boolean(diagnostic && diagnostic.active);
    } catch (_error) {
      return false;
    }
  }

  function currentContext() {
    const gameState = typeof window !== "undefined" && window.SupaChessGameState ? window.SupaChessGameState : null;
    const whiteSelect = typeof document !== "undefined" ? document.getElementById("sel-clock-white") : null;
    const blackSelect = typeof document !== "undefined" ? document.getElementById("sel-clock-black") : null;
    return {
      enabled: isEnabled(),
      diagnosticActive: diagnosticActive(),
      unassistedGame: Boolean(gameState && gameState.unassistedGame),
      gameMode: gameState ? gameState.gameMode : "vs-engine",
      correctionExercise: Boolean(typeof window !== "undefined" && window.SupaChessIsCorrectionExercise && window.SupaChessIsCorrectionExercise()),
      clocksEnabled: Boolean(gameState && gameState.clocksEnabled),
      whiteMinutes: Number(whiteSelect ? whiteSelect.value : 0) || 0,
      blackMinutes: Number(blackSelect ? blackSelect.value : 0) || 0,
    };
  }

  function isActive() {
    return evaluateContext(currentContext()).active;
  }

  function contextStatus() {
    return evaluateContext(currentContext());
  }

  function renderToggle() {
    if (typeof document === "undefined") return;
    const button = document.getElementById("btn-anti-blunder-shield");
    if (!button) return;
    const enabled = isEnabled();
    const status = contextStatus();
    button.setAttribute("aria-checked", String(enabled));
    button.setAttribute("aria-pressed", String(enabled));
    button.textContent = "Bouclier Anti-Gaffe : " + (enabled ? "ON" : "OFF");
    button.title = enabled
      ? status.active ? status.reason : "Activé mais inactif ici — " + status.reason
      : "Désactivé par défaut : active-le pour vérifier tes coups pendant l'entraînement.";
  }

  let pendingHandlers = null;

  function present(report, handlers = {}) {
    if (typeof document === "undefined") return false;
    const panel = document.getElementById("anti-blunder-alert");
    const message = document.getElementById("anti-blunder-alert-message");
    const detail = document.getElementById("anti-blunder-alert-detail");
    if (!panel || !message) return false;
    pendingHandlers = handlers;
    message.textContent = report && report.message ? report.message : "Vérifie : Échecs / Prises / Menaces.";
    if (detail) {
      const findings = report && Array.isArray(report.findings) ? report.findings : [];
      detail.textContent = findings.map((finding) => finding.suggestedHabit).filter(Boolean).join(" ");
    }
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    const replay = document.getElementById("anti-blunder-replay");
    if (replay && typeof replay.focus === "function") replay.focus();
    return true;
  }

  function hide() {
    if (typeof document === "undefined") return;
    const panel = document.getElementById("anti-blunder-alert");
    if (!panel) return;
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    pendingHandlers = null;
  }

  function runPending(action) {
    const handlers = pendingHandlers;
    pendingHandlers = null;
    hide();
    if (handlers && typeof handlers[action] === "function") handlers[action]();
  }

  function initUi() {
    if (typeof document === "undefined") return;
    const button = document.getElementById("btn-anti-blunder-shield");
    if (button) {
      button.addEventListener("click", () => {
        const next = !isEnabled();
        setEnabled(next);
        if (next && typeof window.gamesMarkTrainingAidUsed === "function") window.gamesMarkTrainingAidUsed();
      });
    }
    document.getElementById("anti-blunder-replay")?.addEventListener("click", () => runPending("onReplay"));
    document.getElementById("anti-blunder-play-anyway")?.addEventListener("click", () => runPending("onPlayAnyway"));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const panel = document.getElementById("anti-blunder-alert");
      if (!panel || panel.hidden) return;
      event.preventDefault();
      runPending("onReplay");
    });
    document.addEventListener("supachess:correction-mode-change", renderToggle);
    document.addEventListener("supachess:level-diagnostic-change", renderToggle);
    document.addEventListener("supachess:unassisted-mode-change", renderToggle);
    renderToggle();
  }

  const api = {
    STORAGE_KEY,
    diagnoseMove,
    evaluateContext,
    buildMessage,
    isEnabled,
    setEnabled,
    isActive,
    contextStatus,
    currentContext,
    present,
    hide,
    renderToggle,
    initUi,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUi);
    else initUi();
  }

  return api;
})();

if (typeof module !== "undefined" && module.exports) module.exports = SupaAntiBlunderShield;
if (typeof window !== "undefined") window.SupaChessAntiBlunderShield = SupaAntiBlunderShield;
