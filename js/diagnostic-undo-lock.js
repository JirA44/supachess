"use strict";
(() => {
  const key = "supachess-level-diagnostic";
  const active = () => {
    if (window.SupaChessIsCorrectionExercise?.()) return false;
    try { return Boolean(JSON.parse(localStorage.getItem(key) || "null")?.active) || Boolean(window.SupaChessIsUnassistedGame?.()); }
    catch (_) { return Boolean(window.SupaChessIsUnassistedGame?.()); }
  };
  const sync = () => {
    const button = document.getElementById("btn-undo");
    if (!button) return;
    if (active()) {
      button.disabled = true;
      button.title = "Indisponible pendant le diagnostic ou une partie sans aide";
    } else if (typeof window.SupaChessSyncUndoButton === "function") {
      window.SupaChessSyncUndoButton();
    }
  };
  sync();
  window.addEventListener("storage", e => { if (e.key === key) sync(); });
  window.addEventListener("supachess:level-diagnostic-change", sync);
  window.addEventListener("supachess:unassisted-mode-change", sync);
  window.addEventListener("supachess:correction-mode-change", sync);
  document.addEventListener("supachess:level-diagnostic-change", sync);
  document.addEventListener("supachess:unassisted-mode-change", sync);
  document.addEventListener("supachess:correction-mode-change", sync);
  const banner = document.getElementById("level-diagnostic-banner");
  if (banner && typeof MutationObserver === "function")
    new MutationObserver(sync).observe(banner, { childList: true, characterData: true, subtree: true });
  document.addEventListener("click", e => {
    if (e.target.closest?.("#btn-undo") && active()) {
      e.preventDefault(); e.stopImmediatePropagation(); sync();
    }
  }, true);
})();
