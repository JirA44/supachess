/* board.js — échiquier custom CSS grid, pièces Unicode, interaction clic-clic. */
"use strict";

const UNICODE_PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

class BoardUI {
  constructor(el, onSquareClick) {
    this.el = el;
    this.onSquareClick = onSquareClick;
    this.flipped = false;
    this.selected = null;
    this.lastMove = null;   // {from, to}
    this.dots = [];         // [{square, rank, quality}]
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
        const dot = this.dots.find((d) => d.square === sq);
        if (dot) {
          const d = document.createElement("span");
          d.className = "cdot " + dot.quality;
          d.textContent = dot.rank;
          d.title = dot.title || "";
          cell.appendChild(d);
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

/* Couleur de qualité d'un coup candidat selon sa perte d'éval vs le top-1. */
function qualityClass(deltaCp, rank) {
  if (rank === 1 || deltaCp <= 10) return "q-best";
  if (deltaCp <= 30) return "q-good";
  if (deltaCp <= 80) return "q-mid";
  return "q-bad";
}
