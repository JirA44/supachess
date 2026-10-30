/* app.js — orchestration : partie contre Stockfish + coach interceptant. */
"use strict";

const $ = (id) => document.getElementById(id);

const state = {
  chess: new Chess(),
  engine: null,
  userColor: "w",
  candidates: [],        // [{rank, uci, san, line, deltaCp, args}]
  phase: "init",         // init | analyzing | userTurn | coach | engineThinking | gameover
  abandoned: false,
  stopped: false,
  pendingMove: null,     // coup utilisateur intercepté {from,to,promotion,uci}
  fenHistory: [],        // clés FEN (4 champs) pour détection de répétition
  evalHistory: [],       // éval (côté Blancs) de chaque demi-coup joué, parallèle à history()
  evalWhiteCp: 0,
  gen: 0,                // génération de tour : invalide les analyses en vol au changement de mode

  stats: { moves: 0, top1: 0, top3: 0, intercepts: 0, forced: 0 },
  accuracy: { w: [], b: [], pendingEngine: null, lastMove: null, byPly: {} }, // moveAccuracy [0..100] par couleur
  moveGradeHistory: [], // demi-coups joués avec catégorie, révisée après analyse moteur
};

const boardUI = new BoardUI($("board"), onSquareClick);
const DOTS_STORAGE_KEY = "supachess-show-candidate-dots";
const MOVE_DOTS_STORAGE_KEY = "supachess-show-legal-move-dots";
const LEVEL_DIAGNOSTIC_KEY = "supachess-level-diagnostic";
function readLevelDiagnostic() {
  try { return JSON.parse(localStorage.getItem(LEVEL_DIAGNOSTIC_KEY) || "null"); }
  catch (_) { return null; }
}
function isLevelDiagnosticActive() {
  const diagnostic = readLevelDiagnostic();
  return Boolean(diagnostic && diagnostic.active);
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
let levelDiagnosticLockWasActive = isLevelDiagnosticActive();
function countCompletedDiagnosticGames(diagnostic) {
  const start = Date.parse(diagnostic && diagnostic.startedAt || "");
  if (!Number.isFinite(start)) return 0;
  try {
    const games = JSON.parse(localStorage.getItem("supachess_games") || "[]");
    if (!Array.isArray(games)) return 0;
    const counted = new Set();
    for (const game of games) {
      if (!game || !game.id || game.abandoned || game.termination === "abandoned" || !["1-0", "0-1", "1/2-1/2"].includes(game.result)) continue;
      if (!Number(game.stats && game.stats.moves)) continue;
      const startedAt = Number.parseInt(String(game.id), 10);
      const playedAgainstStockfish = /stockfish/i.test(String(game.engineName || "")) ||
        game.stockfishRatingSource === "supachess-engine-setting-v1";
      if (Number.isFinite(startedAt) && startedAt >= start && playedAgainstStockfish) counted.add(String(game.id));
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
    banner.textContent = "Diagnostic de niveau activé par défaut : termine 10 parties contre Stockfish. Coaching, bulles candidates et points de coups sont désactivés pendant ce bilan.";
    return;
  }
  if (diagnostic.active) {
    setAbandonVisible(true);
    const count = countCompletedDiagnosticGames(diagnostic);
    banner.hidden = false;
    const prefix = diagnostic.defaultActivation ? "Diagnostic de niveau activé par défaut : " : "Diagnostic actif : ";
    banner.textContent = prefix + count + "/10 parties terminées contre Stockfish depuis son activation. Coaching, bulles candidates et points de coups sont désactivés pendant le diagnostic.";
  } else if (diagnostic.completed) {
    setAbandonVisible(false);
    banner.hidden = false;
    banner.textContent = "Diagnostic terminé : " + (diagnostic.analyzedGamesAtCompletion || 10) +
      " parties terminées contre Stockfish. Les bulles candidates et points de coups sont réactivés. Consulte le bilan et les exercices ciblés.";
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
boardUI.showDots = levelDiagnosticLockWasActive ? false : localStorage.getItem(DOTS_STORAGE_KEY) !== "false";
boardUI.showMoveDots = levelDiagnosticLockWasActive ? false : localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false";
function syncDotsButton() {
  const button = $("btn-dots");
  if (!button) return;
  const locked = isLevelDiagnosticActive();
  const candidatesPanel = $("candidates-panel");
  if (candidatesPanel) {
    candidatesPanel.hidden = locked;
    candidatesPanel.setAttribute("aria-hidden", String(locked));
  }
  button.disabled = locked;
  button.title = locked ? "Bloqué pendant le diagnostic de niveau" : "Afficher ou masquer les bulles candidates";
  button.textContent = locked ? "Bulles candidates : bloquées" : "Bulles candidates : " + (boardUI.showDots ? "ON" : "OFF");
  button.setAttribute("aria-pressed", String(!locked && boardUI.showDots));
  syncLevelDiagnosticBanner();
}
function syncMoveDotsButton() {
  const button = $("btn-move-dots");
  if (!button) return;
  const locked = isLevelDiagnosticActive();
  button.disabled = locked;
  button.title = locked ? "Bloqué pendant le diagnostic de niveau" : "Afficher ou masquer les points de coups possibles";
  button.textContent = locked ? "Points chauds/froids : bloqués" : "Points chauds/froids : " + (boardUI.showMoveDots ? "ON" : "OFF");
  button.setAttribute("aria-pressed", String(!locked && boardUI.showMoveDots));
}
function applyLevelDiagnosticLock() {
  const diagnostic = readLevelDiagnostic();
  const active = Boolean(diagnostic && diagnostic.active);
  if (active) {
    boardUI.showDots = false;
    boardUI.showMoveDots = false;
    if (state.phase === "coach") {
      state.phase = "userTurn";
      state.pendingMove = null;
      moveFeedback.clearPreview();
      hideCoach();
    }
  } else if (levelDiagnosticLockWasActive) {
    // Leaving the diagnostic must turn both aids back on, even if older saved
    // preferences were false; the player can switch either aid off afterwards.
    boardUI.showDots = true;
    boardUI.showMoveDots = true;
    localStorage.setItem(DOTS_STORAGE_KEY, "true");
    localStorage.setItem(MOVE_DOTS_STORAGE_KEY, "true");
  }
  levelDiagnosticLockWasActive = active;
  syncDotsButton();
  syncMoveDotsButton();
  if (typeof renderBoard === "function") renderBoard();
}
window.addEventListener("supachess:level-diagnostic-change", applyLevelDiagnosticLock);
window.applyLevelDiagnosticLock = applyLevelDiagnosticLock;
window.addEventListener("storage", (event) => {
  if (event.key !== LEVEL_DIAGNOSTIC_KEY) return;
  const active = isLevelDiagnosticActive();
  if (!active && levelDiagnosticLockWasActive) {
    const diagnostic = readLevelDiagnostic();
    boardUI.showDots = typeof diagnostic?.restoreDots === "boolean" ? diagnostic.restoreDots : localStorage.getItem(DOTS_STORAGE_KEY) !== "false";
    boardUI.showMoveDots = typeof diagnostic?.restoreMoveDots === "boolean" ? diagnostic.restoreMoveDots : localStorage.getItem(MOVE_DOTS_STORAGE_KEY) !== "false";
  }
  applyLevelDiagnosticLock();
});

/* ── Réglages ── */
function thresholdCp() { return Math.round(parseFloat($("sel-threshold").value) * 100); }
function movetime() { return parseInt($("sel-movetime").value, 10); }
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
function estimateOpponentAccuracyRange(fideLikeElo) {
  // Indicative heuristic anchored to the requested 1,500 Elo => 50–60% range.
  const center = 55 + (fideLikeElo - 1500) * 0.02;
  return {
    min: Math.max(0, Math.round(center - 5)),
    max: Math.min(100, Math.round(center + 5)),
  };
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
    const range = estimateOpponentAccuracyRange(estimatedElo);
    accuracyOutput.textContent = `Repère indicatif de précision moyenne par partie : ${range.min}–${range.max} %`;
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
  newGame();
  document.dispatchEvent(new Event("supachess:engine-ready"));
}

function newGame() {
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
  state.pendingMove = null;
  resetAccuracy();
  state.fenHistory = [fenKey(state.chess.fen())];
  state.evalHistory = [];
  state.userColor = $("sel-color").value;
  boardUI.setFlipped(state.userColor === "b");
  boardUI.selected = null;
  boardUI.lastMove = null;
  boardUI.dots = [];
  boardUI.legalTargets = [];
  boardUI.legalTargetHints = {};
  hideCoach();
  if (typeof gamesNewEntry === "function") gamesNewEntry();
  renderAll();
  startTurn();
}

function abandonCurrentGame() {
  if (state.phase === "init" || state.phase === "gameover") return;
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
  setStatus("Partie abandonnée — défaite enregistrée.");
  renderAll();
}

function stopCurrentGame() {
  if (state.phase === "init" || state.phase === "gameover") return;
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
  setStatus("Analyse de la position… (MultiPV)");
  boardUI.dots = [];
  renderBoard();
  const fen = state.chess.fen();
  const legalMoveCount = state.chess.moves({ verbose: true }).length;
  setStatus(`Analyse des ${legalMoveCount} coups possibles…`);
  const res = await state.engine.analyze({ fen, multipv: Math.max(1, legalMoveCount), movetime: movetime(), elo: 0 });
  if (state.gen !== gen || state.chess.fen() !== fen) return; // partie/mode changé entre temps
  buildCandidates(res.lines, fen);
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
  if (isManualMode()) {
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

function buildCandidates(lines, fen) {
  if (!lines.length) { state.candidates = []; return; }
  const best = lines[0];
  const bestVal = scoreValue(best);
  state.candidates = lines.map((line, i) => {
    const deltaCp = Math.max(0, bestVal - scoreValue(line));
    const args = buildArguments(fen, line, best, state.fenHistory);
    const reply = buildReplyInfo(fen, line.pv);
    const bd = computeBreakdown(fen, line);
    return { rank: i + 1, uci: line.pv[0], san: args.san, line, deltaCp, args, reply, bd };
  });
  clExpanded.clear();
  // Comparaison de chaque candidat avec le suivant du classement
  for (let i = 0; i < state.candidates.length; i++) {
    state.candidates[i].cmp = buildComparison(state.candidates[i], state.candidates[i + 1] || null);
  }
  const dotsBySquare = new Map();
  for (const cand of state.candidates) {
    const square = cand.uci.slice(2, 4);
    const grade = moveGrade(cand.deltaCp, isBrilliantCandidate(fen, cand), cand.rank === 1);
    const evaluation = cand.line && (cand.line.scoreCp !== null || cand.line.mate !== null)
      ? formatScore(cand.line, state.chess.turn() === "w") : "—";
    const moveBadge = { san: cand.san, label: moveGradeBadgeLabel(grade), evaluation, grade, rank: cand.rank };
    if (!dotsBySquare.has(square)) dotsBySquare.set(square, []);
    dotsBySquare.get(square).push(moveBadge);
  }
  boardUI.dots = candidateDotsFromGroups(dotsBySquare);
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
  const mv = state.chess.move(uciToMoveObj(res.bestmove));
  if (mv) {
    boardUI.lastMove = { from: mv.from, to: mv.to };
    state.fenHistory.push(fenKey(state.chess.fen()));
    state.evalHistory.push(res.lines.length ? whitePovEval(res.lines[0], engineColor === "w") : null);
    // Eval AVANT (POV engine) = top-1 de son analyse ; APRÈS = top-1 de la
    // prochaine analyse MultiPV utilisateur (déjà lancée pour son tour).
    moveFeedback.clearPreview();
    moveFeedback.show({ san: mv.san, color: engineColor, moveNumber: moveNumberFromFen(fen), square: mv.to, token: gen });
    boardUI.lastMove = { from: mv.from, to: mv.to, san: mv.san, grade: moveGrade(null) };
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

function recordMoveGrade(ply, color, category) {
  const existing = state.moveGradeHistory.find((entry) => entry.ply === ply);
  if (existing) { existing.color = color; existing.category = category; }
  else state.moveGradeHistory.push({ ply, color, category });
  renderMoveGradeSummary();
}

function renderMoveGradeSummary() {
  const wrap = $("move-grade-summary");
  if (!wrap) return;
  const categories = [
    ["brilliant", "!!", "Brillant"], ["best", "★", "Meilleur coup"],
    ["very-good", "!", "Très bon coup"], ["good", "✓", "Bon coup"],
    ["ok", "=", "Coup OK"], ["inaccuracy", "?!", "Imprécision"],
    ["error", "?", "Erreur"], ["blunder", "??", "Gaffe"], ["unrated", "…", "En attente"],
  ];
  wrap.replaceChildren();
  for (const [color, label] of [["w", "Blancs"], ["b", "Noirs"]]) {
    const side = document.createElement("section");
    side.className = "move-grade-side";
    side.dataset.color = color;
    const heading = document.createElement("h3");
    heading.textContent = label;
    side.appendChild(heading);
    for (const [key, symbol, name] of categories) {
      const count = state.moveGradeHistory.filter((entry) => entry.color === color && entry.category === key).length;
      const row = document.createElement("div");
      row.className = "move-grade-count-row grade-" + key;
      row.dataset.grade = key;
      row.innerHTML = `<span class="move-grade-count-dot" aria-hidden="true"></span><span class="move-grade-count-symbol" aria-hidden="true">${symbol}</span><span class="move-grade-count-name">${name}</span><strong data-grade-count>${count ? "+" + count : "0"}</strong>`;
      side.appendChild(row);
    }
    wrap.appendChild(side);
  }
}

function finishEngineFeedback(pending, replyLine) {
  const card = moveFeedback.cards.get(pending.color);
  if (!card || card.token !== pending.token) return;
  const deltaCp = Math.max(0, pending.beforeValue + scoreValue(replyLine));
  const cand = { deltaCp, line: { ...replyLine, pv: [pending.uci, ...replyLine.pv] } };
  const brilliant = isBrilliantCandidate(pending.fen, cand);
  recordMoveGrade(pending.ply, pending.color, moveGradeCategory(deltaCp, brilliant, pending.uci === pending.beforeBestUci));
  const grade = moveGrade(deltaCp, brilliant, pending.uci === pending.beforeBestUci);
  moveFeedback.show({ san: pending.san, color: pending.color, moveNumber: pending.moveNumber, square: pending.square,
    deltaCp, brilliant, best: pending.uci === pending.beforeBestUci, token: pending.token });
  if (boardUI.lastMove && boardUI.lastMove.to === pending.square) {
    boardUI.lastMove.grade = grade;
    boardUI.lastMove.evaluation = replyLine && (replyLine.scoreCp !== null || replyLine.mate !== null)
      ? formatScore(replyLine, pending.color === "b") : "—";
    renderBoard();
  }
}

/* ── Interaction échiquier ── */
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
    const legalMoves = state.chess.moves({ square: sq, verbose: true });
    boardUI.legalTargets = [...new Set(legalMoves.map((m) => m.to))];
    boardUI.legalTargetHints = {};
    for (const move of legalMoves) {
      const prefix = move.from + move.to;
      const candidate = state.candidates
        .filter((c) => c.uci.startsWith(prefix))
        .sort((a, b) => a.deltaCp - b.deltaCp)[0];
      const previous = boardUI.legalTargetHints[move.to];
      if (previous && candidate && previous.rank <= candidate.rank) continue;
      boardUI.legalTargetHints[move.to] = {
        quality: candidate ? qualityClass(candidate.deltaCp, candidate.rank) : null,
        rank: candidate?.rank ?? 999,
        capture: move.flags.includes("c") || move.flags.includes("e"),
        san: move.san,
        evaluation: candidate && (candidate.line.scoreCp !== null || candidate.line.mate !== null)
          ? formatScore(candidate.line, state.chess.turn() === "w") : "—",
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
    moveFeedback.show({ san: attempted.san, color: attempted.color, moveNumber: moveNumberFromFen(fen), square: attempted.to, mode: "preview" });
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
      setStatus("Analyse du coup indisponible. Réessaie ce coup.");
      return;
    }
    const best = state.candidates[0] ? state.candidates[0].line : line;
    const deltaCp = Math.max(0, scoreValue(best) - scoreValue(line));
    const args = buildArguments(state.chess.fen(), line, best, state.fenHistory);
    const reply = buildReplyInfo(state.chess.fen(), line.pv);
    const bd = computeBreakdown(state.chess.fen(), line);
    cand = { rank: null, uci, san: args.san, line, deltaCp, args, reply, cmp: null, bd };
    state.phase = "userTurn";
  }

  // Mode manuel : pas d'interception pour le camp adverse (réplication d'une
  // partie jouée ailleurs — on rentre le coup tel quel, l'analyse reste affichée).
  const skipIntercept = isLevelDiagnosticActive() || (isManualMode() && state.chess.turn() !== state.userColor);
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
  previewCandidate(cand);
  state.phase = "coach";
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
  state.phase = "userTurn";
  const userMoveColor = state.chess.turn();
  const fenBefore = state.chess.fen();
  const mv = state.chess.move(moveObj);
  if (!mv) return;
  moveFeedback.clearPreview();
  const brilliant = isBrilliantCandidate(fenBefore, cand);
  const grade = moveGrade(cand ? cand.deltaCp : null, brilliant, cand?.rank === 1);
  recordMoveGrade(state.chess.history().length, userMoveColor,
    moveGradeCategory(cand ? cand.deltaCp : null, brilliant, cand?.rank === 1));
  moveFeedback.show({ san: mv.san, color: mv.color, moveNumber: moveNumberFromFen(fenBefore), square: mv.to,
    deltaCp: cand ? cand.deltaCp : null, brilliant, best: cand?.rank === 1 });
  const evaluation = cand && cand.line && (cand.line.scoreCp !== null || cand.line.mate !== null)
    ? formatScore(cand.line, userMoveColor === "w") : "—";
  boardUI.lastMove = { from: mv.from, to: mv.to, san: mv.san, grade, evaluation };
  // Précision du coup utilisateur : avant = meilleur candidat, après = candidat joué.
  if (cand && state.candidates.length) {
    recordAccuracy(userMoveColor,
      clampCpFromLine(state.candidates[0].line),
      clampCpFromLine(cand.line), state.chess.history().length);
  }
  state.evalHistory.push(cand && cand.line ? whitePovEval(cand.line, userMoveColor === "w") : null);
  boardUI.dots = [];
  state.fenHistory.push(fenKey(state.chess.fen()));
  state.stats.moves++;
  if (cand && cand.rank === 1) state.stats.top1++;
  if (cand && cand.rank !== null && cand.rank <= 3) state.stats.top3++;
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
  if (state.abandoned || state.stopped) return true;
  const c = state.chess;
  if (!c.game_over()) return false;
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
function renderAll() { renderBoard(); renderCandidatesList(); renderHistory(); renderStats(); renderMoveGradeSummary(); }
function renderBoard() { boardUI.render(state.chess); }

/* Cartes candidats dépliables (clic sur l'en-tête). Le 1er candidat est
   déplié par défaut. Déplié = arguments POUR/CONTRE + micro-points. */
const clExpanded = new Set();

function clIsOpen(c, i) {
  if (clExpanded.has("!" + c.uci)) return false;       // fermé explicitement
  return clExpanded.has(c.uci) || i === 0;             // 1er ouvert par défaut
}

function renderCandidatesList() {
  const wrap = $("candidates-list");
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
  const hist = state.chess.history();
  const evals = state.evalHistory || [];
  let html = "";
  for (let i = 0; i < hist.length; i += 2) {
    html += "<span class=\"mvnum\">" + (i / 2 + 1) + ".</span><span class=\"mv\">" + esc(hist[i]) + "</span>" + evalTag(evals[i]) + accuracyHistoryTag(i + 1);
    if (hist[i + 1]) html += "<span class=\"mv\">" + esc(hist[i + 1]) + "</span>" + evalTag(evals[i + 1]) + accuracyHistoryTag(i + 2);
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

function renderStats() {
  const s = state.stats;
  $("stat-moves").textContent = s.moves;
  $("stat-top1").textContent = s.moves ? Math.round((s.top1 / s.moves) * 100) + " %" : "—";
  $("stat-top3").textContent = s.moves ? Math.round((s.top3 / s.moves) * 100) + " %" : "—";
  $("stat-intercepts").textContent = s.intercepts;
  $("stat-forced").textContent = s.forced;
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
function accuracyHtml() {
  const exercise = typeof reviewState !== "undefined" && reviewState.exercise;
  if (exercise) {
    const headers = exercise.headers || reviewState.currentHeaders || {};
    const players = Array.isArray(exercise.analysis?.players) ? exercise.analysis.players : [];
    return [["w", headers.White || "Blancs"], ["b", headers.Black || "Noirs"]].map(([color, name]) => {
      const player = players.find((item) => item && item.color === color);
      const value = player && Number.isFinite(player.accuracy) ? player.accuracy : null;
      return value === null
        ? `${esc(name)}: <span style="color:var(--text-dim)">—</span>`
        : `${esc(name)}: <span style="color:${accColor(value)};font-weight:600">${formatAccuracyPct(value)}%</span>`;
    }).join(" &nbsp;·&nbsp; ");
  }
  const youAreWhite = state.userColor === "w";
  const parts = [["w", youAreWhite ? "Blancs (toi)" : "Blancs (SF)"],
                 ["b", youAreWhite ? "Noirs (SF)" : "Noirs (toi)"]].map(([c, label]) => {
    const v = avgAccuracy(state.accuracy[c]);
    if (v === null) return `${esc(label)}: <span style="color:var(--text-dim)">—</span>`;
    const last = state.accuracy.lastMove;
    const moveNote = last && last.color === c
      ? last.delta === null
        ? ` · première moyenne : ${formatAccuracyPct(last.average)}%`
        : ` · ${last.delta >= 0 ? "+" : "−"}${formatAccuracyPct(Math.abs(last.delta))}% de précision moyenne sur ce demi-coup`
      : "";
    return `${esc(label)}: <span style="color:${accColor(v)};font-weight:600">${formatAccuracyPct(v)}%</span>${moveNote}`;
  });
  return parts.join(" &nbsp;·&nbsp; ");
}
function renderAccuracy() {
  const html = accuracyHtml();
  const cell = $("stat-accuracy");
  if (cell) cell.innerHTML = html;
  const badge = $("accuracy-badge");
  if (badge) badge.innerHTML = "Précision — " + html;
}

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

function setStatus(msg) { $("status-line").textContent = msg; }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ── Boutons ── */
$("btn-new").addEventListener("click", newGame);
$("btn-abandon-game")?.addEventListener("click", abandonCurrentGame);
$("btn-stop-game")?.addEventListener("click", stopCurrentGame);
syncDotsButton();
syncMoveDotsButton();
$("btn-abandon-diagnostic")?.addEventListener("click", abandonLevelDiagnostic);
$("btn-dots").addEventListener("click", () => {
  if (isLevelDiagnosticActive()) return;
  boardUI.showDots = !boardUI.showDots;
  localStorage.setItem(DOTS_STORAGE_KEY, String(boardUI.showDots));
  syncDotsButton();
  renderBoard();
});
$("btn-move-dots").addEventListener("click", () => {
  if (isLevelDiagnosticActive()) return;
  boardUI.showMoveDots = !boardUI.showMoveDots;
  localStorage.setItem(MOVE_DOTS_STORAGE_KEY, String(boardUI.showMoveDots));
  syncMoveDotsButton();
  renderBoard();
});
$("sel-color").addEventListener("change", newGame);
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
updateOpponentFideEstimate();
$("btn-force").addEventListener("click", () => {
  if (state.pendingMove) {
    const { from, to, promotion, cand } = state.pendingMove;
    commitUserMove({ from, to, promotion }, cand, true);
  }
});
$("btn-cancel").addEventListener("click", () => {
  state.pendingMove = null;
  state.phase = "userTurn";
  hideCoach();
  setStatus("À vous de jouer.");
});
$("btn-undo").addEventListener("click", () => {
  if (state.phase === "engineThinking" || state.phase === "analyzing") return;
  hideCoach();
  state.gen++;
  moveFeedback.clear();
  // Annule jusqu'à revenir au trait du joueur (1 ou 2 demi-coups)
  let undone = 0;
  while (undone < 2 && state.chess.history().length > 0) {
    state.chess.undo();
    state.fenHistory.pop();
    state.evalHistory.pop();
    undone++;
    if (state.chess.turn() === state.userColor) break;
  }
  if (state.stats.moves > 0) state.stats.moves--;
  state.moveGradeHistory = state.moveGradeHistory.filter((entry) => entry.ply <= state.chess.history().length);
  state.accuracy.pendingEngine = null;
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
    "Black", state.userColor === "b" ? "Joueur" : "Stockfish 19"
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
  state.fenHistory = [fenKey(state.chess.fen())];
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

