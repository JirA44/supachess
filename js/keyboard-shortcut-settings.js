/* Réglages locaux des raccourcis de navigation par qualité. */
(function (root) {
  "use strict";

  const STORAGE_KEY = "supachess.moveGradeShortcuts.v1";
  const DEFAULTS = Object.freeze({
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
  const LABELS = Object.freeze({
    brilliant: "Brillant",
    best: "Meilleur coup",
    "very-good": "Très bon coup",
    good: "Bon coup",
    ok: "Coup OK",
    inaccuracy: "Imprécision",
    error: "Erreur",
    blunder: "Gaffe",
  });

  function normalizeKey(key) {
    if (typeof key !== "string" || key.length !== 1 || /\s/.test(key)) return null;
    return key.toLocaleLowerCase("fr");
  }

  function readBindings() {
    let saved;
    try {
      saved = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "null");
    } catch (_) {
      saved = null;
    }
    const result = {};
    for (const side of ["w", "b"]) {
      result[side] = {};
      for (const [category, pair] of Object.entries(DEFAULTS[side])) {
        const candidate = saved && saved[side] && saved[side][category];
        result[side][category] = pair.map((fallback, index) =>
          normalizeKey(candidate && candidate[index]) || fallback
        );
      }
    }
    const allKeys = Object.values(result).flatMap((groups) => Object.values(groups).flat());
    if (new Set(allKeys).size !== allKeys.length) return structuredCloneDefaults();
    return result;
  }

  function structuredCloneDefaults() {
    return {
      w: Object.fromEntries(Object.entries(DEFAULTS.w).map(([category, pair]) => [category, [...pair]])),
      b: Object.fromEntries(Object.entries(DEFAULTS.b).map(([category, pair]) => [category, [...pair]])),
    };
  }

  function saveKey(side, category, index, rawKey) {
    const key = normalizeKey(rawKey);
    if (!key) return { ok: false, message: "Choisis une touche imprimable (sans espace)." };
    const next = readBindings();
    next[side][category][index] = key;
    const allKeys = Object.values(next).flatMap((groups) => Object.values(groups).flat());
    if (new Set(allKeys).size !== allKeys.length) {
      return { ok: false, message: "Cette touche est déjà attribuée. Choisis-en une autre." };
    }
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {
      return { ok: false, message: "Impossible d’enregistrer ce réglage sur cet appareil." };
    }
    root.dispatchEvent(new CustomEvent("supachess:shortcuts-changed", { detail: next }));
    return { ok: true, key };
  }

  function resetBindings() {
    try {
      root.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      return false;
    }
    root.dispatchEvent(new CustomEvent("supachess:shortcuts-changed", { detail: readBindings() }));
    return true;
  }

  function renderSettings(container) {
    if (!container || container.querySelector("[data-keyboard-shortcut-settings]")) return;
    const section = document.createElement("section");
    section.dataset.keyboardShortcutSettings = "true";
    section.style.cssText = "margin-top:20px;padding:16px;border:1px solid #52657d;border-radius:12px;background:#111827;color:#f5f7fa";
    section.innerHTML =
      '<h3 style="margin:0 0 6px;color:#fff">Raccourcis clavier</h3>' +
      '<p style="margin:0 0 12px;color:#d5deea">Clique une touche, puis appuie sur la nouvelle touche. Les réglages sont enregistrés sur cet appareil; une touche ne peut être attribuée qu’à une seule action.</p>' +
      '<div data-shortcut-boards style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px"></div>' +
      '<p data-shortcut-status role="status" aria-live="polite" style="min-height:1.4em;color:#a8eaff;margin:10px 0"></p>' +
      '<button type="button" data-shortcut-reset style="min-height:40px;padding:8px 12px;border:1px solid #90a4bd;border-radius:8px;background:#26364a;color:#fff;font-weight:700;cursor:pointer">Rétablir les raccourcis par défaut</button>' +
      '<details style="margin-top:14px;color:#d5deea"><summary style="cursor:pointer;font-weight:700">Autres commandes clavier</summary><ul style="line-height:1.8"><li>Relecture : ← demi-coup précédent · → demi-coup suivant</li><li>Correction : pavé numérique 1–9 pour ouvrir les neuf premières parties · 0 pour la dixième</li></ul></details>';
    const boards = section.querySelector("[data-shortcut-boards]");
    const names = { w: "Joueur 1 · Blancs", b: "Joueur 2 · Noirs" };
    for (const side of ["w", "b"]) {
      const panel = document.createElement("div");
      panel.style.cssText = "padding:12px;border:1px solid #40536b;border-radius:10px;background:#1b2636";
      const heading = document.createElement("h4");
      heading.textContent = names[side];
      heading.style.cssText = "margin:0 0 8px;color:#fff";
      panel.appendChild(heading);
      const table = document.createElement("div");
      table.style.cssText = "display:grid;grid-template-columns:minmax(100px,1fr) auto auto;gap:6px 8px;align-items:center";
      for (const category of Object.keys(DEFAULTS[side])) {
        const name = document.createElement("span");
        name.textContent = LABELS[category];
        name.style.cssText = "font-weight:700;color:#e9eef5";
        table.appendChild(name);
        for (let index = 0; index < 2; index++) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.shortcutCapture = "true";
          button.dataset.side = side;
          button.dataset.category = category;
          button.dataset.index = String(index);
          button.style.cssText = "min-width:42px;min-height:38px;padding:6px 10px;border:1px solid #8ba5c2;border-radius:7px;background:#25364a;color:#fff;font-size:1rem;font-weight:800;cursor:pointer";
          button.setAttribute("aria-label", LABELS[category] + " — " + (index === 0 ? "demi-coup précédent" : "demi-coup suivant") + " pour " + names[side] + "; cliquer puis appuyer sur une touche");
          button.addEventListener("click", () => {
            section.querySelectorAll("[data-shortcut-capture]").forEach((item) => { item.dataset.waiting = "false"; });
            button.dataset.waiting = "true";
            section.querySelector("[data-shortcut-status]").textContent = "Appuie sur la touche à attribuer à « " + LABELS[category] + " ».";
            button.focus();
          });
          button.addEventListener("keydown", (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (event.key === "Escape") {
              button.dataset.waiting = "false";
              section.querySelector("[data-shortcut-status]").textContent = "Modification annulée.";
              return;
            }
            if (event.key === "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
            const result = saveKey(side, category, index, event.key);
            section.querySelector("[data-shortcut-status]").textContent = result.ok
              ? "Raccourci enregistré : " + result.key.toLocaleUpperCase("fr") + "."
              : result.message;
            if (result.ok) {
              refreshSettings(section);
              if (typeof root.renderMoveGradeSummary === "function") root.renderMoveGradeSummary();
            }
            button.dataset.waiting = "false";
          });
          table.appendChild(button);
        }
      }
      panel.appendChild(table);
      boards.appendChild(panel);
    }
    section.querySelector("[data-shortcut-reset]").addEventListener("click", () => {
      if (!resetBindings()) {
        section.querySelector("[data-shortcut-status]").textContent = "Impossible de rétablir les raccourcis sur cet appareil.";
        return;
      }
      section.querySelector("[data-shortcut-status]").textContent = "Raccourcis par défaut rétablis.";
      refreshSettings(section);
      if (typeof root.renderMoveGradeSummary === "function") root.renderMoveGradeSummary();
    });
    container.appendChild(section);
    refreshSettings(section);
  }

  function refreshSettings(section) {
    const bindings = readBindings();
    section.querySelectorAll("[data-shortcut-capture]").forEach((button) => {
      const key = bindings[button.dataset.side][button.dataset.category][Number(button.dataset.index)];
      button.textContent = button.dataset.waiting === "true" ? "…" : key.toLocaleUpperCase("fr");
      button.setAttribute("aria-pressed", String(button.dataset.waiting === "true"));
    });
  }

  root.SupaKeyboardShortcuts = { STORAGE_KEY, DEFAULTS, getBindings: readBindings, renderSettings, saveKey, resetBindings };
})(window);
