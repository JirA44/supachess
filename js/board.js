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
    this.showDots = true;
    this.selected = null;
    this.lastMove = null;   // {from, to}
    this.dots = [];         // [{square, label, quality, title}]
    this.previewDot = null;
    this.legalTargets = [];
  }

  setFlipped(f) { this.flipped = f; }

  render(chess) {
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
          span.textContent = UNICODE_PIECES[piece.color][piece.type];
          cell.appendChild(span);
        }
        if (this.selected === sq) cell.classList.add("selected");
        if (this.lastMove && (this.lastMove.from === sq || this.lastMove.to === sq)) {
          cell.classList.add("lastmove");
        }
        if (this.legalTargets.includes(sq)) {
          const hint = document.createElement("span");
          hint.className = "legal-hint";
          cell.appendChild(hint);
        }
        const dotsHere = this.dots.filter((d) => d.square === sq);
        if (this.showDots && dotsHere.length) {
          const stack = document.createElement("span");
          stack.className = "cdot-stack" + (dotsHere.length > 1 ? " multiple" : "");
          for (const dot of dotsHere) {
            const bubble = document.createElement("span");
            bubble.className = "cdot tone-" + dot.quality;
            appendBoardBubbleText(bubble, dot.label || dot.rank, dot.evaluation);
            bubble.title = dot.title || "Coup candidat";
            bubble.setAttribute("aria-label", bubble.title);
            stack.appendChild(bubble);
          }
          cell.appendChild(stack);
        }
        if (this.previewDot && this.previewDot.square === sq) {
          const preview = document.createElement("span");
          preview.className = "cdot preview-move-bubble tone-" + this.previewDot.quality;
          appendBoardBubbleText(preview, this.previewDot.label, this.previewDot.evaluation);
          preview.title = this.previewDot.title;
          cell.appendChild(preview);
        }
        if (this.lastMove && this.lastMove.to === sq && this.lastMove.grade) {
          const note = document.createElement("span");
          note.className = "played-move-bubble tone-" + this.lastMove.grade.tone;
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

function candidateDotsFromGroups(dotsBySquare) {
  return Array.from(dotsBySquare, ([square, moves]) => moves.map((move) => ({
    square,
    label: move.label,
    evaluation: move.evaluation,
    quality: move.grade.tone,
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
