/* app.js — orchestration : partie contre Stockfish + coach interceptant. */
"use strict";

const $ = (id) => document.getElementById(id);

const state = {
  chess: new Chess(),
  engine: null,
  userColor: "w",
  candidates: [],        // [{rank, uci, san, line, deltaCp, args}]
  phase: "init",         // init | analyzing | userTurn | coach | engineThinking | gameover
  pendingMove: null,     // coup utilisateur intercepté {from,to,promotion,uci}
  fenHistory: [],        // clés FEN (4 champs) pour détection de répétition
  evalWhiteCp: 0,
  stats: { moves: 0, top1: 0, top3: 0, intercepts: 0, forced: 0 },
  accuracy: { w: [], b: [], pendingEngine: null }, // moveAccuracy [0..100] par couleur
};

const boardUI = new BoardUI($("board"), onSquareClick);

/* ── Réglages ── */
function thresholdCp() { return Math.round(parseFloat($("sel-threshold").value) * 100); }
function movetime() { return parseInt($("sel-movetime").value, 10); }
function opponentElo() { return parseInt($("sel-elo").value, 10); }

/* ── Init moteur ── */
async function init() {
  setStatus("Chargement du moteur…");
  state.engine = new StockfishEngine("vendor/stockfish-18-lite-single.js");
  await state.engine.ready;
  $("engine-dot").className = "status-dot ready";
  $("engine-label").textContent = state.engine.engineName + " (NNUE) — prêt";
  document.body.dataset.engineReady = "1";
  newGame();
}

function newGame() {
  state.chess = new Chess();
  state.candidates = [];
  state.pendingMove = null;
  resetAccuracy();
  state.fenHistory = [fenKey(state.chess.fen())];
  state.userColor = $("sel-color").value;
  boardUI.setFlipped(state.userColor === "b");
  boardUI.selected = null;
  boardUI.lastMove = null;
  boardUI.dots = [];
  boardUI.legalTargets = [];
  hideCoach();
  renderAll();
  startTurn();
}

function fenKey(fen) { return fen.split(" ").slice(0, 4).join(" "); }

/* ── Boucle de jeu ── */
async function startTurn() {
  if (checkGameOver()) return;
  if (state.chess.turn() === state.userColor) {
    await analyzeForUser();
  } else {
    await playEngineMove();
  }
}

async function analyzeForUser() {
  state.phase = "analyzing";
  setStatus("Analyse de la position… (MultiPV)");
  boardUI.dots = [];
  renderBoard();
  const fen = state.chess.fen();
  const res = await state.engine.analyze({ fen, multipv: 6, movetime: movetime(), elo: 0 });
  if (state.chess.fen() !== fen) return; // partie changée entre temps
  buildCandidates(res.lines, fen);
  updateEvalBar(res.lines[0]);
  // Précision du dernier coup engine : l'eval top-1 de cette analyse (POV utilisateur)
  // inversée donne l'eval APRÈS le coup engine de son point de vue.
  if (state.accuracy.pendingEngine && res.lines.length) {
    const p = state.accuracy.pendingEngine;
    state.accuracy.pendingEngine = null;
    recordAccuracy(p.color, p.beforeCp, -clampCpFromLine(res.lines[0]));
  }
  state.phase = "userTurn";
  setStatus("À vous de jouer — les points indiquent les coups candidats.");
  renderAll();
}

function buildCandidates(lines, fen) {
  if (!lines.length) { state.candidates = []; return; }
  const best = lines[0];
  const bestVal = scoreValue(best);
  state.candidates = lines.map((line, i) => {
    const deltaCp = Math.max(0, bestVal - scoreValue(line));
    const args = buildArguments(fen, line, best, state.fenHistory);
    return { rank: i + 1, uci: line.pv[0], san: args.san, line, deltaCp, args };
  });
  boardUI.dots = state.candidates.map((c) => ({
    square: c.uci.slice(2, 4),
    rank: c.rank,
    quality: qualityClass(c.deltaCp, c.rank),
    title: `${c.san} (${formatScore(c.line, state.chess.turn() === "w")})`,
  }));
}

async function playEngineMove() {
  state.phase = "engineThinking";
  setStatus("Stockfish réfléchit…");
  boardUI.dots = [];
  renderBoard();
  const fen = state.chess.fen();
  const elo = opponentElo();
  const res = await state.engine.analyze({ fen, multipv: 1, movetime: Math.min(movetime(), 1200), elo });
  if (state.chess.fen() !== fen) return;
  if (!res.bestmove || res.bestmove === "(none)") { checkGameOver(); return; }
  const engineColor = state.chess.turn();
  const mv = state.chess.move(uciToMoveObj(res.bestmove));
  if (mv) {
    boardUI.lastMove = { from: mv.from, to: mv.to };
    state.fenHistory.push(fenKey(state.chess.fen()));
    // Eval AVANT (POV engine) = top-1 de son analyse ; APRÈS = top-1 de la
    // prochaine analyse MultiPV utilisateur (déjà lancée pour son tour).
    if (res.lines.length) {
      state.accuracy.pendingEngine = { color: engineColor, beforeCp: clampCpFromLine(res.lines[0]) };
    }
  }
  renderAll();
  startTurn();
}

/* ── Interaction échiquier ── */
function onSquareClick(sq) {
  if (state.phase !== "userTurn") return;
  const piece = state.chess.get(sq);
  if (boardUI.selected) {
    if (boardUI.selected === sq) {
      boardUI.selected = null; boardUI.legalTargets = [];
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
  if (piece && piece.color === state.userColor) {
    boardUI.selected = sq;
    boardUI.legalTargets = state.chess.moves({ square: sq, verbose: true }).map((m) => m.to);
  } else {
    boardUI.selected = null; boardUI.legalTargets = [];
  }
  renderBoard();
}

/* ── Cœur du concept : interception ── */
async function attemptUserMove(moveObj) {
  boardUI.selected = null;
  boardUI.legalTargets = [];
  const uci = moveObj.from + moveObj.to + (moveObj.promotion || "");
  let cand = state.candidates.find((c) => c.uci === uci);

  if (!cand) {
    // Coup hors du top : évaluation rapide de ce coup précis
    setStatus("Évaluation de votre coup…");
    state.phase = "analyzing";
    renderBoard();
    const probe = new Chess(state.chess.fen());
    probe.move(moveObj);
    const res = await state.engine.analyze({ fen: probe.fen(), multipv: 1, movetime: 600, elo: 0 });
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
    } else {
      line = { multipv: 99, depth: 0, scoreCp: -9999, mate: null, pv: [uci] };
    }
    const best = state.candidates[0] ? state.candidates[0].line : line;
    const deltaCp = Math.max(0, scoreValue(best) - scoreValue(line));
    const args = buildArguments(state.chess.fen(), line, best, state.fenHistory);
    cand = { rank: null, uci, san: args.san, line, deltaCp, args };
    state.phase = "userTurn";
  }

  if (cand.deltaCp > thresholdCp()) {
    interceptMove(moveObj, cand);
  } else {
    commitUserMove(moveObj, cand, false);
  }
}

function interceptMove(moveObj, cand) {
  state.phase = "coach";
  state.pendingMove = { ...moveObj, uci: cand.uci, cand };
  state.stats.intercepts++;
  const bestSan = state.candidates[0] ? state.candidates[0].san : "—";
  $("coach-message").textContent =
    `Non, ne joue pas ${cand.san} (perte de ${(cand.deltaCp / 100).toFixed(2)}) ! Joue plutôt ${bestSan}.`;
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
    <div class="cand-args">${pros}${cons || ""}</div>`;
  if (!isUserMove) {
    div.title = "Cliquer pour jouer ce coup";
    div.addEventListener("click", () => {
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
  const mv = state.chess.move(moveObj);
  if (!mv) return;
  // Précision du coup utilisateur : avant = meilleur candidat, après = candidat joué.
  if (cand && state.candidates.length) {
    recordAccuracy(userMoveColor,
      clampCpFromLine(state.candidates[0].line),
      clampCpFromLine(cand.line));
  }
  boardUI.lastMove = { from: mv.from, to: mv.to };
  boardUI.dots = [];
  state.fenHistory.push(fenKey(state.chess.fen()));
  state.stats.moves++;
  if (cand && cand.rank === 1) state.stats.top1++;
  if (cand && cand.rank !== null && cand.rank <= 3) state.stats.top3++;
  if (forced) state.stats.forced++;
  state.pendingMove = null;
  hideCoach();
  renderAll();
  startTurn();
}

function hideCoach() {
  $("coach-panel").classList.add("hidden");
}

/* ── Fin de partie ── */
function checkGameOver() {
  const c = state.chess;
  if (!c.game_over()) return false;
  state.phase = "gameover";
  boardUI.dots = [];
  let msg = "Partie terminée — ";
  if (c.in_checkmate()) {
    msg += c.turn() === state.userColor ? "échec et mat, vous avez perdu." : "échec et mat, vous avez gagné !";
  } else if (c.in_stalemate()) msg += "pat (nulle).";
  else if (c.in_threefold_repetition()) msg += "nulle par répétition.";
  else if (c.insufficient_material()) msg += "nulle (matériel insuffisant).";
  else msg += "nulle.";
  setStatus(msg);
  renderBoard();
  return true;
}

/* ── Rendu ── */
function renderAll() { renderBoard(); renderCandidatesList(); renderHistory(); renderStats(); }
function renderBoard() { boardUI.render(state.chess); }

function renderCandidatesList() {
  const wrap = $("candidates-list");
  if (!state.candidates.length) { wrap.innerHTML = "<em>En attente d'analyse…</em>"; return; }
  const whiteSide = state.chess.turn() === "w";
  wrap.innerHTML = state.candidates.map((c) => {
    const q = qualityClass(c.deltaCp, c.rank);
    const colors = { "q-best": "var(--green)", "q-good": "var(--yellow)", "q-mid": "var(--orange)", "q-bad": "var(--red)" };
    return `<div class="cl-row"><span class="cl-dot" style="background:${colors[q]}"></span>
      <strong>${c.rank}. ${esc(c.san)}</strong>
      <span style="margin-left:auto;color:var(--text-dim)">${formatScore(c.line, whiteSide)}</span></div>`;
  }).join("");
}

function renderHistory() {
  const hist = state.chess.history();
  let html = "";
  for (let i = 0; i < hist.length; i += 2) {
    html += `<span class="mvnum">${i / 2 + 1}.</span><span class="mv">${esc(hist[i])}</span>`;
    if (hist[i + 1]) html += `<span class="mv">${esc(hist[i + 1])}</span>`;
  }
  $("move-history").innerHTML = html || "<em>Aucun coup joué.</em>";
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
function recordAccuracy(color, beforeCp, afterCp) {
  state.accuracy[color].push(moveAccuracyPct(beforeCp, afterCp));
  renderAccuracy();
}
function resetAccuracy() {
  state.accuracy = { w: [], b: [], pendingEngine: null };
  renderAccuracy();
}
function avgAccuracy(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}
function accColor(v) {
  return v >= 90 ? "var(--green)" : v >= 80 ? "var(--yellow)" : v >= 60 ? "var(--orange)" : "var(--red)";
}
function accuracyHtml() {
  const youAreWhite = state.userColor === "w";
  const parts = [["w", youAreWhite ? "Blancs (toi)" : "Blancs (SF)"],
                 ["b", youAreWhite ? "Noirs (SF)" : "Noirs (toi)"]].map(([c, label]) => {
    const v = avgAccuracy(state.accuracy[c]);
    if (v === null) return `${esc(label)}: <span style="color:var(--text-dim)">—</span>`;
    return `${esc(label)}: <span style="color:${accColor(v)};font-weight:600">${v.toFixed(1)}%</span>`;
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
    : (cp / 100).toFixed(1);
}

function setStatus(msg) { $("status-line").textContent = msg; }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ── Boutons ── */
$("btn-new").addEventListener("click", newGame);
$("sel-color").addEventListener("change", newGame);
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
  // Annule jusqu'à revenir au trait du joueur (1 ou 2 demi-coups)
  let undone = 0;
  while (undone < 2 && state.chess.history().length > 0) {
    state.chess.undo();
    state.fenHistory.pop();
    undone++;
    if (state.chess.turn() === state.userColor) break;
  }
  if (state.stats.moves > 0) state.stats.moves--;
  state.accuracy.pendingEngine = null;
  boardUI.lastMove = null;
  renderAll();
  startTurn();
});
$("btn-fen").addEventListener("click", () => {
  const fen = prompt("Collez une position FEN :");
  if (!fen) return;
  const test = new Chess();
  if (!test.load(fen.trim())) { alert("FEN invalide."); return; }
  state.chess = new Chess(fen.trim());
  state.fenHistory = [fenKey(state.chess.fen())];
  state.candidates = [];
  resetAccuracy();
  boardUI.lastMove = null;
  boardUI.dots = [];
  hideCoach();
  renderAll();
  startTurn();
});

init();
