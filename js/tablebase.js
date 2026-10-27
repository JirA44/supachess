/* Exact endgame lookups via the Lichess Syzygy tablebase API. */
"use strict";

(function () {
  const endpoint = "https://tablebase.lichess.org/standard";
  const button = document.getElementById("tablebase-check");
  const status = document.getElementById("tablebase-status");
  const resultBox = document.getElementById("tablebase-result");
  const summary = document.getElementById("tablebase-summary");
  const movesList = document.getElementById("tablebase-moves");
  let requestId = 0;
  let activeController = null;

  const categories = {
    win: "gain prouvé",
    loss: "défaite prouvée",
    draw: "nulle prouvée",
    "syzygy-win": "gain indiqué, mais incertain à cause de l’arrondi DTZ",
    "syzygy-loss": "défaite indiquée, mais incertaine à cause de l’arrondi DTZ",
    "maybe-win": "gain possible, résultat dépendant de la règle des 50 coups",
    "maybe-loss": "défaite possible, résultat dépendant de la règle des 50 coups",
    "cursed-win": "gain théorique annulé par la règle des 50 coups",
    "blessed-loss": "défaite théorique annulée par la règle des 50 coups",
    unknown: "résultat inconnu"
  };

  function pieceCount(fen) {
    const board = String(fen || "").split(" ")[0] || "";
    return (board.match(/[pnbrqk]/gi) || []).length;
  }

  function eligibilityMessage(fen) {
    const fields = String(fen || "").split(" ");
    const pieces = pieceCount(fen);
    if (pieces < 2) return "Position FEN invalide pour la tablebase.";
    if (fields[2] !== "-") return "La tablebase ne couvre pas les positions qui conservent un droit au roque.";
    if (fields[3] !== "-") return "Une prise en passant est encore possible; cette position n’est pas envoyée à la tablebase.";
    if (pieces > 7) return "Hors couverture complète : " + pieces + " pièces. Les tables Syzygy couvrent jusqu’à 7 pièces; certaines finales à 8 pièces seulement sont couvertes par une table partielle séparée.";
    return "";
  }

  function clearResults() {
    resultBox.hidden = true;
    summary.textContent = "";
    movesList.replaceChildren();
  }

  function categoryLabel(category) {
    return categories[category] || "catégorie de tablebase : " + String(category || "inconnue");
  }

  function render(data, fen) {
    const side = fen.split(" ")[1] === "b" ? "Noirs" : "Blancs";
    const category = data && data.category;
    summary.textContent = side + " au trait : " + categoryLabel(category) + ". Résultat exact de la tablebase pour cette position.";
    movesList.replaceChildren();
    (Array.isArray(data.moves) ? data.moves : []).forEach((move, index) => {
      const item = document.createElement("li");
      if (index === 0) item.className = "tablebase-best";
      const san = document.createElement("strong");
      san.textContent = move.san || move.uci || "Coup";
      item.appendChild(san);
      item.appendChild(document.createTextNode(" — après ce demi-coup : " + categoryLabel(move.category)));
      movesList.appendChild(item);
    });
    resultBox.hidden = false;
    status.textContent = data && data.moves && data.moves.length
      ? "Résultats exacts disponibles; les coups sont classés par la tablebase."
      : "La tablebase a répondu, mais n’a fourni aucune suite pour cette position.";
  }

  async function probePosition() {
    if (!button || typeof state === "undefined" || !state.chess) {
      if (status) status.textContent = "L’échiquier n’est pas encore prêt.";
      return;
    }
    const fen = state.chess.fen();
    const reason = eligibilityMessage(fen);
    clearResults();
    if (reason) {
      status.textContent = reason;
      return;
    }

    const id = ++requestId;
    if (activeController) activeController.abort();
    activeController = new AbortController();
    const timeout = setTimeout(() => activeController.abort(), 12000);
    button.disabled = true;
    status.textContent = "Consultation de la tablebase exacte…";
    try {
      const requestUrl = new URL(endpoint);
      requestUrl.searchParams.set("fen", fen.replace(/ /g, "_"));
      const response = await fetch(requestUrl.toString(), {
        headers: { Accept: "application/json" },
        signal: activeController.signal
      });
      if (id !== requestId) return;
      if (state.chess.fen() !== fen) {
        status.textContent = "La position a changé pendant la consultation. Vérifiez la nouvelle position.";
        return;
      }
      if (response.status === 404) {
        status.textContent = "Cette position n’est pas présente dans la tablebase complète consultée.";
        return;
      }
      if (response.status === 429) {
        status.textContent = "La tablebase limite temporairement les requêtes. Réessayez plus tard.";
        return;
      }
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (id !== requestId) return;
      if (state.chess.fen() !== fen) {
        status.textContent = "La position a changé pendant la consultation. Vérifiez la nouvelle position.";
        return;
      }
      render(data, fen);
    } catch (error) {
      if (id !== requestId) return;
      status.textContent = error && error.name === "AbortError"
        ? "La consultation a expiré ou la position a changé. Réessayez."
        : "Tablebase indisponible pour le moment; l’analyse Stockfish reste une estimation, pas une preuve.";
    } finally {
      clearTimeout(timeout);
      if (id === requestId) button.disabled = false;
    }
  }

  if (button) button.addEventListener("click", probePosition);
  window.SupaTablebase = { pieceCount, eligibilityMessage, probePosition, categoryLabel };
})();
