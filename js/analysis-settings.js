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
  function render() {
    const root = document.documentElement;
    root.dataset.showAcpl = String(preferences.showAcpl);
    root.dataset.detailedMetrics = String(preferences.detailedMetrics);
    root.dataset.engineArrows = String(preferences.showArrows);
    document.querySelectorAll(".analysis-toggle[data-setting]").forEach(button => {
      const value = Boolean(preferences[button.dataset.setting]);
      button.setAttribute("aria-checked", String(value));
      button.setAttribute("aria-pressed", String(value));
    });
    const slider = document.getElementById("analysis-multipv");
    const output = document.getElementById("analysis-multipv-value");
    if (slider) slider.value = String(preferences.multiPv);
    if (output) output.textContent = String(preferences.multiPv);
  }
  const api = {
    getMultiPv: () => preferences.multiPv,
    showArrows: () => preferences.showArrows,
    showAcpl: () => preferences.showAcpl,
    detailedMetrics: () => preferences.detailedMetrics
  };
  window.SupaAnalysisSettings = api;
  document.getElementById("analysis-preferences")?.addEventListener("click", event => {
    const button = event.target.closest(".analysis-toggle[data-setting]");
    if (!button) return;
    const key = button.dataset.setting;
    preferences[key] = !preferences[key];
    save(); render();
    if (key === "showArrows") window.SupaChessRenderBoard?.();
  });
  const multipvSlider = document.getElementById("analysis-multipv");
  multipvSlider?.addEventListener("input", event => {
    preferences.multiPv = Math.max(1, Math.min(4, Number(event.target.value) || 1));
    save(); render();
  });
  multipvSlider?.addEventListener("change", () => window.SupaChessReanalyze?.());
  render();
})();
