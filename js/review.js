/* review.js — analyse complète d'un PGN collé : Stockfish coup par coup
   (multipv 2, movetime 400), classification (?! ≥0.3, ? ≥0.6, ?? ≥2.0),
   précision par joueur, bilan pédagogique via supa_coach_server POST /review
   (fallback : bilan local SF si supa offline), puis relecture ◀ ▶. */
"use strict";

const REVIEW_BASE = "http://localhost:8778";
const REVIEW_TIMEOUT_MS = 150000;
const REVIEW_HISTORY_KEY = "supachess_reviewed_pgns";
const REVIEW_HISTORY_LIMIT = 50;
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

const reviewState = { fens: [], moves: [], grades: [], moveGrades: [], correctionExercises: [], currentHeaders: {}, exercise: null, running: false, returnState: null, modalReturnFocus: null };

function trapModalKeys(modal, close) {
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = Array.from(modal.querySelectorAll('a[href],button:not([disabled]):not([hidden]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      .filter((item) => item.getClientRects().length > 0);
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

function reviewShowModal(pgn) {
  const modal = document.getElementById("pgn-modal");
  reviewState.modalReturnFocus = document.activeElement;
  modal.classList.remove("hidden");
  if (pgn) document.getElementById("pgn-input").value = pgn;
  document.getElementById("pgn-input").focus();
}
function reviewHideModal() {
  document.getElementById("pgn-modal").classList.add("hidden");
  const target = reviewState.modalReturnFocus;
  reviewState.modalReturnFocus = null;
  if (target && target.isConnected && typeof target.focus === "function") target.focus();
  else document.getElementById("btn-analyze-pgn").focus();
}

/* Point d'entrée (bouton "Analyser PGN (Supa)" ou panneau Parties). */
function reviewStart(pgn) {
  reviewShowModal(pgn || "");
}

function reviewHistoryLoad() {
  try {
    const items = JSON.parse(localStorage.getItem(REVIEW_HISTORY_KEY) || "[]");
    return Array.isArray(items) ? items.filter((item) => item && typeof item.pgn === "string" && item.pgn.trim()) : [];
  } catch (_e) { return []; }
}

function reviewHistorySave(pgn, headers = {}, correctionExercises = [], analysis = null, moveGrades = []) {
  const normalizedPgn = String(pgn || "").replace(/\r\n?/g, "\n").trim();
  if (!normalizedPgn) return false;
  const previous = reviewHistoryLoad();
  const existing = previous.find((item) => item.pgn.replace(/\r\n?/g, "\n").trim() === normalizedPgn);
  const item = {
    id: existing ? existing.id : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    pgn: normalizedPgn,
    white: headers.White || "Blancs",
    black: headers.Black || "Noirs",
    whiteElo: headers.WhiteElo || "",
    blackElo: headers.BlackElo || "",
    result: headers.Result || "*",
    event: headers.Event || "",
    date: /^\d{4}\.\d{2}\.\d{2}$/.test(String(headers.Date || "")) ? headers.Date : "",
    timeControl: headers.TimeControl || "",
    correctionExercises: Array.isArray(correctionExercises) ? correctionExercises : [],
    moveGrades: Array.isArray(moveGrades) ? moveGrades : (existing && Array.isArray(existing.moveGrades) ? existing.moveGrades : []),
    analysis: analysis && analysis.version === 1 ? analysis : (existing && existing.analysis) || null,
    analyzedAt: analysis && analysis.version === 1 ? new Date().toISOString() : (existing && existing.analyzedAt) || null,
  };
  const next = [item, ...previous.filter((saved) => saved.id !== item.id &&
    saved.pgn.replace(/\r\n?/g, "\n").trim() !== normalizedPgn)].slice(0, REVIEW_HISTORY_LIMIT);
  try {
    localStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(next));
  } catch (_e) {
    const status = document.getElementById("review-history-status");
    if (status) status.textContent = "Analyse terminée, mais l’historique n’a pas pu être enregistré sur cet appareil.";
    return false;
  }
  reviewHistoryRender("PGN enregistré sur cet appareil.");
  return true;
}

function reviewValidCorrectionExercises(items) {
  return Array.isArray(items) ? items.filter((exercise) =>
    exercise && typeof exercise.fen === "string" && exercise.fen.trim() &&
    typeof exercise.bestUci === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(exercise.bestUci)
  ) : [];
}

function reviewHistoryExerciseButton(item){
  const count=reviewValidCorrectionExercises(item.correctionExercises).length;
  const title=`${item.white||"Blancs"} vs ${item.black||"Noirs"}`;
  return count
    ? `<button class="btn mini" type="button" data-review-history-act="exercise" aria-label="Corriger les coups de ${esc(title)} (${count})">Corriger (${count})</button>`
    : `<button class="btn mini" type="button" data-review-history-act="reanalyze-corrections" aria-label="Analyser ${esc(title)} pour créer ses exercices">Analyser pour corriger</button>`;
}

function reviewCorrectionButtons(){
  return [
    ...document.querySelectorAll('#games-list button[data-act="correct"]'),
    ...document.querySelectorAll('#review-history-list button[data-review-history-act="exercise"], #review-history-list button[data-review-history-act="reanalyze-corrections"]')
  ];
}

function reviewRefreshCorrectionHotkeys(){
  reviewCorrectionButtons().forEach((button,index)=>{
    const label=button.dataset.correctionLabel || button.textContent.trim();
    button.dataset.correctionLabel=label;
    if(index>=10){
      button.textContent=label;
      delete button.dataset.correctionHotkey;
      button.removeAttribute("aria-keyshortcuts");
      return;
    }
    const number=index===9?0:index+1;
    button.dataset.correctionHotkey=String(number);
    button.textContent=label.startsWith("Corriger") && button.closest("#games-list")
      ? `Corriger (${number})`
      : `${label} [${number}]`;
    button.setAttribute("aria-keyshortcuts",`Numpad${number}`);
    if(!button.dataset.baseCorrectionTitle)button.dataset.baseCorrectionTitle=button.title;
    button.title=`${button.dataset.baseCorrectionTitle ? button.dataset.baseCorrectionTitle+" · " : ""}Pavé numérique ${number}`;
  });
}

function reviewHistoryRender(statusText) {
  const list = document.getElementById("review-history-list");
  if (!list || typeof localStorage === "undefined") return;
  const items = reviewHistoryLoad();
  list.innerHTML = items.length ? items.map((item) => {
    const when = item.analyzedAt ? new Date(item.analyzedAt).toLocaleDateString("fr-FR") : "";
    const title = `${item.white || "Blancs"} vs ${item.black || "Noirs"}`;
    const detail = [item.event, item.result, when].filter(Boolean).join(" · ");
    return `<div class="review-history-row" data-review-history-id="${esc(item.id)}">
      <span class="review-history-meta"><strong>${esc(title)}</strong>${detail ? `<br><small>${esc(detail)}</small>` : ""}</span>
      <span class="review-history-actions">
        <button class="btn mini" type="button" data-review-history-act="open">Analyser à nouveau</button>
        ${reviewHistoryExerciseButton(item)}
        <button class="btn mini danger" type="button" data-review-history-act="delete" aria-label="Supprimer ${esc(title)}">×</button>
      </span>
    </div>`;
  }).join("") : "<em>Aucun PGN analysé.</em>";
  reviewRefreshCorrectionHotkeys();
  const status = document.getElementById("review-history-status");
  if (status && statusText) status.textContent = statusText;
}

function reviewHistoryRemove(id) {
  const remaining = reviewHistoryLoad().filter((item) => item.id !== id);
  try { localStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(remaining)); }
  catch (_e) { return; }
  reviewHistoryRender("PGN supprimé de cet appareil.");
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
  if (Number.isFinite(grade.mateAwareLoss)) {
    const loss = grade.mateAwareLoss;
    if (loss >= 200) return "blunder";
    if (loss >= 60) return "mistake";
    if (loss >= 30) return "inaccuracy";
    if (row.bestMove) return "best";
    if (loss <= 10) return "very-good";
    if (loss <= 20) return "good";
    return "ok";
  }
  if (!Number.isFinite(row.lossCp)) return "unrated";
  if (row.lossCp >= 200) return "blunder";
  if (row.lossCp >= 60) return "mistake";
  if (row.lossCp >= 30) return "inaccuracy";
  if (grade.brilliant && row.lossCp < 30) return "brilliant";
  if (row.bestMove && row.lossCp <= 10) return "best";
  if (row.lossCp <= 10) return "very-good";
  if (row.lossCp <= 20) return "good";
  return "ok";
}

function reviewBuildCorrectionExercises(rows,fens,moves,positionLines){
  return rows.flatMap((row,index)=>{
    if(!Number.isFinite(row.lossCp)||row.lossCp<=0)return [];
    const move=moves[index], bestLine=positionLines[index], bestUci=bestLine&&bestLine.pv&&bestLine.pv[0];
    if(!move||!fens[index]||typeof bestUci!=="string"||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestUci))return [];
    const playedUci=move.from+move.to+(move.promotion||"");
    if(bestUci===playedUci)return [];
    return [{fen:fens[index],bestUci,bestScoreCp:bestLine.scoreCp,bestMate:bestLine.mate,
      ply:index+1,moveNumber:row.n,color:row.color,playedSan:row.san,classification:row.classification,lossCp:row.lossCp}];
  });
}

function reviewCorrectionLabel(classification){
  return ({
    brilliant:"Brillant",best:"Meilleur coup","very-good":"Très bon coup",good:"Bon coup",
    ok:"Coup OK",inaccuracy:"Imprécision",mistake:"Erreur",blunder:"Gaffe",unrated:"Non évalué"
  })[classification]||"Coup à corriger";
}

async function reviewAnalyzePosition(options, moveNumber, totalMoves) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await state.engine.analyze(options);
    } catch (error) {
      if (attempt === 0 && error && error.retryable) {
        reviewSetProgress("Stockfish ne répond pas au demi-coup " + moveNumber + "/" + totalMoves +
          " — redémarrage du moteur et nouvelle tentative…");
        continue;
      }
      throw error;
    }
  }
  throw new Error("Stockfish n’a pas pu terminer l’analyse après une nouvelle tentative.");
}

async function reviewRun(options = {}) {
  if (reviewState.running) return false;
  const pgnText = document.getElementById("pgn-input").value.trim();
  if (!pgnText) { alert("Collez un PGN d'abord."); return false; }
  const game = new Chess();
  const loadFn = game.load_pgn ? "load_pgn" : "loadPgn";
  if (!game[loadFn](pgnText, { sloppy: true })) { alert("PGN invalide ou illisible."); return false; }
  const moves = game.history({ verbose: true });
  if (!moves.length) { alert("Aucun coup dans ce PGN."); return false; }
  const parsedHeaders = typeof game.header === "function" ? game.header() : {};
  const headers = { ...(options.headers || {}), ...parsedHeaders };

  reviewState.running = true;
  reviewSetReplayControls(false);
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
      const res = await reviewAnalyzePosition({ fen: fens[i], multipv: 2, movetime: 400, elo: 0 }, Math.min(i + 1, moves.length), moves.length);
      cps.push(res.lines.length ? clampCpFromLine(res.lines[0]) : 0);
      positionLines.push(res.lines[0] || null);
    }
  } catch (e) {
    reviewSetProgress("Erreur d'analyse : " + e);
    reviewState.running = false;
    return false;
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
    const mateAwareLoss = cpEvidence && cpEvidence.status === "MATE_EVALUATION" && Number.isFinite(delta)
      ? Math.round(delta * 100) : null;
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
      mateAwareLoss,
    });
  }
  const r1 = (v) => (v === null ? null : Math.round(v * 10) / 10);
  const accW = r1(avgAccuracy(accs.w));
  const accB = r1(avgAccuracy(accs.b));

  reviewState.fens = fens;
  reviewState.moves = moves;
  reviewState.currentHeaders = { ...headers };
  reviewState.grades = rows.map((row, i) => {
    const reply = positionLines[i + 1];
    const move = moves[i];
    const uci = move.from + move.to + (move.promotion || "");
    const cand = { deltaCp: row.lossCp, line: reply ? { ...reply, pv: [uci, ...reply.pv] } : null };
    const eligible = Number.isFinite(cand.deltaCp);
    const evaluation = reply && (reply.scoreCp !== null || reply.mate !== null)
      ? formatScore(reply, move.color === "b") : "—";
    const brilliant = eligible ? isBrilliantCandidate(fens[i], cand) : false;
    const category = reviewClassOf(row, { brilliant, mateAwareLoss: row.mateAwareLoss });
    return { deltaCp: eligible ? cand.deltaCp : null, mateAwareLoss: row.mateAwareLoss, brilliant, category, evaluation };
  });
  rows.forEach((row, i) => { row.evaluation = reviewState.grades[i].evaluation; row.classification = reviewClassOf(row, reviewState.grades[i]); });
  reviewState.moveGrades = reviewState.grades.map((grade, index) => ({ ply: index + 1, color: moves[index].color, category: grade.category || "unrated" }));
  reviewState.correctionExercises = reviewBuildCorrectionExercises(rows, fens, moves, positionLines);
  reviewSetProgress("Analyse Stockfish terminée — bilan en cours…");
  reviewRenderLocal(rows, accW, accB, headers);
  const analysisSummary = typeof ReviewInsights !== "undefined"
    ? ReviewInsights.buildGameSummary({ rows, moves, fens, accuracyW: accW, accuracyB: accB, headers }) : null;
  reviewHistorySave(pgnText, headers, reviewState.correctionExercises, analysisSummary, reviewState.moveGrades);
  document.getElementById("btn-replay-game").classList.remove("hidden");

  // Le lot reste local : le bilan transversal est calculé après les analyses.
  if (!options.batch) {
    await reviewAskSupa(rows, accW, accB, headers);
    if (!options.startCorrections) {
      reviewBeginReplay();
      document.getElementById("replay-bar").classList.remove("hidden");
      reviewSetReplayControls(true);
      await replayGoto(0);
    }
  }
  reviewState.running = false;
  if (options.startCorrections) {
    const exercises = reviewValidCorrectionExercises(reviewState.correctionExercises);
    if (exercises.length) reviewStartCorrectionExercises(exercises, headers, analysisSummary);
    else {
      const status = document.getElementById("review-history-status");
      if (status) status.textContent = "Analyse terminée : aucun demi-coup à corriger n’a été détecté.";
    }
  }
  return true;
}

async function reviewRunBatch(items, onProgress) {
  const queue = (Array.isArray(items) ? items : []).map((item) =>
    typeof item === "string" ? { pgn: item } : item
  ).filter((item) => item && typeof item.pgn === "string" && item.pgn.trim());
  const results = [];
  for (let index = 0; index < queue.length; index++) {
    const item = queue[index];
    const input = document.getElementById("pgn-input");
    if (input) input.value = item.pgn;
    if (typeof onProgress === "function") onProgress({ index: index + 1, total: queue.length, item });
    const completed = await reviewRun({ batch: true });
    results.push({ pgn: item.pgn, completed: completed === true });
    if (completed !== true) break;
  }
  return results;
}

function reviewCount(rows, color, tag) {
  return rows.filter((r) => r.color === color && r.classification === tag).length;
}

function reviewCorrectionExercisesHtml(items){
  const list=Array.isArray(items)?items:[];
  const count=list.length;
  const description=count
    ? `${count} demi-coup(s) avec une perte mesurée en centipions. Choisis cette partie et retrouve le meilleur coup à chaque position.`
    : "Aucun demi-coup avec une perte mesurable en centipions et un meilleur coup distinct dans cette partie.";
  return `<section class="review-correction-practice">
    <h3>Exercices de correction par partie</h3>
    <p>${esc(description)}</p>
    <button id="btn-review-corrections" class="btn" type="button" ${count?"":"disabled"}>Corriger ces coups (${count})</button>
  </section>`;
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
    <div class="review-player-head"><div class="review-player-identity"><span class="review-player-side-label">${color === "w" ? "Joueur 1 · Blancs" : "Joueur 2 · Noirs"}</span><h4>${esc(name)}</h4></div><strong class="review-player-accuracy">${Number.isFinite(accuracy) ? `${accuracy}%` : "—"}</strong></div>
    <div class="review-grade-list">${REVIEW_MOVE_CLASSES.map((category) => {
      const moves = rows.filter((row) => row.color === color && row.classification === category.id);
      const count = reviewCount(rows, color, category.id);
      const firstMove = moves[0];
      const moveList = moves.length
        ? `<details class="review-grade-moves"><summary>${moves.length} coup${moves.length === 1 ? "" : "s"}</summary><ol>${moves.map(moveButton).join("")}</ol></details>`
        : "";
      const categoryJump = firstMove
        ? `<button type="button" class="review-grade-jump review-ply-link" data-review-ply="${firstMove.ply}" aria-label="Aller au premier demi-coup classé ${esc(category.label)}" style="grid-column:3 / 5;display:flex;align-items:center;justify-content:space-between;width:100%;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer"><span class="review-grade-label">${category.label}</span><span class="review-grade-count">${count}</span></button>`
        : `<span class="review-grade-label">${category.label}</span><span class="review-grade-count">${count}</span>`;
      return `<div class="review-grade-row review-grade-${category.id}" title="${category.label}"><span class="review-grade-dot" aria-hidden="true"></span><span class="review-grade-symbol" aria-hidden="true">${category.symbol}</span>${categoryJump}${moveList}</div>`;
    }).join("")}</div>
  </section>`;
  const halfmoveExplanations = rows.map((r, idx) => {
    const cp = r.centipawns;
    const heading = `${r.n}${r.color === "w" ? "." : "..."} ${sanFr(r.san)}`;
    const moveLink = `<button type="button" class="review-ply-link" data-review-ply="${idx + 1}" aria-label="Aller à la position après ${esc(heading)}">${esc(heading)}</button>`;
    const evaluation = r.evaluation && r.evaluation !== "—"
      ? ` · évaluation après ce demi-coup : <strong>${esc(r.evaluation)}</strong>`
      : " · évaluation après ce demi-coup indisponible";
    if (!cp) return `<li class="review-ply" data-review-ply="${idx + 1}">${moveLink}${evaluation} — analyse en centipions indisponible.</li>`;
    const loss = cp.lossCp === null ? "non chiffrable (mat ou analyse incomplète)"
      : `${(Math.round(cp.lossCp*10)/10).toLocaleString("fr-FR")} cp`;
    const evalChange = Number.isFinite(cp.swingWhiteCp)
      ? ` · variation côté Blancs : ${cp.swingWhiteCp>=0?"+":""}${cp.swingWhiteCp.toFixed(0)} cp` : "";
    const facts = (cp.observations||[]).map(o=>o.text).join(" ");
    const principles = (cp.principles||[]).map(p=>`<strong>Principe à vérifier : ${esc(p.label)}.</strong> ${esc(p.text)} <small>${esc(p.caveat)}</small>`).join(" ");
    const mateQualityNote = Number.isFinite(r.mateAwareLoss)
      ? " Le classement du coup utilise la distance au mat calculée par Stockfish; aucune perte en centipions n’est revendiquée." : "";
    return `<li class="review-ply" data-review-ply="${idx + 1}">${moveLink}${evaluation} — perte / meilleur coup : ${esc(loss)}${esc(evalChange)}. ${esc(cp.explanation)}${esc(mateQualityNote)} ${esc(facts)} ${principles || "<small>Aucun principe précis ne peut être confirmé à partir des preuves disponibles pour ce demi-coup.</small>"}</li>`;
  }).join("");
  const blindspots = rows.flatMap((r) => (r.diagnostics || []).map((d) => ({ ...d, n: r.n, color: r.color })));
  const examples = blindspots.slice(0, 8).map((d) => `<li><strong>${d.n}${d.color === "w" ? "." : "..."} :</strong> ${esc(d.text)} <small>${esc(d.caveat)}</small></li>`).join("");
  const principleGroups = new Map();
  rows.forEach((row) => (row.centipawns?.principles || []).forEach((principle) => {
    const current = principleGroups.get(principle.code) || { ...principle, plies: [] };
    current.plies.push(`${row.n}${row.color === "w" ? "." : "..."} ${sanFr(row.san)}`);
    principleGroups.set(principle.code, current);
  }));
  const principlesToWork = [...principleGroups.values()].map((principle) => {
    const candidatesOnly = principle.confidence !== "evidence";
    const status = candidatesOnly ? "Piste suggérée par le moteur, à vérifier dans la variante" :
      principle.plies.length > 1 ? "Motif observé plusieurs fois dans cette partie" : "Observation ponctuelle, récurrence à confirmer";
    return `<li><strong>${esc(principle.label)} :</strong> ${principle.plies.map(esc).join(", ")}. ${esc(status)}. <small>${esc(principle.caveat)}</small></li>`;
  }).join("");
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
    <div class="review-worst"><h4>Principes et fondamentaux à travailler</h4>${principlesToWork ? `<ul>${principlesToWork}</ul>` : "<p>Aucun fondamental précis n’est confirmé par les preuves de cette partie. Une partie seule ne suffit pas à établir une lacune récurrente.</p>"}</div>
    <div class="review-worst"><h4>Habitude à entraîner : échecs, prises, menaces</h4><p>${pedagogical}</p></div>
    ${nextPractice ? `<div class="review-worst"><h4>Plan d’entraînement personnalisé</h4><ol>${nextPractice}</ol></div>` : ""}
    <div class="review-worst"><h4>Chaque demi-coup expliqué : centipions et causes démontrables</h4><p><small>Perte relative au meilleur coup ≠ variation absolue de l’évaluation. Le moteur ne peut pas toujours établir le pourquoi en une phrase; les mats sont traités séparément.</small></p><ol>${halfmoveExplanations}</ol></div>
    ${reviewCorrectionExercisesHtml(reviewState.correctionExercises)}
    <div id="review-supa"></div>`;
  const correctionButton = document.getElementById("btn-review-corrections");
  if (correctionButton) correctionButton.addEventListener("click", () =>
    reviewStartCorrectionExercises(reviewState.correctionExercises, reviewState.currentHeaders));
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

function reviewCorrectionLossText(lossCp){
  return Number.isFinite(lossCp)?`${lossCp.toLocaleString("fr-FR",{maximumFractionDigits:1})} centipions`:"perte mesurée";
}

function reviewCorrectionPhase(item){
  const pieces=new Chess(item.fen).board().flat().filter((piece)=>piece&&piece.type!=="k"&&piece.type!=="p");
  const queens=pieces.filter((piece)=>piece.type==="q").length;
  if(queens===0||pieces.length<=4)return "endgame";
  if(item.moveNumber<=10&&queens===2&&pieces.length>=12)return "opening";
  return "middlegame";
}

function reviewSetCorrectionPhase(phase){
  const exercise=reviewState.exercise;
  if(!exercise)return;
  exercise.phase=phase;
  exercise.items=phase==="all"?exercise.allItems:
    exercise.allItems.filter((item)=>reviewCorrectionPhase(item)===phase);
  exercise.index=0;
  exercise.solved=false;
  reviewShowCorrectionExercise(0);
}

function reviewCompareCorrectionExercises(a,b){
  const moveA=Number.isFinite(Number(a.moveNumber))?Number(a.moveNumber):Number.MAX_SAFE_INTEGER;
  const moveB=Number.isFinite(Number(b.moveNumber))?Number(b.moveNumber):Number.MAX_SAFE_INTEGER;
  if(moveA!==moveB)return moveA-moveB;
  if(a.color===b.color)return 0;
  return a.color==="w"?-1:1;
}

async function reviewCorrectPgn(pgn,headers={}){
  const normalized=String(pgn||"").replace(/\r\n?/g,"\n").trim();
  if(!normalized)return false;
  if(reviewState.running){
    const status=document.getElementById("review-history-status");
    if(status)status.textContent="Une analyse est déjà en cours. Attends sa fin avant de lancer une correction.";
    return false;
  }
  const saved=reviewHistoryLoad().find((item)=>
    item.pgn.replace(/\r\n?/g,"\n").trim()===normalized);
  if(saved){
    const exercises=reviewValidCorrectionExercises(saved.correctionExercises)
      .sort(reviewCompareCorrectionExercises);
    if(exercises.length&&Array.isArray(saved.moveGrades)&&saved.moveGrades.length){
      reviewState.currentHeaders={White:saved.white||headers.White||"Blancs",Black:saved.black||headers.Black||"Noirs"};
      reviewStartCorrectionExercises(exercises,reviewState.currentHeaders,saved.analysis||null,saved.moveGrades);
      return true;
    }
    if(saved.analysis&&saved.analysis.version===1&&
      (!Array.isArray(saved.correctionExercises)||saved.correctionExercises.length===0)){
      const status=document.getElementById("review-history-status");
      if(status)status.textContent="Cette partie a déjà été analysée : aucun demi-coup à corriger n’a été détecté.";
      document.getElementById("review-panel")?.scrollIntoView({block:"start"});
      return true;
    }
  }
  const input=document.getElementById("pgn-input");
  if(!input)return false;
  input.value=normalized;
  reviewState.currentHeaders={...headers};
  const panel=document.getElementById("review-panel");
  if(panel)panel.classList.remove("hidden");
  const completed=await reviewRun({batch:true,startCorrections:true,headers:reviewState.currentHeaders});
  if(!completed){
    const status=document.getElementById("review-history-status");
    if(status)status.textContent="Impossible d’analyser cette partie. Vérifie que son PGN est valide.";
  }
  return completed;
}

function reviewStartCorrectionExercises(items,headers={},analysis=null,moveGrades=reviewState.moveGrades){
  const valid=reviewValidCorrectionExercises(items).sort(reviewCompareCorrectionExercises);
  if(!valid.length){
    const status=document.getElementById("review-history-status");
    if(status)status.textContent="Aucune position de correction exploitable n’est enregistrée. Rouvre et analyse le PGN pour créer les exercices.";
    return;
  }
  window.setSupaCorrectionExerciseMode?.(true);
  reviewBeginReplay();
  reviewState.currentHeaders={...reviewState.currentHeaders,...headers};
  reviewState.moveGrades=Array.isArray(moveGrades)?moveGrades:[];
  reviewState.exercise={allItems:valid,items:valid,index:0,solved:false,phase:"all",headers:{...reviewState.currentHeaders},analysis};
  const phaseSelect=document.getElementById("review-exercise-phase");
  if(phaseSelect)phaseSelect.value="all";
  const panel=document.getElementById("review-exercise-panel");
  if(panel)panel.classList.remove("hidden");
  reviewShowCorrectionExercise(0);
  panel?.scrollIntoView({block:"start"});
}

function reviewClearCorrectionCandidates(message){
  state.candidates=[];
  boardUI.dots=[];
  const list=document.getElementById("candidates-list");
  if(list)list.innerHTML="<em>"+message+"</em>";
}

async function reviewAnalyzeCorrectionCandidates(exercise,index){
  const fen=state.chess.fen();
  const list=document.getElementById("candidates-list");
  if(document.body.dataset.engineReady!=="1"||!state.engine){
    if(list)list.innerHTML="<em>Stockfish prépare l’analyse des coups candidats…</em>";
    document.addEventListener("supachess:engine-ready",function(){
      if(reviewState.exercise===exercise&&exercise.index===index)reviewAnalyzeCorrectionCandidates(exercise,index);
    },{once:true});
    return;
  }
  const legalMoveCount=state.chess.moves({verbose:true}).length;
  if(!legalMoveCount){
    reviewClearCorrectionCandidates("Aucun coup légal dans cette position.");
    return;
  }
  const generation=state.gen;
  if(list)list.innerHTML="<em>Stockfish analyse les coups candidats…</em>";
  try{
    const result=await state.engine.analyze({fen,multipv:Math.min(12,legalMoveCount),movetime:1200,elo:0});
    if(reviewState.exercise!==exercise||exercise.index!==index||state.gen!==generation||state.chess.fen()!==fen)return;
    if(typeof buildCandidates==="function")buildCandidates(result.lines||[],fen);
    if(!state.candidates.length){
      reviewClearCorrectionCandidates("Stockfish n’a pas fourni de coup candidat pour cette position.");
      return;
    }
    renderCandidatesList();
    renderBoard();
    if(result.lines&&result.lines.length&&typeof updateEvalBar==="function")updateEvalBar(result.lines[0]);
  }catch(error){
    if(reviewState.exercise!==exercise||exercise.index!==index||state.chess.fen()!==fen)return;
    reviewClearCorrectionCandidates("Analyse Stockfish indisponible pour ces coups candidats. Tu peux tout de même résoudre l’exercice.");
  }
}

function reviewShowCorrectionExercise(index){
  const exercise=reviewState.exercise;
  if(!exercise)return;
  if(!exercise.items.length){
    exercise.index=0;
    document.getElementById("review-exercise-heading").textContent="Aucun exercice dans cette phase.";
    document.getElementById("review-exercise-prompt").textContent="Choisis une autre phase ou affiche toutes les phases.";
    document.getElementById("review-exercise-feedback").textContent="";
    document.getElementById("btn-review-exercise-next").disabled=true;
    return;
  }
  if(index>=exercise.items.length){reviewExitCorrectionExercises();return;}
  exercise.index=index;
  exercise.solved=false;
  exercise.awaitingRetry=false;
  document.getElementById("btn-review-exercise-retry")?.classList.add("hidden");
  const item=exercise.items[index];
  reviewSetMoveGradeHistory(reviewState.moveGrades, Math.max(0, (Number(item.ply) || 1) - 1));
  state.gen++;
  state.chess=new Chess(item.fen);
  state.fenHistory=[fenKey(state.chess.fen())];
  state.evalHistory=[];
  state.candidates=[];
  state.pendingMove=null;
  state.phase="userTurn";
  state.userColor=state.chess.turn();
  boardUI.setFlipped(state.userColor==="b");
  document.getElementById("btn-review-exercise-flip").setAttribute("aria-pressed",String(boardUI.flipped));
  boardUI.selected=null;
  boardUI.legalTargets=[];
  boardUI.legalTargetHints={};
  boardUI.dots=[];
  boardUI.showDots=true;
  boardUI.showMoveDots=true;
  boardUI.lastMove=null;
  hideCoach();
  moveFeedback.clear();
  const colorName=item.color==="w"?(reviewState.currentHeaders.White||"Blancs"):(reviewState.currentHeaders.Black||"Noirs");
  document.getElementById("review-exercise-heading").textContent=
    `Exercice ${index+1}/${exercise.items.length} · ${reviewCorrectionLabel(item.classification)} · ${colorName}`;
  const moveHeading=`${item.moveNumber}${item.color==="w"?".":"..."} ${item.playedSan}`;
  const lossText=reviewCorrectionLossText(item.lossCp);
  document.getElementById("review-exercise-prompt").textContent=
    `Dans la partie, ${moveHeading} (${reviewCorrectionLabel(item.classification).toLowerCase()}) faisait perdre ${lossText}. Trouve le meilleur coup.`;
  document.getElementById("review-exercise-feedback").textContent="À toi de jouer : clique une pièce puis sa case cible.";
  const next=document.getElementById("btn-review-exercise-next");
  next.disabled=true;
  next.textContent=index===exercise.items.length-1?"Terminer":"Exercice suivant";
  setStatus("Exercice de correction — trouve le meilleur coup.");
  renderAll();
  window.applyLevelDiagnosticLock?.();
  if(typeof renderAccuracy==="function")renderAccuracy();
  if(Number.isFinite(item.bestScoreCp)||Number.isFinite(item.bestMate)){
    updateEvalBar({scoreCp:Number.isFinite(item.bestScoreCp)?item.bestScoreCp:null,
      mate:Number.isFinite(item.bestMate)?item.bestMate:null,pv:[item.bestUci]});
  }else document.getElementById("evalbar-label").textContent="—";
  reviewAnalyzeCorrectionCandidates(exercise,index);
}

function reviewHandleExerciseSquareClick(square){
  const exercise=reviewState.exercise;
  if(!exercise)return false;
  if(exercise.solved||exercise.awaitingRetry)return true;
  const item=exercise.items[exercise.index];
  const piece=state.chess.get(square);
  const selected=boardUI.selected;
  if(selected){
    if(selected===square){
      boardUI.selected=null;boardUI.legalTargets=[];renderBoard();return true;
    }
    const legal=state.chess.moves({square:selected,verbose:true}).find((move)=>move.to===square);
    if(legal){
      const bestPromotion=item.bestUci.length>4?item.bestUci[4]:null;
      const promotion=legal.flags.includes("p")
        ? (item.bestUci.slice(0,4)===selected+square&&bestPromotion?bestPromotion:"q")
        : undefined;
      const uci=selected+square+(promotion||"");
      if(uci!==item.bestUci){
        const played=state.chess.move({from:selected,to:square,promotion});
        if(!played){
          document.getElementById("review-exercise-feedback").textContent="Ce déplacement est illégal dans cette position.";
          boardUI.selected=null;boardUI.legalTargets=[];renderBoard();return true;
        }
        exercise.awaitingRetry=true;
        boardUI.selected=null;boardUI.legalTargets=[];boardUI.legalTargetHints={};
        boardUI.lastMove={from:selected,to:square,san:played.san};
        document.getElementById("review-exercise-feedback").textContent=
          `${played.san} est légal, mais ne corrige pas l’erreur. Observe la position puis recommence pour chercher un meilleur coup.`;
        document.getElementById("btn-review-exercise-retry")?.classList.remove("hidden");
        setStatus("Coup légal joué — recommence pour trouver la correction.");
        renderAll();
        reviewClearCorrectionCandidates("Le coup joué ne corrige pas l’erreur. Recommence pour relancer les candidats de la position initiale.");
        return true;
      }
      const played=state.chess.move({from:selected,to:square,promotion});
      exercise.solved=true;
      boardUI.selected=null;boardUI.legalTargets=[];
      boardUI.lastMove={from:selected,to:square,san:played.san};
      document.getElementById("review-exercise-feedback").textContent=
        `Bien joué : ${played.san} est le meilleur coup. Dans la partie, ${item.playedSan} faisait perdre ${reviewCorrectionLossText(item.lossCp)}.`;
      document.getElementById("btn-review-exercise-next").disabled=false;
      setStatus("Position corrigée.");
      renderAll();
      reviewClearCorrectionCandidates("Correction trouvée. Passe à l’exercice suivant quand tu es prêt.");
      return true;
    }
  }
  if(piece&&piece.color===state.chess.turn()){
    boardUI.selected=square;
    boardUI.legalTargets=state.chess.moves({square,verbose:true}).map((move)=>move.to);
    boardUI.legalTargetHints={};
  }else{
    boardUI.selected=null;boardUI.legalTargets=[];
  }
  renderBoard();
  return true;
}

function reviewExitCorrectionExercises(){
  reviewState.exercise=null;
  reviewRestoreAfterReplay();
}

function reviewSetReplayControls(active) {
  const enabled = Boolean(active && reviewState.fens.length);
  document.getElementById("btn-replay-prev").disabled = !enabled;
  document.getElementById("btn-replay-next").disabled = !enabled;
  document.getElementById("btn-replay-quit").classList.toggle("hidden", !enabled);
  if (!enabled) document.getElementById("replay-label").textContent =
    reviewState.fens.length ? "Relecture en pause" : "Importez ou analysez une partie pour la parcourir";
}

function reviewBeginReplay() {
  if (reviewState.returnState) return;
  document.getElementById("replay-bar").classList.remove("hidden");
  reviewSetReplayControls(true);
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
  const exercisePanel = document.getElementById("review-exercise-panel");
  if (exercisePanel) exercisePanel.classList.add("hidden");
  reviewState.exercise = null;
  const saved = reviewState.returnState;
  if (!saved) {
    window.setSupaCorrectionExerciseMode?.(false);
    return;
  }
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
  document.getElementById("replay-bar").classList.remove("hidden");
  reviewSetReplayControls(false);
  window.setSupaCorrectionExerciseMode?.(false);
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

/* Les compteurs ne comprennent que les demi-coups joués jusqu'à la position affichée. */
function reviewSetMoveGradeHistory(grades, ply) {
  state.moveGradeHistory = (Array.isArray(grades) ? grades : []).filter((grade) => Number(grade.ply) <= ply)
    .map((grade) => ({ ply: Number(grade.ply), color: grade.color,
      category: grade.category === "mistake" ? "error" : (grade.category || "unrated") }));
  if (typeof renderMoveGradeSummary === "function") renderMoveGradeSummary();
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
      square: move.to, deltaCp: grade ? grade.deltaCp : null, brilliant: grade ? grade.brilliant : false,
      best: grade?.category === "best", categoryOverride: grade?.category, mode: "replay" });
    const replayGrade = moveGrade(grade ? grade.deltaCp : null, grade ? grade.brilliant : false, grade?.category === "best", grade?.category);
    boardUI.lastMove = { from: move.from, to: move.to, san: move.san, grade: replayGrade,
      evaluation: reviewState.grades[idx - 1]?.evaluation || "—" };
  }
  state.replayIdx = idx;
  reviewSetMoveGradeHistory(reviewState.moveGrades, idx);
  state.chess = new Chess(reviewState.fens[idx]);
  state.fenHistory = [fenKey(state.chess.fen())];
  state.evalHistory = [];
  state.candidates = [];
  state.accuracy.pendingEngine = null;
  state.pendingMove = null;
  boardUI.lastMove = idx > 0 ? { from: reviewState.moves[idx - 1].from, to: reviewState.moves[idx - 1].to, san: reviewState.moves[idx - 1].san,
    grade: moveGrade(reviewState.grades[idx - 1] ? reviewState.grades[idx - 1].deltaCp : null, reviewState.grades[idx - 1] ? reviewState.grades[idx - 1].brilliant : false, reviewState.grades[idx - 1]?.category === "best", reviewState.grades[idx - 1]?.category),
    evaluation: reviewState.grades[idx - 1]?.evaluation || "—" } : null;
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
trapModalKeys(document.getElementById("pgn-modal"), reviewHideModal);
document.getElementById("btn-review-exercise-flip").addEventListener("click", () => {
  if (!reviewState.exercise) return;
  boardUI.setFlipped(!boardUI.flipped);
  document.getElementById("btn-review-exercise-flip").setAttribute("aria-pressed",String(boardUI.flipped));
  renderBoard();
});
document.getElementById("btn-review-exercise-next").addEventListener("click", () => {
  const exercise = reviewState.exercise;
  if (!exercise || !exercise.solved) return;
  if (exercise.index + 1 < exercise.items.length) reviewShowCorrectionExercise(exercise.index + 1);
  else reviewExitCorrectionExercises();
});
document.getElementById("btn-review-exercise-retry").addEventListener("click", () => {
  const exercise=reviewState.exercise;
  if(exercise&&!exercise.solved)reviewShowCorrectionExercise(exercise.index);
});
document.getElementById("btn-review-exercise-quit").addEventListener("click", reviewExitCorrectionExercises);
document.getElementById("review-exercise-phase").addEventListener("change",(event)=>reviewSetCorrectionPhase(event.target.value));
const reviewHistoryList = document.getElementById("review-history-list");
if (reviewHistoryList) reviewHistoryList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-review-history-act]");
  const row = button && button.closest("[data-review-history-id]");
  if (!button || !row) return;
  const id = row.dataset.reviewHistoryId;
  const item = reviewHistoryLoad().find((saved) => saved.id === id);
  if (button.dataset.reviewHistoryAct === "delete") reviewHistoryRemove(id);
  else if (button.dataset.reviewHistoryAct === "open" && item) reviewStart(item.pgn);
  else if (button.dataset.reviewHistoryAct === "reanalyze-corrections" && item)
    reviewCorrectPgn(item.pgn,{White:item.white,Black:item.black});
  else if (button.dataset.reviewHistoryAct === "exercise" && item)
    reviewCorrectPgn(item.pgn,{White:item.white,Black:item.black});
});
reviewHistoryRender();
function resumeCorrectionExercisesFromUrl() {
  if (typeof URLSearchParams === "undefined") return;
  const params = new URLSearchParams(location.search);
  const resumeId = params.get("resume-exercises");
  const openReview = params.get("open-review") === "1";
  const focusCategory = params.get("focus-category");
  const validFocusCategories = new Set(["inaccuracy","mistake","blunder"]);
  if (!resumeId && !openReview) return;
  const item = resumeId ? reviewHistoryLoad().find((saved) => saved.id === resumeId) : null;
  if (resumeId && !item) return;
  const resume = () => {
    if (!item) { reviewShowModal(); return; }
    const exercises = reviewValidCorrectionExercises(item.correctionExercises);
    if (exercises.length) {
      const headers = { White: item.white, Black: item.black };
      if (focusCategory && validFocusCategories.has(focusCategory)) {
        const focusedExercises = exercises.filter((exercise) => exercise.classification === focusCategory);
        reviewState.currentHeaders = headers;
        reviewStartCorrectionExercises(focusedExercises,headers,item.analysis||null,item.moveGrades||[]);
        if (!focusedExercises.length) {
          const feedback=document.getElementById("review-exercise-feedback");
          if (feedback) feedback.textContent = "Aucun exercice de cette catégorie n’est enregistré dans cette partie. Actualise ton classement des lacunes.";
        }
      } else {
        reviewState.currentHeaders = headers;
        reviewCorrectPgn(item.pgn,headers);
      }
      document.getElementById("review-exercise-panel")?.scrollIntoView({ block: "start" });
    } else {
      reviewStart(item.pgn);
      document.getElementById("review-history-status").textContent = "Cette partie n’a pas encore d’exercices enregistrés. Analyse-la pour les créer.";
    }
  };
  if (document.body.dataset.engineReady === "1") resume();
  else document.addEventListener("supachess:engine-ready", resume, { once: true });
}
resumeCorrectionExercisesFromUrl();
document.getElementById("btn-replay-game").addEventListener("click", () => {
  reviewBeginReplay();
  document.getElementById("replay-bar").classList.remove("hidden");
  replayGoto(0).catch(console.error);
});
document.getElementById("btn-replay-prev").addEventListener("click", () => replayGoto((state.replayIdx || 0) - 1).catch(console.error));
document.getElementById("btn-replay-next").addEventListener("click", () => replayGoto((state.replayIdx || 0) + 1).catch(console.error));
document.getElementById("btn-replay-quit").addEventListener("click", reviewRestoreAfterReplay);
if (typeof document.addEventListener === "function") document.addEventListener("keydown", (event) => {
  const correctionKey=event.code.match(/^Numpad([0-9])$/);
  const target=event.target;
  if(correctionKey&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&
    !(target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))){
    const digit=Number(correctionKey[1]);
    const button=reviewCorrectionButtons()[digit===0?9:digit-1];
    if(button){event.preventDefault();button.click();return;}
  }
  if (!reviewState.returnState || document.getElementById("replay-bar").classList.contains("hidden")) return;
  if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    replayGoto((state.replayIdx || 0) - 1).catch(console.error);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    replayGoto((state.replayIdx || 0) + 1).catch(console.error);
  }
});

