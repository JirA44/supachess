"use strict";
(() => {
  const key = "supachess-level-diagnostic";
  const active = () => {
    try { return Boolean(JSON.parse(localStorage.getItem(key) || "null")?.active); }
    catch (_) { return false; }
  };
  const sync = () => {
    const button = document.getElementById("btn-undo");
    if (!button) return;
    const locked = active();
    button.disabled = locked;
    button.title = locked ? "Indisponible pendant le diagnostic de niveau" : "Annuler le dernier coup";
  };
  sync();
  window.addEventListener("storage", e => { if (e.key === key) sync(); });
  window.addEventListener("supachess:level-diagnostic-change", sync);
  const banner = document.getElementById("level-diagnostic-banner");
  if (banner && typeof MutationObserver === "function")
    new MutationObserver(sync).observe(banner, { childList: true, characterData: true, subtree: true });
  document.addEventListener("click", e => {
    if (e.target.closest?.("#btn-undo") && active()) {
      e.preventDefault(); e.stopImmediatePropagation(); sync();
    }
  }, true);
})();
