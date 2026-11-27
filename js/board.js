/* board.js — échiquier custom CSS grid, pièces Unicode, clic-clic et glisser-déposer fluide.
   Les 64 cases sont créées une seule fois puis mises à jour en place (textContent + className),
   le glisser-déposer suit le pointeur via transform: translate3d(...) appliqué en requestAnimationFrame. */
"use strict";

const UNICODE_PIECES = {
  // VS15 forces the pawn glyph into text presentation so iOS Safari honors the white-piece CSS.
  w: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟︎" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟︎" },
};

const BOARD_SQUARES = (() => {
  const list = [];
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) list.push(String.fromCharCode(97 + file) + (8 - row));
  }
  return list;
})();

/* Remplace les enfants d'un conteneur sans dépendre de replaceChildren (DOM de test minimal). */
function setBoardChildren(parent, children) {
  if (typeof parent.replaceChildren === "function") {
    parent.replaceChildren.apply(parent, children);
    return;
  }
  while (parent.children && parent.children.length) {
    const child = parent.children[0];
    if (typeof parent.removeChild === "function") parent.removeChild(child);
    else if (typeof child.remove === "function") child.remove();
    else break;
  }
  for (const child of children) parent.appendChild(child);
}

let boardArrowCounter = 0;

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
    this.pointerGesture = null;
    this.mateFall = null;
    this.mateFallAnimated = false;
    this.suppressPointerClick = false;
    this.locked = false;
    this.cells = new Map();   // square -> {cell, piece, legalHint, badMarker, stack, preview, played, ...}
    this.arrowSvg = null;
    this.arrowLines = [];
    this.arrowDefs = null;
    this.arrowId = "supa-engine-arrow-" + (++boardArrowCounter);
    this.drag = null;         // {from, piece, startX, startY, lastX, lastY}
    this.dragSource = null;   // case d'origine pendant le glisser
    this.dragRafId = 0;
    this.dragRafActive = false;
    this.el.addEventListener("pointerdown", (event) => this._onPointerDown(event));
    this.el.addEventListener("pointermove", (event) => this._onPointerMove(event));
    this.el.addEventListener("pointerup", (event) => this._onPointerUp(event));
    this.el.addEventListener("pointercancel", () => this._onPointerCancel());
  }

  setFlipped(f) {
    this.flipped = f;
    if (this.cells.size) this._syncLayout();
  }

  /* Verrou d'interaction : l'échiquier reste visible mais ne répond pas
     tant que la leçon demande une réponse préalable (QCM). */
  setLocked(locked) {
    const next = Boolean(locked);
    if (this.locked === next) return;
    this.locked = next;
    if (this.el.classList && typeof this.el.classList.toggle === "function") {
      this.el.classList.toggle("is-locked", next);
    }
    this.el.setAttribute("aria-disabled", String(next));
    if (next) {
      this.pointerGesture = null;
      this._endDrag();
      this.selected = null;
      this.legalTargets = [];
    }
  }

  /* ── Glisser-déposer ─────────────────────────────────────────────── */
  _onPointerDown(event) {
    if (this.locked) return;
    const square = event.target && event.target.closest ? event.target.closest(".sq") : null;
    if (!square || !this.el.contains(square) || square.dataset.hasPiece !== "true" ||
        event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    this.pointerGesture = {
      id: event.pointerId,
      from: square.dataset.square,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      dragging: false,
    };
  }

  _onPointerMove(event) {
    const gesture = this.pointerGesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    if (!gesture.dragging) {
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 6) return;
      gesture.dragging = true;
      this._startDrag(gesture);
    }
    try { this.el.setPointerCapture(event.pointerId); } catch (_) {}
    if (event.cancelable) event.preventDefault();
    this._scheduleDragFrame();
  }

  _onPointerUp(event) {
    const gesture = this.pointerGesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    this.pointerGesture = null;
    const wasDragging = gesture.dragging;
    // La case cible est lue AVANT de reposer la pièce : la pièce flottante ignore le pointeur.
    let target = null;
    if (wasDragging && typeof document.elementFromPoint === "function") {
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      target = hit && hit.closest ? hit.closest(".sq") : null;
    }
    this._endDrag();
    if (!wasDragging) return;
    const to = target && this.el.contains(target) ? target.dataset.square : null;
    if (!to || to === gesture.from) return;
    if (event.cancelable) event.preventDefault();
    this.suppressPointerClick = true;
    setTimeout(() => { this.suppressPointerClick = false; }, 0);
    if (this.selected !== gesture.from) this.onSquareClick(gesture.from);
    this.onSquareClick(to);
  }

  _onPointerCancel() {
    this.pointerGesture = null;
    this._endDrag();
  }

  _startDrag(gesture) {
    const state = this.cells.get(gesture.from);
    if (!state) return;
    const piece = state.piece;
    if (!piece || typeof piece.getBoundingClientRect !== "function") return;
    const rect = piece.getBoundingClientRect();
    this.drag = { from: gesture.from, piece, startX: gesture.x, startY: gesture.y, lastX: gesture.lastX, lastY: gesture.lastY };
    this.dragSource = gesture.from;
    if (this.el.classList && typeof this.el.classList.add === "function") this.el.classList.add("is-dragging");
    if (piece.style) {
      piece.style.position = "fixed";
      piece.style.left = rect.left + "px";
      piece.style.top = rect.top + "px";
      piece.style.width = rect.width + "px";
      piece.style.height = rect.height + "px";
      piece.style.margin = "0";
      piece.style.zIndex = "999";
      piece.style.willChange = "transform";
      piece.style.transform = "translate3d(0px, 0px, 0)";
    }
    piece.className = (piece.className ? piece.className + " " : "") + "is-drag-piece";
  }

  _scheduleDragFrame() {
    if (this.dragRafActive) return;
    this.dragRafActive = true;
    const run = () => {
      this.dragRafActive = false;
      this.dragRafId = 0;
      this._applyDragTransform();
    };
    if (typeof requestAnimationFrame === "function") this.dragRafId = requestAnimationFrame(run);
    else this.dragRafId = setTimeout(run, 16);
  }

  _cancelDragFrame() {
    this.dragRafActive = false;
    if (!this.dragRafId) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.dragRafId);
    else clearTimeout(this.dragRafId);
    this.dragRafId = 0;
  }

  _applyDragTransform() {
    const drag = this.drag;
    if (!drag || !drag.piece || !drag.piece.style) return;
    const dx = drag.lastX - drag.startX;
    const dy = drag.lastY - drag.startY;
    drag.piece.style.transform = "translate3d(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px, 0)";
  }

  _endDrag() {
    this._cancelDragFrame();
    const drag = this.drag;
    this.drag = null;
    this.dragSource = null;
    if (drag && drag.piece) {
      const piece = drag.piece;
      if (piece.style) {
        piece.style.position = "";
        piece.style.left = "";
        piece.style.top = "";
        piece.style.width = "";
        piece.style.height = "";
        piece.style.margin = "";
        piece.style.zIndex = "";
        piece.style.willChange = "";
        piece.style.transform = "";
      }
      piece.className = String(piece.className || "").replace(/\s*is-drag-piece/g, "");
    }
    if (this.el.classList && typeof this.el.classList.remove === "function") this.el.classList.remove("is-dragging");
  }

  /* ── Structure persistante ───────────────────────────────────────── */
  _ensureCells() {
    if (this.cells.size === BOARD_SQUARES.length) return;
    for (const sq of BOARD_SQUARES) {
      const file = sq.charCodeAt(0) - 97;
      const rank = Number(sq[1]);
      const light = (file + (8 - rank)) % 2 === 0;
      const cell = document.createElement("div");
      cell.className = "sq " + (light ? "light" : "dark");
      cell.dataset.square = sq;
      cell.dataset.hasPiece = "false";

      const piece = document.createElement("span");
      piece.className = "";
      const legalHint = document.createElement("span");
      legalHint.className = "";
      const badMarker = document.createElement("span");
      badMarker.className = "";
      const stack = document.createElement("span");
      stack.className = "";
      const preview = document.createElement("span");
      preview.className = "";
      const previewGrade = document.createElement("span");
      previewGrade.className = "board-bubble-grade";
      const previewEval = document.createElement("span");
      previewEval.className = "board-bubble-eval";
      preview.append(previewGrade, previewEval);
      const played = document.createElement("span");
      played.className = "";
      const playedGrade = document.createElement("span");
      playedGrade.className = "board-bubble-grade";
      const playedEval = document.createElement("span");
      playedEval.className = "board-bubble-eval";
      played.append(playedGrade, playedEval);
      const coordRank = document.createElement("span");
      coordRank.className = "coord rank";
      coordRank.textContent = String(rank);
      const coordFile = document.createElement("span");
      coordFile.className = "coord file";
      coordFile.textContent = String.fromCharCode(97 + file);

      cell.append(piece, legalHint, badMarker, stack, preview, played, coordRank, coordFile);
      cell.addEventListener("click", (event) => {
        if (this.suppressPointerClick) {
          this.suppressPointerClick = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (this.locked) {
          event.preventDefault();
          return;
        }
        this.onSquareClick(sq);
      });
      this.el.appendChild(cell);
      this.cells.set(sq, {
        cell, piece, legalHint, badMarker, stack, preview, previewGrade, previewEval,
        played, playedGrade, playedEval, coordRank, coordFile,
        light, rankHost: null, fileHost: null,
      });
    }
    this._syncLayout();
  }

  /* Position visuelle (retournement) + coordonnées : mise à jour sans recréer les cases. */
  _syncLayout() {
    for (const [sq, state] of this.cells) {
      const file = sq.charCodeAt(0) - 97;
      const rank = Number(sq[1]);
      const visualRow = this.flipped ? rank - 1 : 8 - rank;
      const visualCol = this.flipped ? 7 - file : file;
      if (state.cell.style) state.cell.style.order = String(visualRow * 8 + visualCol);
      const showRank = visualCol === 7;
      const showFile = visualRow === 7;
      if (showRank) {
        if (state.rankHost !== state.cell) {
          if (state.rankHost && typeof state.rankHost.removeChild === "function") state.rankHost.removeChild(state.coordRank);
          state.cell.appendChild(state.coordRank);
          state.rankHost = state.cell;
        }
      } else if (state.rankHost) {
        if (typeof state.rankHost.removeChild === "function") state.rankHost.removeChild(state.coordRank);
        state.rankHost = null;
      }
      if (showFile) {
        if (state.fileHost !== state.cell) {
          if (state.fileHost && typeof state.fileHost.removeChild === "function") state.fileHost.removeChild(state.coordFile);
          state.cell.appendChild(state.coordFile);
          state.fileHost = state.cell;
        }
      } else if (state.fileHost) {
        if (typeof state.fileHost.removeChild === "function") state.fileHost.removeChild(state.coordFile);
        state.fileHost = null;
      }
    }
  }

  render(chess) {
    if (activeCandidateTooltipAnchor) hideCandidateMoveTooltip();
    this._ensureCells();
    const board = chess.board();
    for (let row = 0; row < 8; row++) {
      for (let file = 0; file < 8; file++) {
        const sq = String.fromCharCode(97 + file) + (8 - row);
        this._renderCell(sq, board[row][file]);
      }
    }
    this._renderArrows();
  }

  _renderCell(sq, piece) {
    const state = this.cells.get(sq);
    if (!state) return;
    const cell = state.cell;
    cell.dataset.hasPiece = piece ? "true" : "false";

    let kingSquare = false;
    if (piece) {
      const glyph = UNICODE_PIECES[piece.color][piece.type];
      if (state.piece.textContent !== glyph) state.piece.textContent = glyph;
      let pieceClass = "piece " + piece.color;
      if (piece.type === "k" && this.mateFall && this.mateFall.square === sq && this.mateFall.color === piece.color) {
        const bottomColor = this.flipped ? "b" : "w";
        const direction = piece.color === bottomColor ? "bottom" : "top";
        pieceClass += " checkmate-king " + (this.mateFallAnimated ? "checkmate-king-fallen" : "checkmate-king-fall-" + direction) + " checkmate-fall-" + direction;
        this.mateFallAnimated = true;
        kingSquare = true;
      }
      if (this.drag && this.drag.piece === state.piece) pieceClass += " is-drag-piece";
      state.piece.className = pieceClass;
    } else {
      state.piece.textContent = "";
      state.piece.className = "";
    }

    const playedError = Boolean(this.lastMove && this.lastMove.to === sq && this.lastMove.grade && this.lastMove.grade.tone === "bad");
    const previewError = Boolean(this.previewDot && this.previewDot.square === sq && this.previewDot.quality === "bad");

    const classes = ["sq", state.light ? "light" : "dark"];
    if (this.selected === sq) classes.push("selected");
    if (this.lastMove && (this.lastMove.from === sq || this.lastMove.to === sq)) classes.push("lastmove");
    if (playedError || previewError) classes.push("bad-move");
    if (kingSquare) classes.push("checkmate-king-square");
    if (this.dragSource === sq) classes.push("dragging-source");
    cell.className = classes.join(" ");

    if (this.showMoveDots && this.legalTargets.includes(sq)) {
      const detail = this.legalTargetHints[sq] || {};
      state.legalHint.className = "legal-hint" + (detail.quality ? " " + detail.quality : " q-neutral") + (detail.capture ? " capture" : "");
      state.legalHint.title = detail.san
        ? detail.categoryLabel
          ? `${detail.capture ? "Prise possible" : "Coup légal"} : ${detail.san} · ${detail.categoryLabel} · ${detail.source || "déjà évalué"} · évaluation ${detail.evaluation || "—"}`
          : `${detail.capture ? "Prise légale possible" : "Coup légal possible"} : ${detail.san} · non évalué par Stockfish dans cette position : qualité inconnue`
        : "Coup légal possible";
      state.legalHint.setAttribute("aria-label", state.legalHint.title);
    } else {
      state.legalHint.className = "";
      state.legalHint.title = "";
      if (typeof state.legalHint.removeAttribute === "function") state.legalHint.removeAttribute("aria-label");
    }

    if (playedError || previewError) {
      state.badMarker.className = "bad-move-marker";
      state.badMarker.textContent = "!";
      state.badMarker.title = playedError
        ? `${this.lastMove.san || "Coup joué"} — ${this.lastMove.grade.label}`
        : this.previewDot.title || "Coup testé : erreur";
      state.badMarker.setAttribute("aria-label", state.badMarker.title);
    } else {
      state.badMarker.className = "";
      state.badMarker.textContent = "";
      state.badMarker.title = "";
      if (typeof state.badMarker.removeAttribute === "function") state.badMarker.removeAttribute("aria-label");
    }

    const dotsHere = this.showDots ? this.dots.filter((d) => d.square === sq) : [];
    if (dotsHere.length) {
      const bubbles = dotsHere.map((dot) => {
        const bubble = document.createElement("span");
        bubble.className = "cdot tone-" + dot.quality + (dot.category ? " grade-" + dot.category : "");
        appendBoardBubbleText(bubble, dot.label || dot.rank, dot.evaluation);
        const moveSan = dot.san || dot.moveSan || "";
        bubble.title = dot.title || "";
        bubble.setAttribute("aria-label", moveSan
          ? `${dot.category === "brilliant" ? `Coup brillant repéré par ${dot.source || "le système Supa"}. ` : ""}${dot.label || dot.rank || "Coup candidat"} · ${dot.evaluation || "évaluation indisponible"} · coup à jouer ${moveSan}`
          : dot.title || "Coup candidat");
        if (moveSan) {
          bubble.tabIndex = 0;
          bubble.addEventListener("pointerenter", () => showCandidateMoveTooltip(bubble, moveSan));
          bubble.addEventListener("pointerleave", hideCandidateMoveTooltip);
          bubble.addEventListener("focus", () => showCandidateMoveTooltip(bubble, moveSan));
          bubble.addEventListener("blur", hideCandidateMoveTooltip);
        }
        return bubble;
      });
      setBoardChildren(state.stack, bubbles);
      state.stack.className = "cdot-stack" + (dotsHere.length > 1 ? " multiple" : "");
    } else {
      setBoardChildren(state.stack, []);
      state.stack.className = "";
    }

    if (this.previewDot && this.previewDot.square === sq) {
      state.preview.className = "preview-move-bubble tone-" + this.previewDot.quality + (this.previewDot.category ? " grade-" + this.previewDot.category : "");
      state.previewGrade.textContent = this.previewDot.label;
      state.previewEval.textContent = this.previewDot.evaluation;
      state.preview.title = this.previewDot.title;
    } else {
      state.preview.className = "";
      state.previewGrade.textContent = "";
      state.previewEval.textContent = "";
      state.preview.title = "";
    }

    if (this.lastMove && this.lastMove.to === sq && this.lastMove.grade) {
      const grade = this.lastMove.grade;
      const rating = grade.rating === null ? "…" : grade.rating;
      state.played.className = "played-move-bubble tone-" + grade.tone + " grade-" + (grade.category || "unrated");
      state.playedGrade.textContent = `${grade.symbol}${rating}`;
      state.playedEval.textContent = this.lastMove.evaluation;
      state.played.title = `${this.lastMove.san || "Coup joué"} · ${grade.rating === null ? "analyse en cours" : grade.label}`;
      state.played.setAttribute("aria-label", `${state.played.title} · évaluation ${this.lastMove.evaluation || "indisponible"}`);
    } else {
      state.played.className = "";
      state.playedGrade.textContent = "";
      state.playedEval.textContent = "";
      state.played.title = "";
      if (typeof state.played.removeAttribute === "function") state.played.removeAttribute("aria-label");
    }
  }

  /* Couche SVG recyclée : l'élément <svg> et ses 4 lignes sont conservés d'un rendu à l'autre. */
  _renderArrows() {
    const uciList = Array.isArray(this.engineArrows) ? this.engineArrows.slice(0, 4) : [];
    if (!this.showEngineArrows || !uciList.length) {
      if (this.arrowSvg && this.arrowSvg.style) this.arrowSvg.style.display = "none";
      return;
    }
    const svgNs = "http://www.w3.org/2000/svg";
    if (!this.arrowSvg) {
      const svg = document.createElementNS(svgNs, "svg");
      svg.setAttribute("class", "engine-arrow-overlay");
      svg.setAttribute("viewBox", "0 0 800 800");
      svg.setAttribute("aria-hidden", "true");
      const colors = ["#16a36a", "#2581d8", "#e19b24", "#ff3366"];
      const defs = document.createElementNS(svgNs, "defs");
      for (let index = 0; index < 4; index++) {
        const marker = document.createElementNS(svgNs, "marker");
        marker.setAttribute("id", this.arrowId + "-head-" + index);
        marker.setAttribute("markerWidth", "8");
        marker.setAttribute("markerHeight", "8");
        marker.setAttribute("refX", "6");
        marker.setAttribute("refY", "3");
        marker.setAttribute("orient", "auto");
        const head = document.createElementNS(svgNs, "path");
        head.setAttribute("d", "M0,0 L0,6 L7,3 z");
        head.setAttribute("fill", colors[index]);
        marker.appendChild(head);
        defs.appendChild(marker);
      }
      svg.appendChild(defs);
      for (let index = 0; index < 4; index++) {
        const line = document.createElementNS(svgNs, "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", "0");
        line.setAttribute("x2", "0");
        line.setAttribute("y2", "0");
        line.setAttribute("stroke", colors[index]);
        line.setAttribute("stroke-width", index === 0 ? "18" : "13");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("opacity", index === 0 ? ".72" : ".48");
        line.setAttribute("marker-end", "url(#" + this.arrowId + "-head-" + index + ")");
        svg.appendChild(line);
        this.arrowLines.push(line);
      }
      this.el.appendChild(svg);
      this.arrowSvg = svg;
    }
    if (this.arrowSvg.style) this.arrowSvg.style.display = "block";
    const colors = ["#16a36a", "#2581d8", "#e19b24", "#ff3366"];
    const point = (square) => {
      let file = square.charCodeAt(0) - 97;
      let rank = 8 - Number(square[1]);
      if (this.flipped) { file = 7 - file; rank = 7 - rank; }
      return { x: file * 100 + 50, y: rank * 100 + 50 };
    };
    this.arrowLines.forEach((line, index) => {
      const uci = uciList[index];
      if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
        line.setAttribute("x1", "0");
        line.setAttribute("y1", "0");
        line.setAttribute("x2", "0");
        line.setAttribute("y2", "0");
        line.setAttribute("opacity", "0");
        return;
      }
      const from = point(uci.slice(0, 2)), to = point(uci.slice(2, 4));
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
      line.setAttribute("stroke", colors[index]);
      line.setAttribute("opacity", index === 0 ? ".72" : ".48");
    });
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
    source: move.source || null,
    title: move.title || `${move.san}: ${move.label} · ${move.evaluation}`,
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BoardUI };
}
