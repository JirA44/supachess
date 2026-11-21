/* Local round-robin engine tournament with a reproducible, provisional Elo table. */
(function (root) {
  "use strict";
  const STORAGE_KEY = "supachess_engine_tournament_v1";
  const MAX_PLIES = 160;
  const engines = [
    { id: "sf18", name: "Stockfish 18", path: "vendor/stockfish-18-lite-single.js", kind: "stockfish" },
    { id: "sf19", name: "Stockfish 19", path: "vendor/stockfish-19-lite-single.js", kind: "stockfish" },
    { id: "berserk14", name: "Berserk 14", path: "vendor/berserk-14-worker.js", kind: "berserk" },
  ];
  let active = null;

  function readResults() {
    try {
      const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(rows) ? rows.filter((row) => row && engines.some((engine) => engine.id === row.whiteId) && engines.some((engine) => engine.id === row.blackId) && ["1-0", "0-1", "1/2-1/2"].includes(row.result) && Number.isFinite(Number(row.thinkMs))) : [];
    } catch (_) { return []; }
  }

  function calculateStandings(rows, thinkMs) {
    const allCadences = thinkMs === null || thinkMs === "all" || thinkMs === undefined;
    const selected = rows.filter((row) => allCadences || Number(row.thinkMs) === Number(thinkMs)).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const stats = new Map(engines.map((engine) => [engine.id, { id: engine.id, name: engine.name, rating: 1500, wins: 0, draws: 0, losses: 0, played: 0, score: 0 }]));
    for (const row of selected) {
      const white = stats.get(row.whiteId);
      const black = stats.get(row.blackId);
      if (!white || !black) continue;
      const whiteScore = row.result === "1-0" ? 1 : row.result === "0-1" ? 0 : 0.5;
      const blackScore = 1 - whiteScore;
      const expectedWhite = 1 / (1 + Math.pow(10, (black.rating - white.rating) / 400));
      const delta = 24 * (whiteScore - expectedWhite);
      white.rating += delta;
      black.rating -= delta;
      white.played += 1;
      black.played += 1;
      white.score += whiteScore;
      black.score += blackScore;
      if (whiteScore === 1) { white.wins += 1; black.losses += 1; }
      else if (whiteScore === 0) { black.wins += 1; white.losses += 1; }
      else { white.draws += 1; black.draws += 1; }
    }
    return Array.from(stats.values()).sort((a, b) => b.rating - a.rating).map((entry) => ({
      ...entry,
      rating: Math.round(entry.rating),
      scorePercent: entry.played ? Math.round(entry.score / entry.played * 1000) / 10 : null,
      winLossRatio: entry.losses ? Math.round(entry.wins / entry.losses * 100) / 100 : entry.wins ? "∞" : "—",
    }));
  }

  function ensureUI() {
    if (!root.document || root.__supaEngineTournament) return;
    root.__supaEngineTournament = true;
    const mount = document.querySelector(".sf-study-lab") || document.querySelector(".lesson-line-training");
    if (!mount) return;
    const section = document.createElement("section");
    section.className = "engine-tournament";
    section.setAttribute("aria-labelledby", "engine-tournament-title");
    section.innerHTML = `
      <style>
        .engine-tournament{max-width:1180px;margin:18px auto;padding:18px;border:1px solid #51755b;border-radius:14px;background:#101b16;color:#f3f7f4}
        .engine-tournament-controls{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin:14px 0}
        .engine-tournament-controls label{display:grid;gap:5px}
        .engine-tournament select{padding:9px;border-radius:7px;font:inherit}
        .engine-tournament-status{min-height:1.5em;font-weight:700;color:#d1ead8}
        .engine-tournament-progress{height:10px;border-radius:8px;background:#26352c;overflow:hidden}
        .engine-tournament-progress span{display:block;width:0;height:100%;background:#59ce83;transition:width .2s}
        .engine-tournament-table-wrap{overflow-x:auto;margin-top:12px}
        .engine-tournament table{width:100%;min-width:620px;border-collapse:collapse}
        .engine-tournament th,.engine-tournament td{padding:9px;border-bottom:1px solid #455549;text-align:right}
        .engine-tournament th:first-child,.engine-tournament td:first-child{text-align:left}
        .engine-tournament-note{font-size:.92rem;line-height:1.5;color:#d2ddd4}
      </style>
      <h2 id="engine-tournament-title">Tournoi des moteurs · classement général et Elo interne</h2>
      <p class="engine-tournament-note">Un round-robin joue chaque paire deux fois, avec couleurs inversées. Le classement général cumule les matchs simulés de toutes les cadences; les filtres permettent aussi de comparer les moteurs à cadence identique. Le tableau indique l’Elo interne estimé (départ 1500, K=24), les victoires, défaites, nulles et le ratio V/D. Les résultats sont enregistrés sur cet appareil; ils ne forment pas encore un classement partagé entre joueurs du site et ne représentent pas un Elo FIDE. Les parties sont conservées dans l’historique comme parties d’étude moteur.</p>
      <p class="engine-tournament-note"><strong>Moteurs embarqués :</strong> Stockfish 18, Stockfish 19 et Berserk 14. Stockfish 16/17 et un binaire Supa indépendant ne sont pas présents dans cette version du dépôt : ils ne participeront pas à ce tournoi.</p>
      <div class="engine-tournament-controls">
        <label>Temps par demi-coup
          <select data-tournament-time><option value="100">Rapide · 0,10 s</option><option value="300" selected>Standard · 0,30 s</option><option value="700">Approfondi · 0,70 s</option></select>
        </label>
        <button class="btn" type="button" data-tournament-start>Lancer le round-robin</button>
        <button class="btn" type="button" data-tournament-stop disabled>Arrêter après le coup en cours</button>
        <label>Tableau
          <select data-tournament-filter><option value="all" selected>Général · toutes cadences</option><option value="300">Standard · 0,30 s</option><option value="100">Rapide · 0,10 s</option><option value="700">Approfondi · 0,70 s</option></select>
        </label>
      </div>
      <p class="engine-tournament-status" data-tournament-status role="status" aria-live="polite"></p>
      <div class="engine-tournament-progress" aria-label="Progression du tournoi"><span data-tournament-progress></span></div>
      <div data-tournament-standings></div>`;
    mount.insertAdjacentElement(mount.classList.contains("sf-study-lab") ? "afterend" : "beforebegin", section);
    const status = section.querySelector("[data-tournament-status]");
    const progress = section.querySelector("[data-tournament-progress]");
    const start = section.querySelector("[data-tournament-start]");
    const stop = section.querySelector("[data-tournament-stop]");
    const time = section.querySelector("[data-tournament-time]");
    const filter = section.querySelector("[data-tournament-filter]");
    const standings = section.querySelector("[data-tournament-standings]");

    function renderStandings() {
      const cadence = filter.value === "all" ? "all" : Number(filter.value);
      const rows = calculateStandings(readResults(), cadence);
      const played = rows.reduce((sum, row) => sum + row.played, 0) / 2;
      if (!played) {
        standings.innerHTML = '<p class="engine-tournament-note">Aucun match classé à cette cadence pour le moment.</p>';
        return;
      }
      const scope = cadence === "all" ? "toutes cadences" : "cette cadence";
      standings.innerHTML = '<div class="engine-tournament-table-wrap"><table><thead><tr><th>Rang · moteur simulé</th><th>Elo estimé</th><th>Parties</th><th>V / N / D</th><th>Victoires totales</th><th>Défaites totales</th><th>Score %</th><th>Ratio V/D</th></tr></thead><tbody>' + rows.map((row, index) => '<tr><th scope="row">' + (index + 1) + '. ' + row.name + '</th><td>≈ ' + row.rating + (row.played < 10 ? ' · provisoire' : '') + '</td><td>' + row.played + '</td><td>' + row.wins + ' / ' + row.draws + ' / ' + row.losses + '</td><td>' + row.wins + '</td><td>' + row.losses + '</td><td>' + (row.scorePercent === null ? '—' : row.scorePercent + '%') + '</td><td>' + row.winLossRatio + '</td></tr>').join("") + '</tbody></table></div><p class="engine-tournament-note">' + played + ' match(s) terminés pris en compte pour ' + scope + '. Le ratio V/D vaut victoires ÷ défaites; ∞ signifie aucune défaite. L’Elo est une estimation interne provisoire calculée à partir des résultats simulés; le classement général mélange les cadences et ne remplace pas un Elo humain ou FIDE. Les nuls comptent dans le score, pas dans le ratio V/D.</p>';
    }

    function requestStop() {
      if (!active) return;
      active.cancelled = true;
      stop.disabled = true;
      status.textContent = "Arrêt demandé; le demi-coup en cours sera joué, puis le match incomplet sera écarté du classement.";
    }

    async function playGame(whiteEngine, blackEngine, players, thinkMs, match) {
      const game = new Chess();
      let plies = 0;
      while (!game.game_over() && plies < MAX_PLIES && !match.cancelled) {
        const engine = game.turn() === "w" ? players[whiteEngine.id] : players[blackEngine.id];
        const response = await engine.analyze({ fen: game.fen(), multipv: 1, movetime: thinkMs, elo: 0, timeoutMs: 90000 });
        const uci = String(response && response.bestmove || "");
        const parsed = uci.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/i);
        if (!parsed) throw new Error(engine.engineName + " n’a pas renvoyé de coup UCI valide.");
        const move = game.move({ from: parsed[1].toLowerCase(), to: parsed[2].toLowerCase(), promotion: parsed[3] && parsed[3].toLowerCase() });
        if (!move) throw new Error(engine.engineName + " a renvoyé le coup illégal " + uci + ". Match écarté.");
        plies++;
        if (match.cancelled) return null;
        if (plies % 8 === 0) {
          status.textContent = whiteEngine.name + " (Blancs) – " + blackEngine.name + " (Noirs) · " + plies + " demi-coups légaux…";
          progress.style.width = Math.min(99, (match.completed / match.total + plies / MAX_PLIES / match.total) * 100) + "%";
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      }
      if (match.cancelled) return null;
      const result = game.in_checkmate() ? (game.turn() === "w" ? "0-1" : "1-0") : "1/2-1/2";
      const termination = game.in_checkmate() ? "Échec et mat" : "Partie nulle ou limite de 160 demi-coups";
      if (root.SupaSelfPlayStudy && root.SupaSelfPlayStudy.storeGeneratedEngineGame) {
        root.SupaSelfPlayStudy.storeGeneratedEngineGame({
          ChessCtor: Chess, chess: game, result, white: whiteEngine.name, black: blackEngine.name,
          engineName: whiteEngine.name + " vs " + blackEngine.name, termination,
          mode: "engine-tournament",
        });
      }
      return {
        id: "engine-match-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        date: new Date().toISOString(), whiteId: whiteEngine.id, blackId: blackEngine.id,
        result, thinkMs, plies, termination,
      };
    }

    async function startTournament() {
      if (active) return;
      const thinkMs = Number(time.value);
      const pairs = [];
      for (let i = 0; i < engines.length; i++) for (let j = i + 1; j < engines.length; j++) {
        pairs.push([engines[i], engines[j]], [engines[j], engines[i]]);
      }
      const match = { cancelled: false, players: [], completed: 0, total: pairs.length };
      active = match;
      start.disabled = true;
      stop.disabled = true;
      try {
        const players = {};
        for (const config of engines) {
          players[config.id] = config.kind === "berserk" ? new BerserkEngine(config.path) : new StockfishEngine(config.path);
          match.players.push(players[config.id]);
          status.textContent = "Chargement de " + config.name + "…";
          await players[config.id].ready;
          if (match.cancelled) return;
        }
        stop.disabled = false;
        for (const [white, black] of pairs) {
          if (match.cancelled) break;
          const record = await playGame(white, black, players, thinkMs, match);
          if (!record || match.cancelled) break;
          const results = readResults();
          results.push(record);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(-2000))); }
          catch (_) { throw new Error("Le stockage local est saturé; le classement ne peut pas enregistrer la partie."); }
          match.completed++;
          status.textContent = "Match " + match.completed + "/" + match.total + " enregistré · " + white.name + " – " + black.name + " · " + record.result + " · PGN légal.";
          progress.style.width = (match.completed / match.total * 100) + "%";
          renderStandings();
        }
        if (!match.cancelled) status.textContent = "Round-robin terminé : " + match.completed + "/" + match.total + " matchs classés. Les résultats sont enregistrés sur cet appareil.";
      } catch (error) {
        if (!match.cancelled) status.textContent = "Tournoi interrompu : " + (error && error.message || "erreur moteur inconnue");
      } finally {
        match.players.forEach((player) => { try { player.stop(); } catch (_) {} });
        if (active === match) active = null;
        start.disabled = false;
        stop.disabled = true;
        renderStandings();
      }
    }

    start.addEventListener("click", startTournament);
    stop.addEventListener("click", requestStop);
    filter.addEventListener("change", renderStandings);
    renderStandings();
  }

  function getLocalStandings(thinkMs) {
    return calculateStandings(readResults(), thinkMs === undefined ? "all" : thinkMs);
  }

  root.SupaEngineTournament = { calculateStandings, getLocalStandings };
  if (typeof module !== "undefined" && module.exports) module.exports = { calculateStandings };
  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", ensureUI, { once: true });
    else ensureUI();
  }
})(typeof window !== "undefined" ? window : globalThis);
