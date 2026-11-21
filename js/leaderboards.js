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
    ["simulatedEngines", "🤖 Moteurs simulés · général"],
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

  function renderEngineRows(rows) {
    const rated = (rows || []).filter((entry) => entry.played > 0);
    heading.textContent = "🤖 Moteurs simulés · classement général";
    if (!rated.length) {
      output.innerHTML = '<div class="leaderboard-empty">Aucun résultat moteur lisible dans ce navigateur. La page récupère aussi les matchs PGN de l’historique local. Si le round-robin a été joué dans un autre navigateur, un autre profil ou une page ouverte en fichier local, son stockage est isolé et ne peut pas être lu depuis cette adresse. Lance ou rejoue le round-robin depuis l’Académie ouverte sur ce même site et ce même navigateur.</div>';
      status.textContent = "Aucun résultat local détecté dans cette origine de site.";
      return;
    }
    output.innerHTML = '<div class="leaderboard-table-wrap"><table class="leaderboard-table"><thead><tr><th scope="col">Rang</th><th scope="col">Moteur simulé</th><th scope="col">Elo estimé</th><th scope="col">Parties</th><th scope="col">V / N / D</th><th scope="col">Victoires totales</th><th scope="col">Défaites totales</th><th scope="col">Score</th><th scope="col">Ratio V/D</th></tr></thead><tbody>' + rated.map((entry, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1);
      return '<tr><td>' + rank + '</td><th scope="row">' + escape(entry.name) + '</th><td>≈ ' + formatRating(entry.rating) + (entry.played < 10 ? ' · provisoire' : '') + '</td><td>' + entry.played + '</td><td>' + entry.wins + ' / ' + entry.draws + ' / ' + entry.losses + '</td><td>' + entry.wins + '</td><td>' + entry.losses + '</td><td>' + (entry.scorePercent === null ? '—' : entry.scorePercent + '%') + '</td><td>' + entry.winLossRatio + '</td></tr>';
    }).join("") + '</tbody></table></div><p class="leaderboard-note">Classement local calculé avec les résultats des tournois de moteurs sur cet appareil, toutes cadences confondues. Elo interne indicatif (départ 1500, K=24), pas un Elo humain/FIDE; les cadences mélangées réduisent la comparabilité. Le ratio V/D = victoires ÷ défaites; les nulles sont affichées séparément. Pour lancer des matchs : ouvre l’Académie et démarre un round-robin.</p>';
    status.textContent = rated.reduce((sum, entry) => sum + entry.played, 0) / 2 + " match(s) simulé(s) terminés · résultats locaux à cet appareil.";
  }

  function load(type) {
    selected = type;
    const token = ++requestId;
    tabs.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.type === type)));
    heading.textContent = categories.find(([key]) => key === type)?.[1] || "Classement";
    output.innerHTML = '<div class="leaderboard-empty">Chargement du classement…</div>';
    if (type === "simulatedEngines") {
      const tournament = window.SupaEngineTournament;
      if (!tournament || typeof tournament.getLocalStandings !== "function") {
        output.innerHTML = '<div class="leaderboard-empty">Le classement local des moteurs n’est pas disponible sur cette page.</div>';
        status.textContent = "Classement moteur indisponible.";
        return;
      }
      renderEngineRows(tournament.getLocalStandings("all"));
      return;
    }
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
