(function () {
  "use strict";

  const categories = [
    ["puzzle", "🧩 Elo puzzles atteint"],
    ["classic1m", "⚡ 1 minute"],
    ["classic3m", "⏱️ 3 minutes"],
    ["classic5m", "♟ 5 minutes"],
    ["classicUnlimited", "∞ Sans limite"],
    ["puzzleSprint3m", "🚀 Sprint puzzles · 3 min"],
    ["puzzleSprint5m", "🚀 Sprint puzzles · 5 min"],
    ["puzzleSurvival", "🛡️ Survie puzzles"],
    ["puzzleBattle", "⚔️ Bataille de puzzles"],
  ];
  const tabs = document.getElementById("leaderboard-tabs");
  const output = document.getElementById("leaderboard-output");
  const status = document.getElementById("leaderboard-status");
  const heading = document.getElementById("leaderboard-title");
  let selected = "puzzle";
  let requestId = 0;

  function escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function formatRating(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number).toLocaleString("fr-FR") : "—";
  }

  function renderRows(type, rows) {
    const rated = rows.filter((player) => Number(player.stats && player.stats[type] && player.stats[type].played) > 0 || (type === "puzzle" && player.puzzlesSolved > 0));
    if (!rated.length) {
      output.innerHTML = '<div class="leaderboard-empty">Aucun résultat classé enregistré dans ce format pour le moment. Les comptes apparaîtront après une partie ou une épreuve dont le score est synchronisé.</div>';
      status.textContent = "0 joueur classé dans ce format.";
      return;
    }
    if (type === "puzzle") rated.sort((a, b) => b.peakRating - a.peakRating || b.rating - a.rating);
    heading.textContent = categories.find(([key]) => key === type)?.[1] || "Classement";
    output.innerHTML = '<div class="leaderboard-table-wrap"><table class="leaderboard-table"><thead><tr><th scope="col">Rang</th><th scope="col">Joueur</th><th scope="col">Elo actuel</th><th scope="col">Elo atteint</th><th scope="col">Parties</th><th scope="col">V / N / D</th></tr></thead><tbody>' + rated.map((player, index) => {
      const stats = player.stats[type] || {};
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1);
      return '<tr><td>' + rank + '</td><th scope="row">' + escape(player.displayName || "Joueur") + '</th><td>' + formatRating(player.rating) + '</td><td>' + formatRating(player.peakRating) + '</td><td>' + Number(stats.played || 0).toLocaleString("fr-FR") + '</td><td>' + Number(stats.wins || 0) + ' / ' + Number(stats.draws || 0) + ' / ' + Number(stats.losses || 0) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
    status.textContent = rated.length + " joueur(s) classé(s) affiché(s), parmi les comptes inscrits ayant des résultats enregistrés.";
  }

  function load(type) {
    selected = type;
    const token = ++requestId;
    tabs.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.type === type)));
    heading.textContent = categories.find(([key]) => key === type)?.[1] || "Classement";
    output.innerHTML = '<div class="leaderboard-empty">Chargement du classement…</div>';
    status.textContent = "Lecture des scores des comptes inscrits…";
    const profiles = window.SupaProfiles;
    if (!profiles || typeof profiles.getTopRanking !== "function") {
      output.innerHTML = '<div class="leaderboard-empty">Le service de classement n’est pas disponible sur cette page.</div>';
      status.textContent = "Classement indisponible.";
      return;
    }
    profiles.getTopRanking(type, 100).then((rows) => {
      if (token !== requestId || selected !== type) return;
      renderRows(type, rows || []);
    }).catch(() => {
      if (token !== requestId) return;
      output.innerHTML = '<div class="leaderboard-empty">Impossible de charger ce classement. Réessaie après avoir vérifié ta connexion.</div>';
      status.textContent = "Erreur de chargement.";
    });
  }

  categories.forEach(([type, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "leaderboard-tab";
    button.dataset.type = type;
    button.setAttribute("aria-pressed", "false");
    button.textContent = label;
    button.addEventListener("click", () => load(type));
    tabs.appendChild(button);
  });
  load(selected);
})();
