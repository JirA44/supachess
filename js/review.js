/* review.js — analyse complète d'un PGN collé : Stockfish coup par coup
   (multipv 2, movetime 400), classification (?! ≥0.3, ? ≥0.6, ?? ≥2.0),
   précision par joueur, bilan pédagogique via supa_coach_server POST /review
   (fallback : bilan local SF si supa offline), puis relecture ◀ ▶. */
"use strict";

const REVIEW_BASE = "http://localhost:8778";
const REVIEW_TIMEOUT_MS = 150000;

const reviewState = { fens: [], moves: [], running: false };

function reviewShowModal(pgn) {
  document.getElementById("pgn-modal").classList.remove("hidden");
  if (pgn) document.getElementById("pgn-input").value = pgn;
}
function reviewHideModal() {
  document.getElementById("pgn-modal").classList.add("hidden");
}

/* Point d'entrée (bouton "Analyser PGN (Supa)" ou panneau Parties). */
function reviewStart(pgn) {
  reviewShowModal(pgn || "");
}

function reviewSetProgress(txt) {
  const el = document.getElementById("review-progress");
  if (el) el.textContent = txt;
}

function reviewTagOf(delta) {
  if (delta >= 2.0) return "??";
  if (delta >= 0.6) return "?";
  if (delta >= 0.3) return "?!";
  return "";
}

async function reviewRun() {
  if (reviewState.running) return;
  const pgnText = document.getElementById("pgn-input").value.trim();
  if (!pgnText) { alert("Collez un PGN d'abord."); return; }
  const game = new Chess();
  const loadFn = game.load_pgn ? "load_pgn" : "loadPgn";
  if (!game[loadFn](pgnText, { sloppy: true })) { alert("PGN invalide ou illisible."); return; }
  const moves = game.history({ verbose: true });
  if (!moves.length) { alert("Aucun coup dans ce PGN."); return; }
  const headers = typeof game.header === "function" ? game.header() : {};

  reviewState.running = true;
  reviewHideModal();
  const panel = document.getElementById("review-panel");
  panel.classList.remove("hidden");
  document.getElementById("review-report").innerHTML = "";
  document.getElementById("btn-replay-game").classList.add("hidden");

  // Rejouer pour obtenir toutes les positions (gère [FEN] de départ).
  const startFen = headers.FEN || undefined;
  const c = startFen ? new Chess(startFen) : new Chess();
  const fens = [c.fen()];
  for (const m of moves) { c.move(m.san); fens.push(c.fen()); }

  // Analyse SF de chaque position (score POV trait).
  const cps = [];
  try {
    for (let i = 0; i < fens.length; i++) {
      reviewSetProgress(`Analyse Stockfish… coup ${Math.min(i + 1, moves.length)}/${moves.length}`);
      const tmp = new Chess(fens[i]);
      if (tmp.game_over()) { cps.push(tmp.in_checkmate() ? -1000 : 0); continue; }
      const res = await state.engine.analyze({ fen: fens[i], multipv: 2, movetime: 400, elo: 0 });
      cps.push(res.lines.length ? clampCpFromLine(res.lines[0]) : 0);
    }
  } catch (e) {
    reviewSetProgress("Erreur d'analyse : " + e);
    reviewState.running = false;
    return;
  }

  // Deltas par coup + précision par joueur.
  const rows = [];
  const accs = { w: [], b: [] };
  for (let i = 0; i < moves.length; i++) {
    const before = cps[i];
    const after = -cps[i + 1];
    const delta = Math.max(0, (before - after)) / 100;
    accs[moves[i].color].push(moveAccuracyPct(before, after));
    rows.push({
      n: Math.floor(i / 2) + 1,
      color: moves[i].color,
      san: moves[i].san,
      delta: +delta.toFixed(2),
      tag: reviewTagOf(delta),
    });
  }
  const r1 = (v) => (v === null ? null : Math.round(v * 10) / 10);
  const accW = r1(avgAccuracy(accs.w));
  const accB = r1(avgAccuracy(accs.b));

  reviewState.fens = fens;
  reviewState.moves = moves;
  reviewSetProgress("Analyse Stockfish terminée — bilan en cours…");
  reviewRenderLocal(rows, accW, accB, headers);
  document.getElementById("btn-replay-game").classList.remove("hidden");

  // Bilan pédagogique Supa (best-effort).
  await reviewAskSupa(rows, accW, accB, headers);
  reviewState.running = false;
}

function reviewCount(rows, color, tag) {
  return rows.filter((r) => r.color === color && r.tag === tag).length;
}

function reviewRenderLocal(rows, accW, accB, headers) {
  const worst = rows.filter((r) => r.tag).sort((a, b) => b.delta - a.delta).slice(0, 6);
  const moveLabel = (r) => `${r.n}.${r.color === "b" ? ".." : ""} ${sanFr(r.san)} ${r.tag} (−${r.delta.toFixed(2)})`;
  const line = (col, label) =>
    `<tr><td>${label}</td><td>${col === "w" ? (accW ?? "—") : (accB ?? "—")}%</td>` +
    `<td>${reviewCount(rows, col, "?!")}</td><td>${reviewCount(rows, col, "?")}</td>` +
    `<td>${reviewCount(rows, col, "??")}</td></tr>`;
  document.getElementById("review-report").innerHTML = `
    <div class="review-local">
      <h3>Bilan Stockfish (local)</h3>
      <div class="review-meta">${esc(headers.White || "Blancs")} vs ${esc(headers.Black || "Noirs")} — ${esc(headers.Result || "*")}</div>
      <table class="stats-table"><thead><tr><th></th><th>Précision</th><th>?!</th><th>?</th><th>??</th></tr></thead>
      <tbody>${line("w", "Blancs")}${line("b", "Noirs")}</tbody></table>
      ${worst.length ? `<div class="review-worst"><strong>Moments clés :</strong> ${worst.map(moveLabel).map(esc).join(" · ")}</div>`
        : "<div class='review-worst'>Aucune erreur notable détectée.</div>"}
    </div>
    <div id="review-supa"></div>`;
}

async function reviewAskSupa(rows, accW, accB, headers) {
  const payload = {
    white: headers.White || "Blancs",
    black: headers.Black || "Noirs",
    result: headers.Result || "*",
    accuracy_w: accW,
    accuracy_b: accB,
    moves: rows,
  };
  let resp;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), REVIEW_TIMEOUT_MS);
    const r = await fetch(REVIEW_BASE + "/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    resp = await r.json();
  } catch (_e) {
    reviewSetProgress("Bilan Supa indisponible (hors-ligne) — bilan local affiché.");
    return;
  }
  const rep = resp && resp.report;
  const box = document.getElementById("review-supa");
  if (!rep || !box) {
    reviewSetProgress("Bilan Supa indisponible — bilan local affiché.");
    return;
  }
  const list = (title, arr) => (Array.isArray(arr) && arr.length)
    ? `<h4>${title}</h4><ul>${arr.map((x) => `<li>${esc(String(x))}</li>`).join("")}</ul>` : "";
  box.innerHTML = `<div class="supa-section"><div class="supa-head">🤖 Bilan Supa <span class="supa-model">${esc(resp.source || "")}</span></div>` +
    (typeof rep === "string" ? `<p>${esc(rep)}</p>`
      : list("Points forts", rep.points_forts) + list("Erreurs récurrentes", rep.erreurs) + list("Conseils de progression", rep.conseils)) +
    "</div>";
  reviewSetProgress("Analyse terminée.");
}

/* ── Relecture de la partie analysée ── */
async function replayGoto(i) {
  if (!reviewState.fens.length) return;
  const idx = Math.max(0, Math.min(reviewState.fens.length - 1, i));
  state.replayIdx = idx;
  state.chess = new Chess(reviewState.fens[idx]);
  state.fenHistory = [fenKey(state.chess.fen())];
  state.candidates = [];
  state.accuracy.pendingEngine = null;
  state.pendingMove = null;
  boardUI.lastMove = null;
  boardUI.dots = [];
  boardUI.selected = null;
  boardUI.legalTargets = [];
  hideCoach();
  state.userColor = state.chess.turn(); // dots/candidats du côté au trait
  document.getElementById("replay-label").textContent =
    `Coup ${idx}/${reviewState.fens.length - 1}`;
  renderAll();
  await analyzeForUser(); // recalcul dots + candidats à chaque position
}

document.getElementById("btn-analyze-pgn").addEventListener("click", () => reviewStart(""));
document.getElementById("btn-run-review").addEventListener("click", () => { reviewRun().catch(console.error); });
document.getElementById("btn-close-pgn").addEventListener("click", reviewHideModal);
document.getElementById("btn-replay-game").addEventListener("click", () => {
  document.getElementById("replay-bar").classList.remove("hidden");
  replayGoto(0).catch(console.error);
});
document.getElementById("btn-replay-prev").addEventListener("click", () => replayGoto((state.replayIdx || 0) - 1).catch(console.error));
document.getElementById("btn-replay-next").addEventListener("click", () => replayGoto((state.replayIdx || 0) + 1).catch(console.error));
document.getElementById("btn-replay-quit").addEventListener("click", () => {
  document.getElementById("replay-bar").classList.add("hidden");
  document.getElementById("review-panel").classList.add("hidden");
  state.userColor = document.getElementById("sel-color").value;
  newGame();
});
