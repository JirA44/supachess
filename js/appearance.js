/* Réglages d’apparence de l’échiquier SupaChess — conservés sur cet appareil. */
"use strict";
(() => {
  const STORAGE_KEY = "supachess-board-appearance-v1";
  const boardThemes = [
    { id:"green", label:"Vert classique", light:"#eeeed2", dark:"#769656" },
    { id:"blue", label:"Bleu", light:"#e8edf5", dark:"#7892ad" },
    { id:"wood", label:"Bois", light:"#f0d9b5", dark:"#b58863" },
    { id:"slate", label:"Ardoise", light:"#e2e6ed", dark:"#788394" },
    { id:"purple", label:"Violet", light:"#f0e8f7", dark:"#9a7ab2" },
    { id:"gray", label:"Gris", light:"#e4e4e1", dark:"#888985" },
    { id:"sand", label:"Sable", light:"#f4e7c8", dark:"#c4a06a" },
    { id:"midnight", label:"Nuit", light:"#cbd5e1", dark:"#334155" },
  ];
  const pieceThemes = [
    { id:"classic", label:"Classique", sample:"♞" },
    { id:"bold", label:"Renforcé", sample:"♞" },
    { id:"outline", label:"Contour", sample:"♞" },
    { id:"flat", label:"Épuré", sample:"♞" },
    { id:"carved", label:"Sculpté", sample:"♞" },
  ];
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        board: boardThemes.some(x => x.id === saved.board) ? saved.board : "green",
        pieces: pieceThemes.some(x => x.id === saved.pieces) ? saved.pieces : "classic",
        psychedelic: saved.psychedelic === true
      };
    } catch (_) { return { board:"green", pieces:"classic" }; }
  }
  let current = load();
  const api = {
    get: () => ({ ...current }),
    setBoard: value => { if (boardThemes.some(theme => theme.id === value)) { current.board = value; apply(true); } },
    setPieces: value => { if (pieceThemes.some(theme => theme.id === value)) { current.pieces = value; apply(true); } },
    setPsychedelic: value => { current.psychedelic = Boolean(value); apply(true); },
    reset: () => { current = { board:"green", pieces:"classic", psychedelic:false }; apply(true); }
  };
  window.SupaAppearanceSettings = api;
  function apply(save = false) {
    document.documentElement.dataset.boardTheme = current.board;
    document.documentElement.dataset.pieceTheme = current.pieces;
    document.documentElement.dataset.psychedelic = String(current.psychedelic);
    if (save) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch (_) {}
    }
    render();
  }
  function render() {
    const boardRoot = document.getElementById("board-theme-options");
    const pieceRoot = document.getElementById("piece-theme-options");
    const psychedelicToggle = document.getElementById("psychedelic-mode-toggle");
    if (!boardRoot || !pieceRoot) return;
    boardRoot.innerHTML = "";
    boardThemes.forEach(theme => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "appearance-choice board-theme-choice";
      button.dataset.theme = theme.id;
      button.title = theme.label;
      button.setAttribute("aria-label", theme.label);
      button.setAttribute("aria-pressed", String(current.board === theme.id));
      button.style.setProperty("--preview-light", theme.light);
      button.style.setProperty("--preview-dark", theme.dark);
      button.innerHTML = '<span class="board-theme-swatch" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="appearance-choice-label">'+theme.label+'</span>';
      boardRoot.appendChild(button);
    });
    pieceRoot.innerHTML = "";
    pieceThemes.forEach(theme => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "appearance-choice piece-theme-choice piece-theme-"+theme.id;
      button.dataset.theme = theme.id;
      button.title = theme.label;
      button.setAttribute("aria-label", theme.label);
      button.setAttribute("aria-pressed", String(current.pieces === theme.id));
      button.innerHTML = '<span class="piece-theme-sample" aria-hidden="true">♞♙</span><span class="appearance-choice-label">'+theme.label+'</span>';
      pieceRoot.appendChild(button);
    });
    if (psychedelicToggle) {
      psychedelicToggle.setAttribute("aria-pressed", String(current.psychedelic));
      psychedelicToggle.setAttribute("aria-label", current.psychedelic ? "Désactiver le mode psychédélique" : "Activer le mode psychédélique");
      psychedelicToggle.innerHTML = '<span class="psychedelic-orb" aria-hidden="true">✺</span><span class="appearance-choice-label">'+(current.psychedelic ? "Mode activé" : "Mode désactivé")+'</span>';
    }
  }
  document.getElementById("board-theme-options")?.addEventListener("click", event => {
    const button = event.target.closest("button[data-theme]");
    if (!button) return;
    current.board = button.dataset.theme;
    apply(true);
  });
  document.getElementById("piece-theme-options")?.addEventListener("click", event => {
    const button = event.target.closest("button[data-theme]");
    if (!button) return;
    current.pieces = button.dataset.theme;
    apply(true);
  });
  document.getElementById("psychedelic-mode-toggle")?.addEventListener("click", () => {
    api.setPsychedelic(!current.psychedelic);
  });
  document.getElementById("appearance-reset")?.addEventListener("click", () => {
    current = { board:"green", pieces:"classic", psychedelic:false };
    apply(true);
  });
  apply(false);
})();
