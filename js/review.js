/* review.js — analyse complète d'un PGN collé : Stockfish coup par coup
   (multipv 2, movetime 400), classification (?! ≥0.3, ? ≥0.6, ?? ≥2.0),
   précision par joueur, bilan pédagogique via supa_coach_server POST /review
   (fallback : bilan local SF si supa offline), puis relecture ◀ ▶. */
"use strict";

const REVIEW_BASE = "http://localhost:8778";
const REVIEW_TIMEOUT_MS = 150000;
const REVIEW_MOVE_CLASSES = [
  { id: "brilliant", symbol: "!!", label: "Brillant" },
  { id: "best", symbol: "★", label: "Meilleur coup" },
  { id: "very-good", symbol: "!", label: "Très bon coup" },
  { id: "good", symbol: "✓", label: "Bon coup" },
  { id: "ok", symbol: "=", label: "Coup OK" },
  { id: "inaccuracy", symbol: "?!", label: "Imprécision" },
  { id: "mistake", symbol: "?", label: "Erreur" },
  { id: "blunder", symbol: "??", label: "Gaffe" },
  { id: "unrated", symbol: "…", label: "Non évalué" },
];

const reviewState = { fens: [], moves: [], grades: [], running: false, returnState: null };

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

function reviewClassOf(row, grade = {}) {
  if (!Number.isFinite(row.lossCp)) return "unrated";
  if (row.lossCp >= 200) return "blunder";
  if (row.lossCp >= 60) return "mistake";
  if (row.lossCp >= 30) return "inaccuracy";
  if (grade.brilliant && row.lossCp <= 10) return "brilliant";
  if (row.bestMove && row.lossCp <= 10) return "best";
  if (row.lossCp <= 10) return "very-good";
  if (row.lossCp <= 20) return "good";
  return "ok";
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
  const positionLines = [];
  try {
    for (let i = 0; i < fens.length; i++) {
      reviewSetProgress(`Analyse Stockfish… coup ${Math.min(i + 1, moves.length)}/${moves.length}`);
      const tmp = new Chess(fens[i]);
      if (tmp.game_over()) { cps.push(tmp.in_checkmate() ? -1000 : 0); positionLines.push(null); continue; }
      const res = await state.engine.analyze({ fen: fens[i], multipv: 2, movetime: 400, elo: 0 });
      cps.push(res.lines.length ? clampCpFromLine(res.lines[0]) : 0);
      positionLines.push(res.lines[0] || null);
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
    const next = new Chess(fens[i + 1]);
    const beforeValue = positionLines[i] ? scoreValue(positionLines[i]) : before;
    const replyValue = positionLines[i + 1] ? scoreValue(positionLines[i + 1]) :
      (next.in_checkmate() ? -100000 : cps[i + 1]);
    const delta = Math.max(0, beforeValue + replyValue) / 100;
    // Accuracy is not inferred from mate/unknown centipawn scores.
    // Retain only scores with fully comparable CP evaluations.

    const uciMove = moves[i].from + moves[i].to + (moves[i].promotion || "");
    const bestMove = positionLines[i]?.pv?.[0] === uciMove;
    const blindspot = typeof ChessBlindspots !== "undefined"
      ? ChessBlindspots.tacticalMisses(fens[i], uciMove, { lossCp: delta * 100 }) : null;
    const cpEvidence = typeof SupaChessCentipawns !== "undefined"
      ? SupaChessCentipawns.explain({
          fenBefore:fens[i],fenAfter:fens[i+1],uci:uciMove,
          bestBefore:positionLines[i],bestAfter:positionLines[i+1],
          captureFacts:blindspot && blindspot.status === "OK" ? blindspot.facts : []
        }) : null;
    const verifiedLossCp = cpEvidence && cpEvidence.status === "OK" ? cpEvidence.lossCp : null;
    const displayDelta = verifiedLossCp === null ? null : verifiedLossCp / 100;
    if (verifiedLossCp !== null) accs[moves[i].color].push(moveAccuracyPct(before, after));
    rows.push({
      n: Math.floor(i / 2) + 1,
      color: moves[i].color,
      san: moves[i].san,
      bestMove,
      delta: displayDelta === null ? null : +displayDelta.toFixed(2),
      tag: displayDelta === null ? "" : reviewTagOf(displayDelta),
      diagnostics: blindspot && blindspot.status === "OK" ? blindspot.diagnostics : [],
      centipawns: cpEvidence,
      lossCp: verifiedLossCp,
    });
  }
  const r1 = (v) => (v === null ? null : Math.round(v * 10) / 10);
  const accW = r1(avgAccuracy(accs.w));
  const accB = r1(avgAccuracy(accs.b));

  reviewState.fens = fens;
  reviewState.moves = moves;
  reviewState.grades = rows.map((row, i) => {
    const reply = positionLines[i + 1];
    const move = moves[i];
    const uci = move.from + move.to + (move.promotion || "");
    const cand = { deltaCp: row.lossCp, line: reply ? { ...reply, pv: [uci, ...reply.pv] } : null };
    const eligible = Number.isFinite(cand.deltaCp);
    return { deltaCp: eligible ? cand.deltaCp : null, brilliant: eligible ? isBrilliantCandidate(fens[i], cand) : false };
  });
  rows.forEach((row, i) => { row.classification = reviewClassOf(row, reviewState.grades[i]); });
  reviewSetProgress("Analyse Stockfish terminée — bilan en cours…");
  reviewRenderLocal(rows, accW, accB, headers);
  document.getElementById("btn-replay-game").classList.remove("hidden");

  // Bilan pédagogique Supa (best-effort).
  await reviewAskSupa(rows, accW, accB, headers);
  reviewState.running = false;
}

function reviewCount(rows, color, tag) {
  return rows.filter((r) => r.color === color && r.classification === tag).length;
}

function reviewRenderLocal(rows, accW, accB, headers) {
  rows.forEach((row, i) => {
    row.classification = reviewClassOf(row, reviewState.grades[i]);
    row.ply = i + 1;
  });
  const worst = rows.filter((r) => r.tag).sort((a, b) => b.delta - a.delta).slice(0, 6);
  const moveLabel = (r) => `${r.n}.${r.color === "b" ? ".." : ""} ${sanFr(r.san)} ${r.tag} (${Number.isFinite(r.delta) ? "−" + r.delta.toFixed(2) : "non chiffrable"})`;
  const moveButton = (row) => {
    const heading = `${row.n}${row.color === "w" ? "." : "..."} ${sanFr(row.san)}`;
    return `<li class="review-ply" data-review-ply="${row.ply}"><button type="button" class="review-ply-link" data-review-ply="${row.ply}" aria-label="Aller à la position après ${esc(heading)}">${esc(heading)}</button></li>`;
  };
  const playerCard = (color, name, accuracy) => `<section class="review-player-card review-player-${color}">
    <div class="review-player-head"><h4>${esc(name)}</h4><strong class="review-player-accuracy">${Number.isFinite(accuracy) ? `${accuracy}%` : "—"}</strong></div>
    <div class="review-grade-list">${REVIEW_MOVE_CLASSES.map((category) => {
      const moves = rows.filter((row) => row.color === color && row.classification === category.id);
      const count = reviewCount(rows, color, category.id);
      const moveList = moves.length
        ? `<details class="review-grade-moves"><summary>${moves.length} coup${moves.length === 1 ? "" : "s"}</summary><ol>${moves.map(moveButton).join("")}</ol></details>`
        : "";
      return `<div class="review-grade-row review-grade-${category.id}" title="${category.label}"><span class="review-grade-symbol" aria-hidden="true">${category.symbol}</span><span class="review-grade-label">${category.label}</span><span class="review-grade-count">${count}</span>${moveList}</div>`;
    }).join("")}</div>
  </section>`;
  const halfmoveExplanations = rows.map((r, idx) => {
    const cp = r.centipawns;
    const heading = `${r.n}${r.color === "w" ? "." : "..."} ${sanFr(r.san)}`;
    const moveLink = `<button type="button" class="review-ply-link" data-review-ply="${idx + 1}" aria-label="Aller à la position après ${esc(heading)}">${esc(heading)}</button>`;
    if (!cp) return `<li class="review-ply" data-review-ply="${idx + 1}">${moveLink} : analyse en centipions indisponible.</li>`;
    const loss = cp.lossCp === null ? "non chiffrable (mat ou analyse incomplète)"
      : `${(Math.round(cp.lossCp*10)/10).toLocaleString("fr-FR")} cp`;
    const evalChange = Number.isFinite(cp.swingWhiteCp)
      ? ` · variation côté Blancs : ${cp.swingWhiteCp>=0?"+":""}${cp.swingWhiteCp.toFixed(0)} cp` : "";
    const facts = (cp.observations||[]).map(o=>o.text).join(" ");
    return `<li class="review-ply" data-review-ply="${idx + 1}">${moveLink} — perte / meilleur coup : ${esc(loss)}${esc(evalChange)}. ${esc(cp.explanation)} ${esc(facts)}</li>`;
  }).join("");
  const blindspots = rows.flatMap((r) => (r.diagnostics || []).map((d) => ({ ...d, n: r.n, color: r.color })));
  const examples = blindspots.slice(0, 8).map((d) => `<li><strong>${d.n}${d.color === "w" ? "." : "..."} :</strong> ${esc(d.text)} <small>${esc(d.caveat)}</small></li>`).join("");
  const lessonRows = rows.map((r, idx) => ({
    color:r.color, san:r.san, ply:idx+1, fenBefore:null,
    diagnostics:r.diagnostics || []
  }));
  const learningPlan = typeof SupaChessLearning !== "undefined"
    ? SupaChessLearning.plan({reports:lessonRows}) : [];
  const nextPractice = learningPlan.slice(0,3).map((p) =>
    `<li><strong>${esc(p.skill)} :</strong> ${esc(p.practice)} ${p.exercisesToTry} situations d’entraînement suggérées, puis vérification à J+1, J+3 et J+7. <small>${p.confidence === "pattern_supported" ? "Motif corroboré" : "Observation à confirmer sur plusieurs parties"}.</small></li>`
  ).join("");
  const pedagogical = ["w", "b"].map((color) => {
    const total = rows.filter((r) => r.color === color).length;
    const exposed = rows.filter((r) => r.color === color && (r.diagnostics || []).length).length;
    if (!exposed) return `${color === "w" ? "Blancs" : "Noirs"} : aucune prise immédiate signalée par ce détecteur.`;
    const label = exposed >= 3
      ? "Motif observé plusieurs fois : vérifier les prises adverses à chaque coup."
      : "Observation ponctuelle : pas assez d'exemples pour conclure à une lacune récurrente.";
    return `${color === "w" ? "Blancs" : "Noirs"} : ${exposed} coup(s) sur ${total} avec une prise adverse immédiate possible. ${label}`;
  }).map(esc).join("<br>");
  document.getElementById("review-report").innerHTML = `
    <div class="review-local">
      <h3>Bilan Stockfish (local)</h3>
      <div class="review-meta">${esc(headers.White || "Blancs")} vs ${esc(headers.Black || "Noirs")} — ${esc(headers.Result || "*")}</div>
      <div class="review-player-grid">${playerCard("w", headers.White || "Blancs", accW)}${playerCard("b", headers.Black || "Noirs", accB)}</div>
      ${worst.length ? `<div class="review-worst"><strong>Moments clés :</strong> ${worst.map(moveLabel).map(esc).join(" · ")}</div>`
        : "<div class='review-worst'>Aucune erreur notable détectée.</div>"}
    </div>
    ${examples ? `<div class="review-worst"><h4>Vérification des pièces en prise (preuve d’une capture légale)</h4><ul>${examples}</ul></div>` : ""}
    <div class="review-worst"><h4>Habitude à entraîner : échecs, prises, menaces</h4><p>${pedagogical}</p></div>
    ${nextPractice ? `<div class="review-worst"><h4>Plan d’entraînement personnalisé</h4><ol>${nextPractice}</ol></div>` : ""}
    <div class="review-worst"><h4>Chaque demi-coup expliqué : centipions et causes démontrables</h4><p><small>Perte relative au meilleur coup ≠ variation absolue de l’évaluation. Le moteur ne peut pas toujours établir le pourquoi en une phrase; les mats sont traités séparément.</small></p><ol>${halfmoveExplanations}</ol></div>
    <div id="review-supa"></div>`;
  document.querySelectorAll("#review-report .review-ply-link").forEach((link) => {
    link.addEventListener("click", () => reviewJumpToPly(Number(link.dataset.reviewPly)));
  });
  reviewSyncSelectedPly(state.replayIdx || 0);
}

function reviewSyncSelectedPly(ply) {
  document.querySelectorAll("#review-report .review-ply").forEach((item) => {
    const selected = Number(item.dataset.reviewPly) === ply;
    item.classList.toggle("selected", selected);
    const link = item.querySelector(".review-ply-link");
    if (link) {
      if (selected) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    }
  });
}

function reviewBeginReplay() {
  if (reviewState.returnState) return;
  const feedback = document.getElementById("move-feedback");
  reviewState.returnState = {
    state: { ...state, accuracy: { ...state.accuracy, w: [...state.accuracy.w], b: [...state.accuracy.b] } },
    boardUI: { ...boardUI, dots: [...boardUI.dots], legalTargets: [...boardUI.legalTargets],
      lastMove: boardUI.lastMove ? { ...boardUI.lastMove } : null },
    status: document.getElementById("status-line").textContent,
    evalHeight: document.getElementById("evalbar-white").style.height,
    evalLabel: document.getElementById("evalbar-label").textContent,
    feedbackClass: feedback.className,
    feedbackHtml: feedback.innerHTML,
    coachClass: document.getElementById("coach-panel").className,
  };
}

function reviewRestoreAfterReplay() {
  const saved = reviewState.returnState;
  if (!saved) return;
  const nextGen = state.gen + 1; // invalidate any analysis started by the replay
  Object.assign(state, saved.state);
  state.gen = nextGen;
  Object.assign(boardUI, saved.boardUI);
  document.getElementById("status-line").textContent = saved.status;
  document.getElementById("evalbar-white").style.height = saved.evalHeight;
  document.getElementById("evalbar-label").textContent = saved.evalLabel;
  const feedback = document.getElementById("move-feedback");
  feedback.className = saved.feedbackClass;
  feedback.innerHTML = saved.feedbackHtml;
  document.getElementById("coach-panel").className = saved.coachClass;
  reviewState.returnState = null;
  document.getElementById("replay-bar").classList.add("hidden");
  renderAll();
  if (["engineThinking", "analyzing"].includes(state.phase)) startTurn();
}

function reviewJumpToPly(ply) {
  reviewBeginReplay();
  document.getElementById("replay-bar").classList.remove("hidden");
  replayGoto(ply).catch(console.error);
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
  state.gen++;
  moveFeedback.clear();
  if (idx > 0) {
    const move = reviewState.moves[idx - 1];
    const grade = reviewState.grades[idx - 1];
    moveFeedback.show({ san: move.san, color: move.color, moveNumber: moveNumberFromFen(reviewState.fens[idx - 1]),
      square: move.to, deltaCp: grade ? grade.deltaCp : null, brilliant: grade ? grade.brilliant : false, mode: "replay" });
    const replayGrade = moveGrade(grade ? grade.deltaCp : null, grade ? grade.brilliant : false);
    boardUI.lastMove = { from: move.from, to: move.to, san: move.san, grade: replayGrade };
  }
  state.replayIdx = idx;
  state.chess = new Chess(reviewState.fens[idx]);
  state.fenHistory = [fenKey(state.chess.fen())];
  state.evalHistory = [];
  state.candidates = [];
  state.accuracy.pendingEngine = null;
  state.pendingMove = null;
  boardUI.lastMove = idx > 0 ? { from: reviewState.moves[idx - 1].from, to: reviewState.moves[idx - 1].to, san: reviewState.moves[idx - 1].san, grade: moveGrade(reviewState.grades[idx - 1] ? reviewState.grades[idx - 1].deltaCp : null, reviewState.grades[idx - 1] ? reviewState.grades[idx - 1].brilliant : false) } : null;
  boardUI.dots = [];
  boardUI.selected = null;
  boardUI.legalTargets = [];
  hideCoach();
  state.userColor = state.chess.turn(); // dots/candidats du côté au trait
  document.getElementById("replay-label").textContent =
    `Coup ${idx}/${reviewState.fens.length - 1}`;
  renderAll();
  reviewSyncSelectedPly(idx);
  await analyzeForUser(); // recalcul dots + candidats à chaque position
}

document.getElementById("btn-analyze-pgn").addEventListener("click", () => reviewStart(""));
document.getElementById("btn-run-review").addEventListener("click", () => { reviewRun().catch(console.error); });
document.getElementById("btn-close-pgn").addEventListener("click", reviewHideModal);
document.getElementById("btn-replay-game").addEventListener("click", () => {
  reviewBeginReplay();
  document.getElementById("replay-bar").classList.remove("hidden");
  replayGoto(0).catch(console.error);
});
document.getElementById("btn-replay-prev").addEventListener("click", () => replayGoto((state.replayIdx || 0) - 1).catch(console.error));
document.getElementById("btn-replay-next").addEventListener("click", () => replayGoto((state.replayIdx || 0) + 1).catch(console.error));
document.getElementById("btn-replay-quit").addEventListener("click", reviewRestoreAfterReplay);
