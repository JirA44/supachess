/* games.js — auto-enregistrement des parties dans localStorage + panneau "Parties".
   Clé: supachess_games, array {id, date, pgn, result, accuracyW, accuracyB, stats}.
   Mise à jour continue à chaque coup, finalisée au résultat. Rien à cliquer. */
"use strict";

const GAMES_KEY = "supachess_games";
let currentGameId = null;

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
    "White", state.userColor === "w" ? "Joueur" : "Stockfish 18",
    "Black", state.userColor === "b" ? "Joueur" : "Stockfish 18",
    "Result", result
  );
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

function gamesRenderPanel() {
  const wrap = document.getElementById("games-list");
  if (!wrap) return;
  const arr = gamesLoad().slice().reverse();
  if (!arr.length) { wrap.innerHTML = "<em>Aucune partie enregistrée.</em>"; return; }
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
