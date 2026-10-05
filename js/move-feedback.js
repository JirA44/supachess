/* Notes communes aux coups joués, essais et relectures. */
"use strict";

function moveGrade(deltaCp, brilliant = false) {
  if (!Number.isFinite(deltaCp)) return { rating: null, symbol: "…", label: "Analyse en cours", tone: "pending" };
  const loss = Math.max(0, deltaCp);
  if (brilliant && loss <= 10) return { rating: 10, symbol: "!!", label: "Brillant", tone: "best" };
  if (loss <= 10) return { rating: 10, symbol: "!", label: "Excellent", tone: "best" };
  if (brilliant && loss < 30) return { rating: 8, symbol: "!?", label: "Intéressant", tone: "good" };
  if (loss < 30) return { rating: 8, symbol: "=", label: "Bon coup", tone: "good" };
  if (loss < 60) return { rating: 6, symbol: "?!", label: "Imprécision", tone: "mid" };
  if (loss < 200) return { rating: 3, symbol: "?", label: "Erreur", tone: "bad" };
  return { rating: 1, symbol: "??", label: "Gaffe", tone: "bad" };
}

// Un sacrifice doit conserver l'évaluation et céder au moins une pièce
// sur la réponse calculée. Le premier coup du classement ne suffit pas.
function isBrilliantCandidate(fen, cand) {
  if (!cand || cand.deltaCp >= 30 || !cand.line || cand.line.depth < 10) return false;
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
  show({ san, color, moveNumber, deltaCp = null, brilliant = false, mode = "played", token = null }) {
    const key = mode === "preview" ? "preview" : color;
    const grade = moveGrade(deltaCp, brilliant);
    this.cards.delete(key);
    this.cards.set(key, { san, color, moveNumber, deltaCp, mode, token, ...grade });
    this.render();
  },
  clear() { this.cards.clear(); this.render(); },
  clearPreview() { this.cards.delete("preview"); this.render(); },
  render() {
    const wrap = document.getElementById("move-feedback");
    if (!wrap) return;
    wrap.replaceChildren();
    for (const [key, card] of this.cards) {
      const bubble = document.createElement("article");
      bubble.className = "move-bubble tone-" + card.tone;
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
  moveFeedback.show({ san: cand.san, color: state.chess.turn(), moveNumber: moveNumberFromFen(state.chess.fen()), deltaCp: cand.deltaCp,
    brilliant: isBrilliantCandidate(state.chess.fen(), cand), mode: "preview" });
}
