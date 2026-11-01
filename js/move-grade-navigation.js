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

  function currentGradeEntries() {
    return reviewState.returnState ? reviewState.moveGrades : state.moveGradeHistory;
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
    for (const row of wrap.querySelectorAll(".move-grade-count-row")) {
      const side = row.closest(".move-grade-side");
      const color = side && side.dataset.color;
      const category = normalizeCategory(row.dataset.grade);
      if (!color || row.dataset.navigationReady === "true") continue;
      row.dataset.navigationReady = "true";
      row.dataset.color = color;
      const movesOfType = entries.filter((entry) => entry && entry.color === color && normalizeCategory(entry.category) === category).length;
      const name = row.querySelector(".move-grade-count-name")?.textContent || category;
      const count = row.querySelector("[data-grade-count]");
      const children = Array.from(row.childNodes).filter((child) => child !== count);
      const main = document.createElement("button");
      main.type = "button";
      main.className = "move-grade-count-main";
      main.disabled = movesOfType === 0;
      main.setAttribute("aria-label", movesOfType
        ? "Aller au premier demi-coup " + name + " des " + side.querySelector("h3").textContent
        : "Aucun demi-coup " + name + " disponible dans cette partie");
      for (const child of children) main.appendChild(child);
      main.addEventListener("click", () => moveGradeNavigate(color, category, "first"));
      row.appendChild(main);
      const countButton = document.createElement("button");
      countButton.type = "button";
      countButton.className = "move-grade-count-value";
      countButton.disabled = movesOfType === 0;
      countButton.setAttribute("aria-label", movesOfType
        ? "Aller au premier demi-coup " + name + " des " + side.querySelector("h3").textContent
        : "Aucun demi-coup " + name + " disponible dans cette partie");
      if (count) countButton.appendChild(count);
      countButton.addEventListener("click", () => moveGradeNavigate(color, category, "first"));
      row.appendChild(countButton);
      const configured = root.SupaKeyboardShortcuts && root.SupaKeyboardShortcuts.getBindings();
      const shortcuts = configured && configured[color] && configured[color][category] || MOVE_GRADE_SHORTCUTS[color] && MOVE_GRADE_SHORTCUTS[color][category];
      for (let index = 0; index < 2; index++) {
        const direction = index === 0 ? "previous" : "next";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "move-grade-step";
        button.disabled = movesOfType === 0;
        button.title = direction === "previous" ? "Demi-coup précédent de ce type" : "Demi-coup suivant de ce type";
        button.setAttribute("aria-label", button.title + (shortcuts ? " · raccourci " + shortcuts[index].toUpperCase() : ""));
        button.textContent = index === 0 ? "‹" : "›";
        if (shortcuts) {
          const key = document.createElement("small");
          key.className = "move-grade-step-key";
          key.setAttribute("aria-hidden", "true");
          key.textContent = shortcuts[index].toUpperCase();
          button.appendChild(key);
        }
        button.addEventListener("click", () => moveGradeNavigate(color, category, direction));
        row.appendChild(button);
      }
    }
  }

  function installKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      if (reviewState.running) return;
      const target = event.target;
      if (target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
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
    module.exports = { MOVE_GRADE_SHORTCUTS, moveGradeTargetPly, normalizeCategory };
  }
  if (typeof document === "undefined") return;

  const originalRender = window.renderMoveGradeSummary;
  if (typeof originalRender === "function") {
    window.renderMoveGradeSummary = function (...args) {
      originalRender.apply(this, args);
      enhanceMoveGradeRows();
    };
    window.renderMoveGradeSummary();
  }
  installKeyboardShortcuts();
  root.moveGradeNavigate = moveGradeNavigate;
})(typeof window !== "undefined" ? window : globalThis);
