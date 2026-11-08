/* Navigation rapide entre les demi-coups par qualité. */
(function (root) {
  "use strict";

  const MOVE_GRADE_SHORTCUTS = Object.freeze({
    w: Object.freeze({
      brilliant: Object.freeze(["a", "z"]),
      best: Object.freeze(["q", "s"]),
      "very-good": Object.freeze(["w", "x"]),
      good: Object.freeze(["e", "r"]),
      ok: Object.freeze(["d", "f"]),
      inaccuracy: Object.freeze(["c", "v"]),
      error: Object.freeze(["t", "y"]),
      blunder: Object.freeze(["g", "h"]),
    }),
    b: Object.freeze({
      brilliant: Object.freeze(["b", "n"]),
      best: Object.freeze(["u", "i"]),
      "very-good": Object.freeze(["j", "k"]),
      good: Object.freeze([",", ";"]),
      ok: Object.freeze(["o", "p"]),
      inaccuracy: Object.freeze(["l", "m"]),
      error: Object.freeze([":", "!"]),
      blunder: Object.freeze(["^", "$"]),
    }),
  });

  const normalizeCategory = (category) => category === "mistake" ? "error" : String(category || "unrated");

  function moveGradeTargetPly(entries, color, category, direction, currentPly) {
    const matches = (Array.isArray(entries) ? entries : [])
      .filter((entry) => entry && entry.color === color && normalizeCategory(entry.category) === category)
      .map((entry) => Number(entry.ply))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (!matches.length) return null;
    if (direction === "first") return matches[0];
    const current = Number(currentPly);
    if (!Number.isFinite(current)) return direction === "previous" ? matches[matches.length - 1] : matches[0];
    if (direction === "previous") {
      for (let i = matches.length - 1; i >= 0; i--) if (matches[i] < current) return matches[i];
      return matches[matches.length - 1];
    }
    for (const ply of matches) if (ply > current) return ply;
    return matches[0];
  }

  function moveGradeEntriesThroughPosition(entries, currentPly, moves) {
    const requested = Math.max(0, Math.floor(Number(currentPly) || 0));
    const moveList = Array.isArray(moves) ? moves : null;
    const limit = moveList ? Math.min(requested, moveList.length) : requested;
    const colorAliases = { white: "w", black: "b", w: "w", b: "b" };
    const byPly = new Map();
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (!entry || !Number.isFinite(Number(entry.ply)) || Number(entry.ply) > limit) continue;
      const color = colorAliases[String(entry.color || "").toLowerCase()] || entry.color;
      if (color !== "w" && color !== "b") continue;
      const ply = Number(entry.ply);
      byPly.set(ply, { ...entry, ply, color, category: normalizeCategory(entry.category) });
    }
    if (moveList) {
      return moveList.slice(0, limit).map((move, index) => {
        const ply = index + 1;
        const saved = byPly.get(ply);
        const color = colorAliases[String(move && move.color || "").toLowerCase()] || (saved && saved.color);
        return {
          ...(saved || {}),
          ply,
          color,
          category: saved ? saved.category : "unrated",
        };
      }).filter((entry) => entry.color === "w" || entry.color === "b");
    }
    return [...byPly.values()].sort((a, b) => a.ply - b.ply);
  }

  function currentGradeEntries() {
    const inReplay = typeof reviewState !== "undefined" && reviewState.returnState;
    if (inReplay) {
      return moveGradeEntriesThroughPosition(reviewState.moveGrades, state.replayIdx, reviewState.moves);
    }
    if (typeof state === "undefined" || !state.chess) return [];
    const moves = state.chess.history({ verbose: true });
    return moveGradeEntriesThroughPosition(state.moveGradeHistory, moves.length, moves);
  }

  function prepareCurrentGameReplay() {
    const moves = state.chess.history({ verbose: true });
    const fens = Array.isArray(state.positionFenHistory) ? state.positionFenHistory.slice(0, moves.length + 1) : [];
    if (!moves.length || fens.length !== moves.length + 1) return false;
    const grades = Array.isArray(state.moveGradeHistory) ? state.moveGradeHistory : [];
    reviewState.fens = fens;
    reviewState.moves = moves;
    reviewState.grades = moves.map((move, index) => {
      const found = grades.find((entry) => Number(entry.ply) === index + 1);
      return found ? { ...found, category: normalizeCategory(found.category) } : { category: "unrated" };
    });
    reviewState.moveGrades = moves.map((move, index) => {
      const found = grades.find((entry) => Number(entry.ply) === index + 1);
      return {
        ply: index + 1,
        color: move.color,
        category: normalizeCategory(found && found.category),
        ...(found && found.noTrainingAids === true ? { noTrainingAids: true } : {}),
      };
    });
    reviewState.correctionExercises = [];
    reviewState.currentHeaders = {};
    reviewBeginReplay();
    return true;
  }

  function moveGradeNavigate(color, category, direction) {
    const entries = currentGradeEntries();
    const currentPly = reviewState.returnState ? Number(state.replayIdx) : state.chess.history().length;
    const ply = moveGradeTargetPly(entries, color, category, direction, currentPly);
    if (ply === null) return false;
    if (!reviewState.returnState && !prepareCurrentGameReplay()) return false;
    replayGoto(ply).catch((error) => console.error("Impossible d’ouvrir ce demi-coup :", error));
    return true;
  }

  function enhanceMoveGradeRows() {
    const wrap = document.getElementById("move-grade-summary");
    if (!wrap || typeof state === "undefined") return;
    const entries = currentGradeEntries();
    for (const row of wrap.querySelectorAll(".move-grade-table-row")) {
      const category = normalizeCategory(row.dataset.grade);
      const name = row.querySelector(".move-grade-count-name")?.textContent || category;
      for (const button of row.querySelectorAll("[data-move-grade-color]")) {
        if (button.dataset.navigationReady === "true") continue;
        button.dataset.navigationReady = "true";
        const color = button.dataset.moveGradeColor;
        const sideName = color === "w" ? "Blancs" : "Noirs";
        const movesOfType = entries.filter((entry) => entry && entry.color === color && normalizeCategory(entry.category) === category).length;
        button.disabled = movesOfType === 0;
        button.setAttribute("aria-label", movesOfType
          ? "Aller au premier demi-coup " + name + " des " + sideName
          : "Aucun demi-coup " + name + " des " + sideName + " dans cette partie");
        button.addEventListener("click", () => moveGradeNavigate(color, category, "first"));
      }
    }
  }

  function installKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      if (reviewState.running) return;
      const target = event.target;
      if (target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.closest("[data-shortcut-capture]"))) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const shortcutApi = root.SupaKeyboardShortcuts;
      const key = String(event.key || "").toLocaleLowerCase("fr");
      const configured = shortcutApi && shortcutApi.getBindings() || MOVE_GRADE_SHORTCUTS;
      for (const [color, categories] of Object.entries(configured)) {
        for (const [category, pair] of Object.entries(categories)) {
          if (shortcutApi ? shortcutApi.matchesEvent(event, pair[0]) : pair[0] === key) {
            event.preventDefault();
            moveGradeNavigate(color, category, "previous");
            return;
          }
          if (shortcutApi ? shortcutApi.matchesEvent(event, pair[1]) : pair[1] === key) {
            event.preventDefault();
            moveGradeNavigate(color, category, "next");
            return;
          }
        }
      }
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { MOVE_GRADE_SHORTCUTS, moveGradeTargetPly, moveGradeEntriesThroughPosition, normalizeCategory };
  }
  if (typeof document === "undefined") return;

  const originalRender = window.renderMoveGradeSummary;
  if (typeof originalRender === "function") {
    window.renderMoveGradeSummary = function (...args) {
      const fullHistory = state.moveGradeHistory;
      state.moveGradeHistory = currentGradeEntries();
      try {
        originalRender.apply(this, args);
      } finally {
        state.moveGradeHistory = fullHistory;
      }
      enhanceMoveGradeRows();
    };
    window.renderMoveGradeSummary();
  }
  installKeyboardShortcuts();
  document.addEventListener("supachess:shortcuts-changed", () => {
    if (typeof root.renderMoveGradeSummary === "function") root.renderMoveGradeSummary();
  });
  root.moveGradeNavigate = moveGradeNavigate;
})(typeof window !== "undefined" ? window : globalThis);
