/* Notes communes aux coups joués, essais et relectures. */
"use strict";

function moveGrade(deltaCp, brilliant = false, best = false, categoryOverride = null) {
  const loss = Number.isFinite(deltaCp) ? Math.max(0, deltaCp) : null;
  let category = "unrated";
  if (loss !== null) {
    if (brilliant && loss < 30) category = "brilliant";
    else if (loss >= 200) category = "blunder";
    else if (loss >= 60) category = "error";
    else if (loss >= 30) category = "inaccuracy";
    else if (best) category = "best";
    else if (loss <= 10) category = "very-good";
    else if (loss < 20) category = "good";
    else category = "ok";
  }
  category = categoryOverride || category;
  const grades = {
    brilliant: { rating: 10, symbol: "!!", label: "Brillant", tone: "best" },
    best: { rating: 10, symbol: "★", label: "Meilleur coup", tone: "best" },
    "very-good": { rating: 10, symbol: "!", label: "Très bon coup", tone: "best" },
    good: { rating: 8, symbol: "✓", label: "Bon coup", tone: "good" },
    ok: { rating: 7, symbol: "=", label: "Coup OK", tone: "good" },
    inaccuracy: { rating: 6, symbol: "?!", label: "Imprécision", tone: "mid" },
    error: { rating: 3, symbol: "?", label: "Erreur", tone: "bad" },
    mistake: { rating: 3, symbol: "?", label: "Erreur", tone: "bad" },
    blunder: { rating: 1, symbol: "??", label: "Gaffe", tone: "bad" },
    unrated: { rating: null, symbol: "…", label: "Analyse en cours", tone: "pending" },
  };
  return { ...(grades[category] || grades.unrated), category };
}

// Un sacrifice doit conserver l'évaluation et céder au moins une pièce
// sur la réponse calculée. Le premier coup du classement ne suffit pas.
function isBrilliantCandidate(fen, cand) {
  if (!cand || cand.deltaCp >= 30 || !cand.line || cand.line.depth < 8 || cand.line.pv.length < 2) return false;
  try {
    return pvMaterialDelta(fen, cand.line.pv, 2, new Chess(fen).turn()) <= -3;
  } catch (_e) { return false; }
}

function moveNumberFromFen(fen) {
  const number = Number(fen.split(" ")[5]);
  return Number.isInteger(number) && number > 0 ? number : 1;
}

const moveFeedback = {
  cards: new Map(),
  show({ san, color, moveNumber, square = null, deltaCp = null, brilliant = false, best = false, categoryOverride = null, mode = "played", token = null }) {
    const key = mode === "preview" ? "preview" : color;
    const grade = moveGrade(deltaCp, brilliant, best, categoryOverride);
    this.cards.delete(key);
    this.cards.set(key, { san, color, moveNumber, square, deltaCp, mode, token, ...grade });
    if (mode === "preview") this.syncBoardPreview();
    this.render();
  },
  clear() { this.cards.clear(); this.syncBoardPreview(); this.render(); },
  clearPreview() { this.cards.delete("preview"); this.syncBoardPreview(); this.render(); },
  syncBoardPreview() {
    if (typeof boardUI === "undefined") return;
    const preview = this.cards.get("preview");
    boardUI.previewDot = preview ? {
      square: preview.square,
      label: `${preview.symbol}${preview.rating === null ? "…" : preview.rating}`,
      evaluation: preview.evaluation,
      quality: preview.tone,
      category: preview.category,
      title: `${preview.san} — coup testé`,
    } : null;
    boardUI.render(state.chess);
  },
  render() {
    const wrap = document.getElementById("move-feedback");
    if (!wrap) return;
    wrap.replaceChildren();
    for (const [key, card] of this.cards) {
      const bubble = document.createElement("article");
      bubble.className = "move-bubble tone-" + card.tone + " grade-" + card.category;
      const modeLabel = card.mode === "preview" ? "Coup testé" : card.mode === "replay" ? "Relecture" : "Coup joué";
      const side = card.color === "w" ? "Blancs" : "Noirs";
      const heading = document.createElement("div");
      heading.className = "move-bubble-heading";
      const numberedMove = `${card.moveNumber}${card.color === "w" ? "." : "…"} ${card.san}`;
      heading.textContent = `${modeLabel} · ${side} · ${numberedMove}`;
      const result = document.createElement("strong");
      result.className = "move-bubble-result";
      result.textContent = `${card.symbol}  ${card.rating === null ? "…" : card.rating + "/10"} · ${card.label}`;
      const detail = document.createElement("p");
      detail.textContent = card.rating === null ? "La note arrive après l’analyse." :
        card.deltaCp >= 10000 ? "Mat forcé perdu ou concédé face au meilleur coup." :
          `Perte face au meilleur coup : ${(Math.max(0, card.deltaCp) / 100).toFixed(2)} pion(s).`;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "move-bubble-close";
      close.textContent = "×";
      close.setAttribute("aria-label", `Fermer la note de ${card.san}`);
      close.addEventListener("click", () => { this.cards.delete(key); this.render(); });
      bubble.append(heading, result, detail, close);
      wrap.appendChild(bubble);
    }
    wrap.classList.toggle("hidden", this.cards.size === 0);
  },
};

function previewCandidate(cand) {
  if (!["userTurn", "coach"].includes(state.phase)) return;
  moveFeedback.show({ san: cand.san, color: state.chess.turn(), moveNumber: moveNumberFromFen(state.chess.fen()),
    square: cand.uci.slice(2, 4), deltaCp: cand.deltaCp,
    evaluation: cand.line && (cand.line.scoreCp !== null || cand.line.mate !== null)
      ? formatScore(cand.line, state.chess.turn() === "w") : "—",
    brilliant: isBrilliantCandidate(state.chess.fen(), cand), best: cand.rank === 1, mode: "preview" });
}
