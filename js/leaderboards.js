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
  const CACHE_PREFIX = "supachess-leaderboard-v1:";
  const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
  const config = window.SupaLeaderboardsConfig || {};
  const REQUEST_TIMEOUT = Number.isFinite(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : 4000;

  const tabs = document.getElementById("leaderboard-tabs");
  const output = document.getElementById("leaderboard-output");
  const status = document.getElementById("leaderboard-status");
  const heading = document.getElementById("leaderboard-title");
  const retryButton = document.getElementById("leaderboard-retry");
  const offlineNote = document.getElementById("leaderboard-offline");
  let selected = "puzzle";
  let requestId = 0;

  function escape(value) {
    const amp = String.fromCharCode(38);
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": amp + "amp;",
      "<": amp + "lt;",
      ">": amp + "gt;",
      '"': amp + "quot;",
      "'": amp + "#39;",
    })[char]);
  }

  function formatRating(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number).toLocaleString("fr-FR") : "—";
  }

  function labelFor(type) {
    return categories.find(([key]) => key === type)?.[1] || "Classement";
  }

  function cacheKey(type) {
    return CACHE_PREFIX + type;
  }

  function readCache(type) {
    try {
      const raw = window.localStorage.getItem(cacheKey(type));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rows) || !Number.isFinite(parsed.savedAt)) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function writeCache(type, rows) {
    try {
      window.localStorage.setItem(cacheKey(type), JSON.stringify({ rows: rows, savedAt: Date.now() }));
    } catch (_) {
      /* quota plein ou stockage indisponible : le classement reste fonctionnel en ligne */
    }
  }

  function formatSavedAt(savedAt) {
    try {
      return new Date(savedAt).toLocaleString("fr-FR");
    } catch (_) {
      return "";
    }
  }

  function showOfflineNote(text) {
    if (!offlineNote) return;
    offlineNote.textContent = text || "";
    offlineNote.hidden = !text;
  }

  function setRetryVisible(visible) {
    if (!retryButton) return;
    retryButton.hidden = !visible;
  }

  function renderSkeleton() {
    const columns = 6;
    const cells = Array.from({ length: columns }, () => '<td><span class="leaderboard-skeleton"></span></td>').join("");
    const rows = Array.from({ length: 6 }, () => "<tr>" + cells + "</tr>").join("");
    output.innerHTML = '<div class="leaderboard-table-wrap"><table class="leaderboard-table leaderboard-table--loading"><thead><tr><th scope="col">Rang</th><th scope="col">Joueur</th><th scope="col">Elo actuel</th><th scope="col">Elo atteint</th><th scope="col">Parties</th><th scope="col">V / N / D</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderRows(type, rows, options) {
    const cached = options && options.cached;
    const rated = rows.filter((player) => Number(player.stats && player.stats[type] && player.stats[type].played) > 0 || (type === "puzzle" && player.puzzlesSolved > 0));
    if (!rated.length) {
      output.innerHTML = '<div class="leaderboard-empty">Aucun résultat classé enregistré dans ce format pour le moment. Les comptes apparaîtront après une partie ou une épreuve dont le score est synchronisé.</div>';
      status.textContent = "0 joueur classé dans ce format.";
      return;
    }
    if (type === "puzzle") rated.sort((a, b) => b.peakRating - a.peakRating || b.rating - a.rating);
    heading.textContent = labelFor(type);
    output.innerHTML = '<div class="leaderboard-table-wrap"><table class="leaderboard-table"><thead><tr><th scope="col">Rang</th><th scope="col">Joueur</th><th scope="col">Elo actuel</th><th scope="col">Elo atteint</th><th scope="col">Parties</th><th scope="col">V / N / D</th></tr></thead><tbody>' + rated.map((player, index) => {
      const stats = player.stats[type] || {};
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1);
      return '<tr><td>' + rank + '</td><th scope="row">' + escape(player.displayName || "Joueur") + '</th><td>' + formatRating(player.rating) + '</td><td>' + formatRating(player.peakRating) + '</td><td>' + Number(stats.played || 0).toLocaleString("fr-FR") + '</td><td>' + Number(stats.wins || 0) + ' / ' + Number(stats.draws || 0) + ' / ' + Number(stats.losses || 0) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
    status.textContent = rated.length + " joueur(s) classé(s) affiché(s), parmi les comptes inscrits ayant des résultats enregistrés." +
      (cached ? " Données en cache local, actualisation en cours." : "");
  }

  function engineRowsContent(rows) {
    const rated = (rows || []).filter((entry) => entry.played > 0);
    if (!rated.length) {
      return {
        html: '<div class="leaderboard-empty">Aucun résultat moteur lisible dans ce navigateur. La page récupère aussi les matchs PGN de l’historique local. Si le round-robin a été joué dans un autre navigateur, un autre profil ou une page ouverte en fichier local, son stockage est isolé et ne peut pas être lu depuis cette adresse. Lance ou rejoue le round-robin depuis l’Académie ouverte sur ce même site et ce même navigateur.</div>',
        summary: "Aucun résultat local détecté dans cette origine de site.",
        count: 0,
      };
    }
    const html = '<div class="leaderboard-table-wrap"><table class="leaderboard-table"><thead><tr><th scope="col">Rang</th><th scope="col">Moteur simulé</th><th scope="col">Elo estimé</th><th scope="col">Parties</th><th scope="col">V / N / D</th><th scope="col">Victoires totales</th><th scope="col">Défaites totales</th><th scope="col">Score</th><th scope="col">Ratio V/D</th></tr></thead><tbody>' + rated.map((entry, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1);
      return '<tr><td>' + rank + '</td><th scope="row">' + escape(entry.name) + '</th><td>≈ ' + formatRating(entry.rating) + (entry.played < 10 ? ' · provisoire' : '') + '</td><td>' + entry.played + '</td><td>' + entry.wins + ' / ' + entry.draws + ' / ' + entry.losses + '</td><td>' + entry.wins + '</td><td>' + entry.losses + '</td><td>' + (entry.scorePercent === null ? '—' : entry.scorePercent + '%') + '</td><td>' + entry.winLossRatio + '</td></tr>';
    }).join("") + '</tbody></table></div><p class="leaderboard-note">Classement local calculé avec les résultats des tournois de moteurs sur cet appareil, toutes cadences confondues. Elo interne indicatif (départ 1500, K=24), pas un Elo humain/FIDE; les cadences mélangées réduisent la comparabilité. Le ratio V/D = victoires ÷ défaites; les nulles sont affichées séparément. Pour lancer des matchs : ouvre l’Académie et démarre un round-robin.</p>';
    return {
      html,
      summary: rated.reduce((sum, entry) => sum + entry.played, 0) / 2 + " match(s) simulé(s) terminés · résultats locaux à cet appareil.",
      count: rated.length,
    };
  }

  function renderEngineRows(rows) {
    heading.textContent = "🤖 Moteurs simulés · classement général";
    const content = engineRowsContent(rows);
    output.innerHTML = content.html;
    status.textContent = content.summary;
  }

  /* Repli hors ligne : le classement des moteurs locaux ne dépend d'aucun réseau. */
  function localFallbackHtml() {
    const tournament = window.SupaEngineTournament;
    if (!tournament || typeof tournament.getLocalStandings !== "function") return "";
    const content = engineRowsContent(tournament.getLocalStandings("all"));
    if (!content.count) return "";
    return '<section class="leaderboard-fallback" aria-labelledby="leaderboard-fallback-title"><h3 id="leaderboard-fallback-title">Moteurs locaux · repli hors ligne</h3>' + content.html + "</section>";
  }

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("le serveur n’a pas répondu en moins de " + (ms / 1000) + " s")), ms);
      Promise.resolve(promise).then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); }
      );
    });
  }

  function renderError(type, message) {
    const fallback = localFallbackHtml();
    output.innerHTML = '<div class="leaderboard-empty leaderboard-error"><p><strong>Classement indisponible.</strong> ' + escape(message) + "</p>" +
      (fallback ? '<p class="leaderboard-note">Le classement des moteurs locaux reste consultable ci-dessous.</p>' : '<p class="leaderboard-note">Réessaie dans un instant : la connexion ou le service de comptes peut être momentanément indisponible.</p>') +
      "</div>" + fallback;
    status.textContent = "Erreur de chargement du classement.";
    showOfflineNote(fallback ? "Affichage hors ligne : seuls les résultats locaux des moteurs sont disponibles." : "Mode hors ligne : aucun classement local disponible.");
    setRetryVisible(true);
  }

  function load(type) {
    selected = type;
    const token = ++requestId;
    tabs.querySelectorAll("button[data-type]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.type === type)));
    heading.textContent = labelFor(type);
    setRetryVisible(false);
    showOfflineNote("");

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

    const profiles = window.SupaProfiles;
    if (!profiles || typeof profiles.getTopRanking !== "function") {
      renderError(type, "le service de classement des comptes n’est pas disponible sur cette page.");
      return;
    }

    const cached = readCache(type);
    const cacheFresh = cached && Date.now() - cached.savedAt <= CACHE_MAX_AGE;
    renderSkeleton();
    status.textContent = "Lecture des scores des comptes inscrits…";
    if (cacheFresh) renderRows(type, cached.rows, { cached: true });

    withTimeout(profiles.getTopRanking(type, 100), REQUEST_TIMEOUT).then((rows) => {
      if (token !== requestId || selected !== type) return;
      const list = rows || [];
      writeCache(type, list);
      showOfflineNote("");
      setRetryVisible(false);
      renderRows(type, list);
    }).catch((error) => {
      if (token !== requestId || selected !== type) return;
      const message = error && error.message ? error.message : "erreur inconnue";
      if (cacheFresh) {
        renderRows(type, cached.rows, { cached: true });
        status.textContent = "Classement affiché depuis le cache local (dernière synchronisation " + formatSavedAt(cached.savedAt) + ").";
        showOfflineNote("Actualisation impossible : " + message + " Le classement affiché vient du cache local.");
        setRetryVisible(true);
        return;
      }
      renderError(type, message);
    });
  }

  function setupTabs() {
    const existing = Array.from(tabs.querySelectorAll("button[data-type]"));
    if (existing.length) {
      existing.forEach((button) => button.addEventListener("click", () => load(button.dataset.type)));
      return;
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
  }

  setupTabs();
  if (retryButton) retryButton.addEventListener("click", () => load(selected));
  load(selected);
})();
