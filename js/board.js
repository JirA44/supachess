/* board.js — échiquier custom CSS grid, pièces Unicode, interaction clic-clic. */
"use strict";

const UNICODE_PIECES = {
  // Filled glyph silhouettes let CSS paint the white pieces white on every font.
  w: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

class BoardUI {
  constructor(el, onSquareClick) {
    this.el = el;
    this.onSquareClick = onSquareClick;
    this.flipped = false;
    this.selected = null;
    this.lastMove = null;   // {from, to}
    this.dots = [];         // [{square, label, quality, title}]
    this.showDots = true;
    this.previewDot = null;
    this.legalTargets = [];
    this.legalTargetHints = {}; // destination -> {quality, capture, san, evaluation}
    this.showMoveDots = true;
    this.dragFrom = null;
    this.el.addEventListener("dragstart", (event) => {
      const piece = event.target.closest(".piece");
      const square = event.target.closest(".sq");
      if (!piece || !square) { event.preventDefault(); return; }
      this.dragFrom = square.dataset.square;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", this.dragFrom);
      }
    });
    this.el.addEventListener("dragover", (event) => {
      if (this.dragFrom && event.target.closest(".sq")) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });
    this.el.addEventListener("drop", (event) => {
      const target = event.target.closest(".sq");
      const from = this.dragFrom || event.dataTransfer?.getData("text/plain");
      const to = target && target.dataset.square;
      this.dragFrom = null;
      if (!from || !to || from === to) return;
      event.preventDefault();
      event.stopPropagation();
      this.onSquareClick(from);
      this.onSquareClick(to);
    });
    this.el.addEventListener("dragend", () => { this.dragFrom = null; });
  }

  setFlipped(f) { this.flipped = f; }

  render(chess) {
    if (activeCandidateTooltipAnchor) hideCandidateMoveTooltip();
    this.el.innerHTML = "";
    const board = chess.board();
    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = this.flipped ? 7 - vr : vr;
        const c = this.flipped ? 7 - vc : vc;
        const sq = String.fromCharCode(97 + c) + (8 - r);
        const cell = document.createElement("div");
        cell.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
        cell.dataset.square = sq;
        const piece = board[r][c];
        if (piece) {
          const span = document.createElement("span");
          span.className = "piece " + piece.color;
          span.draggable = piece.color === chess.turn();
          span.textContent = UNICODE_PIECES[piece.color][piece.type];
          cell.appendChild(span);
        }
        if (this.selected === sq) cell.classList.add("selected");
        if (this.lastMove && (this.lastMove.from === sq || this.lastMove.to === sq)) {
          cell.classList.add("lastmove");
        }
        if (this.showMoveDots && this.legalTargets.includes(sq)) {
          const hint = document.createElement("span");
          const detail = this.legalTargetHints[sq] || {};
          hint.className = "legal-hint" + (detail.quality ? " " + detail.quality : " q-neutral") + (detail.capture ? " capture" : "");
          hint.title = detail.san
            ? detail.categoryLabel
              ? `${detail.capture ? "Prise possible" : "Coup légal"} : ${detail.san} · ${detail.categoryLabel} · ${detail.source || "déjà évalué"} · évaluation ${detail.evaluation || "—"}`
              : `${detail.capture ? "Prise légale possible" : "Coup légal possible"} : ${detail.san} · Stockfish ne l’a pas évalué dans cette position : qualité inconnue`
            : "Coup légal possible";
          hint.setAttribute("aria-label", hint.title);
          cell.appendChild(hint);
        }
        const playedError = this.lastMove && this.lastMove.to === sq && this.lastMove.grade && this.lastMove.grade.tone === "bad";
        const previewError = this.previewDot && this.previewDot.square === sq && this.previewDot.quality === "bad";
        if (playedError || previewError) {
          cell.classList.add("bad-move");
          const marker = document.createElement("span");
          marker.className = "bad-move-marker";
          marker.textContent = "!";
          marker.title = playedError
            ? `${this.lastMove.san || "Coup joué"} — ${this.lastMove.grade.label}`
            : this.previewDot.title || "Coup testé : erreur";
          marker.setAttribute("aria-label", marker.title);
          cell.appendChild(marker);
        }
        const dotsHere = this.showDots ? this.dots.filter((d) => d.square === sq) : [];
        if (dotsHere.length) {
          const stack = document.createElement("span");
          stack.className = "cdot-stack" + (dotsHere.length > 1 ? " multiple" : "");
          for (const dot of dotsHere) {
            const bubble = document.createElement("span");
            bubble.className = "cdot tone-" + dot.quality + (dot.category ? " grade-" + dot.category : "");
            appendBoardBubbleText(bubble, dot.label || dot.rank, dot.evaluation);
            const moveSan = dot.san || dot.moveSan || "";
            bubble.setAttribute("aria-label", moveSan
              ? `${dot.label || dot.rank || "Coup candidat"} · ${dot.evaluation || "évaluation indisponible"} · coup à jouer ${moveSan}`
              : dot.title || "Coup candidat");
            if (moveSan) {
              bubble.tabIndex = 0;
              bubble.addEventListener("pointerenter", () => showCandidateMoveTooltip(bubble, moveSan));
              bubble.addEventListener("pointerleave", hideCandidateMoveTooltip);
              bubble.addEventListener("focus", () => showCandidateMoveTooltip(bubble, moveSan));
              bubble.addEventListener("blur", hideCandidateMoveTooltip);
            }
            stack.appendChild(bubble);
          }
          cell.appendChild(stack);
        }
        if (this.previewDot && this.previewDot.square === sq) {
          const preview = document.createElement("span");
          preview.className = "cdot preview-move-bubble tone-" + this.previewDot.quality + (this.previewDot.category ? " grade-" + this.previewDot.category : "");
          appendBoardBubbleText(preview, this.previewDot.label, this.previewDot.evaluation);
          preview.title = this.previewDot.title;
          cell.appendChild(preview);
        }
        if (this.lastMove && this.lastMove.to === sq && this.lastMove.grade) {
          const note = document.createElement("span");
          note.className = "played-move-bubble tone-" + this.lastMove.grade.tone + " grade-" + (this.lastMove.grade.category || "unrated");
          const rating = this.lastMove.grade.rating === null ? "…" : this.lastMove.grade.rating;
          appendBoardBubbleText(note, `${this.lastMove.grade.symbol}${rating}`, this.lastMove.evaluation);
          note.title = `${this.lastMove.san || "Coup joué"} · ${this.lastMove.grade.rating === null ? "analyse en cours" : this.lastMove.grade.label}`;
          note.setAttribute("aria-label", `${note.title} · évaluation ${this.lastMove.evaluation || "indisponible"}`);
          cell.appendChild(note);
        }
        // Coordonnées sur les bords
        if (vc === 7) {
          const rk = document.createElement("span");
          rk.className = "coord rank";
          rk.textContent = 8 - r;
          cell.appendChild(rk);
        }
        if (vr === 7) {
          const fl = document.createElement("span");
          fl.className = "coord file";
          fl.textContent = String.fromCharCode(97 + c);
          cell.appendChild(fl);
        }
        cell.addEventListener("click", () => this.onSquareClick(sq));
        this.el.appendChild(cell);
      }
    }
  }
}

let activeCandidateTooltipAnchor = null;
function showCandidateMoveTooltip(anchor, moveSan) {
  if (!anchor || !moveSan) return;
  let tooltip = document.getElementById("candidate-move-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "candidate-move-tooltip";
    tooltip.className = "candidate-move-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);
  }
  if (activeCandidateTooltipAnchor && activeCandidateTooltipAnchor !== anchor) activeCandidateTooltipAnchor.removeAttribute("aria-describedby");
  activeCandidateTooltipAnchor = anchor;
  tooltip.textContent = "À jouer : " + moveSan;
  tooltip.hidden = false;
  tooltip.setAttribute("aria-hidden", "false");
  anchor.setAttribute("aria-describedby", tooltip.id);
  tooltip.style.left = "0px";
  tooltip.style.top = "0px";
  const anchorRect = anchor.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const gap = 8;
  let left = anchorRect.right + gap;
  let side = "right";
  if (left + tooltipRect.width > window.innerWidth - gap) {
    left = anchorRect.left - tooltipRect.width - gap;
    side = "left";
  }
  tooltip.dataset.side = side;
  left = Math.max(gap, Math.min(left, window.innerWidth - tooltipRect.width - gap));
  const top = Math.max(gap, Math.min(anchorRect.top + (anchorRect.height - tooltipRect.height) / 2, window.innerHeight - tooltipRect.height - gap));
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}
function hideCandidateMoveTooltip() {
  const tooltip = document.getElementById("candidate-move-tooltip");
  if (tooltip) { tooltip.hidden = true; tooltip.setAttribute("aria-hidden", "true"); }
  if (activeCandidateTooltipAnchor) activeCandidateTooltipAnchor.removeAttribute("aria-describedby");
  activeCandidateTooltipAnchor = null;
}

function candidateDotsFromGroups(dotsBySquare) {
  return Array.from(dotsBySquare, ([square, moves]) => moves.map((move) => ({
    square,
    label: move.label,
    san: move.san,
    evaluation: move.evaluation,
    quality: move.grade.tone,
    category: move.grade.category,
    title: `${move.san}: ${move.label} · ${move.evaluation}`,
  }))).flat();
}
function appendBoardBubbleText(bubble, grade, evaluation) {
  const gradeLine = document.createElement("span");
  gradeLine.className = "board-bubble-grade";
  gradeLine.textContent = grade || "…";
  const evalLine = document.createElement("span");
  evalLine.className = "board-bubble-eval";
  evalLine.textContent = evaluation || "—";
  bubble.append(gradeLine, evalLine);
}

/* Couleur de qualité d'un coup candidat selon sa perte d'éval vs le top-1. */
function qualityClass(deltaCp, rank) {
  if (rank === 1 || deltaCp <= 10) return "q-best";
  if (deltaCp <= 30) return "q-good";
  if (deltaCp <= 80) return "q-mid";
  return "q-bad";
}
