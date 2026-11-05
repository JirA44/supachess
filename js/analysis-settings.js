/* Préférences d’analyse SupaChess — stockées localement. */
"use strict";
(() => {
  const STORAGE_KEY = "supachess-analysis-preferences-v1";
  const defaults = { showAcpl:true, detailedMetrics:true, showArrows:true, multiPv:4 };
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        showAcpl: typeof saved.showAcpl === "boolean" ? saved.showAcpl : defaults.showAcpl,
        detailedMetrics: typeof saved.detailedMetrics === "boolean" ? saved.detailedMetrics : defaults.detailedMetrics,
        showArrows: typeof saved.showArrows === "boolean" ? saved.showArrows : defaults.showArrows,
        multiPv: Math.max(1, Math.min(4, Number(saved.multiPv) || defaults.multiPv))
      };
    } catch (_) { return { ...defaults }; }
  }
  let preferences = load();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch (_) {}
  }
  function trainingAidsLocked() {
    if (window.SupaChessIsCorrectionExercise?.()) return false;
    let diagnosticActive = false;
    try { diagnosticActive = Boolean(JSON.parse(localStorage.getItem("supachess-level-diagnostic") || "null")?.active); } catch (_) {}
    try {
      return diagnosticActive || Boolean(window.SupaChessIsUnassistedGame?.()) || sessionStorage.getItem("supachess-unassisted-game-active-v1") === "true";
    } catch (_) { return diagnosticActive || Boolean(window.SupaChessIsUnassistedGame?.()); }
  }
  function isCorrectionExercise() { return Boolean(window.SupaChessIsCorrectionExercise?.()); }
  function sync() { render(); window.SupaChessRenderBoard?.(); }
  function render() {
    const root = document.documentElement;
    root.dataset.showAcpl = String(preferences.showAcpl);
    root.dataset.detailedMetrics = String(preferences.detailedMetrics);
    root.dataset.engineArrows = String(preferences.showArrows && !trainingAidsLocked());
    document.querySelectorAll(".analysis-toggle[data-setting]").forEach(button => {
      const value = Boolean(preferences[button.dataset.setting]);
      button.setAttribute("aria-checked", String(value));
      button.setAttribute("aria-pressed", String(value));
      const locked = button.dataset.setting === "showArrows" && trainingAidsLocked();
      button.disabled = locked;
      if (locked) button.title = "Flèches désactivées pendant le diagnostic ou une partie sans aide";
      else if (button.dataset.setting === "showArrows") button.removeAttribute("title");
    });
    const slider = document.getElementById("analysis-multipv");
    const output = document.getElementById("analysis-multipv-value");
    if (slider) slider.value = String(preferences.multiPv);
    if (output) output.textContent = String(preferences.multiPv);
  }
  function update(key, value) {
    if (key === "showArrows" && trainingAidsLocked()) return;
    if (key === "multiPv") preferences.multiPv = Math.max(1, Math.min(4, Number(value) || defaults.multiPv));
    else if (Object.prototype.hasOwnProperty.call(defaults, key) && key !== "multiPv") preferences[key] = Boolean(value);
    else return;
    save(); render();
    window.dispatchEvent(new CustomEvent("supachess-analysis-preferences-change", { detail: { ...preferences } }));
    if (key === "showArrows") {
      if (preferences.showArrows && !isCorrectionExercise()) window.gamesMarkTrainingAidUsed?.();
      window.SupaChessRenderBoard?.();
    }
    if (key === "multiPv") window.SupaChessReanalyze?.();
  }
  const api = {
    get: () => ({ ...preferences }),
    getMultiPv: () => preferences.multiPv,
    showArrows: () => preferences.showArrows && !trainingAidsLocked(),
    showAcpl: () => preferences.showAcpl,
    detailedMetrics: () => preferences.detailedMetrics,
    set: update
  };
  window.SupaAnalysisSettings = api;
  document.getElementById("analysis-preferences")?.addEventListener("click", event => {
    const button = event.target.closest(".analysis-toggle[data-setting]");
    if (!button) return;
    const key = button.dataset.setting;
    if (key === "showArrows" && trainingAidsLocked()) return;
    update(key, !preferences[key]);
    if (key === "showArrows") {
      if (preferences.showArrows && !isCorrectionExercise()) window.gamesMarkTrainingAidUsed?.();
      window.SupaChessRenderBoard?.();
    }
  });
  const multipvSlider = document.getElementById("analysis-multipv");
  multipvSlider?.addEventListener("input", event => {
    preferences.multiPv = Math.max(1, Math.min(4, Number(event.target.value) || 1));
    save(); render();
  });
  multipvSlider?.addEventListener("change", () => window.SupaChessReanalyze?.());
  document.addEventListener("supachess:correction-mode-change", sync);
  document.addEventListener("supachess:level-diagnostic-change", sync);
  document.addEventListener("supachess:unassisted-mode-change", sync);
  window.addEventListener("supachess:correction-mode-change", sync);
  window.addEventListener("supachess:level-diagnostic-change", sync);
  window.addEventListener("supachess:unassisted-mode-change", sync);
  render();
})();
