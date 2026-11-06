/* app.js — orchestration : partie contre Stockfish + coach interceptant. */
"use strict";

const $ = (id) => document.getElementById(id);

const state = {
  chess: new Chess(),
  engine: null,
  userColor: "w",
  unassistedGame: false,
  candidates: [],        // [{rank, uci, san, line, deltaCp, args}]
  candidateFen: null,
  systemBrilliantCandidates: [],
  phase: "init",         // init | analyzing | userTurn | coach | engineThinking | gameover
  abandoned: false,
  stopped: false,
  undoCount: 0,
  pendingMove: null,     // coup utilisateur intercepté {from,to,promotion,uci}
  fenHistory: [],        // clés FEN (4 champs) pour détection de répétition
  positionFenHistory: [], // FEN exacts avant chaque demi-coup pour retrouver les évaluations
  evalHistory: [],       // éval (côté Blancs) de chaque demi-coup joué, parallèle à history()
  evalWhiteCp: 0,
  gen: 0,                // génération de tour : invalide les analyses en vol au changement de mode

  stats: { moves: 0, rankedMoves: 0, top1: 0, top3: 0, top5: 0, top10: 0, top25: 0, top50: 0, accuracyMoves: 0, accuracyAbove60: 0, accuracyAbove75: 0, accuracyAbove90: 0, intercepts: 0, forced: 0 },
  sessionMoveSamples: [],
  candidateRankByUci: new Map(),
  candidateRankCoverageComplete: false,
  accuracy: { w: [], b: [], pendingEngine: null, lastMove: null, byPly: {} }, // moveAccuracy [0..100] par couleur
  moveGradeHistory: [], // demi-coups joués avec catégorie, révisée après analyse moteur
  clockMs: { w: 0, b: 0 },
  clockRemainingMs: { w: 0, b: 0 },
  clocksEnabled: false,
  clockActiveColor: null,
  clockStartedAt: 0,
  clockIntervalId: null,
  timeExpiredColor: null,
  timeRankSubmitted: false,
};

const boardUI = new BoardUI($("board"), onSquareClick);
const DOTS_STORAGE_KEY = "supachess-show-candidate-dots";
const MOVE_DOTS_STORAGE_KEY = "supachess-show-legal-move-dots";
const EVALBAR_PREFERENCE_KEY = "supachess-evalbar-visible-v1";
const LEVEL_DIAGNOSTIC_KEY = "supachess-level-diagnostic";
function readLevelDiagnostic() {
  try { return JSON.parse(localStorage.getItem(LEVEL_DIAGNOSTIC_KEY) || "null"); }
  catch (_) { return null; }
}
function isLevelDiagnosticActive() {
  const diagnostic = readLevelDiagnostic();
  return Boolean(diagnostic && diagnostic.active);
}
let correctionExerciseModeActive = false;
let correctionModeRestore = null;
function isUnassistedAidLockActive() { return state.unassistedGame && !correctionExerciseModeActive; }
function isDiagnosticControlLockActive() {
  return isLevelDiagnosticActive() && !correctionExerciseModeActive;
}
function ensureDefaultLevelDiagnostic() {
  const existing = readLevelDiagnostic();
  if (existing) return existing;
  const initial = {
    active: true,
    defaultActivation: true,
    startedAt: new Date().toISOString(),
    restoreDots: localStorage.getItem(DOTS_STORAGE_KEY) !== "false",
    restoreMoveDots: localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false",
    restoreEvalBar: localStorage.getItem(EVALBAR_PREFERENCE_KEY) !== "false",
    aidsInitialized: false,
  };
  try { localStorage.setItem(LEVEL_DIAGNOSTIC_KEY, JSON.stringify(initial)); } catch (_) {}
  return initial;
}
function startLevelDiagnostic() {
  const existing = readLevelDiagnostic();
  const diagnostic = {
    active: true,
    defaultActivation: false,
    startedAt: new Date().toISOString(),
    restoreDots: existing && typeof existing.restoreDots === "boolean"
      ? existing.restoreDots : localStorage.getItem(DOTS_STORAGE_KEY) !== "false",
    restoreMoveDots: existing && typeof existing.restoreMoveDots === "boolean"
      ? existing.restoreMoveDots : localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false",
    restoreEvalBar: existing && typeof existing.restoreEvalBar === "boolean"
      ? existing.restoreEvalBar : localStorage.getItem(EVALBAR_PREFERENCE_KEY) !== "false",
    aidsInitialized: false,
  };
  try { localStorage.setItem(LEVEL_DIAGNOSTIC_KEY, JSON.stringify(diagnostic)); } catch (_) {}
  return diagnostic;
}
window.startLevelDiagnostic = startLevelDiagnostic;
ensureDefaultLevelDiagnostic();
if (new URLSearchParams(window.location.search).get("start-diagnostic") === "1") {
  const currentDiagnostic = readLevelDiagnostic();
  if (!currentDiagnostic || !currentDiagnostic.active) startLevelDiagnostic();
  const launchUrl = new URL(window.location.href);
  launchUrl.searchParams.delete("start-diagnostic");
  window.history.replaceState(window.history.state, "", launchUrl);
}
let levelDiagnosticLockWasActive = isDiagnosticControlLockActive();
function countCompletedDiagnosticGames(diagnostic) {
  const start = Date.parse(diagnostic && diagnostic.startedAt || "");
  if (!Number.isFinite(start)) return 0;
  try {
    const games = JSON.parse(localStorage.getItem("supachess_games") || "[]");
    if (!Array.isArray(games)) return 0;
    const counted = new Set();
    for (const game of games) {
      if (!game || !game.id || game.trainingAidsUsed !== false || game.abandoned || game.termination === "abandoned" || !["1-0", "0-1", "1/2-1/2"].includes(game.result)) continue;
      if (!Number(game.stats && game.stats.moves)) continue;
      const startedAt = Number.parseInt(String(game.id), 10);
      const playedAgainstStockfish = /stockfish/i.test(String(game.engineName || "")) ||
        game.stockfishRatingSource === "supachess-engine-setting-v1";
      if (Number.isFinite(startedAt) && startedAt >= start && playedAgainstStockfish) counted.add(String(game.id));
    }
    return counted.size;
  } catch (_) { return 0; }
}
function countEligibleStockfishGames() {
  try {
    const games = JSON.parse(localStorage.getItem("supachess_games") || "[]");
    if (!Array.isArray(games)) return 0;
    const counted = new Set();
    for (const game of games) {
      const rating = Number(game && game.stockfishRatingEstimate);
      const eligible = game && game.id &&
        /stockfish/i.test(String(game.engineName || "")) &&
        game.stockfishRatingSource === "supachess-engine-setting-v1" &&
        ["w", "b"].includes(game.userColor) &&
        ["1-0", "0-1", "1/2-1/2"].includes(game.result) &&
        Number.isFinite(rating) && rating >= 800 && rating <= 3500;
      if (eligible) counted.add(String(game.id));
    }
    return counted.size;
  } catch (_) { return 0; }
}
function refreshLevelDiagnosticProgress() {
  const diagnostic = readLevelDiagnostic();
  if (!diagnostic || !diagnostic.active) {
    syncLevelDiagnosticBanner();
    return;
  }
  const count = countCompletedDiagnosticGames(diagnostic);
  if (count >= 10) {
    try {
      localStorage.setItem(LEVEL_DIAGNOSTIC_KEY, JSON.stringify({
        ...diagnostic, active: false, completed: true, endedEarly: false,
        analyzedGamesAtCompletion: count,
      }));
    } catch (_) {}
    applyLevelDiagnosticLock();
    return;
  }
  syncLevelDiagnosticBanner();
}
function syncLevelDiagnosticBanner() {
  const banner = $("level-diagnostic-banner");
  if (!banner) return;
  const diagnostic = readLevelDiagnostic();
  const abandonButton = $("btn-abandon-diagnostic");
  const setAbandonVisible = (visible) => { if (abandonButton) abandonButton.hidden = !visible; };
  if (!diagnostic) {
    setAbandonVisible(true);
    banner.hidden = false;
    banner.textContent = "Diagnostic de niveau activé par défaut : termine 10 parties contre Stockfish. Le coaching reste désactivé; tu peux activer ou couper les bulles, les points et la barre d’évaluation. Toute aide utilisée exclut la partie du bilan sans aide."
    return;
  }
  if (diagnostic.active && correctionExerciseModeActive) {
    setAbandonVisible(false);
    banner.hidden = false;
    banner.textContent = "Diagnostic en pause pendant la correction. Il reprendra à la fin de l’exercice.";
  } else if (diagnostic.active) {
    setAbandonVisible(true);
    const count = countCompletedDiagnosticGames(diagnostic);
    banner.hidden = false;
    const prefix = diagnostic.defaultActivation ? "Diagnostic de niveau activé par défaut : " : "Diagnostic actif : ";
    const totalEligible = countEligibleStockfishGames();
    const earlierOrUncounted = Math.max(0, totalEligible - count);
    banner.textContent = prefix + count + "/10 parties terminées contre Stockfish depuis son activation. Repère global : " + totalEligible + " partie(s) admissible(s) dans l’historique; " + earlierOrUncounted + " ne sont pas retenues dans ce diagnostic. Le coaching reste désactivé; active ou coupe les aides à volonté. Une aide utilisée exclut la partie du bilan sans aide."
  } else if (diagnostic.completed) {
    setAbandonVisible(false);
    banner.hidden = false;
    banner.textContent = "Diagnostic terminé : " + (diagnostic.analyzedGamesAtCompletion || 10) +
      " parties terminées contre Stockfish. Les commandes des aides sont de nouveau disponibles. Consulte le bilan et les exercices ciblés."
  } else if (diagnostic.endedEarly) {
    setAbandonVisible(false);
    banner.hidden = false;
    banner.textContent = "Diagnostic interrompu avant 10 parties. Les aides sont réactivées; le bilan de niveau reste à confirmer.";
  } else {
    setAbandonVisible(false);
    banner.hidden = true;
  }
}
function abandonLevelDiagnostic() {
  const diagnostic = readLevelDiagnostic();
  if (!diagnostic || !diagnostic.active) return;
  const endedEarly = {
    ...diagnostic,
    active: false,
    completed: false,
    endedEarly: true,
    endedAt: new Date().toISOString(),
    gamesCompletedBeforeEnd: countCompletedDiagnosticGames(diagnostic),
  };
  try { localStorage.setItem(LEVEL_DIAGNOSTIC_KEY, JSON.stringify(endedEarly)); } catch (_) {}
  applyLevelDiagnosticLock();
}
const diagnosticAidsInitialized = Boolean(levelDiagnosticLockWasActive && readLevelDiagnostic()?.aidsInitialized);
boardUI.showDots = levelDiagnosticLockWasActive && !diagnosticAidsInitialized ? false : localStorage.getItem(DOTS_STORAGE_KEY) !== "false";
boardUI.showMoveDots = levelDiagnosticLockWasActive && !diagnosticAidsInitialized ? false : localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false";
function syncDotsButton() {
  const button = $("btn-dots");
  if (!button) return;
  const unassistedLocked = isUnassistedAidLockActive();
  const candidatesPanel = $("candidates-panel");
  if (candidatesPanel) {
    candidatesPanel.hidden = unassistedLocked;
    candidatesPanel.setAttribute("aria-hidden", String(unassistedLocked));
  }
  button.disabled = unassistedLocked;
  button.title = unassistedLocked ? "Aide désactivée pour cette partie" : "Afficher ou masquer les bulles candidates";
  button.textContent = unassistedLocked ? "Bulles candidates : désactivées pour cette partie" : "Bulles candidates : " + (boardUI.showDots ? "ON" : "OFF");
  button.setAttribute("aria-pressed", String(!unassistedLocked && boardUI.showDots));
  syncLevelDiagnosticBanner();
}
function syncMoveDotsButton() {
  const button = $("btn-move-dots");
  if (!button) return;
  const unassistedLocked = isUnassistedAidLockActive();
  button.disabled = unassistedLocked;
  button.title = unassistedLocked ? "Aide désactivée pour cette partie" : "Afficher ou masquer les points de coups possibles";
  button.textContent = unassistedLocked ? "Points chauds/froids : désactivés pour cette partie" : "Points chauds/froids : " + (boardUI.showMoveDots ? "ON" : "OFF");
  button.setAttribute("aria-pressed", String(!unassistedLocked && boardUI.showMoveDots));
}
function syncEvalBarToggle() {
  const button = $("btn-evalbar-toggle");
  const bar = document.querySelector(".board-row .evalbar") || $(".evalbar");
  const label = $("evalbar-label");
  if (!bar || !button) return;
  let preferred = true;
  try { preferred = localStorage.getItem(EVALBAR_PREFERENCE_KEY) !== "false"; } catch (_) {}
  const locked = isUnassistedAidLockActive();
  const visible = preferred && !locked;
  bar.hidden = !visible;
  if (label) label.hidden = !visible;
  button.disabled = locked;
  button.setAttribute("aria-pressed", String(visible));
  button.textContent = locked ? "Barre d’évaluation : désactivée pour cette partie" : "Barre d’évaluation : " + (visible ? "ON" : "OFF");
  window.SupaChessEvalBarVisible = visible;
}
const evalBarToggle = $("btn-evalbar-toggle");
if (evalBarToggle) evalBarToggle.addEventListener("click", () => {
  if (isUnassistedGameModeActive()) return;
  const visible = evalBarToggle.getAttribute("aria-pressed") !== "true";
  try { localStorage.setItem(EVALBAR_PREFERENCE_KEY, String(visible)); } catch (_) {}
  syncEvalBarToggle();
  if (!correctionExerciseModeActive && visible && typeof window.gamesMarkTrainingAidUsed === "function") window.gamesMarkTrainingAidUsed();
});
setTimeout(syncEvalBarToggle, 0);
function applyLevelDiagnosticLock() {
  let diagnostic = readLevelDiagnostic();
  const active = Boolean(diagnostic && diagnostic.active) && !correctionExerciseModeActive;
  if (active && !diagnostic.aidsInitialized) {
    diagnostic = {
      ...diagnostic,
      restoreDots: typeof diagnostic.restoreDots === "boolean" ? diagnostic.restoreDots : localStorage.getItem(DOTS_STORAGE_KEY) !== "false",
      restoreMoveDots: typeof diagnostic.restoreMoveDots === "boolean" ? diagnostic.restoreMoveDots : localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false",
      restoreEvalBar: typeof diagnostic.restoreEvalBar === "boolean" ? diagnostic.restoreEvalBar : localStorage.getItem(EVALBAR_PREFERENCE_KEY) !== "false",
      aidsInitialized: true,
    };
    try {
      localStorage.setItem(LEVEL_DIAGNOSTIC_KEY, JSON.stringify(diagnostic));
      localStorage.setItem(DOTS_STORAGE_KEY, "false");
      localStorage.setItem(MOVE_DOTS_STORAGE_KEY, "false");
      localStorage.setItem(EVALBAR_PREFERENCE_KEY, "false");
    } catch (_) {}
    boardUI.showDots = false;
    boardUI.showMoveDots = false;
  }
  if (isUnassistedAidLockActive()) {
    boardUI.showDots = false;
    boardUI.showMoveDots = false;
    try {
      localStorage.setItem(DOTS_STORAGE_KEY, "false");
      localStorage.setItem(MOVE_DOTS_STORAGE_KEY, "false");
      localStorage.setItem(EVALBAR_PREFERENCE_KEY, "false");
    } catch (_) {}
  }
  if (active && state.phase === "coach") {
    state.phase = "userTurn";
    state.pendingMove = null;
    moveFeedback.clearPreview();
    hideCoach();
  }
  if (!active && diagnostic && diagnostic.active === false && !diagnostic.aidsRestored &&
      (diagnostic.aidsInitialized || levelDiagnosticLockWasActive)) {
    boardUI.showDots = typeof diagnostic.restoreDots === "boolean"
      ? diagnostic.restoreDots : localStorage.getItem(DOTS_STORAGE_KEY) !== "false";
    boardUI.showMoveDots = typeof diagnostic.restoreMoveDots === "boolean"
      ? diagnostic.restoreMoveDots : localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false";
    const restoreEvalBar = typeof diagnostic.restoreEvalBar === "boolean"
      ? diagnostic.restoreEvalBar : localStorage.getItem(EVALBAR_PREFERENCE_KEY) !== "false";
    try {
      localStorage.setItem(DOTS_STORAGE_KEY, String(boardUI.showDots));
      localStorage.setItem(MOVE_DOTS_STORAGE_KEY, String(boardUI.showMoveDots));
      localStorage.setItem(EVALBAR_PREFERENCE_KEY, String(restoreEvalBar));
      diagnostic = { ...diagnostic, aidsRestored: true };
      localStorage.setItem(LEVEL_DIAGNOSTIC_KEY, JSON.stringify(diagnostic));
    } catch (_) {}
  }
  levelDiagnosticLockWasActive = active;
  syncDotsButton();
  syncMoveDotsButton();
  syncEvalBarToggle();
  syncBestMoveButton();
  if (typeof renderBoard === "function") renderBoard();
}
window.addEventListener("supachess:level-diagnostic-change", applyLevelDiagnosticLock);
window.applyLevelDiagnosticLock = applyLevelDiagnosticLock;
window.setSupaCorrectionExerciseMode = function(active) {
  const nextActive = Boolean(active);
  if (nextActive && !correctionExerciseModeActive) {
    let storedPreferences = null;
    try {
      storedPreferences = {
        dots: localStorage.getItem(DOTS_STORAGE_KEY),
        moveDots: localStorage.getItem(MOVE_DOTS_STORAGE_KEY),
        evalBar: localStorage.getItem(EVALBAR_PREFERENCE_KEY),
      };
    } catch (_) {}
    correctionModeRestore = {
      showDots: boardUI.showDots,
      showMoveDots: boardUI.showMoveDots,
      storedPreferences,
    };
    correctionExerciseModeActive = true;
    boardUI.showDots = true;
    boardUI.showMoveDots = true;
    try {
      localStorage.setItem(DOTS_STORAGE_KEY, "true");
      localStorage.setItem(MOVE_DOTS_STORAGE_KEY, "true");
      localStorage.setItem(EVALBAR_PREFERENCE_KEY, "true");
    } catch (_) {}
  } else if (!nextActive && correctionExerciseModeActive) {
    correctionExerciseModeActive = false;
    const restore = correctionModeRestore;
    correctionModeRestore = null;
    if (restore) {
      boardUI.showDots = restore.showDots;
      boardUI.showMoveDots = restore.showMoveDots;
      if (restore.storedPreferences) {
        try {
          [
            [DOTS_STORAGE_KEY, restore.storedPreferences.dots],
            [MOVE_DOTS_STORAGE_KEY, restore.storedPreferences.moveDots],
            [EVALBAR_PREFERENCE_KEY, restore.storedPreferences.evalBar],
          ].forEach(([key, value]) => {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
          });
        } catch (_) {}
      }
    }
  }
  applyLevelDiagnosticLock();
  window.dispatchEvent(new Event("supachess:correction-mode-change"));
  document.dispatchEvent(new Event("supachess:correction-mode-change"));
};
window.addEventListener("storage", (event) => {
  if (event.key !== LEVEL_DIAGNOSTIC_KEY) return;
  applyLevelDiagnosticLock();
});

/* ── Réglages ── */
function thresholdCp() { return Math.round(parseFloat($("sel-threshold").value) * 100); }
function movetime() { return parseInt($("sel-movetime").value, 10); }
const PLAYER_CLOCK_SETTINGS_KEY = "supachess-player-clocks-v1";
let pendingTimedGameMinutes = null;
function restorePlayerClockSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYER_CLOCK_SETTINGS_KEY) || "{}");
    for (const color of ["w", "b"]) {
      const select = $(color === "w" ? "sel-clock-white" : "sel-clock-black");
      const value = String(Number(saved[color]) || 0);
      if (select && ["0", "1", "3", "5"].includes(value)) select.value = value;
    }
  } catch (_) {}
}
function persistPlayerClockSettings() {
  try {
    localStorage.setItem(PLAYER_CLOCK_SETTINGS_KEY, JSON.stringify({
      w: $("sel-clock-white")?.value || "0",
      b: $("sel-clock-black")?.value || "0",
    }));
  } catch (_) {}
}
function selectedClockMs(color) {
  const select = $(color === "w" ? "sel-clock-white" : "sel-clock-black");
  const minutes = select ? Math.max(0, Number(select.value) || 0) : 0;
  return minutes * 60 * 1000;
}
function formatPlayerClock(ms) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.ceil(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ":" + String(seconds).padStart(2, "0");
}
function renderPlayerClocks() {
  for (const color of ["w", "b"]) {
    const value = $(color === "w" ? "clock-white" : "clock-black");
    const box = document.querySelector('[data-clock-side="' + color + '"]');
    if (!value || !box) continue;
    let remaining = state.clockRemainingMs[color];
    if (state.clockActiveColor === color && state.clockStartedAt) remaining -= Date.now() - state.clockStartedAt;
    const expired = state.timeExpiredColor === color || (state.clockMs[color] > 0 && remaining <= 0);
    value.textContent = state.clockMs[color] > 0 ? formatPlayerClock(remaining) : "∞";
    box.classList.toggle("is-active", state.clockActiveColor === color);
    box.classList.toggle("is-expired", expired);
    value.setAttribute("aria-label", color === "w" ? "Temps restant des Blancs" : "Temps restant des Noirs");
  }
  const status = $("clock-control-status");
  if (status) {
    const remainingFor = (color) => {
      const activeDelta = state.clockActiveColor === color && state.clockStartedAt ? Date.now() - state.clockStartedAt : 0;
      return state.clockMs[color] ? formatPlayerClock(state.clockRemainingMs[color] - activeDelta) : "illimité";
    };
    const white = remainingFor("w");
    const black = remainingFor("b");
    status.textContent = "Blancs : " + white + " · Noirs : " + black +
      (state.clockActiveColor ? " · pendule en cours" : " · arrêtée");
  }
}
function stopPlayerClock(color) {
  if (!state.clockActiveColor || (color && color !== state.clockActiveColor)) return;
  const active = state.clockActiveColor;
  if (state.clockStartedAt && state.clockMs[active] > 0) {
    state.clockRemainingMs[active] = Math.max(0, state.clockRemainingMs[active] - (Date.now() - state.clockStartedAt));
  }
  state.clockActiveColor = null;
  state.clockStartedAt = 0;
  if (state.clockIntervalId !== null) window.clearInterval(state.clockIntervalId);
  state.clockIntervalId = null;
  renderPlayerClocks();
}
function startPlayerClock(color) {
  stopPlayerClock();
  if (!state.clocksEnabled || !color || state.phase === "gameover" || !state.clockMs[color]) { renderPlayerClocks(); return; }
  state.clockActiveColor = color;
  state.clockStartedAt = Date.now();
  state.clockIntervalId = window.setInterval(() => {
    const remaining = state.clockRemainingMs[color] - (Date.now() - state.clockStartedAt);
    if (remaining <= 0) finishOnTime(color);
    else renderPlayerClocks();
  }, 100);
  renderPlayerClocks();
}
function finishOnTime(color) {
  if (state.phase === "gameover" || state.clockActiveColor !== color) return;
  stopPlayerClock(color);
  state.clockRemainingMs[color] = 0;
  state.timeExpiredColor = color;
  state.phase = "gameover";
  state.gen++;
  state.pendingMove = null;
  const abandonButton = $("btn-abandon-game"), stopButton = $("btn-stop-game");
  if (abandonButton) abandonButton.disabled = true;
  if (stopButton) stopButton.disabled = true;
  const winner = isManualMode()
    ? (color === "w" ? "les Noirs gagnent" : "les Blancs gagnent")
    : (color === state.userColor ? "Stockfish gagne" : "tu gagnes");
  setStatus("Temps écoulé — " + winner + " par dépassement du temps.");
  renderAll();
  if (typeof gamesAutoSave === "function") gamesAutoSave();
  renderPlayerClocks();
}
window.SupaChessStartTimedGame = function(minutes) {
  const value = String(Math.max(0, Number(minutes) || 0));
  const white = $("sel-clock-white"), black = $("sel-clock-black");
  if (white) white.value = value;
  if (black) black.value = value;
  persistPlayerClockSettings();
  const modal = $("profile-modal");
  if (modal) modal.remove();
  if (document.body.dataset.engineReady === "1" && state.phase !== "init") newGame({ unassisted: true });
  else pendingTimedGameMinutes = value;
};
function opponentElo() { return parseInt($("sel-elo").value, 10); }
function isManualMode() { return $("sel-elo").value === "manual"; }
function opponentThinkTime() { return movetime(); }

/* Indicative FIDE-like estimate only: anchor full-power SF19 at 3500 for 3s,
   then adjust by about 35 points per doubling of engine think time. */
function estimateOpponentFideLikeElo(elo, thinkTimeMs) {
  const base = elo === 0 ? 3500 : elo;
  const timeAdjustment = 35 * Math.log2(thinkTimeMs / 3000);
  return Math.max(800, Math.min(3500, Math.round((base + timeAdjustment) / 10) * 10));
}
function updateOpponentFideEstimate() {
  const output = $("opponent-fide-estimate");
  const accuracyOutput = $("opponent-accuracy-estimate");
  if (!output) return;
  if (isManualMode()) {
    output.textContent = "Mode manuel — aucun adversaire moteur";
    if (accuracyOutput) accuracyOutput.textContent = "Mode manuel — précision à mesurer dans tes parties.";
    return;
  }
  const thinkTime = opponentThinkTime();
  const seconds = (thinkTime / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const estimatedElo = estimateOpponentFideLikeElo(opponentElo(), thinkTime);
  const rating = estimatedElo.toLocaleString("fr-FR");
  output.textContent = `≈ ${rating} Elo FIDE-like estimés · Stockfish 19, ${seconds} s`;
  if (accuracyOutput) {
    const observed = typeof gamesOpponentAccuracySummary === "function" && typeof gamesLoad === "function"
      ? gamesOpponentAccuracySummary(gamesLoad(), opponentElo(), thinkTime)
      : null;
    if (!observed) {
      accuracyOutput.textContent = "Précision non prédite : aucune partie terminée avec ce réglage et ce temps.";
    } else {
      const oneDecimal = (value) => value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      accuracyOutput.textContent = "Historique moteur · " + oneDecimal(observed.average) + "% en moyenne · " +
        oneDecimal(observed.min) + "–" + oneDecimal(observed.max) + "% observés · écart moyen à la moyenne ±" +
        oneDecimal(observed.meanAbsoluteDeviation) + " points · " + observed.games + " partie(s). Ce repère décrit l’historique, pas la prochaine partie.";
    }
  }
}

/* ── Init moteur ── */
async function init() {
  setStatus("Chargement du moteur…");
  state.engine = new StockfishEngine("vendor/stockfish-19-lite-single.js");
  await state.engine.ready;
  $("engine-dot").className = "status-dot ready";
  $("engine-label").textContent = state.engine.engineName + " (NNUE) — prêt";
  document.body.dataset.engineReady = "1";
  const resumeUnaided = sessionStorage.getItem("supachess-unassisted-game-active-v1") === "true";
  const queuedClockMinutes = pendingTimedGameMinutes;
  pendingTimedGameMinutes = null;
  // Discard legacy session flags so an old profile click cannot launch a timed game on a later visit.
  try { sessionStorage.removeItem("supachess-pending-clock-game-v1"); } catch (_) {}
  if (queuedClockMinutes !== null) {
    $("sel-clock-white").value = queuedClockMinutes;
    $("sel-clock-black").value = queuedClockMinutes;
    newGame({ unassisted: false });
  } else newGame({ unassisted: resumeUnaided, resume: resumeUnaided, clocksEnabled: false });
  document.dispatchEvent(new Event("supachess:engine-ready"));
}

function newGame(options = {}) {
  stopPlayerClock();
  const playerClocks = document.querySelector(".player-clocks");
  if (playerClocks) playerClocks.hidden = false;
  state.clocksEnabled = options.clocksEnabled !== false;
  state.undoCount = 0;
  state.timeExpiredColor = null;
  state.timeRankSubmitted = false;
  state.clockMs = { w: selectedClockMs("w"), b: selectedClockMs("b") };
  state.clockRemainingMs = { ...state.clockMs };
  setUnassistedGameMode(Boolean(options.unassisted), { resume: Boolean(options.resume) });
  window.SupaReplayHistory = null;
  state.abandoned = false;
  state.stopped = false;
  const abandonButton = $("btn-abandon-game");
  const stopButton = $("btn-stop-game");
  if (abandonButton) abandonButton.disabled = false;
  if (stopButton) stopButton.disabled = false;
  state.gen++;
  moveFeedback.clear();
  state.moveGradeHistory = [];
  state.chess = new Chess();
  state.candidates = [];
  state.candidateFen = null;
  state.systemBrilliantCandidates = [];
  state.pendingMove = null;
  resetAccuracy();
  state.fenHistory = [fenKey(state.chess.fen())];
  state.positionFenHistory = [state.chess.fen()];
  state.evalHistory = [];
  state.userColor = $("sel-color").value;
  boardUI.setFlipped(state.userColor === "b");
  boardUI.mateFall = null;
  boardUI.mateFallAnimated = false;
  boardUI.selected = null;
  boardUI.lastMove = null;
  boardUI.dots = [];
  boardUI.legalTargets = [];
  boardUI.legalTargetHints = {};
  hideCoach();
  if (typeof gamesNewEntry === "function") gamesNewEntry();
  renderAll();
  renderPlayerClocks();
  startTurn();
}

function abandonCurrentGame() {
  if (state.phase === "init" || state.phase === "gameover") return;
  stopPlayerClock();
  state.gen++;
  state.abandoned = true;
  state.stopped = false;
  state.phase = "gameover";
  const abandonButton = $("btn-abandon-game");
  const stopButton = $("btn-stop-game");
  if (abandonButton) abandonButton.disabled = true;
  if (stopButton) stopButton.disabled = true;
  state.pendingMove = null;
  moveFeedback.clear();
  hideCoach();
  boardUI.selected = null;
  boardUI.legalTargets = [];
  boardUI.dots = [];
  if (typeof gamesAutoSave === "function") gamesAutoSave();
  setStatus("Partie terminée — défaite par abandon.");
  renderAll();
}

function stopCurrentGame() {
  if (state.phase === "init" || state.phase === "gameover") return;
  try { state.engine?.stop?.(); } catch (_) {}
  stopPlayerClock();
  state.gen++;
  state.abandoned = false;
  state.stopped = true;
  state.phase = "gameover";
  state.pendingMove = null;
  moveFeedback.clear();
  hideCoach();
  boardUI.selected = null;
  boardUI.legalTargets = [];
  boardUI.dots = [];
  const abandonButton = $("btn-abandon-game");
  const stopButton = $("btn-stop-game");
  if (abandonButton) abandonButton.disabled = true;
  if (stopButton) stopButton.disabled = true;
  if (typeof gamesAutoSave === "function") gamesAutoSave();
  setStatus("Partie arrêtée — résultat non décidé, aucune défaite enregistrée.");
  renderAll();
}

const UNASSISTED_MODE_KEY = "supachess-unassisted-game-active-v1";
const UNASSISTED_PREFS_KEY = "supachess-unassisted-game-restore-v1";
function isUnassistedGameModeActive() { return Boolean(state.unassistedGame && !correctionExerciseModeActive); }
window.SupaChessIsUnassistedGame = isUnassistedGameModeActive;
window.SupaChessIsCorrectionExercise = () => correctionExerciseModeActive;
function syncUndoButton() {
  const button = $("btn-undo");
  if (!button) return;
  const limit = 3;
  const reached = state.undoCount >= limit;
  const engineBusy = state.phase === "engineThinking" || state.phase === "analyzing";
  const diagnosticLocked = isDiagnosticControlLockActive();
  const correctionMode = correctionExerciseModeActive && typeof window.reviewUndoCorrectionExercise === "function";
  const noMoveToUndo = correctionMode && state.chess.history().length === 0;
  button.textContent = correctionMode ? "Annuler le demi-coup" : "Annuler mon demi-coup (" + state.undoCount + "/" + limit + ")";
  button.disabled = correctionMode
    ? engineBusy || noMoveToUndo
    : isUnassistedAidLockActive() || diagnosticLocked || engineBusy || reached;
  button.title = correctionMode
    ? noMoveToUndo ? "Joue un demi-coup avant de pouvoir l’annuler" : "Annuler le demi-coup joué dans l’exercice de correction"
    : isUnassistedAidLockActive()
      ? "Annulation désactivée pendant une partie sans aide"
      : diagnosticLocked
        ? "Annulation désactivée pendant le diagnostic"
        : engineBusy
          ? "Attends la fin de l’analyse ou du coup adverse avant d’annuler"
          : reached
            ? "Limite de trois annulations atteinte pour cette partie"
            : "Annuler votre dernier demi-coup et la réponse du moteur (" + (limit - state.undoCount) + " restante(s))";
}
window.SupaChessSyncUndoButton = syncUndoButton;
function setUnassistedGameMode(active, options = {}) {
  const wasActive = state.unassistedGame;
  if (active && !wasActive && !options.resume) {
    const snapshot = {
      dots: localStorage.getItem(DOTS_STORAGE_KEY),
      moveDots: localStorage.getItem(MOVE_DOTS_STORAGE_KEY),
      arrows: window.SupaAnalysisSettings?.showArrows() ?? true,
      evalbar: localStorage.getItem(EVALBAR_PREFERENCE_KEY),
    };
    try { sessionStorage.setItem(UNASSISTED_PREFS_KEY, JSON.stringify(snapshot)); } catch (_) {}
  }
  state.unassistedGame = Boolean(active);
  if (state.unassistedGame) {
    try { sessionStorage.setItem(UNASSISTED_MODE_KEY, "true"); } catch (_) {}
    boardUI.showDots = false;
    boardUI.showMoveDots = false;
    localStorage.setItem(DOTS_STORAGE_KEY, "false");
    localStorage.setItem(MOVE_DOTS_STORAGE_KEY, "false");
    window.SupaAnalysisSettings?.set("showArrows", false);
    localStorage.setItem(EVALBAR_PREFERENCE_KEY, "false");
    window.SupaChessEvalBarVisible = false;
    state.pendingMove = null;
    if (state.phase === "coach") state.phase = "userTurn";
    moveFeedback.clear();
    hideCoach();
  } else {
    try { sessionStorage.removeItem(UNASSISTED_MODE_KEY); } catch (_) {}
    if (wasActive) {
      try {
        const snapshot = JSON.parse(sessionStorage.getItem(UNASSISTED_PREFS_KEY) || "null");
        if (snapshot) {
          if (snapshot.dots === null) localStorage.removeItem(DOTS_STORAGE_KEY); else localStorage.setItem(DOTS_STORAGE_KEY, snapshot.dots);
          if (snapshot.moveDots === null) localStorage.removeItem(MOVE_DOTS_STORAGE_KEY); else localStorage.setItem(MOVE_DOTS_STORAGE_KEY, snapshot.moveDots);
          window.SupaAnalysisSettings?.set("showArrows", Boolean(snapshot.arrows));
          if (snapshot.evalbar === null) localStorage.removeItem(EVALBAR_PREFERENCE_KEY); else localStorage.setItem(EVALBAR_PREFERENCE_KEY, snapshot.evalbar);
        }
      } catch (_) {}
      try { sessionStorage.removeItem(UNASSISTED_PREFS_KEY); } catch (_) {}
      boardUI.showDots = localStorage.getItem(DOTS_STORAGE_KEY) !== "false";
      boardUI.showMoveDots = localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false";
    }
  }
  const button = $("btn-unassisted-game");
  if (button) {
    button.setAttribute("aria-pressed", String(state.unassistedGame));
    button.textContent = state.unassistedGame ? "Recommencer sans aide" : "Jouer une partie sans aide";
  }
  syncUndoButton();
  const bestButton = $("btn-best-move");
  if (bestButton && state.unassistedGame) {
    bestButton.disabled = true;
    bestButton.title = "Meilleur coup masqué pendant une partie sans aide";
  }
  document.querySelector('.analysis-toggle[data-setting="showArrows"]')?.toggleAttribute("disabled", state.unassistedGame);
  syncDotsButton();
  syncMoveDotsButton();
  syncEvalBarToggle();
  syncBestMoveButton();
  document.dispatchEvent(new Event("supachess:unassisted-mode-change"));
  if (typeof renderBoard === "function") renderBoard();
}
function fenKey(fen) { return fen.split(" ").slice(0, 4).join(" "); }

/* ── Boucle de jeu ── */
async function startTurn() {
  if (checkGameOver()) return;
  if (isManualMode() || state.chess.turn() === state.userColor) {
    await analyzeForUser();
  } else {
    await playEngineMove();
  }
}

async function analyzeForUser() {
  state.phase = "analyzing";
  const gen = ++state.gen;
  const fen = state.chess.fen();
  state.candidateFen = null;
  state.systemBrilliantCandidates = state.systemBrilliantCandidates.filter((candidate) => candidate.fen === fen);
  setStatus("Analyse de la position… (MultiPV)");
  boardUI.dots = candidateDotsForPosition(fen);
  renderBoard();
  const legalMoveCount = state.chess.moves({ verbose: true }).length;
  setStatus(`Analyse des ${legalMoveCount} coups possibles…`);
  const requestedMultiPv = window.SupaAnalysisSettings?.getMultiPv() || 4;
  const displayMultiPv = Math.max(1, Math.min(legalMoveCount, requestedMultiPv));
  const rankingMultiPv = Math.min(legalMoveCount, Math.max(50, displayMultiPv));
  state.candidateRankByUci = new Map();
  state.candidateRankCoverageComplete = false;
  const res = await state.engine.analyze({ fen, multipv: rankingMultiPv, movetime: movetime(), elo: 0 });
  if (state.gen !== gen || state.chess.fen() !== fen) return; // partie/mode changé entre temps
  state.candidateRankByUci = new Map(res.lines.map((line, index) => [line.pv[0], index + 1]));
  state.candidateRankCoverageComplete = res.lines.length >= Math.min(50, legalMoveCount);
  buildCandidates(res.lines.slice(0, displayMultiPv), fen);
  updateEvalBar(res.lines[0]);
  // Précision du dernier coup engine : l'eval top-1 de cette analyse (POV utilisateur)
  // inversée donne l'eval APRÈS le coup engine de son point de vue.
  if (state.accuracy.pendingEngine && res.lines.length) {
    const p = state.accuracy.pendingEngine;
    state.accuracy.pendingEngine = null;
    recordAccuracy(p.color, p.beforeCp, -clampCpFromLine(res.lines[0]), p.ply);
    finishEngineFeedback(p, res.lines[0]);
  }
  state.phase = "userTurn";
  startPlayerClock(state.chess.turn());
  if (state.unassistedGame) {
    setStatus(isManualMode() ? "Mode sans aide — jouez les coups des deux côtés, aucun conseil affiché." : "À vous de jouer — partie sans aide, aucun indice ni évaluation affiché.");
  } else if (isManualMode()) {
    const turnLabel = state.chess.turn() === "w" ? "Blancs" : "Noirs";
    const isOpp = state.chess.turn() !== state.userColor;
    setStatus(`Mode manuel — au trait: ${turnLabel}${isOpp ? " (coup adverse: pas d'interception)" : ""}.`);
  } else if (isLevelDiagnosticActive()) {
    setStatus("À vous de jouer — diagnostic actif, sans aide du coach.");
  } else {
    setStatus("À vous de jouer — les points indiquent les coups candidats.");
  }
  renderAll();
}

function candidateDotsForPosition(fen) {
  const dotsBySquare = new Map();
  const add = (square, move) => {
    if (!dotsBySquare.has(square)) dotsBySquare.set(square, []);
    dotsBySquare.get(square).push(move);
  };
  const reports = state.systemBrilliantCandidates.filter((candidate) => candidate.fen === fen);
  const reportedByUci = new Map(reports.map((candidate) => [candidate.uci, candidate]));
  const included = new Set();
  if (state.candidateFen === fen) {
    for (const cand of state.candidates) {
      const report = reportedByUci.get(cand.uci);
      const brilliant = Boolean(report) || isBrilliantCandidate(fen, cand);
      const grade = moveGrade(cand.deltaCp, brilliant, cand.rank === 1);
      const evaluation = cand.line && (cand.line.scoreCp !== null || cand.line.mate !== null)
        ? formatScore(cand.line, state.chess.turn() === "w") : "—";
      const source = report ? report.source : brilliant ? "SupaChess" : null;
      add(cand.uci.slice(2, 4), {
        san: cand.san, label: moveGradeBadgeLabel(grade), evaluation, grade, rank: cand.rank, source,
        title: brilliant ? `Coup brillant repéré par ${source || "le système Supa"} · ${cand.san} · à examiner`
          : `${cand.san}: ${moveGradeBadgeLabel(grade)} · ${evaluation}`
      });
      included.add(cand.uci);
    }
  }
  for (const report of reports) {
    if (included.has(report.uci)) continue;
    const grade = moveGrade(0, true, false);
    add(report.uci.slice(2, 4), {
      san: report.san, label: "!!", evaluation: "—", grade, source: report.source,
      title: `Coup brillant repéré par ${report.source} · ${report.san} · à examiner`
    });
  }
  return candidateDotsFromGroups(dotsBySquare);
}

/* API d’intégration : un moteur Supa peut signaler un coup légal, même absent du MultiPV Stockfish. */
function reportSupaBrilliantCandidate(report) {
  if (!report || typeof report !== "object") return false;
  const fen = typeof report.fen === "string" ? report.fen : state.chess.fen();
  if (fen !== state.chess.fen()) return false;
  const rawMove = typeof report.move === "string" ? report.move.trim() : "";
  const suppliedUci = typeof report.uci === "string" ? report.uci.trim() : "";
  const uci = (suppliedUci || (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(rawMove) ? rawMove : "")).toLowerCase();
  const san = typeof report.san === "string" ? report.san.trim() : (!uci ? rawMove : "");
  const legalMoves = state.chess.moves({ verbose: true });
  const move = legalMoves.find((candidate) =>
    (uci && candidate.from + candidate.to + (candidate.promotion || "") === uci) ||
    (!uci && san && candidate.san === san)
  );
  if (!move) return false;
  const canonicalUci = move.from + move.to + (move.promotion || "");
  const source = typeof report.source === "string" && report.source.trim() ? report.source.trim() : "SupaEngine";
  const existing = state.systemBrilliantCandidates.find((candidate) => candidate.fen === fen && candidate.uci === canonicalUci);
  const marker = { fen, uci: canonicalUci, san: move.san, source };
  if (existing) Object.assign(existing, marker);
  else state.systemBrilliantCandidates.push(marker);
  for (const candidate of state.candidates) {
    if (candidate.uci === canonicalUci) { candidate.supaBrilliant = true; candidate.brilliantSource = source; }
  }
  boardUI.dots = candidateDotsForPosition(fen);
  renderBoard();
  if (state.candidateFen === fen) renderCandidatesList();
  return true;
}
window.SupaChessReportBrilliantCandidate = reportSupaBrilliantCandidate;
window.addEventListener("supa:brilliant-candidate", (event) => reportSupaBrilliantCandidate(event.detail));

function buildCandidates(lines, fen) {
  state.candidateFen = fen;
  if (!lines.length) { state.candidates = []; boardUI.dots = candidateDotsForPosition(fen); return; }
  const best = lines[0];
  const bestVal = scoreValue(best);
  state.candidates = lines.map((line, i) => {
    const deltaCp = Math.max(0, bestVal - scoreValue(line));
    const args = buildArguments(fen, line, best, state.fenHistory);
    const reply = buildReplyInfo(fen, line.pv);
    const bd = computeBreakdown(fen, line);
    const uci = line.pv[0];
    const systemReport = state.systemBrilliantCandidates.find((candidate) => candidate.fen === fen && candidate.uci === uci);
    return { rank: i + 1, uci, san: args.san, line, deltaCp, args, reply, bd, supaBrilliant: Boolean(systemReport), brilliantSource: systemReport ? systemReport.source : null };
  });
  clExpanded.clear();
  for (let i = 0; i < state.candidates.length; i++) {
    state.candidates[i].cmp = buildComparison(state.candidates[i], state.candidates[i + 1] || null);
  }
  boardUI.dots = candidateDotsForPosition(fen);
}

/* ── Décomposition heuristique des "micro-points" d'un candidat ──
   total (éval moteur, pions, POV joueur) = somme composantes + dynamique. */
function computeBreakdown(fenBefore, line) {
  try {
    const after = new Chess(fenBefore);
    const color = after.turn();
    if (!after.move(uciToMoveObj(line.pv[0]))) return null;
    const bd = evalBreakdown(after.fen(), color);
    const total = clampCpFromLine(line) / 100;
    const sum = bd.materiel + bd.roi + bd.activite + bd.centre + bd.structure;
    bd.dynamique = total - sum;
    bd.total = total;
    return bd;
  } catch (_e) { return null; }
}

function fmtPts(v) { return (v > 0 ? "+" : "") + v.toFixed(2); }

function breakdownHtml(bd, cls) {
  if (!bd) return "";
  return `<div class="${cls}" title="Estimation heuristique — Stockfish NNUE ne publie pas sa décomposition interne. 'Dynamique' = éval totale − somme des composantes.">` +
    `Σ° Matériel ${fmtPts(bd.materiel)} · Roi ${fmtPts(bd.roi)} · Activité ${fmtPts(bd.activite)}` +
    ` · Centre ${fmtPts(bd.centre)} · Structure ${fmtPts(bd.structure)} · Dynamique ${fmtPts(bd.dynamique)}</div>`;
}

async function playEngineMove() {
  state.phase = "engineThinking";
  const gen = ++state.gen;
  startPlayerClock(state.chess.turn());
  setStatus("Stockfish réfléchit…");
  boardUI.dots = [];
  renderBoard();
  const fen = state.chess.fen();
  const elo = opponentElo();
  const thinkTime = opponentThinkTime();
  // La référence reste rapide; le coup adverse utilise bien le temps choisi.
  const baseline = await state.engine.analyze({ fen, multipv: 1, movetime: Math.min(thinkTime, 1200), elo: 0 });
  if (state.gen !== gen || state.chess.fen() !== fen) return;
  const res = elo === 0 && thinkTime <= 1200
    ? baseline
    : await state.engine.analyze({ fen, multipv: 1, movetime: thinkTime, elo });
  if (state.gen !== gen || state.chess.fen() !== fen) return;
  if (!res.bestmove || res.bestmove === "(none)") { checkGameOver(); return; }
  const engineColor = state.chess.turn();
  stopPlayerClock(engineColor);
  const mv = state.chess.move(uciToMoveObj(res.bestmove));
  if (mv) {
    if (window.SupaChessAudio) window.SupaChessAudio.play(state.chess.in_check() ? "check" : (mv.flags && (mv.flags.includes("c") || mv.flags.includes("e")) ? "capture" : "move"));
    boardUI.lastMove = { from: mv.from, to: mv.to };
    state.fenHistory.push(fenKey(state.chess.fen()));
    state.positionFenHistory.push(state.chess.fen());
    state.evalHistory.push(res.lines.length ? whitePovEval(res.lines[0], engineColor === "w") : null);
    // Eval AVANT (POV engine) = top-1 de son analyse ; APRÈS = top-1 de la
    // prochaine analyse MultiPV utilisateur (déjà lancée pour son tour).
    moveFeedback.clearPreview();
    if (!state.unassistedGame) moveFeedback.show({ san: mv.san, color: engineColor, moveNumber: moveNumberFromFen(fen), square: mv.to, token: gen });
    boardUI.lastMove = { from: mv.from, to: mv.to, san: mv.san, grade: state.unassistedGame ? null : moveGrade(null) };
    if (baseline.lines.length) {
      const pending = { color: engineColor, beforeCp: clampCpFromLine(baseline.lines[0]),
        beforeValue: scoreValue(baseline.lines[0]), beforeBestUci: baseline.lines[0].pv[0],
        san: mv.san, uci: res.bestmove, fen, square: mv.to, moveNumber: moveNumberFromFen(fen),
        ply: state.chess.history().length, token: gen };
      recordMoveGrade(pending.ply, engineColor, "unrated");
      if (state.chess.game_over()) {
        const terminal = { scoreCp: 0, mate: state.chess.in_checkmate() ? 0 : null, pv: [], depth: baseline.lines[0].depth };
        finishEngineFeedback(pending, terminal);
        recordAccuracy(engineColor, pending.beforeCp, state.chess.in_checkmate() ? 1000 : 0, pending.ply);
      } else {
        state.accuracy.pendingEngine = pending;
      }
    } else {
      recordMoveGrade(state.chess.history().length, engineColor, "unrated");
    }
    if (typeof gamesAutoSave === "function") gamesAutoSave();
  }
  renderAll();
  startTurn();
}

function moveGradeCategory(lossCp, brilliant = false, best = false) {
  if (!Number.isFinite(lossCp)) return "unrated";
  if (brilliant && lossCp < 30) return "brilliant";
  if (lossCp >= 200) return "blunder";
  if (lossCp >= 60) return "error";
  if (lossCp >= 30) return "inaccuracy";
  if (best) return "best";
  if (lossCp <= 10) return "very-good";
  if (lossCp < 20) return "good";
  return "ok";
}

function recordMoveGrade(ply, color, category, metadata = {}) {
  const existing = state.moveGradeHistory.find((entry) => entry.ply === ply);
  if (existing) {
    existing.color = color;
    existing.category = category;
    Object.assign(existing, metadata);
  } else state.moveGradeHistory.push({ ply, color, category, ...metadata });
  renderMoveGradeSummary();
}

function renderMoveGradeSummary() {
  const wrap = $("move-grade-summary");
  if (!wrap) return;
  wrap.hidden = isUnassistedAidLockActive();
  if (isUnassistedAidLockActive()) return;
  const categories = [
    ["brilliant", "!!", "Brillant"], ["best", "★", "Meilleur coup"],
    ["very-good", "!", "Très bon coup"], ["good", "✓", "Bon coup"],
    ["ok", "=", "Coup OK"], ["inaccuracy", "?!", "Imprécision"],
    ["error", "?", "Erreur"], ["blunder", "??", "Gaffe"], ["unrated", "…", "Non évalué"],
  ];
  const explanations = {
    brilliant: "Perte inférieure à 30 cp, avec un motif brillant confirmé.",
    best: "Meilleur coup retenu par Stockfish (perte de 0 cp).",
    "very-good": "Perte de 0 à 10 cp, hors coup meilleur ou brillant.",
    good: "Perte supérieure à 10 et inférieure à 20 cp.",
    ok: "Perte de 20 à moins de 30 cp.",
    inaccuracy: "Perte de 30 à moins de 60 cp.",
    error: "Perte de 60 à moins de 200 cp.",
    blunder: "Perte de 200 cp ou plus.",
    unrated: "Demi-coup pas encore évalué par Stockfish.",
  };
  wrap.replaceChildren();
  const table = document.createElement("div");
  table.className = "move-grade-table";
  table.setAttribute("role", "table");
  table.setAttribute("aria-label", "Qualité des demi-coups par joueur");
  const header = document.createElement("div");
  header.className = "move-grade-table-header";
  header.setAttribute("role", "row");
  header.innerHTML = '<span role="columnheader">Type de coup</span><span role="columnheader">Blancs</span><span role="columnheader">Noirs</span>';
  table.appendChild(header);
  for (const [key, symbol, name] of categories) {
    const row = document.createElement("div");
    row.className = "move-grade-table-row grade-" + key;
    row.dataset.grade = key;
    row.setAttribute("role", "row");
    row.innerHTML = '<span class="move-grade-table-label" role="rowheader"><span class="move-grade-count-dot" aria-hidden="true"></span><span class="move-grade-count-symbol" aria-hidden="true">' + symbol + '</span><span class="move-grade-count-name">' + name + '</span></span>';
    for (const color of ["w", "b"]) {
      const count = state.moveGradeHistory.filter((entry) => entry.color === color && entry.category === key).length;
      const button = document.createElement("button");
      button.type = "button";
      const cell = document.createElement("div");
      cell.className = "move-grade-table-cell";
      cell.dataset.color = color;
      cell.setAttribute("role", "cell");
      const gradeCell = document.createElement("div");
      gradeCell.className = "move-grade-table-grade grade-" + key;
      gradeCell.dataset.grade = key;
      button.className = "move-grade-count-value";
      button.dataset.moveGradeColor = color;
      button.disabled = count === 0;
      button.setAttribute("aria-label", name + " des " + (color === "w" ? "Blancs" : "Noirs") + " : " + count + (count === 1 ? " demi-coup; aller à sa position" : " demi-coups; aller à la première position"));
      button.innerHTML = '<strong data-grade-count>' + (count ? "+" + count : "0") + '</strong>';
      gradeCell.appendChild(button);
      cell.appendChild(gradeCell);
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  wrap.appendChild(table);

  const legend = $("move-grade-legend");
  if (!legend) return;
  legend.replaceChildren();
  for (const [key, symbol, name] of categories) {
    const count = state.moveGradeHistory.filter((entry) => entry.category === key).length;
    const row = document.createElement("div");
    row.className = "move-grade-count-row grade-" + key + " move-grade-legend-row";
    row.dataset.grade = key;
    row.innerHTML = `<span class="move-grade-count-dot" aria-hidden="true"></span><span class="move-grade-count-symbol" aria-hidden="true">${symbol}</span><span class="move-grade-count-name">${name}</span><strong data-grade-count>${count}</strong><small>${explanations[key]}</small>`;
    legend.appendChild(row);
  }
}

function finishEngineFeedback(pending, replyLine) {
  const card = moveFeedback.cards.get(pending.color);
  if (!card || card.token !== pending.token) return;
  const deltaCp = Math.max(0, pending.beforeValue + scoreValue(replyLine));
  const cand = { deltaCp, line: { ...replyLine, pv: [pending.uci, ...replyLine.pv] } };
  const brilliant = isBrilliantCandidate(pending.fen, cand);
  recordMoveGrade(pending.ply, pending.color, moveGradeCategory(deltaCp, brilliant, pending.uci === pending.beforeBestUci), { lossCp: deltaCp });
  const grade = moveGrade(deltaCp, brilliant, pending.uci === pending.beforeBestUci);
  if (!state.unassistedGame) moveFeedback.show({ san: pending.san, color: pending.color, moveNumber: pending.moveNumber, square: pending.square,
    deltaCp, brilliant, best: pending.uci === pending.beforeBestUci, token: pending.token, source: pending.cand && pending.cand.brilliantSource || (pending.cand && pending.cand.supaBrilliant ? "SupaEngine" : null) });
  if (boardUI.lastMove && boardUI.lastMove.to === pending.square) {
    boardUI.lastMove.grade = state.unassistedGame ? null : grade;
    boardUI.lastMove.evaluation = state.unassistedGame ? null : replyLine && (replyLine.scoreCp !== null || replyLine.mate !== null)
      ? formatScore(replyLine, pending.color === "b") : "—";
    renderBoard();
  }
  if (typeof gamesAutoSave === "function") gamesAutoSave();
}

/* ── Interaction échiquier ── */
function evaluationPositionKey(fen) { return String(fen || "").split(" ").slice(0, 5).join(" "); }

function findPreviouslyEvaluatedMove(fen, uci) {
  const key = evaluationPositionKey(fen);
  if (typeof reviewFindKnownMoveGrade === "function") {
    const reviewed = reviewFindKnownMoveGrade(fen, uci);
    if (reviewed) return reviewed;
  }
  const played = state.chess.history({ verbose: true });
  const priorFens = state.positionFenHistory || [];
  for (let i = 0; i < Math.min(played.length, priorFens.length - 1); i++) {
    const move = played[i];
    const playedUci = move.from + move.to + (move.promotion || "");
    if (evaluationPositionKey(priorFens[i]) !== key || playedUci !== uci) continue;
    const grade = state.moveGradeHistory.find((entry) => entry.ply === i + 1);
    if (grade && grade.category && grade.category !== "unrated") {
      return { category: grade.category, evaluation: grade.evaluation || "—", source: "déjà évalué pendant cette partie" };
    }
  }
  return null;
}

function onSquareClick(sq) {
  if (typeof reviewHandleExerciseSquareClick === "function" && reviewHandleExerciseSquareClick(sq)) return;
  if (state.phase !== "userTurn") return;
  const piece = state.chess.get(sq);
  if (boardUI.selected) {
    if (boardUI.selected === sq) {
      boardUI.selected = null; boardUI.legalTargets = []; boardUI.legalTargetHints = {};
      renderBoard(); return;
    }
    const legal = state.chess.moves({ square: boardUI.selected, verbose: true })
      .find((m) => m.to === sq);
    if (legal) {
      const promotion = legal.flags.includes("p") ? "q" : undefined;
      attemptUserMove({ from: boardUI.selected, to: sq, promotion });
      return;
    }
  }
  const selectableColor = isManualMode() ? state.chess.turn() : state.userColor;
  if (piece && piece.color === selectableColor) {
    boardUI.selected = sq;
    if (state.unassistedGame) {
      boardUI.legalTargets = [];
      boardUI.legalTargetHints = {};
      renderBoard();
      return;
    }
    const legalMoves = state.chess.moves({ square: sq, verbose: true });
    boardUI.legalTargets = [...new Set(legalMoves.map((m) => m.to))];
    boardUI.legalTargetHints = {};
    for (const move of legalMoves) {
      const uci = move.from + move.to + (move.promotion || "");
      const prefix = move.from + move.to;
      const candidate = state.candidates
        .filter((c) => c.uci === uci || (move.promotion && c.uci.startsWith(prefix)))
        .sort((a, b) => a.deltaCp - b.deltaCp)[0];
      const known = candidate ? null : findPreviouslyEvaluatedMove(state.chess.fen(), uci);
      const grade = candidate
        ? moveGrade(candidate.deltaCp, isBrilliantCandidate(state.chess.fen(), candidate), candidate.rank === 1)
        : known ? moveGrade(null, false, false, known.category) : null;
      const previous = boardUI.legalTargetHints[move.to];
      if (previous && candidate && previous.rank <= candidate.rank) continue;
      boardUI.legalTargetHints[move.to] = {
        quality: grade ? `grade-${grade.category}` : null,
        category: grade?.category || null,
        categoryLabel: grade?.label || null,
        source: candidate ? "analyse Stockfish de cette position" : known?.source || null,
        rank: candidate?.rank ?? 999,
        capture: move.flags.includes("c") || move.flags.includes("e"),
        san: move.san,
        evaluation: candidate && (candidate.line.scoreCp !== null || candidate.line.mate !== null)
          ? formatScore(candidate.line, state.chess.turn() === "w") : known?.evaluation || "—",
      };
    }
  } else {
    boardUI.selected = null; boardUI.legalTargets = []; boardUI.legalTargetHints = {};
  }
  renderBoard();
}

/* ── Cœur du concept : interception ── */
async function attemptUserMove(moveObj) {
  if (state.phase !== "userTurn") return;
  const fen = state.chess.fen();
  const gen = state.gen;
  const probe = new Chess(fen);
  const attempted = probe.move(moveObj);
  if (!attempted) return;
  stopPlayerClock(state.chess.turn());
  boardUI.selected = null;
  boardUI.legalTargets = [];
  boardUI.legalTargetHints = {};
  const uci = moveObj.from + moveObj.to + (moveObj.promotion || "");
  let cand = state.candidates.find((c) => c.uci === uci);

  if (!cand) {
    // Coup hors du top : évaluation rapide de ce coup précis
    setStatus("Évaluation de votre coup…");
    state.phase = "analyzing";
    renderBoard();
    if (!state.unassistedGame) moveFeedback.show({ san: attempted.san, color: attempted.color, moveNumber: moveNumberFromFen(fen), square: attempted.to, mode: "preview" });
    const res = probe.game_over() ? { lines: [] } :
      await state.engine.analyze({ fen: probe.fen(), multipv: 1, movetime: 600, elo: 0 });
    if (state.gen !== gen || state.chess.fen() !== fen) return;
    // Score retourné côté adversaire → on inverse pour le joueur
    let line;
    if (res.lines.length) {
      const l = res.lines[0];
      line = {
        multipv: 99, depth: l.depth,
        scoreCp: l.scoreCp !== null ? -l.scoreCp : null,
        mate: l.mate !== null ? -l.mate : null,
        pv: [uci, ...l.pv],
      };
    } else if (probe.game_over()) {
      line = { multipv: 99, depth: 0, scoreCp: 0, mate: probe.in_checkmate() ? 1 : null, pv: [uci] };
    } else {
      state.phase = "userTurn";
      startPlayerClock(state.chess.turn());
      setStatus("Analyse du coup indisponible. Réessaie ce coup.");
      return;
    }
    const best = state.candidates[0] ? state.candidates[0].line : line;
    const deltaCp = Math.max(0, scoreValue(best) - scoreValue(line));
    const args = buildArguments(state.chess.fen(), line, best, state.fenHistory);
    const reply = buildReplyInfo(state.chess.fen(), line.pv);
    const bd = computeBreakdown(state.chess.fen(), line);
    cand = { rank: state.candidateRankByUci.get(uci) || null, uci, san: args.san, line, deltaCp, args, reply, cmp: null, bd };
    state.phase = "userTurn";
  }

  // Mode manuel : pas d'interception pour le camp adverse (réplication d'une
  // partie jouée ailleurs — on rentre le coup tel quel, l'analyse reste affichée).
  const skipIntercept = state.unassistedGame || isLevelDiagnosticActive() || (isManualMode() && state.chess.turn() !== state.userColor);
  if (!skipIntercept && cand.deltaCp > thresholdCp()) {
    interceptMove(moveObj, cand);
  } else {
    commitUserMove(moveObj, cand, false);
  }
}

function interceptMove(moveObj, cand) {
  if (isLevelDiagnosticActive()) {
    commitUserMove(moveObj, cand, false);
    return;
  }
  if (typeof gamesMarkTrainingAidUsed === "function") gamesMarkTrainingAidUsed();
  if (window.SupaChessAudio) window.SupaChessAudio.play("incorrect");
  previewCandidate(cand);
  state.phase = "coach";
  startPlayerClock(state.chess.turn());
  state.pendingMove = { ...moveObj, uci: cand.uci, cand };
  state.stats.intercepts++;
  const bestSan = state.candidates[0] ? state.candidates[0].san : "—";
  let msg = `Non, ne joue pas ${cand.san} (perte de ${(cand.deltaCp / 100).toFixed(2)}) ! Joue plutôt ${bestSan}.`;
  // Punition adverse explicite du coup refusé (à partir de la PV de la sonde)
  if (cand.reply) {
    msg += ` Si tu joues ${cand.san}, l'adversaire répond ${cand.reply.san}` +
      (cand.reply.punish ? ` et ${cand.reply.punish}.` : " et garde une position confortable.");
  }
  $("coach-message").textContent = msg;
  renderCoachRanking(cand);
  $("coach-panel").classList.remove("hidden");
  setStatus("Coup intercepté — consultez le coach.");
  renderStats();
  // Enrichissement IA Supa (async, best-effort : heuristiques affichées d'abord)
  if (typeof supaEnrichCoach === "function") {
    const fen = state.chess.fen();
    supaState.lastFen = fen;
    const cands = cand.rank === null ? [...state.candidates, cand] : state.candidates;
    supaEnrichCoach(fen, cand.san, cands).catch(() => {});
  }
}

function renderCoachRanking(userCand) {
  const wrap = $("coach-ranking");
  wrap.innerHTML = "";
  const whiteSide = state.chess.turn() === "w";
  for (const c of state.candidates) {
    wrap.appendChild(candidateCard(c, whiteSide, false));
  }
  if (userCand && userCand.rank === null) {
    wrap.appendChild(candidateCard(userCand, whiteSide, true));
  }
}

function candidateCard(c, whiteSide, isUserMove) {
  const div = document.createElement("div");
  div.className = "cand" + (isUserMove ? " user-move" : "");
  div.dataset.san = c.san;
  const q = qualityClass(c.deltaCp, c.rank || 99);
  const pros = c.args.pros.map((a) => `<div class="arg-pro">${esc(a)}</div>`).join("");
  const cons = c.args.cons.map((a) => `<div class="arg-con">${esc(a)}</div>`).join("");
  div.innerHTML = `
    <div class="cand-head">
      <span class="cand-rank ${q}">${c.rank || "✗"}</span>
      <span class="cand-san">${esc(c.san)}</span>
      <span class="cand-eval">${formatScore(c.line, whiteSide)}</span>
    </div>
    <div class="cand-args">${pros}${cons || ""}</div>
    ${c.bd ? breakdownHtml(c.bd, "cl-sub cl-bd") : ""}
    ${c.reply ? `<div class="cand-reply">↩ ${isUserMove
      ? `Si tu joues ${esc(c.san)}, l'adversaire répond ${esc(c.reply.san)}${c.reply.punish ? " et " + esc(c.reply.punish) : ""}`
      : `Riposte attendue : ${esc(c.reply.text)}`}</div>` : ""}`;
  const preview = document.createElement("button");
  preview.type = "button";
  preview.className = "btn mini move-preview";
  preview.textContent = "Tester";
  preview.setAttribute("aria-label", "Tester " + c.san);
  preview.addEventListener("click", (event) => { event.stopPropagation(); previewCandidate(c); });
  div.appendChild(preview);
  if (!isUserMove) {
    div.title = "Cliquer pour jouer ce coup";
    div.addEventListener("click", () => {
      if (!["userTurn", "coach"].includes(state.phase)) return;
      hideCoach();
      commitUserMove(uciToMoveObj(c.uci), c, false);
    });
  } else {
    div.title = "Votre coup (intercepté)";
  }
  return div;
}

function commitUserMove(moveObj, cand, forced) {
  stopPlayerClock(state.chess.turn());
  state.phase = "userTurn";
  const userMoveColor = state.chess.turn();
  const fenBefore = state.chess.fen();
  const mv = state.chess.move(moveObj);
  if (!mv) return;
  if (window.SupaChessAudio) window.SupaChessAudio.play(state.chess.in_check() ? "check" : (mv.flags && (mv.flags.includes("c") || mv.flags.includes("e")) ? "capture" : "move"));
  moveFeedback.clearPreview();
  const brilliant = isBrilliantCandidate(fenBefore, cand);
  const grade = moveGrade(cand ? cand.deltaCp : null, brilliant, cand?.rank === 1);
  recordMoveGrade(state.chess.history().length, userMoveColor,
    moveGradeCategory(cand ? cand.deltaCp : null, brilliant, cand?.rank === 1),
    { noTrainingAids: typeof gamesTrainingAidsActive === "function" && !gamesTrainingAidsActive() && !forced, lossCp: cand && Number.isFinite(cand.deltaCp) ? cand.deltaCp : null });
  if (forced && typeof gamesMarkTrainingAidUsed === "function") gamesMarkTrainingAidUsed();
  if (!state.unassistedGame) moveFeedback.show({ san: mv.san, color: mv.color, moveNumber: moveNumberFromFen(fenBefore), square: mv.to,
    deltaCp: cand ? cand.deltaCp : null, brilliant, best: cand?.rank === 1, source: cand?.brilliantSource || (cand?.supaBrilliant ? "SupaEngine" : null) });
  const evaluation = cand && cand.line && (cand.line.scoreCp !== null || cand.line.mate !== null)
    ? formatScore(cand.line, userMoveColor === "w") : "—";
  boardUI.lastMove = { from: mv.from, to: mv.to, san: mv.san, grade: state.unassistedGame ? null : grade, evaluation: state.unassistedGame ? null : evaluation };
  // Précision du coup utilisateur : avant = meilleur candidat, après = candidat joué.
  if (cand && state.candidates.length) {
    recordAccuracy(userMoveColor,
      clampCpFromLine(state.candidates[0].line),
      clampCpFromLine(cand.line), state.chess.history().length);
  }
  state.evalHistory.push(cand && cand.line ? whitePovEval(cand.line, userMoveColor === "w") : null);
  boardUI.dots = [];
  state.fenHistory.push(fenKey(state.chess.fen()));
  state.positionFenHistory.push(state.chess.fen());
  recordSessionMoveSample(cand, userMoveColor);
  if (forced) state.stats.forced++;
  state.pendingMove = null;
  if (typeof gamesAutoSave === "function") gamesAutoSave();
  hideCoach();
  renderAll();
  startTurn();
}

function hideCoach() {
  $("coach-panel").classList.add("hidden");
}

/* ── Fin de partie ── */
function checkGameOver() {
  if (state.abandoned) {
    setStatus("Partie terminée — défaite par abandon.");
    return true;
  }
  if (state.stopped || state.timeExpiredColor) return true;
  const c = state.chess;
  if (!c.game_over()) return false;
  boardUI.mateFall = null;
  boardUI.mateFallAnimated = false;
  if (c.in_checkmate()) {
    const matedColor = c.turn();
    const pieces = c.board();
    for (let row = 0; row < pieces.length && !boardUI.mateFall; row++) {
      for (let file = 0; file < pieces[row].length; file++) {
        const piece = pieces[row][file];
        if (piece && piece.type === "k" && piece.color === matedColor) {
          boardUI.mateFall = { color: matedColor, square: String.fromCharCode(97 + file) + (8 - row) };
          break;
        }
      }
    }
  }
  stopPlayerClock();
  state.phase = "gameover";
  const abandonButton = $("btn-abandon-game");
  const stopButton = $("btn-stop-game");
  if (abandonButton) abandonButton.disabled = true;
  if (stopButton) stopButton.disabled = true;
  boardUI.dots = [];
  let msg = "Partie terminée — ";
  if (c.in_checkmate()) {
    msg += c.turn() === state.userColor ? "échec et mat, vous avez perdu." : "échec et mat, vous avez gagné !";
  } else if (c.in_stalemate()) msg += "pat (nulle).";
  else if (c.in_threefold_repetition()) msg += "nulle par répétition.";
  else if (c.insufficient_material()) msg += "nulle (matériel insuffisant).";
  else msg += "nulle.";
  if (typeof gamesAutoSave === "function") gamesAutoSave();
  refreshLevelDiagnosticProgress();
  setStatus(msg);
  renderBoard();
  return true;
}

/* ── Rendu ── */
function renderAll() { renderBoard(); renderCandidatesList(); renderHistory(); renderStats(); renderMoveGradeSummary(); syncBestMoveButton(); syncUndoButton(); }
function syncBestMoveButton() {
  const button = $("btn-best-move");
  if (!button) return;
  const replayButton = $("btn-replay-quit");
  const replayActive = replayButton && !replayButton.classList.contains("hidden");
  if (state.unassistedGame) {
    button.disabled = true;
    button.title = "Meilleur coup masqué pendant une partie sans aide";
    return;
  }
  if (isDiagnosticControlLockActive() && !replayActive) {
    button.disabled = true;
    button.title = "Meilleur coup masqué pendant le diagnostic de niveau";
    return;
  }
  button.title = "Jouer le meilleur demi-coup Stockfish";
  const allowedTurn = isManualMode() || state.chess.turn() === state.userColor;
  const replayReady = replayActive && typeof window.reviewPlayBestHalfMove === "function";
  button.disabled = button.dataset.pending === "true" || (replayReady
    ? !["userTurn", "coach"].includes(state.phase)
    : !["userTurn", "coach"].includes(state.phase) || !allowedTurn || !state.candidates.length);
}
function renderBoard() {
  const multipv = window.SupaAnalysisSettings?.getMultiPv() || 4;
  const showArrows = Boolean(window.SupaAnalysisSettings?.showArrows());
  const candidates = state.candidates.slice(0, multipv);
  boardUI.engineArrows = candidates.map((candidate) => candidate.uci);
  boardUI.showEngineArrows = showArrows;
  boardUI.render(state.chess);
  const legend = $("engine-arrow-legend");
  if (legend) {
    const colors = ["#16a36a", "#2581d8", "#e19b24", "#ff3366"];
    legend.hidden = !showArrows || !candidates.length;
    legend.replaceChildren();
    candidates.forEach((candidate, index) => {
      const item = document.createElement("span");
      item.className = "engine-arrow-legend-item";
      item.setAttribute("role", "listitem");
      const swatch = document.createElement("i");
      swatch.className = "engine-arrow-legend-color";
      swatch.style.backgroundColor = colors[index];
      swatch.style.color = colors[index];
      swatch.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = "Rang " + (index + 1) + (index === 0 ? " · meilleur coup" : " · alternative") + " : " + candidate.san;
      item.append(swatch, label);
      legend.appendChild(item);
    });
  }
}
window.SupaChessRenderBoard = renderBoard;
window.SupaChessReanalyze = function() {
  if (state.engine && state.phase === "userTurn") analyzeForUser().catch(console.error);
};

/* Cartes candidats dépliables (clic sur l'en-tête). Le 1er candidat est
   déplié par défaut. Déplié = arguments POUR/CONTRE + micro-points. */
const clExpanded = new Set();

function clIsOpen(c, i) {
  if (clExpanded.has("!" + c.uci)) return false;       // fermé explicitement
  return clExpanded.has(c.uci) || i === 0;             // 1er ouvert par défaut
}

function renderCandidatesList() {
  const wrap = $("candidates-list");
  if (isUnassistedAidLockActive()) { wrap.replaceChildren(); return; }
  if (!state.candidates.length) { wrap.innerHTML = "<em>En attente d'analyse…</em>"; return; }
  const whiteSide = state.chess.turn() === "w";
  wrap.innerHTML = state.candidates.map((c, i) => {
    const open = clIsOpen(c, i);
    const grade = moveGrade(c.deltaCp, isBrilliantCandidate(state.chess.fen(), c), c.rank === 1);
    const sub = [];
    if (open) {
      const pros = c.args.pros.map((a) => `<div class="arg-pro">✚ ${esc(a)}</div>`).join("");
      const cons = c.args.cons.map((a) => `<div class="arg-con">✖ ${esc(a)}</div>`).join("");
      if (pros || cons) sub.push(`<div class="cl-args">${pros}${cons}</div>`);
      if (c.bd) sub.push(breakdownHtml(c.bd, "cl-sub cl-bd"));
    }
    if (c.cmp) sub.push(`<div class="cl-sub cl-cmp">▸ ${esc(c.cmp)}</div>`);
    if (c.reply) sub.push(`<div class="cl-sub cl-reply">↩ Riposte attendue : ${esc(c.reply.text)}</div>`);
    return `<div class="cl-card${open ? " open" : ""}" data-uci="${esc(c.uci)}">
      <div class="cl-row" style="cursor:pointer" title="Cliquer pour ${open ? "replier" : "déplier"}">
        <div class="cl-move">
          <span class="cl-caret">${open ? "▾" : "▸"}</span>
          <span class="cl-dot grade-${grade.category}" aria-label="${esc(grade.label)}"></span>
          <strong class="cl-san">${c.rank}. ${esc(c.san)}</strong>
        </div>
        <span class="move-grade-chip tone-${grade.tone}" title="Note ${grade.rating === null ? "en cours" : grade.rating + " sur 10"} — ${esc(grade.label)}">
          <span class="move-grade-symbol">${esc(grade.symbol)}</span>
          <span class="move-grade-rating">${grade.rating === null ? "…" : `<b>${grade.rating}</b><small>/10</small>`}</span>
        </span>
      </div>
      <div class="cl-row-meta">
        <span class="cl-eval">Évaluation : ${formatScore(c.line, whiteSide)}</span>
        <button type="button" class="btn mini move-preview" data-preview="${esc(c.uci)}" aria-label="Tester ${esc(c.san)}">Tester</button>
      </div>
      ${sub.join("")}</div>`;
  }).join("");
  for (const row of wrap.querySelectorAll(".cl-card > .cl-row")) {
    row.addEventListener("click", () => {
      const card = row.parentElement;
      const uci = card.dataset.uci;
      const i = state.candidates.findIndex((c) => c.uci === uci);
      if (i < 0) return;
      if (clIsOpen(state.candidates[i], i)) {
        clExpanded.delete(uci);
        clExpanded.add("!" + uci);
      } else {
        clExpanded.delete("!" + uci);
        clExpanded.add(uci);
      }
      renderCandidatesList();
    });
  }
  for (const button of wrap.querySelectorAll("[data-preview]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const cand = state.candidates.find((c) => c.uci === button.dataset.preview);
      if (cand) previewCandidate(cand);
    });
  }
}

function accuracyHistoryTag(ply) {
  const entry = state.accuracy.byPly && state.accuracy.byPly[ply];
  if (!entry) return "";
  const mean = formatAccuracyPct(entry.average);
  const change = entry.delta === null ? "(départ)" :
    "(" + (entry.delta >= 0 ? "+" : "−") + formatAccuracyPct(Math.abs(entry.delta)) + " pp)";
  const tone = entry.delta === null ? "first" : entry.delta >= 0 ? "up" : "down";
  const player = entry.color === state.userColor ? "toi" : "Stockfish";
  const description = entry.delta === null
    ? "Moyenne de précision initiale de " + player + " après ce demi-coup : " + mean + "%."
    : "Moyenne de précision de " + player + " après ce demi-coup : " + mean + "%; variation " + (entry.delta >= 0 ? "plus " : "moins ") + formatAccuracyPct(Math.abs(entry.delta)) + " points de pourcentage.";
  return "<span class=\"move-accuracy-note " + tone + "\" data-ply=\"" + ply + "\" title=\"" + esc(description) + "\">Moy. " + mean + "% " + change + "</span>";
}

function renderHistory() {
  const replayHistory = window.SupaReplayHistory;
  const hist = replayHistory && Array.isArray(replayHistory.moves)
    ? replayHistory.moves : state.chess.history();
  const evals = replayHistory ? [] : (state.evalHistory || []);
  const gradeLabels = {
    brilliant: ["!!", "Brillant"], best: ["★", "Meilleur coup"],
    "very-good": ["!", "Très bon coup"], good: ["✓", "Bon coup"],
    ok: ["=", "Coup OK"], inaccuracy: ["?!", "Imprécision"],
    error: ["?", "Erreur"], mistake: ["?", "Erreur"],
    blunder: ["??", "Gaffe"], unrated: ["…", "Non évalué"],
  };
  const grades = replayHistory && Array.isArray(replayHistory.moveGrades)
    ? replayHistory.moveGrades : (state.moveGradeHistory || []);
  const gradesByPly = new Map(grades.map((entry) => [Number(entry.ply), entry]));
  const moveQualityMarkup = (ply) => {
    const entry = gradesByPly.get(ply);
    const category = entry && entry.category === "mistake" ? "error" : entry && gradeLabels[entry.category] ? entry.category : "unrated";
    const [symbol, label] = gradeLabels[category];
    return "<span class=\"mv-quality grade-" + category + "\" title=\"Qualité Stockfish : " + label +
      "\" aria-label=\"Qualité Stockfish : " + label + "\">" + symbol + "</span>";
  };
  const moveMarkup = (san, ply) => {
    const safeSan = esc(san);
    if (!replayHistory) return "<span class=\"mv\">" + safeSan + "</span>";
    const current = Number(replayHistory.currentPly) === ply;
    return "<button type=\"button\" class=\"mv replay-move" + (current ? " active" : "") +
      "\" data-replay-ply=\"" + ply + "\" aria-label=\"Afficher la position après le demi-coup " +
      ply + " : " + safeSan + "\"" + (current ? " aria-current=\"step\"" : "") + ">" + safeSan + "</button>";
  };
  let html = "";
  for (let i = 0; i < hist.length; i += 2) {
    html += "<span class=\"mvnum\">" + (i / 2 + 1) + ".</span>" + moveMarkup(hist[i], i + 1) +
      moveQualityMarkup(i + 1) + evalTag(evals[i]) + (replayHistory ? "" : accuracyHistoryTag(i + 1));
    if (hist[i + 1]) html += moveMarkup(hist[i + 1], i + 2) +
      moveQualityMarkup(i + 2) + evalTag(evals[i + 1]) + (replayHistory ? "" : accuracyHistoryTag(i + 2));
  }
  $("move-history").innerHTML = html || "<em>Aucun coup joué.</em>";
}
/* Éval d'un coup joué en valeur côté Blancs : {cp} ou {mate} (positif = avantage Blancs). */
function whitePovEval(line, moverIsWhite) {
  if (!line) return null;
  const sign = moverIsWhite ? 1 : -1;
  if (line.mate !== null) return { mate: line.mate * sign };
  return { cp: (line.scoreCp !== null ? line.scoreCp : 0) * sign };
}
function evalTag(e) {
  const s = fmtEval(e);
  return s ? ` <span class="mv-eval">${s}</span>` : "";
}
function fmtEval(e) {
  if (!e) return "";
  if (e.mate !== undefined) return (e.mate > 0 ? "#+" : "#") + e.mate;
  if (e.cp === undefined) return "";
  const v = e.cp / 100;
  return (v > 0 ? "+" : "") + v.toFixed(2);
}

function ensureSessionStatRows() {
  const rows = [
    ["stat-top5", "% top-5 Stockfish", "stat-top3"],
    ["stat-top10", "% top-10 Stockfish", "stat-top5"],
    ["stat-top25", "% top-25 Stockfish", "stat-top10"],
    ["stat-top50", "% top-50 Stockfish", "stat-top25"],
    ["stat-accuracy-60", "Demi-coups avec précision > 60 %", "stat-top50"],
    ["stat-accuracy-75", "Demi-coups avec précision > 75 %", "stat-accuracy-60"],
    ["stat-accuracy-90", "Demi-coups avec précision > 90 %", "stat-accuracy-75"],
  ];
  for (const [id, label, afterId] of rows) {
    if ($(id)) continue;
    const after = $(afterId);
    const parentRow = after && after.closest("tr");
    if (!parentRow) continue;
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.textContent = label;
    const valueCell = document.createElement("td");
    valueCell.id = id;
    valueCell.textContent = "—";
    row.append(labelCell, valueCell);
    parentRow.after(row);
  }
}

function renderStats() {
  ensureSessionStatRows();
  const reviewed = typeof reviewState !== "undefined" ? reviewState.sessionStats : null;
  const rate = (count, total, lowerBound = false) => total
    ? `${lowerBound ? "≥ " : ""}${Math.round((count / total) * 100)} % (${count}/${total})`
    : "—";
  if (reviewed) {
    $("stat-moves").textContent = `Blancs ${reviewed.w.moves} · Noirs ${reviewed.b.moves}`;
    $("stat-moves").title = "Demi-coups présents dans la partie analysée.";
    $("stat-top1").textContent = `Blancs ${rate(reviewed.w.top1, reviewed.w.ranked)} · Noirs ${rate(reviewed.b.top1, reviewed.b.ranked)}`;
    for (const [id, threshold] of [["stat-top3", 3], ["stat-top5", 5], ["stat-top10", 10], ["stat-top25", 25], ["stat-top50", 50]]) {
      $(""+id).textContent = `Blancs ${rate(reviewed.w.top2, reviewed.w.ranked, threshold > 2)} · Noirs ${rate(reviewed.b.top2, reviewed.b.ranked, threshold > 2)}`;
      $(""+id).title = threshold > 2
        ? "Borne minimale : cette partie a été analysée avec les deux premières lignes Stockfish seulement."
        : "";
    }
    for (const [id, threshold] of [["stat-accuracy-60", 60], ["stat-accuracy-75", 75], ["stat-accuracy-90", 90]]) {
      $(""+id).textContent = `Blancs ${rate(reviewed.w[`accuracyAbove${threshold}`], reviewed.w.accuracyMoves)} · Noirs ${rate(reviewed.b[`accuracyAbove${threshold}`], reviewed.b.accuracyMoves)}`;
    }
    $("stat-intercepts").textContent = "—";
    $("stat-intercepts").title = "Non mesuré dans un PGN importé.";
    $("stat-forced").textContent = "—";
    $("stat-forced").title = "Non mesuré dans un PGN importé.";
    return;
  }
  const s = state.stats;
  $("stat-moves").textContent = s.moves;
  $("stat-moves").removeAttribute("title");
  $("stat-top1").textContent = rate(s.top1, s.rankedMoves);
  $("stat-top3").textContent = rate(s.top3, s.rankedMoves);
  $("stat-top5").textContent = rate(s.top5, s.rankedMoves);
  $("stat-top10").textContent = rate(s.top10, s.rankedMoves);
  $("stat-top25").textContent = rate(s.top25, s.rankedMoves);
  $("stat-top50").textContent = rate(s.top50, s.rankedMoves);
  $("stat-accuracy-60").textContent = rate(s.accuracyAbove60, s.accuracyMoves);
  $("stat-accuracy-75").textContent = rate(s.accuracyAbove75, s.accuracyMoves);
  $("stat-accuracy-90").textContent = rate(s.accuracyAbove90, s.accuracyMoves);
  $("stat-intercepts").textContent = s.intercepts;
  $("stat-forced").textContent = s.forced;
}
function recordSessionMoveSample(cand, color) {
  const rank = cand && Number.isInteger(cand.rank) ? cand.rank : null;
  const rankKnown = rank !== null || state.candidateRankCoverageComplete;
  const sample = {
    rank: rank !== null ? rank : (rankKnown ? 51 : null),
    rankKnown,
    accuracy: state.accuracy.lastMove && state.accuracy.lastMove.color === color
      ? state.accuracy.lastMove.moveAccuracy : null,
  };
  state.sessionMoveSamples.push(sample);
  state.stats.moves++;
  if (sample.rankKnown) {
    state.stats.rankedMoves++;
    if (sample.rank <= 1) state.stats.top1++;
    if (sample.rank <= 3) state.stats.top3++;
    if (sample.rank <= 5) state.stats.top5++;
    if (sample.rank <= 10) state.stats.top10++;
    if (sample.rank <= 25) state.stats.top25++;
    if (sample.rank <= 50) state.stats.top50++;
  }
  if (sample.accuracy !== null) {
    state.stats.accuracyMoves++;
    if (sample.accuracy > 60) state.stats.accuracyAbove60++;
    if (sample.accuracy > 75) state.stats.accuracyAbove75++;
    if (sample.accuracy > 90) state.stats.accuracyAbove90++;
  }
}

function undoSessionMoveSample() {
  const sample = state.sessionMoveSamples.pop();
  if (!sample) return;
  const s = state.stats;
  s.moves = Math.max(0, s.moves - 1);
  if (sample.rankKnown) {
    s.rankedMoves = Math.max(0, s.rankedMoves - 1);
    if (sample.rank <= 1) s.top1 = Math.max(0, s.top1 - 1);
    if (sample.rank <= 3) s.top3 = Math.max(0, s.top3 - 1);
    if (sample.rank <= 5) s.top5 = Math.max(0, s.top5 - 1);
    if (sample.rank <= 10) s.top10 = Math.max(0, s.top10 - 1);
    if (sample.rank <= 25) s.top25 = Math.max(0, s.top25 - 1);
    if (sample.rank <= 50) s.top50 = Math.max(0, s.top50 - 1);
  }
  if (sample.accuracy !== null) {
    s.accuracyMoves = Math.max(0, s.accuracyMoves - 1);
    if (sample.accuracy > 60) s.accuracyAbove60 = Math.max(0, s.accuracyAbove60 - 1);
    if (sample.accuracy > 75) s.accuracyAbove75 = Math.max(0, s.accuracyAbove75 - 1);
    if (sample.accuracy > 90) s.accuracyAbove90 = Math.max(0, s.accuracyAbove90 - 1);
  }
}

/* ── Précision (style lichess accuracy) ── */
function clampCpFromLine(line) {
  if (line.mate !== null) return line.mate > 0 ? 1000 : -1000;
  return Math.max(-1000, Math.min(1000, line.scoreCp));
}
function winPct(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}
function moveAccuracyPct(beforeCp, afterCp) {
  const drop = Math.max(0, winPct(beforeCp) - winPct(afterCp));
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1668;
  return Math.max(0, Math.min(100, acc));
}
function recordAccuracy(color, beforeCp, afterCp, ply = null) {
  const moveAccuracy = moveAccuracyPct(beforeCp, afterCp);
  const previousAverage = avgAccuracy(state.accuracy[color]);
  state.accuracy[color].push(moveAccuracy);
  const average = avgAccuracy(state.accuracy[color]);
  state.accuracy.lastMove = {
    color, ply, moveAccuracy, average,
    delta: previousAverage === null ? null : average - previousAverage
  };
  if (Number.isInteger(ply) && ply > 0) {
    state.accuracy.byPly[ply] = state.accuracy.lastMove;
    renderHistory();
  }
  renderAccuracy();
}
function resetAccuracy() {
  window.SupaChessClearReviewAccuracy?.();
  state.accuracy = { w: [], b: [], pendingEngine: null, lastMove: null, byPly: {} };
  renderAccuracy();
}
function avgAccuracy(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}
function formatAccuracyPct(value) {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function accColor(v) {
  return v >= 90 ? "var(--green)" : v >= 80 ? "var(--yellow)" : v >= 60 ? "var(--orange)" : "var(--red)";
}
function accuracyDifferenceHtml(white, black, whiteLabel, blackLabel) {
  if (!Number.isFinite(white) || !Number.isFinite(black)) return "";
  const difference = Math.abs(white - black);
  const leadingLabel = difference < 0.005 ? "égalité" : esc(white > black ? whiteLabel : blackLabel);
  return `<span class="accuracy-difference"> · Écart de précision : <strong>${formatAccuracyPct(difference)} points</strong> (${leadingLabel})</span>`;
}
function accuracyHtml() {
  const review = typeof reviewState !== "undefined" ? reviewState : null;
  const summary = review ? review.gameSummary : null;
  const exercise = review ? review.exercise : null;
  const headers = summary?.headers || exercise?.headers || review?.currentHeaders || {};
  if (summary || exercise || headers.White || headers.Black) {
    const players = Array.isArray(summary?.players) ? summary.players :
      (Array.isArray(exercise?.analysis?.players) ? exercise.analysis.players : []);
    const values = {};
    const parts = [["w", headers.White || "Blancs"], ["b", headers.Black || "Noirs"]].map(([color, name]) => {
      const player = players.find((item) => item && item.color === color);
      const value = player && Number.isFinite(player.accuracy) ? player.accuracy : null;
      values[color] = value;
      const playerSide = color === "w" ? "Blanc" : "Noir";
      const playerLabel = `<span class="accuracy-player-label accuracy-player-${color}"><span class="accuracy-player-dot accuracy-player-dot-${color}" aria-hidden="true"></span><span class="accuracy-player-side">(${playerSide})</span> ${esc(name)}</span>`;
      return value === null
        ? `${playerLabel}: <span style="color:var(--text-dim)">—</span>`
        : `${playerLabel}: <span style="color:${accColor(value)};font-weight:600">${formatAccuracyPct(value)}%</span>`;
    });
    const difference = accuracyDifferenceHtml(values.w, values.b, headers.White || "Blancs", headers.Black || "Noirs");
    if (difference) parts.push(difference);
    return parts.join(" &nbsp;·&nbsp; ");
  }
  const youAreWhite = state.userColor === "w";
  const labels = { w: youAreWhite ? "Blancs (toi)" : "Blancs (SF)", b: youAreWhite ? "Noirs (SF)" : "Noirs (toi)" };
  const values = { w: avgAccuracy(state.accuracy.w), b: avgAccuracy(state.accuracy.b) };
  const parts = [["w", labels.w], ["b", labels.b]].map(([color, label]) => {
    const value = values[color];
    if (value === null) return `${esc(label)}: <span style="color:var(--text-dim)">—</span>`;
    const last = state.accuracy.lastMove;
    const moveNote = last && last.color === color
      ? last.delta === null
        ? ` · première moyenne : ${formatAccuracyPct(last.average)}%`
        : ` · ${last.delta >= 0 ? "+" : "−"}${formatAccuracyPct(Math.abs(last.delta))}% de précision moyenne sur ce demi-coup`
      : "";
    return `${esc(label)}: <span style="color:${accColor(value)};font-weight:600">${formatAccuracyPct(value)}%</span>${moveNote}`;
  });
  const difference = accuracyDifferenceHtml(values.w, values.b, labels.w, labels.b);
  if (difference) parts.push(difference);
  return parts.join(" &nbsp;·&nbsp; ");
}
function renderAccuracy() {
  const html = accuracyHtml();
  const cell = $("stat-accuracy");
  if (cell) { cell.innerHTML = html; if (cell.closest("tr")) cell.closest("tr").hidden = state.unassistedGame; }
  const badge = $("accuracy-badge");
  if (badge) { badge.innerHTML = "Précision — " + html; badge.hidden = state.unassistedGame; }
}
window.SupaChessRenderAccuracy = renderAccuracy;

function updateEvalBar(bestLine) {
  if (!bestLine) return;
  const whiteToMove = state.chess.turn() === "w";
  let cp;
  if (bestLine.mate !== null) cp = (bestLine.mate > 0 ? 2000 : -2000) * (whiteToMove ? 1 : -1);
  else cp = bestLine.scoreCp * (whiteToMove ? 1 : -1);
  state.evalWhiteCp = cp;
  const pct = 100 / (1 + Math.exp(-cp / 250)); // sigmoïde
  $("evalbar-white").style.height = pct.toFixed(1) + "%";
  $("evalbar-label").textContent = bestLine.mate !== null
    ? "#" + Math.abs(bestLine.mate)
    : (cp > 0 ? "+" : "") + (cp / 100).toFixed(2);
}

// La barre d'évaluation est calée sur l'échiquier en CSS (.board-row, align-items: stretch).

function setStatus(msg) { $("status-line").textContent = msg; syncUndoButton(); }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ── Boutons ── */
$("btn-new").addEventListener("click", () => newGame({ unassisted: false }));
$("btn-unassisted-game")?.addEventListener("click", () => newGame({ unassisted: true }));
$("btn-abandon-game")?.addEventListener("click", abandonCurrentGame);
$("btn-stop-game")?.addEventListener("click", stopCurrentGame);
syncDotsButton();
syncMoveDotsButton();
$("btn-abandon-diagnostic")?.addEventListener("click", abandonLevelDiagnostic);
$("btn-dots").addEventListener("click", () => {
  if (isUnassistedAidLockActive()) return;
  boardUI.showDots = !boardUI.showDots;
  if (!correctionExerciseModeActive && boardUI.showDots && typeof gamesMarkTrainingAidUsed === "function") gamesMarkTrainingAidUsed();
  localStorage.setItem(DOTS_STORAGE_KEY, String(boardUI.showDots));
  syncDotsButton();
  renderBoard();
});
$("btn-move-dots").addEventListener("click", () => {
  if (isUnassistedAidLockActive()) return;
  boardUI.showMoveDots = !boardUI.showMoveDots;
  if (!correctionExerciseModeActive && boardUI.showMoveDots && typeof gamesMarkTrainingAidUsed === "function") gamesMarkTrainingAidUsed();
  localStorage.setItem(MOVE_DOTS_STORAGE_KEY, String(boardUI.showMoveDots));
  syncMoveDotsButton();
  renderBoard();
});
$("sel-color").addEventListener("change", () => newGame({ unassisted: state.unassistedGame }));
$("btn-flip-board").addEventListener("click", () => {
  boardUI.setFlipped(!boardUI.flipped);
  $("btn-flip-board").setAttribute("aria-pressed", String(boardUI.flipped));
  renderBoard();
});
$("btn-best-move").addEventListener("click", () => {
  if (state.unassistedGame) return;
  const replayButton = $("btn-replay-quit");
  const replayActive = replayButton && !replayButton.classList.contains("hidden");
  if (replayActive) {
    if (typeof window.reviewPlayBestHalfMove === "function") {
      window.reviewPlayBestHalfMove().catch((error) => setStatus("Impossible de jouer le meilleur demi-coup : " + error.message));
    } else setStatus("Le mode relecture n’a pas chargé le calcul du meilleur demi-coup.");
    return;
  }
  if (isDiagnosticControlLockActive()) return;
  if (!["userTurn", "coach"].includes(state.phase) || (!isManualMode() && state.chess.turn() !== state.userColor)) return;
  const best = state.candidates.find((candidate) => candidate.rank === 1) || state.candidates[0];
  if (!best) return;
  hideCoach();
  commitUserMove(uciToMoveObj(best.uci), best, true);
});
function onOpponentSettingsChange() {
  updateOpponentFideEstimate();
  // Recalcule aussi si le niveau ou le temps change pendant une partie.
  if (state.phase === "gameover" || state.phase === "init") return;
  state.gen++;
  state.pendingMove = null;
  hideCoach();
  startTurn();
}
$("sel-elo").addEventListener("change", onOpponentSettingsChange);
$("sel-movetime").addEventListener("change", onOpponentSettingsChange);
restorePlayerClockSettings();
for (const id of ["sel-clock-white", "sel-clock-black"]) {
  const control = $(id);
  control?.addEventListener("change", () => {
    persistPlayerClockSettings();
    const status = $("clock-control-status");
    if (status) status.textContent = "Nouveau temps enregistré. Il sera appliqué à la prochaine partie.";
  });
}
updateOpponentFideEstimate();
$("btn-force").addEventListener("click", () => {
  if (!state.unassistedGame && state.pendingMove) {
    const { from, to, promotion, cand } = state.pendingMove;
    commitUserMove({ from, to, promotion }, cand, true);
  }
});
$("btn-cancel").addEventListener("click", () => {
  state.pendingMove = null;
  state.phase = "userTurn";
  startPlayerClock(state.chess.turn());
  hideCoach();
  setStatus("À vous de jouer.");
});
$("btn-undo").addEventListener("click", () => {
  if (state.phase === "engineThinking" || state.phase === "analyzing") return;
  if (correctionExerciseModeActive) {
    if (typeof window.reviewUndoCorrectionExercise === "function") window.reviewUndoCorrectionExercise();
    syncUndoButton();
    return;
  }
  if (isUnassistedAidLockActive() || isDiagnosticControlLockActive()) return;
  if (state.undoCount >= 3) {
    setStatus("Limite de trois annulations atteinte pour cette partie.");
    syncUndoButton();
    return;
  }
  const history = state.chess.history({ verbose: true });
  let lastUserMoveIndex = -1;
  for (let index = history.length - 1; index >= 0; index--) {
    if (history[index].color === state.userColor) {
      lastUserMoveIndex = index;
      break;
    }
  }
  if (lastUserMoveIndex < 0) {
    setStatus("Aucun demi-coup joué à annuler.");
    return;
  }

  stopPlayerClock();
  hideCoach();
  state.gen++;
  moveFeedback.clear();
  // Retire le dernier demi-coup du joueur et les réponses moteur qui le suivent.
  const pliesToUndo = history.length - lastUserMoveIndex;
  state.undoCount++;
  syncUndoButton();
  for (let undone = 0; undone < pliesToUndo; undone++) {
    const ply = state.chess.history().length;
    const move = state.chess.undo();
    if (move && move.color === state.userColor) undoSessionMoveSample();
    if (move && state.accuracy.byPly[ply]) {
      if (state.accuracy[move.color].length) state.accuracy[move.color].pop();
      delete state.accuracy.byPly[ply];
    }
    state.fenHistory.pop();
    state.positionFenHistory.pop();
    state.evalHistory.pop();
  }
  state.moveGradeHistory = state.moveGradeHistory.filter((entry) => entry.ply <= state.chess.history().length);
  state.accuracy.pendingEngine = null;
  const remainingAccuracyPlies = Object.keys(state.accuracy.byPly).map(Number).filter(Number.isFinite).sort((a, b) => b - a);
  state.accuracy.lastMove = remainingAccuracyPlies.length ? state.accuracy.byPly[remainingAccuracyPlies[0]] : null;
  boardUI.lastMove = null;
  renderAll();
  startTurn();
});
$("btn-pgn").addEventListener("click", () => {
  if (state.chess.history().length === 0) { alert("Aucun coup joué."); return; }
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  state.chess.header(
    "Event", "SupaChess entraînement",
    "Site", "https://jira44.github.io/supachess/",
    "Date", `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
    "White", state.userColor === "w" ? "Joueur" : "Stockfish 19",
    "Black", state.userColor === "b" ? "Joueur" : "Stockfish 19",
    "SupaChessTrainingAidsUsed", typeof gamesTrainingAidsActive === "function" && gamesTrainingAidsActive() ? "true" : "false",
    "SupaChessUnassistedMode", state.unassistedGame ? "true" : "false"
  );
  const blob = new Blob([state.chess.pgn()], { type: "application/x-chess-pgn" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `supachess_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.pgn`;
  a.click();
  URL.revokeObjectURL(a.href);
});
$("btn-fen").addEventListener("click", () => {
  const fen = prompt("Collez une position FEN :");
  if (!fen) return;
  const test = new Chess();
  if (!test.load(fen.trim())) { alert("FEN invalide."); return; }
  state.gen++;
  moveFeedback.clear();
  state.chess = new Chess(fen.trim());
  state.candidateFen = null;
  state.systemBrilliantCandidates = [];
  state.fenHistory = [fenKey(state.chess.fen())];
  state.positionFenHistory = [state.chess.fen()];
  state.evalHistory = [];
  state.candidates = [];
  if (typeof gamesNewEntry === "function") gamesNewEntry();
  resetAccuracy();
  boardUI.lastMove = null;
  boardUI.dots = [];
  hideCoach();
  renderAll();
  startTurn();
});

refreshLevelDiagnosticProgress();
init();


document.getElementById("move-history")?.addEventListener("click", (event) => {
  const moveButton = event.target.closest("[data-replay-ply]");
  if (!moveButton || !window.SupaReplayHistory || typeof window.reviewJumpToPly !== "function") return;
  const ply = Number(moveButton.dataset.replayPly);
  if (Number.isInteger(ply)) window.reviewJumpToPly(ply);
});
