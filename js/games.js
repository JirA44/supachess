/* games.js — auto-enregistrement des parties dans localStorage + panneau "Parties".
   Clé: supachess_games, array {id, date, pgn, result, accuracyW, accuracyB, stats}.
   Mise à jour continue à chaque coup, finalisée au résultat. Rien à cliquer. */
"use strict";

const GAMES_KEY = "supachess_games";
let currentGameId = null;
let currentGameMetadata = {};

const GAMES_SEQUENCE_KEY = "supachess_game_sequence_v1";

function gamesLoad() {
  try {
    const a = JSON.parse(localStorage.getItem(GAMES_KEY) || "[]");
    return Array.isArray(a) ? gamesEnsureGameNumbers(a) : [];
  } catch (_e) { return []; }
}

function gamesEnsureGameNumbers(games) {
  if (!Array.isArray(games)) return [];
  const used = new Set();
  let maxExisting = 0;
  let changed = false;
  for (const game of games) {
    if (!game || typeof game !== "object") continue;
    const number = Number(game.gameNumber);
    if (Number.isSafeInteger(number) && number > 0 && !used.has(number)) {
      used.add(number);
      maxExisting = Math.max(maxExisting, number);
    } else {
      game.gameNumber = null;
      changed = true;
    }
  }
  let sequence = 0;
  try { sequence = Math.max(0, Math.floor(Number(localStorage.getItem(GAMES_SEQUENCE_KEY)) || 0)); } catch (_) {}
  let next = Math.max(sequence, maxExisting);
  for (const game of games) {
    if (!game || typeof game !== "object" || Number.isSafeInteger(Number(game.gameNumber)) && Number(game.gameNumber) > 0) continue;
    game.gameNumber = ++next;
    changed = true;
  }
  if (next > sequence) {
    try { localStorage.setItem(GAMES_SEQUENCE_KEY, String(next)); } catch (_) {}
  }
  if (changed) gamesStore(games);
  return games;
}

function gamesNextNumber(games) {
  const list = Array.isArray(games) ? games : gamesLoad();
  const maxExisting = list.reduce((max, game) => {
    const number = Number(game && game.gameNumber);
    return Number.isSafeInteger(number) && number > max ? number : max;
  }, 0);
  let sequence = 0;
  try { sequence = Math.max(0, Math.floor(Number(localStorage.getItem(GAMES_SEQUENCE_KEY)) || 0)); } catch (_) {}
  const next = Math.max(sequence, maxExisting) + 1;
  try { localStorage.setItem(GAMES_SEQUENCE_KEY, String(next)); } catch (_) {}
  return next;
}

function gamesEnsureCurrentNumber() {
  const current = Number(currentGameMetadata && currentGameMetadata.gameNumber);
  if (Number.isSafeInteger(current) && current > 0) return current;
  currentGameMetadata.gameNumber = gamesNextNumber(gamesLoad());
  return currentGameMetadata.gameNumber;
}
window.gamesCurrentNumber = gamesEnsureCurrentNumber;

function gamesStore(arr) {
  try { localStorage.setItem(GAMES_KEY, JSON.stringify(arr)); } catch (_e) { /* quota */ }
}

function gamesCurrentPlayerName() {
  let user = null;
  try {
    const auth = window.firebase && typeof window.firebase.auth === "function" ? window.firebase.auth() : null;
    user = auth && auth.currentUser;
  } catch (_) {}
  const displayName = user && typeof user.displayName === "string" ? user.displayName.trim() : "";
  const emailName = user && typeof user.email === "string" ? user.email.split("@")[0].trim() : "";
  const rawName = displayName || emailName || "Joueur";
  return rawName.replace(/["\\\u0000-\u001f\u007f]/g, "").trim().slice(0, 80) || "Joueur";
}
window.gamesCurrentPlayerName = gamesCurrentPlayerName;

function gamesTrainingAidsActive() {
  const ui = typeof boardUI === "object" ? boardUI : {};
  const arrows = window.SupaAnalysisSettings && typeof window.SupaAnalysisSettings.showArrows === "function"
    ? window.SupaAnalysisSettings.showArrows() : null;
  return ui.showDots === true || ui.showMoveDots === true || arrows === true || window.SupaChessEvalBarVisible === true;
}

function gamesMarkTrainingAidUsed() {
  if (!currentGameMetadata || currentGameMetadata.trainingAidsUsed === true) return;
  currentGameMetadata.trainingAidsUsed = true;
  if (currentGameId && typeof state === "object" && state.chess && state.chess.history().length) gamesAutoSave();
}
window.gamesTrainingAidsActive = gamesTrainingAidsActive;
window.gamesMarkTrainingAidUsed = gamesMarkTrainingAidUsed;

function gamesDiagnosticModeActive() {
  try {
    const diagnostic = JSON.parse(localStorage.getItem("supachess-level-diagnostic") || "null");
    return Boolean(diagnostic && diagnostic.active);
  } catch (_) { return false; }
}

window.gamesMarkDiagnosticMode = function(active) {
  if (!active || !currentGameId || !currentGameMetadata ||
      !state || state.phase === "init" || state.phase === "gameover") return;
  currentGameMetadata.diagnosticMode = true;
  currentGameMetadata.unassistedMode = true;
  // Keep any aid use already recorded before diagnostics was activated.
  if (gamesTrainingAidsActive()) currentGameMetadata.trainingAidsUsed = true;
  gamesAutoSave();
};

function gamesNewEntry() {
  currentGameId = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  const gameNumber = gamesNextNumber(gamesLoad());
  const diagnosticMode = gamesDiagnosticModeActive();
  const manual = typeof isManualMode === "function" && isManualMode();
  const setting = !manual && typeof opponentElo === "function" ? opponentElo() : null;
  const thinkTime = !manual && typeof opponentThinkTime === "function" ? opponentThinkTime() : null;
  const hasEngineSetting = !manual && Number.isFinite(setting);
  const estimate = hasEngineSetting && typeof estimateOpponentFideLikeElo === "function"
    ? estimateOpponentFideLikeElo(setting, thinkTime)
    : null;
  currentGameMetadata = {
    engineName: manual ? null : (state.engine && state.engine.engineName) || "Stockfish 19",
    manualMode: manual,
    clockMs: { ...(state.clockMs || { w: 0, b: 0 }) },
    userColor: state.userColor,
    playerName: gamesCurrentPlayerName(),
    gameNumber,
    stockfishRatingEstimate: Number.isFinite(estimate) ? estimate : null,
    stockfishRatingSource: Number.isFinite(estimate) ? "supachess-engine-setting-v1" : null,
    stockfishSettingElo: hasEngineSetting ? setting : null,
    engineThinkTimeMs: Number.isFinite(thinkTime) ? thinkTime : null,
    trainingAidsUsed: diagnosticMode ? false : gamesTrainingAidsActive(),
    unassistedMode: diagnosticMode || Boolean(state.unassistedGame),
    diagnosticMode,
  };
}

function gamesRound1(v) { return v === null || v === undefined ? null : Math.round(v * 10) / 10; }

function gamesPgnTag(game, name) {
  const pgn = String(game && game.pgn || "");
  const match = pgn.match(new RegExp("^\\[" + name + '\\s+"([^"]*)"\\]', "m"));
  return match ? match[1] : "";
}

function gamesHalfMoveCount(game) {
  let pgn = String(game && game.pgn || "");
  pgn = pgn.replace(/^\s*\[[^\]]*\]\s*$/gm, "");
  pgn = pgn.replace(/\{[^}]*\}/g, "").replace(/;[^\n]*/g, "");
  let previous;
  do {
    previous = pgn;
    pgn = pgn.replace(/\([^()]*\)/g, " ");
  } while (pgn !== previous);
  const tokens = pgn.replace(/\$\d+/g, " ").split(/\s+/).filter(Boolean);
  let count = 0;
  for (const token of tokens) {
    if (/^\d+\.(?:\.\.)?$/.test(token) || /^(?:1-0|0-1|1\/2-1\/2|\*)$/.test(token) || /^(?:e\.p\.|\u00bd)$/i.test(token)) continue;
    if (/^[!?+#]+$/.test(token)) continue;
    if (/^(?:O-O(?:-O)?|0-0(?:-0)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?)[!?+#]*$/.test(token)) count++;
  }
  return count;
}

function gamesNumericValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function gamesGameSettings(game) {
  const setting = gamesNumericValue(game && game.stockfishSettingElo) ??
    gamesNumericValue(gamesPgnTag(game, "SupaChessEngineSetting"));
  const thinkTime = gamesNumericValue(game && game.engineThinkTimeMs) ??
    gamesNumericValue(gamesPgnTag(game, "SupaChessEngineThinkTimeMs"));
  return { setting, thinkTime };
}

function gamesOpponentColor(game) {
  let userColor = game && game.userColor;
  if (!["w", "b"].includes(userColor)) userColor = gamesPgnTag(game, "SupaChessUserColor");
  if (!["w", "b"].includes(userColor)) {
    const white = gamesPgnTag(game, "White");
    const black = gamesPgnTag(game, "Black");
    if (/joueur|player/i.test(white)) userColor = "w";
    else if (/joueur|player/i.test(black)) userColor = "b";
  }
  return userColor === "w" ? "b" : userColor === "b" ? "w" : null;
}

function gamesIsCompleted(game) {
  return Boolean(game && !game.stopped && game.result && ["1-0", "0-1", "1/2-1/2"].includes(game.result));
}

function gamesOpponentAccuracySummary(games, setting, thinkTime) {
  const values = (Array.isArray(games) ? games : []).filter((game) => {
    if (!gamesIsCompleted(game) || !/stockfish/i.test(String(game.engineName || gamesPgnTag(game, "SupaChessOpponent")))) return false;
    const config = gamesGameSettings(game);
    return config.setting === setting && config.thinkTime === thinkTime;
  }).map((game) => {
    const color = gamesOpponentColor(game);
    return color === "w" ? gamesNumericValue(game.accuracyW) : color === "b" ? gamesNumericValue(game.accuracyB) : null;
  }).filter((value) => value !== null && value >= 0 && value <= 100);
  if (!values.length) return null;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    games: values.length,
    average,
    min: Math.min(...values),
    max: Math.max(...values),
    meanAbsoluteDeviation: values.reduce((sum, value) => sum + Math.abs(value - average), 0) / values.length,
  };
}

function gamesEngineRowDetails(game) {
  const name = String(game && (game.engineName || gamesPgnTag(game, "SupaChessOpponent")) || "");
  if (!/stockfish/i.test(name)) return "";
  const color = gamesOpponentColor(game);
  const config = gamesGameSettings(game);
  const storedEstimate = gamesNumericValue(game.stockfishRatingEstimate) ??
    gamesNumericValue(gamesPgnTag(game, "SupaChessOpponentRatingEstimate"));
  const thinkLabel = config.thinkTime !== null
    ? (config.thinkTime / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " s"
    : "";
  const engineAccuracy = color === "w" ? gamesNumericValue(game.accuracyW) : color === "b" ? gamesNumericValue(game.accuracyB) : null;
  const ratingLabel = storedEstimate !== null
    ? "≈ " + storedEstimate.toLocaleString("fr-FR") + " Elo-like"
    : config.setting !== null
      ? "réglage moteur UCI " + (config.setting === 0 ? "pleine puissance" : config.setting.toLocaleString("fr-FR"))
      : "";
  const details = [
    "Moteur " + (color === "w" ? "B" : color === "b" ? "N" : "?"),
    name,
    ratingLabel,
    config.setting !== null ? "réglage UCI " + (config.setting === 0 ? "pleine puissance" : config.setting.toLocaleString("fr-FR")) : "",
    thinkLabel,
    engineAccuracy !== null ? "précision " + engineAccuracy.toLocaleString("fr-FR") + "%" : "",
  ].filter(Boolean);
  return details.join(" · ");
}


function gamesResult() {
  if (state.abandoned) return state.userColor === "w" ? "0-1" : "1-0";
  if (state.stopped) return "*";
  if (state.timeExpiredColor) return state.timeExpiredColor === "w" ? "0-1" : "1-0";
  const c = state.chess;
  if (c.in_checkmate()) return c.turn() === "w" ? "0-1" : "1-0";
  if (c.game_over()) return "1/2-1/2";
  return "*";
}

function gamesBuildPgn(result) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const gameNumber = gamesEnsureCurrentNumber();
  const detectedPlayerName = gamesCurrentPlayerName();
  if (detectedPlayerName !== "Joueur" || !currentGameMetadata.playerName) {
    currentGameMetadata.playerName = detectedPlayerName;
  }
  const playerName = currentGameMetadata.playerName || "Joueur";
  state.chess.header(
    "Event", "SupaChess entraînement",
    "Site", "https://jira44.github.io/supachess/",
    "Date", `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
    "White", state.userColor === "w" ? playerName : "Stockfish 19",
    "Black", state.userColor === "b" ? playerName : "Stockfish 19",
    "SupaChessPlayerName", playerName,
    "SupaChessGameNumber", String(gameNumber),
    "Result", result
  );
  if (state.abandoned) state.chess.header("Termination", "abandoned");
  else if (state.stopped) state.chess.header("Termination", "unterminated");
  else if (state.timeExpiredColor) state.chess.header("Termination", "time forfeit");
  if (currentGameMetadata.clockMs) {
    state.chess.header(
      "SupaChessClockWhiteMs", String(Number(currentGameMetadata.clockMs.w) || 0),
      "SupaChessClockBlackMs", String(Number(currentGameMetadata.clockMs.b) || 0)
    );
    if (currentGameMetadata.clockMs.w === currentGameMetadata.clockMs.b) {
      state.chess.header("TimeControl", Number(currentGameMetadata.clockMs.w) > 0
        ? String(Math.round(currentGameMetadata.clockMs.w / 1000)) + "+0" : "-");
    }
  }
  state.chess.header("SupaChessTrainingAidsUsed", currentGameMetadata.trainingAidsUsed ? "true" : "false");
  state.chess.header("SupaChessUnassistedMode", currentGameMetadata.unassistedMode ? "true" : "false");
  state.chess.header("SupaChessDiagnosticMode", currentGameMetadata.diagnosticMode ? "true" : "false");
  if (currentGameMetadata.engineName) {
    const customHeaders = [
      "SupaChessOpponent", currentGameMetadata.engineName,
      "SupaChessUserColor", currentGameMetadata.userColor || "",
      "SupaChessOpponentRatingEstimate", currentGameMetadata.stockfishRatingEstimate == null ? "" : String(currentGameMetadata.stockfishRatingEstimate),
      "SupaChessRatingSource", currentGameMetadata.stockfishRatingSource || "",
      "SupaChessEngineSetting", currentGameMetadata.stockfishSettingElo == null ? "" : String(currentGameMetadata.stockfishSettingElo),
      "SupaChessEngineThinkTimeMs", currentGameMetadata.engineThinkTimeMs == null ? "" : String(currentGameMetadata.engineThinkTimeMs),
    ];
    state.chess.header(...customHeaders);
  }
  return state.chess.pgn();
}

function gamesSubmitTimedRanking(entry) {
  if (!entry || currentGameMetadata.rankingSubmitted || state.phase !== "gameover" ||
      state.abandoned || state.stopped || entry.result === "*" ||
      currentGameMetadata.manualMode || currentGameMetadata.trainingAidsUsed !== false) return;
  const clocks = currentGameMetadata.clockMs || {};
  if (Number(clocks.w) !== Number(clocks.b)) return;
  const minutes = Number(clocks.w) / 60000;
  const typeByMinutes = { 0: "classicUnlimited", 1: "classic1m", 3: "classic3m", 5: "classic5m" };
  const gameType = typeByMinutes[minutes];
  if (!gameType || !(state.chess.game_over() || state.timeExpiredColor)) return;
  let auth = null;
  try { auth = window.firebase && window.firebase.auth ? window.firebase.auth() : null; } catch (_) {}
  const user = auth && auth.currentUser;
  if (!user || !window.SupaProfiles || typeof window.SupaProfiles.recordTimedGame !== "function") return;
  let outcome;
  const result = entry.result;
  const userWon = (result === "1-0" && state.userColor === "w") || (result === "0-1" && state.userColor === "b");
  if (result === "1/2-1/2") outcome = "draw";
  else outcome = userWon ? "win" : "loss";
  currentGameMetadata.rankingSubmitted = true;
  const opponentRating = Number(currentGameMetadata.stockfishRatingEstimate) ||
    (Number(currentGameMetadata.stockfishSettingElo) || 1600);
  Promise.resolve(window.SupaProfiles.recordTimedGame(user.uid, gameType, outcome, opponentRating))
    .catch(() => {});
}

/* Appelé après chaque coup (joueur + engine) et à la fin de partie. */
function gamesAutoSave() {
  if (!currentGameId) gamesNewEntry();
  if (state.chess.history().length === 0 && !state.abandoned && !state.stopped) return;
  const result = gamesResult();
  const entry = {
    id: currentGameId,
    date: new Date().toISOString(),
    pgn: gamesBuildPgn(result),
    result,
    abandoned: Boolean(state.abandoned),
    stopped: Boolean(state.stopped),
    termination: state.abandoned ? "abandoned" : state.stopped ? "unterminated" : state.timeExpiredColor ? "time-forfeit" : null,
    timeExpiredColor: state.timeExpiredColor || null,
    timeControlMs: { ...(currentGameMetadata.clockMs || { w: 0, b: 0 }) },
    accuracyW: gamesRound1(avgAccuracy(state.accuracy.w)),
    accuracyB: gamesRound1(avgAccuracy(state.accuracy.b)),
    stats: { ...state.stats },
    moveGrades: Array.isArray(state.moveGradeHistory) ? state.moveGradeHistory.map((grade) => ({ ...grade })) : [],
    ...currentGameMetadata,
    unassistedMode: Boolean(currentGameMetadata.unassistedMode || state.unassistedGame),
  };
  const arr = gamesLoad();
  const i = arr.findIndex((g) => g.id === currentGameId);
  if (i >= 0) arr[i] = entry; else arr.push(entry);
  gamesStore(arr);
  gamesRenderPanel();
  gamesSubmitTimedRanking(entry);
}

function gamesDownload(name, content) {
  const blob = new Blob([content], { type: "application/x-chess-pgn" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function gamesRenderStockfishEstimate() {
  const list = document.getElementById("games-list");
  if (!list) return;
  let panel = document.getElementById("stockfish-performance-estimate");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "stockfish-performance-estimate";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = "<h3>Repère de niveau contre Stockfish</h3><p data-stockfish-performance-status></p>";
    panel.style.cssText = "margin:10px 0;padding:12px;border:1px solid #4b9a67;border-radius:8px;background:rgba(60,155,99,.1)";
    const heading = panel.querySelector("h3");
    heading.style.cssText = "margin:0 0 6px;color:#7bd394";
    list.insertAdjacentElement("afterend", panel);
  }
  const output = panel.querySelector("[data-stockfish-performance-status]");
  const estimate = typeof ReviewInsights !== "undefined" && typeof ReviewInsights.stockfishPerformanceEstimate === "function"
    ? ReviewInsights.stockfishPerformanceEstimate(gamesLoad())
    : null;
  if (!estimate || estimate.status === "insufficient_games") {
    const count = estimate ? estimate.games : 0;
    output.textContent = "Parties terminées admissibles : " + count + "/10. Joue et termine au moins 10 parties contre un niveau Stockfish réglé; 20 donnent un premier suivi plus utile.";
    return;
  }
  output.textContent = "Estimation provisoire : " + estimate.estimate.toLocaleString("fr-FR") + " FIDE-like · " +
    estimate.games.toLocaleString("fr-FR") + " parties terminées · niveau Stockfish moyen " + estimate.averageOpponentLevel.toLocaleString("fr-FR") +
    ". Indicateur relatif aux réglages de SupaChess, non calibré officiellement FIDE.";
}

function gamesAcplDetailsForPgn(pgn) {
  const normalize = (value) => String(value || "").replace(/\r\n?/g, "\n").trim();
  let reviewed = null;
  try {
    const saved = JSON.parse(localStorage.getItem("supachess_reviewed_pgns") || "[]");
    if (Array.isArray(saved)) reviewed = saved.find((item) => normalize(item && item.pgn) === normalize(pgn)) || null;
  } catch (_) {}
  const grades = reviewed && Array.isArray(reviewed.moveGrades) ? reviewed.moveGrades : [];
  const average = (color) => {
    const values = grades.filter((grade) => grade && grade.color === color &&
      grade.lossCp !== null && grade.lossCp !== undefined && Number.isFinite(Number(grade.lossCp)))
      .map((grade) => Number(grade.lossCp));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  const white = average("w");
  const black = average("b");
  const format = (value) => value === null ? "—" : value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const gap = white === null || black === null ? null : Math.abs(white - black);
  const advantage = gap === null || gap === 0 ? "" : " (" + (white < black ? "Blancs" : "Noirs") + " plus précis)";
  return " · ACPL B/N : " + format(white) + " / " + format(black) + " cp · écart : " + format(gap) + " cp" + advantage;
}
window.gamesAcplDetailsForPgn = gamesAcplDetailsForPgn;
function gamesRenderPanel() {
  const wrap = document.getElementById("games-list");
  if (!wrap) return;
  const arr = gamesLoad().slice().reverse();
  if (!arr.length) {
    wrap.innerHTML = "<em>Aucune partie enregistrée.</em>";
    gamesRenderStockfishEstimate();
    if (typeof updateOpponentFideEstimate === "function") updateOpponentFideEstimate();
    return;
  }
  wrap.innerHTML = arr.map((g, index) => {
    const d = new Date(g.date);
    const when = d.toLocaleDateString("fr-FR") + " " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const acc = (g.accuracyW != null ? g.accuracyW + "%" : "—") + " / " +
      (g.accuracyB != null ? g.accuracyB + "%" : "—");
    const gap = Number.isFinite(g.accuracyW) && Number.isFinite(g.accuracyB)
      ? Math.abs(g.accuracyW - g.accuracyB) : null;
    const gapLabel = gap === null ? "" : ` · écart ${gap.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} % (${g.accuracyW === g.accuracyB ? "égalité" : "en faveur des " + (g.accuracyW > g.accuracyB ? "Blancs" : "Noirs")})`;
    const resultLabel = g.abandoned ? "Défaite par abandon" : g.stopped ? "Arrêtée — sans résultat" : g.result;
    const aidLabel = g.trainingAidsUsed === false ? "Sans aides" :
      g.trainingAidsUsed === true ? "Avec aides" : "Aides non vérifiées";
    const aidColor = g.trainingAidsUsed === false ? "#8fe3a2" :
      g.trainingAidsUsed === true ? "#ffb38a" : "#c2c9d2";
    const gameNumber = Number.isSafeInteger(Number(g.gameNumber)) && Number(g.gameNumber) > 0 ? Number(g.gameNumber) : index + 1;
    const engineDetails = gamesEngineRowDetails(g);
    const halfMoveCount = gamesHalfMoveCount(g);
    return `<div class="game-row" data-id="${esc(g.id)}">
      <span class="game-meta">Partie n°${gameNumber} · ${esc(when)} · <strong>${esc(resultLabel)}</strong> · ${halfMoveCount} demi-coup${halfMoveCount > 1 ? "s" : ""} · <strong class="game-aid-label" style="color:${aidColor}">${aidLabel}</strong> · préc. B/N ${esc(acc)}${esc(gapLabel)}${esc(gamesAcplDetailsForPgn(g.pgn))}${engineDetails ? `<small class="game-engine-details">${esc(engineDetails)}</small>` : ""}</span>
      <span class="game-actions">
        <button class="btn mini" data-act="correct" title="Aller à la première erreur à corriger">Corriger</button>
        <button class="btn mini" data-act="dl" title="Télécharger le PGN">⬇ PGN</button>
        <button class="btn mini" data-act="analyse" title="Analyser avec Supa">Analyser</button>
        <button class="btn mini danger" data-act="del" title="Supprimer">✕</button>
      </span></div>`;
  }).join("");
  if (typeof reviewRefreshCorrectionHotkeys === "function") reviewRefreshCorrectionHotkeys();
  gamesRenderStockfishEstimate();
  if (typeof updateOpponentFideEstimate === "function") updateOpponentFideEstimate();
}

document.getElementById("games-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const row = btn.closest(".game-row");
  const id = row && row.dataset.id;
  const game = gamesLoad().find((g) => g.id === id);
  if (!game) return;
  const act = btn.dataset.act;
  if (act === "dl") {
    gamesDownload(`supachess_${id}.pgn`, game.pgn);
  } else if (act === "analyse") {
    if (typeof reviewStart === "function") reviewStart(game.pgn);
  } else if (act === "correct") {
    if (typeof reviewCorrectPgn === "function") reviewCorrectPgn(game.pgn);
  } else if (act === "del") {
    gamesStore(gamesLoad().filter((g) => g.id !== id));
    gamesRenderPanel();
  }
});

document.getElementById("btn-export-all").addEventListener("click", () => {
  const arr = gamesLoad();
  if (!arr.length) { alert("Aucune partie enregistrée."); return; }
  gamesDownload("supachess_toutes_parties.pgn", arr.map((g) => g.pgn).join("\n\n"));
});

gamesRenderPanel();

