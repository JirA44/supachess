/* games.js — auto-enregistrement des parties dans localStorage + panneau "Parties".
   Clé: supachess_games, array {id, date, pgn, result, accuracyW, accuracyB, stats}.
   Mise à jour continue à chaque coup, finalisée au résultat. Rien à cliquer. */
"use strict";

const GAMES_KEY = "supachess_games";
let currentGameId = null;
let currentGameMetadata = {};

function gamesLoad() {
  try {
    const a = JSON.parse(localStorage.getItem(GAMES_KEY) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (_e) { return []; }
}

function gamesStore(arr) {
  try { localStorage.setItem(GAMES_KEY, JSON.stringify(arr)); } catch (_e) { /* quota */ }
}

function gamesNewEntry() {
  currentGameId = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  const manual = typeof isManualMode === "function" && isManualMode();
  const setting = !manual && typeof opponentElo === "function" ? opponentElo() : null;
  const thinkTime = !manual && typeof opponentThinkTime === "function" ? opponentThinkTime() : null;
  const estimate = Number.isFinite(setting) && setting > 0 && typeof estimateOpponentFideLikeElo === "function"
    ? estimateOpponentFideLikeElo(setting, thinkTime)
    : null;
  currentGameMetadata = {
    engineName: manual ? null : (state.engine && state.engine.engineName) || "Stockfish 19",
    userColor: state.userColor,
    stockfishRatingEstimate: Number.isFinite(estimate) ? estimate : null,
    stockfishRatingSource: Number.isFinite(estimate) ? "supachess-engine-setting-v1" : null,
    stockfishSettingElo: Number.isFinite(setting) && setting > 0 ? setting : null,
    engineThinkTimeMs: Number.isFinite(thinkTime) ? thinkTime : null,
  };
}

function gamesRound1(v) { return v === null || v === undefined ? null : Math.round(v * 10) / 10; }

function gamesResult() {
  const c = state.chess;
  if (c.in_checkmate()) return c.turn() === "w" ? "0-1" : "1-0";
  if (c.game_over()) return "1/2-1/2";
  return "*";
}

function gamesBuildPgn(result) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  state.chess.header(
    "Event", "SupaChess entraînement",
    "Site", "https://jira44.github.io/supachess/",
    "Date", `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
    "White", state.userColor === "w" ? "Joueur" : "Stockfish 19",
    "Black", state.userColor === "b" ? "Joueur" : "Stockfish 19",
    "Result", result
  );
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

/* Appelé après chaque coup (joueur + engine) et à la fin de partie. */
function gamesAutoSave() {
  if (!currentGameId) gamesNewEntry();
  if (state.chess.history().length === 0) return;
  const result = gamesResult();
  const entry = {
    id: currentGameId,
    date: new Date().toISOString(),
    pgn: gamesBuildPgn(result),
    result,
    accuracyW: gamesRound1(avgAccuracy(state.accuracy.w)),
    accuracyB: gamesRound1(avgAccuracy(state.accuracy.b)),
    stats: { ...state.stats },
    ...currentGameMetadata,
  };
  const arr = gamesLoad();
  const i = arr.findIndex((g) => g.id === currentGameId);
  if (i >= 0) arr[i] = entry; else arr.push(entry);
  gamesStore(arr);
  gamesRenderPanel();
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
  output.textContent = "Estimation provisoire : " + estimate.estimate + " FIDE-like · " +
    estimate.games + " parties terminées · niveau Stockfish moyen " + estimate.averageOpponentLevel +
    ". Indicateur relatif aux réglages de SupaChess, non calibré officiellement FIDE.";
}

function gamesRenderPanel() {
  const wrap = document.getElementById("games-list");
  if (!wrap) return;
  const arr = gamesLoad().slice().reverse();
  if (!arr.length) {
    wrap.innerHTML = "<em>Aucune partie enregistrée.</em>";
    gamesRenderStockfishEstimate();
    return;
  }
  wrap.innerHTML = arr.map((g) => {
    const d = new Date(g.date);
    const when = d.toLocaleDateString("fr-FR") + " " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const acc = (g.accuracyW != null ? g.accuracyW + "%" : "—") + " / " +
      (g.accuracyB != null ? g.accuracyB + "%" : "—");
    return `<div class="game-row" data-id="${esc(g.id)}">
      <span class="game-meta">${esc(when)} · <strong>${esc(g.result)}</strong> · préc. B/N ${esc(acc)}</span>
      <span class="game-actions">
        <button class="btn mini" data-act="dl" title="Télécharger le PGN">⬇ PGN</button>
        <button class="btn mini" data-act="analyse" title="Analyser avec Supa">Analyser</button>
        <button class="btn mini danger" data-act="del" title="Supprimer">✕</button>
      </span></div>`;
  }).join("");
  gamesRenderStockfishEstimate();
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

