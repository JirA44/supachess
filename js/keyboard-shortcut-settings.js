/* Fenêtre de réglage centralisée pour tous les raccourcis SupaChess. */
(function (root) {
  "use strict";

  const STORAGE_KEY = "supachess.keyboardShortcuts.v2";
  const DEFAULTS = Object.freeze({
    w: Object.freeze({
      brilliant: Object.freeze(["a", "z"]), best: Object.freeze(["q", "s"]),
      "very-good": Object.freeze(["w", "x"]), good: Object.freeze(["e", "r"]),
      ok: Object.freeze(["d", "f"]), inaccuracy: Object.freeze(["c", "v"]),
      error: Object.freeze(["t", "y"]), blunder: Object.freeze(["g", "h"]),
    }),
    b: Object.freeze({
      brilliant: Object.freeze(["b", "n"]), best: Object.freeze(["u", "i"]),
      "very-good": Object.freeze(["j", "k"]), good: Object.freeze([",", ";"]),
      ok: Object.freeze(["o", "p"]), inaccuracy: Object.freeze(["l", "m"]),
      error: Object.freeze([":", "!"]), blunder: Object.freeze(["^", "$"]),
    }),
    replay: Object.freeze({ previous: "ArrowLeft", next: "ArrowRight" }),
    corrections: Object.freeze(["Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9", "Numpad0"]),
    closeProfile: "Escape",
  });
  const TYPE_LABELS = Object.freeze({
    brilliant: "Brillant", best: "Meilleur coup", "very-good": "Très bon coup",
    good: "Bon coup", ok: "Coup OK", inaccuracy: "Imprécision",
    error: "Erreur", blunder: "Gaffe",
  });
  const SPECIAL_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape", "Enter", "Home", "End", "PageUp", "PageDown"]);

  function normalizeToken(token) {
    if (typeof token !== "string") return null;
    if (/^Numpad[0-9]$/.test(token) || SPECIAL_KEYS.has(token)) return token;
    if (token.length === 1 && !/\s/.test(token)) return token.toLocaleLowerCase("fr");
    return null;
  }

  function tokenFromEvent(event) {
    if (/^Numpad[0-9]$/.test(event.code || "")) return event.code;
    if (SPECIAL_KEYS.has(event.code)) return event.code;
    return normalizeToken(event.key);
  }

  function keyLabel(token) {
    const names = { ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Escape: "Échap", Enter: "Entrée", Home: "Début", End: "Fin", PageUp: "Page ↑", PageDown: "Page ↓" };
    if (names[token]) return names[token];
    if (/^Numpad[0-9]$/.test(token)) return "Pavé " + token.slice(-1);
    return String(token).toLocaleUpperCase("fr");
  }

  function cloneDefaults() {
    return {
      w: Object.fromEntries(Object.entries(DEFAULTS.w).map(([category, pair]) => [category, [...pair]])),
      b: Object.fromEntries(Object.entries(DEFAULTS.b).map(([category, pair]) => [category, [...pair]])),
      replay: { ...DEFAULTS.replay },
      corrections: [...DEFAULTS.corrections],
      closeProfile: DEFAULTS.closeProfile,
    };
  }

  function allBindings(bindings) {
    const values = [];
    for (const side of ["w", "b"]) for (const pair of Object.values(bindings[side])) values.push(...pair);
    values.push(bindings.replay.previous, bindings.replay.next, ...bindings.corrections, bindings.closeProfile);
    return values;
  }

  function readBindings() {
    let saved = null;
    try { saved = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) {}
    const result = cloneDefaults();
    for (const side of ["w", "b"]) for (const [category, pair] of Object.entries(result[side])) {
      const candidate = saved && saved[side] && saved[side][category];
      result[side][category] = pair.map((fallback, index) => normalizeToken(candidate && candidate[index]) || fallback);
    }
    for (const key of ["previous", "next"]) result.replay[key] = normalizeToken(saved && saved.replay && saved.replay[key]) || result.replay[key];
    if (saved && Array.isArray(saved.corrections) && saved.corrections.length === result.corrections.length) {
      result.corrections = saved.corrections.map((token, index) => normalizeToken(token) || DEFAULTS.corrections[index]);
    }
    result.closeProfile = normalizeToken(saved && saved.closeProfile) || DEFAULTS.closeProfile;
    const values = allBindings(result);
    return new Set(values).size === values.length ? result : cloneDefaults();
  }

  function assignBinding(bindings, id, token) {
    const parts = String(id || "").split(":");
    if (parts[0] === "grade" && parts.length === 4 && ["w", "b"].includes(parts[1]) && bindings[parts[1]][parts[2]]) {
      const index = Number(parts[3]);
      if (index === 0 || index === 1) { bindings[parts[1]][parts[2]][index] = token; return true; }
    }
    if (parts[0] === "replay" && ["previous", "next"].includes(parts[1])) { bindings.replay[parts[1]] = token; return true; }
    if (parts[0] === "correction" && Number.isInteger(Number(parts[1])) && Number(parts[1]) >= 0 && Number(parts[1]) < 10) {
      bindings.corrections[Number(parts[1])] = token; return true;
    }
    if (id === "closeProfile") { bindings.closeProfile = token; return true; }
    return false;
  }

  function saveBinding(id, rawToken) {
    const token = normalizeToken(rawToken);
    if (!token) return { ok: false, message: "Choisis une touche imprimable ou une touche de navigation." };
    const next = readBindings();
    if (!assignBinding(next, id, token)) return { ok: false, message: "Ce raccourci n’existe pas." };
    const values = allBindings(next);
    if (new Set(values).size !== values.length) return { ok: false, message: "Cette touche est déjà attribuée. Choisis-en une autre." };
    try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch (_) { return { ok: false, message: "Impossible d’enregistrer ce réglage sur cet appareil." }; }
    root.dispatchEvent(new CustomEvent("supachess:shortcuts-changed", { detail: next }));
    return { ok: true, token };
  }

  function resetBindings() {
    try { root.localStorage.removeItem(STORAGE_KEY); }
    catch (_) { return false; }
    root.dispatchEvent(new CustomEvent("supachess:shortcuts-changed", { detail: readBindings() }));
    return true;
  }

  function matchesEvent(event, token) {
    if (/^Numpad[0-9]$/.test(token) || SPECIAL_KEYS.has(token)) return event.code === token;
    return normalizeToken(event.key) === token;
  }

  function renderSettings(container) {
    if (!container || container.querySelector("[data-keyboard-shortcut-opener]")) return;
    const panel = document.createElement("section");
    panel.dataset.keyboardShortcutOpener = "true";
    panel.style.cssText = "margin-top:20px;padding:16px;border:1px solid #52657d;border-radius:12px;background:#111827;color:#f5f7fa";
    panel.innerHTML = '<h3 style="margin:0 0 6px;color:#fff">Raccourcis clavier</h3><p style="margin:0 0 12px;color:#d5deea">Consulte et personnalise tous les raccourcis depuis une fenêtre dédiée.</p><button type="button" data-open-shortcuts style="min-height:42px;padding:9px 14px;border:1px solid #8ba5c2;border-radius:8px;background:#26364a;color:#fff;font-weight:800;cursor:pointer">Afficher et configurer les raccourcis</button>';
    panel.querySelector("[data-open-shortcuts]").addEventListener("click", () => openSettingsWindow(panel.querySelector("[data-open-shortcuts]")));
    container.appendChild(panel);
  }

  function openSettingsWindow(returnFocus) {
    if (document.querySelector("[data-shortcut-window]")) return;
    const overlay = document.createElement("div");
    overlay.dataset.shortcutWindow = "true";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "shortcut-window-title");
    overlay.style.cssText = "position:fixed;inset:0;z-index:10020;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:14px;overflow:auto";
    const box = document.createElement("section");
    box.style.cssText = "box-sizing:border-box;width:min(900px,100%);max-height:92vh;overflow:auto;padding:20px;background:#172131;color:#f5f7fa;border:1px solid #68b5ff;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.65)";
    box.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><h2 id="shortcut-window-title" style="margin:0;color:#fff">Tous les raccourcis clavier</h2><p style="margin:5px 0 0;color:#d5deea">Clique une touche puis appuie sur la nouvelle. Les réglages restent sur cet appareil.</p></div><button type="button" data-shortcut-close aria-label="Fermer les raccourcis clavier" style="min-width:42px;min-height:42px;border:1px solid #8797aa;border-radius:8px;background:#26364a;color:#fff;font-size:24px;cursor:pointer">×</button></div><div data-shortcut-groups style="display:grid;gap:14px;margin-top:16px"></div><p data-shortcut-status role="status" aria-live="polite" style="min-height:1.4em;color:#a8eaff;margin:12px 0"></p><button type="button" data-shortcut-reset style="min-height:42px;padding:9px 14px;border:1px solid #8ba5c2;border-radius:8px;background:#26364a;color:#fff;font-weight:800;cursor:pointer">Rétablir tous les raccourcis par défaut</button>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const groups = box.querySelector("[data-shortcut-groups]");
    const names = { w: "Joueur 1 · Blancs", b: "Joueur 2 · Noirs" };
    for (const side of ["w", "b"]) {
      addGroup(groups, names[side], Object.keys(DEFAULTS[side]).flatMap((category) => [
        { id: "grade:" + side + ":" + category + ":0", label: TYPE_LABELS[category] + " · demi-coup précédent" },
        { id: "grade:" + side + ":" + category + ":1", label: TYPE_LABELS[category] + " · demi-coup suivant" },
      ]));
    }
    addGroup(groups, "Navigation dans la partie", [
      { id: "replay:previous", label: "Demi-coup précédent" },
      { id: "replay:next", label: "Demi-coup suivant" },
    ]);
    addGroup(groups, "Aller à la correction d’une partie", Array.from({ length: 10 }, (_, index) => ({
      id: "correction:" + index, label: index === 9 ? "Dixième partie · Correction" : (index + 1) + (index === 0 ? "re partie" : "e partie") + " · Correction",
    })));
    addGroup(groups, "Fenêtres", [{ id: "closeProfile", label: "Fermer le profil ou la fenêtre ouverte" }]);

    box.querySelector("[data-shortcut-close]").addEventListener("click", () => closeSettingsWindow(overlay, returnFocus));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeSettingsWindow(overlay, returnFocus);
    });
    box.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusables = [...box.querySelectorAll("button:not([disabled])")];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    box.querySelector("[data-shortcut-reset]").addEventListener("click", () => {
      if (!resetBindings()) box.querySelector("[data-shortcut-status]").textContent = "Impossible de rétablir les raccourcis sur cet appareil.";
      else box.querySelector("[data-shortcut-status]").textContent = "Tous les raccourcis par défaut sont rétablis.";
      refreshWindow(overlay);
    });
    overlay.querySelector("[data-shortcut-close]").focus();
    overlay._returnFocus = returnFocus;
  }

  function addGroup(parent, title, actions) {
    const section = document.createElement("section");
    section.style.cssText = "padding:12px;border:1px solid #40536b;border-radius:10px;background:#1b2636";
    const heading = document.createElement("h3");
    heading.textContent = title;
    heading.style.cssText = "margin:0 0 8px;color:#fff;font-size:1.02rem";
    section.appendChild(heading);
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:minmax(150px,1fr) auto;gap:6px 10px;align-items:center";
    for (const action of actions) {
      const label = document.createElement("span");
      label.textContent = action.label;
      label.style.cssText = "color:#e9eef5;font-weight:700";
      grid.appendChild(label);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.shortcutCapture = action.id;
      button.style.cssText = "min-width:58px;min-height:38px;padding:6px 9px;border:1px solid #8ba5c2;border-radius:7px;background:#25364a;color:#fff;font-size:.95rem;font-weight:800;cursor:pointer";
      button.setAttribute("aria-label", action.label + " ; cliquer puis appuyer sur une touche");
      button.addEventListener("click", () => {
        const overlay = button.closest("[data-shortcut-window]");
        overlay.querySelectorAll("[data-shortcut-capture]").forEach((item) => { item.dataset.waiting = "false"; });
        button.dataset.waiting = "true";
        overlay.querySelector("[data-shortcut-status]").textContent = "Appuie sur la touche à attribuer à « " + action.label + " ».";
        refreshWindow(overlay);
        button.focus();
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
          button.dataset.waiting = "false";
          refreshWindow(button.closest("[data-shortcut-window]"));
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        const overlay = button.closest("[data-shortcut-window]");
        if (event.key === "Escape") {
          button.dataset.waiting = "false";
          overlay.querySelector("[data-shortcut-status]").textContent = "Modification annulée.";
          refreshWindow(overlay);
          return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const result = saveBinding(action.id, tokenFromEvent(event));
        overlay.querySelector("[data-shortcut-status]").textContent = result.ok
          ? "Raccourci enregistré : " + keyLabel(result.token) + "."
          : result.message;
        button.dataset.waiting = "false";
        refreshWindow(overlay);
      });
      grid.appendChild(button);
    }
    section.appendChild(grid);
    parent.appendChild(section);
  }

  function refreshWindow(overlay) {
    if (!overlay) return;
    const bindings = readBindings();
    for (const button of overlay.querySelectorAll("[data-shortcut-capture]")) {
      const id = button.dataset.shortcutCapture;
      let value;
      const parts = id.split(":");
      if (parts[0] === "grade") value = bindings[parts[1]][parts[2]][Number(parts[3])];
      else if (parts[0] === "replay") value = bindings.replay[parts[1]];
      else if (parts[0] === "correction") value = bindings.corrections[Number(parts[1])];
      else value = bindings.closeProfile;
      button.textContent = button.dataset.waiting === "true" ? "…" : keyLabel(value);
      button.setAttribute("aria-pressed", String(button.dataset.waiting === "true"));
      button.title = "Raccourci actuel : " + keyLabel(value);
    }
  }

  function closeSettingsWindow(overlay, returnFocus) {
    if (!overlay) return;
    overlay.remove();
    (returnFocus || document.querySelector("[data-open-shortcuts]"))?.focus();
  }

  document.addEventListener("keydown", (event) => {
    const overlay = document.querySelector("[data-shortcut-window]");
    if (!overlay || !matchesEvent(event, readBindings().closeProfile)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeSettingsWindow(overlay, overlay._returnFocus);
  });

  root.SupaKeyboardShortcuts = {
    STORAGE_KEY, DEFAULTS, getBindings: readBindings, saveBinding, resetBindings,
    normalizeToken, tokenFromEvent, matchesEvent, keyLabel, renderSettings, refreshWindow,
  };
})(window);
