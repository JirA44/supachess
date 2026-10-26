(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ReviewInsights = api;
  if (root && root.document && typeof root.reviewHistoryLoad === "function") api.attachUI();
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const GRADE_IDS = ["brilliant", "best", "very-good", "good", "ok", "inaccuracy", "mistake", "blunder"];
  const ISSUE_IDS = new Set(["inaccuracy", "mistake", "blunder"]);
  const PHASES = ["opening", "middlegame", "endgame"];

  function phaseOf(fen, moveNumber) {
    if (Number(moveNumber) <= 10) return "opening";
    const board = String(fen || "").split(/\s+/)[0] || "";
    const majorMinorPieces = (board.match(/[QRBNqrbn]/g) || []).length;
    if (!/[Qq]/.test(board) && majorMinorPieces <= 6) return "endgame";
    return "middlegame";
  }

  function blankPlayer(name, color, accuracy) {
    const grades = Object.fromEntries(GRADE_IDS.map((id) => [id, 0]));
    const phases = Object.fromEntries(PHASES.map((id) => [id, { moves: 0, issues: 0 }]));
    return { name, color, moves: 0, ratedMoves: 0, accuracy: Number.isFinite(accuracy) ? accuracy : null,
      grades, phases, diagnostics: {}, worstMoves: [] };
  }

  function classify(lossCp) {
    if (!Number.isFinite(lossCp)) return "unrated";
    if (lossCp >= 200) return "blunder";
    if (lossCp >= 60) return "mistake";
    if (lossCp >= 30) return "inaccuracy";
    if (lossCp <= 10) return "very-good";
    if (lossCp <= 20) return "good";
    return "ok";
  }

  function buildGameSummary(input = {}) {
    const rows = Array.isArray(input.rows) ? input.rows : [];
    const moves = Array.isArray(input.moves) ? input.moves : [];
    const fens = Array.isArray(input.fens) ? input.fens : [];
    const headers = input.headers || {};
    const players = {
      w: blankPlayer(String(headers.White || "Blancs"), "w", input.accuracyW),
      b: blankPlayer(String(headers.Black || "Noirs"), "b", input.accuracyB),
    };

    rows.forEach((row, index) => {
      const player = players[row && row.color];
      if (!player) return;
      player.moves++;
      if (!row || !Number.isFinite(row.lossCp)) return;
      player.ratedMoves++;
      const category = GRADE_IDS.includes(row.classification) ? row.classification : classify(row.lossCp);
      player.grades[category]++;
      const move = moves[index] || {};
      const moveNumber = Number(row.n) || Math.floor(index / 2) + 1;
      const phase = phaseOf(fens[index], moveNumber);
      player.phases[phase].moves++;
      if (ISSUE_IDS.has(category)) player.phases[phase].issues++;

      for (const diagnostic of Array.isArray(row.diagnostics) ? row.diagnostics : []) {
        if (!diagnostic || typeof diagnostic.code !== "string") continue;
        const current = player.diagnostics[diagnostic.code] || { count: 0, habit: "" };
        current.count++;
        if (!current.habit && typeof diagnostic.suggestedHabit === "string") current.habit = diagnostic.suggestedHabit;
        player.diagnostics[diagnostic.code] = current;
      }

      if (ISSUE_IDS.has(category)) {
        player.worstMoves.push({ moveNumber, color: player.color, san: String(row.san || move.san || "?"),
          lossCp: row.lossCp, phase, diagnostics: (Array.isArray(row.diagnostics) ? row.diagnostics : []).map((item) => item.code).filter(Boolean) });
      }
    });

    for (const player of Object.values(players)) {
      player.worstMoves.sort((a, b) => b.lossCp - a.lossCp);
      player.worstMoves = player.worstMoves.slice(0, 4);
    }
    return { version: 1, players: Object.values(players) };
  }

  function splitPgnCollection(text) {
    const normalized = String(text || "").replace(/\r\n?/g, "\n").trim();
    if (!normalized) return [];
    const starts = [...normalized.matchAll(/^\s*\[Event\s+/gm)].map((match) => match.index);
    if (starts.length < 2) return [normalized];
    return starts.map((start, index) => normalized.slice(start, starts[index + 1] || normalized.length).trim()).filter(Boolean);
  }

  function validatePgnCollection(text, ChessClass) {
    const Game = ChessClass || root.Chess || (typeof require === "function" ? require("chess.js").Chess : null);
    if (!Game) throw new Error("Le validateur PGN n'est pas disponible.");
    const valid = [];
    const invalid = [];
    for (const pgn of splitPgnCollection(text)) {
      try {
        const game = new Game();
        const load = game.load_pgn || game.loadPgn;
        if (typeof load !== "function" || !load.call(game, pgn, { sloppy: true }) || !game.history().length) {
          invalid.push(pgn);
          continue;
        }
        valid.push({ pgn, headers: typeof game.header === "function" ? game.header() : {}, plies: game.history().length });
      } catch (_) {
        invalid.push(pgn);
      }
    }
    return { valid, invalid };
  }

  function blankAggregate(name) {
    return { name, games: 0, moves: 0, ratedMoves: 0, accuracyWeighted: 0, accuracyWeight: 0,
      grades: Object.fromEntries(GRADE_IDS.map((id) => [id, 0])),
      phases: Object.fromEntries(PHASES.map((id) => [id, { moves: 0, issues: 0 }])),
      diagnostics: {}, worstMoves: [] };
  }

  function aggregate(items) {
    const list = Array.isArray(items) ? items : [];
    const profiles = new Map();
    let analyzedGames = 0;
    let skippedGames = 0;
    for (const item of list) {
      const summary = item && item.analysis;
      if (!summary || summary.version !== 1 || !Array.isArray(summary.players)) { skippedGames++; continue; }
      analyzedGames++;
      for (const player of summary.players) {
        if (!player || !["w", "b"].includes(player.color)) continue;
        const name = String(player.name || (player.color === "w" ? "Blancs (sans nom)" : "Noirs (sans nom)")).trim();
        const key = name.toLocaleLowerCase();
        if (!profiles.has(key)) profiles.set(key, blankAggregate(name));
        const profile = profiles.get(key);
        profile.games++;
        profile.moves += Number(player.moves) || 0;
        profile.ratedMoves += Number(player.ratedMoves) || 0;
        if (Number.isFinite(player.accuracy) && Number(player.ratedMoves) > 0) {
          profile.accuracyWeighted += player.accuracy * player.ratedMoves;
          profile.accuracyWeight += player.ratedMoves;
        }
        for (const id of GRADE_IDS) profile.grades[id] += Number(player.grades && player.grades[id]) || 0;
        for (const id of PHASES) {
          profile.phases[id].moves += Number(player.phases && player.phases[id] && player.phases[id].moves) || 0;
          profile.phases[id].issues += Number(player.phases && player.phases[id] && player.phases[id].issues) || 0;
        }
        for (const [code, detail] of Object.entries(player.diagnostics || {})) {
          const current = profile.diagnostics[code] || { count: 0, habit: "" };
          current.count += Number(detail && detail.count) || 0;
          if (!current.habit && detail && typeof detail.habit === "string") current.habit = detail.habit;
          profile.diagnostics[code] = current;
        }
        for (const move of Array.isArray(player.worstMoves) ? player.worstMoves : []) {
          profile.worstMoves.push({ ...move, event: String(item.event || ""), opponent: String(player.color === "w" ? item.black || "Noirs" : item.white || "Blancs") });
        }
      }
    }
    const result = [...profiles.values()].map((profile) => {
      profile.accuracy = profile.accuracyWeight ? profile.accuracyWeighted / profile.accuracyWeight : null;
      profile.worstMoves.sort((a, b) => b.lossCp - a.lossCp);
      profile.worstMoves = profile.worstMoves.slice(0, 6);
      delete profile.accuracyWeighted;
      delete profile.accuracyWeight;
      return profile;
    }).sort((a, b) => b.games - a.games || a.name.localeCompare(b.name, "fr"));
    return { profiles: result, analyzedGames, skippedGames, selectedGames: list.length };
  }

  function personalizedPath(profile) {
    if (!profile) return [];
    const smallSample = profile.games < 3 || profile.ratedMoves < 30;
    const recommendations = [];
    const add = (program, skill, evidence, practice) => {
      if (recommendations.some((item) => item.program === program)) return;
      recommendations.push({ program, skill, evidence, practice, confidence: smallSample ? "faible · échantillon à confirmer" : "à confirmer sur d’autres parties" });
    };
    const exposed = profile.diagnostics && profile.diagnostics.PIECE_EN_PRISE_EN_UN_COUP;
    if (exposed && exposed.count > 0) add("Anti-erreurs · anticiper l’adversaire",
      "Anticiper les menaces et pièces exposées",
      exposed.count + " occurrence(s) de prise immédiate sur " + profile.games + " partie(s)",
      "Avant chaque coup, liste les échecs, prises et menaces adverses; vérifie les pièces que ton coup laisserait sans défense.");
    const phases = Object.entries(profile.phases || {}).filter(([, value]) => value && value.moves >= 3)
      .map(([phase, value]) => ({ phase, rate: value.issues / value.moves, moves: value.moves, issues: value.issues }))
      .sort((a, b) => b.rate - a.rate);
    const weakest = phases[0];
    if (weakest) {
      const label = ({ opening: "ouverture", middlegame: "milieu de jeu", endgame: "finale" })[weakest.phase];
      const program = ({ opening: "Fischer · préparation et précision",
        middlegame: "Kasparov · coups candidats et calcul",
        endgame: "Carlsen · amélioration et conversion" })[weakest.phase];
      add(program, "Renforcer la " + label,
        weakest.issues + " coup(s) classé(s) comme erreur(s) sur " + weakest.moves + " demi-coups notés dans cette phase",
        "Revois les principes de cette phase, puis calcule les réponses adverses avant de valider chaque coup.");
    }
    const issueCount = ["inaccuracy", "mistake", "blunder"].reduce((sum, key) => sum + (Number(profile.grades && profile.grades[key]) || 0), 0);
    if (issueCount > 0) add("Kasparov · coups candidats et calcul",
      "Corriger les imprécisions et calculer les réponses",
      issueCount + " coup(s) classé(s) imprécision, erreur ou gaffe",
      "Rejoue chaque position, cherche les coups candidats et calcule la meilleure réponse adverse avant de comparer la suite Stockfish.");
    add("Stockfish · comparer et vérifier", "Comparer tes candidats avec Stockfish 19",
      profile.ratedMoves + " demi-coup(s) noté(s) dans l'échantillon",
      "Annonce ton coup et ta variante avant d'ouvrir l'analyse, puis explique l'écart entre ton calcul et la ligne du moteur.");
    return recommendations.slice(0, 4);
  }

  function attachUI() {
    const doc = root.document;
    const list = doc.getElementById("review-history-list");
    if (!list || doc.getElementById("review-insights-panel")) return;
    const selectedIds = new Set();
    const panel = doc.createElement("section");
    panel.id = "review-insights-panel";
    panel.setAttribute("aria-labelledby", "review-insights-title");
    panel.innerHTML = "<h3 id=\"review-insights-title\">Bilan transversal et parcours personnalisé</h3>" +
      "<p>Importe plusieurs PGN, sélectionne les parties à travailler, puis analyse les coups un par un avec Stockfish. Le bilan reste sur cet appareil.</p>" +
      "<div class=\"review-insights-controls\"><button class=\"btn secondary\" type=\"button\" data-review-insights-import-trigger>Importer des PGN</button><input type=\"file\" accept=\".pgn,.txt,application/x-chess-pgn\" multiple hidden data-review-insights-import> " +
      "<button class=\"btn mini\" type=\"button\" data-review-insights-select-all>Tout sélectionner</button> " +
      "<button class=\"btn\" type=\"button\" data-review-insights-run disabled>Sélectionne des PGN</button></div>" +
      "<p data-review-insights-status role=\"status\" aria-live=\"polite\"></p><div data-review-insights-report aria-live=\"polite\"></div>";
    list.insertAdjacentElement("afterend", panel);

    const style = doc.createElement("style");
    style.id = "review-insights-style";
    style.textContent = "#review-insights-panel{margin-top:12px;padding:10px;border:1px solid rgba(240,179,92,.45);border-radius:8px}" +
      "#review-insights-panel h3{margin:4px 0 8px}#review-insights-panel p{font-size:.86em}" +
      ".review-insights-controls{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}" +
      ".review-insights-player{margin:10px 0;padding:10px;border:1px solid rgba(128,128,128,.35);border-radius:8px}" +
      ".review-insights-player h4{margin:0 0 6px}.review-insights-note{font-size:.78em;opacity:.8}" +
      ".review-history-insights-select{margin-right:6px;flex:0 0 auto}" +
      ".review-path-step{padding:8px;margin:6px 0;border-left:3px solid #3c9b63;background:rgba(60,155,99,.1)}" +
      ".review-path-action{margin-top:6px}";
    doc.head.appendChild(style);

    const status = panel.querySelector("[data-review-insights-status]");
    const report = panel.querySelector("[data-review-insights-report]");
    const runButton = panel.querySelector("[data-review-insights-run]");
    const allButton = panel.querySelector("[data-review-insights-select-all]");
    const importButton = panel.querySelector("[data-review-insights-import-trigger]");
    const importInput = panel.querySelector("[data-review-insights-import]");
    const loadItems = () => root.reviewHistoryLoad();

    function decorateRows() {
      for (const row of list.querySelectorAll(".review-history-row")) {
        const id = row.getAttribute("data-review-history-id");
        if (!id || row.querySelector(".review-history-insights-select")) continue;
        const label = doc.createElement("label");
        label.className = "review-history-insights-select";
        label.setAttribute("aria-label", "Sélectionner cette partie pour le bilan transversal");
        const checkbox = doc.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.reviewInsightsId = id;
        checkbox.checked = selectedIds.has(id);
        label.appendChild(checkbox);
        row.insertBefore(label, row.firstChild);
      }
    }

    function syncControls() {
      const items = loadItems();
      const selected = items.filter((item) => selectedIds.has(item.id));
      const pending = selected.filter((item) => !item.analysis || item.analysis.version !== 1);
      runButton.disabled = selected.length === 0;
      runButton.textContent = !selected.length ? "Sélectionne des PGN" : pending.length
        ? "Analyser " + pending.length + " PGN sélectionné(s)" : "Créer le bilan de " + selected.length + " partie(s)";
      allButton.disabled = items.length === 0;
      allButton.textContent = items.length > 0 && selected.length === items.length
        ? "Tout désélectionner" : "Tout sélectionner";
      status.textContent = selected.length + " partie(s) sélectionnée(s) sur " + items.length + ".";
    }

    function addText(parent, tag, text, className) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      node.textContent = text;
      parent.appendChild(node);
      return node;
    }

    function renderReport() {
      const selected = loadItems().filter((item) => selectedIds.has(item.id));
      const result = aggregate(selected);
      report.replaceChildren();
      if (!result.analyzedGames) {
        addText(report, "p", result.skippedGames
          ? "Les parties sélectionnées ont une ancienne analyse sans mesures détaillées. Réanalyse-les pour les inclure."
          : "Sélectionne au moins une partie analysée.");
        return;
      }
      addText(report, "p", "Bilan calculé sur " + result.analyzedGames + " partie(s) analysée(s). " +
        "Les joueurs sont regroupés par leur nom dans l’en-tête PGN.");
      for (const profile of result.profiles) {
        const section = doc.createElement("section");
        section.className = "review-insights-player";
        report.appendChild(section);
        addText(section, "h4", profile.name);
        addText(section, "p", "Échantillon : " + profile.games + " partie(s), " + profile.ratedMoves +
          " demi-coup(s) noté(s). Précision moyenne mesurée : " +
          (Number.isFinite(profile.accuracy) ? profile.accuracy.toFixed(1) + "%" : "non disponible") + ".");

        const positive = ["brilliant", "best", "very-good", "good"]
          .reduce((sum, key) => sum + (Number(profile.grades[key]) || 0), 0);
        const issues = ["inaccuracy", "mistake", "blunder"]
          .reduce((sum, key) => sum + (Number(profile.grades[key]) || 0), 0);
        const phaseRows = Object.entries(profile.phases).filter((entry) => entry[1].moves >= 3)
          .map(([phase, data]) => ({ phase, moves: data.moves, issues: data.issues, rate: data.issues / data.moves }));
        const weakest = phaseRows.slice().sort((a, b) => b.rate - a.rate)[0];
        const strongest = phaseRows.slice().sort((a, b) => a.rate - b.rate)[0];
        addText(section, "p", "Forces mesurées : " + positive + "/" + profile.ratedMoves +
          " coups classés parmi les meilleurs, très bons ou bons (" +
          (profile.ratedMoves ? (100 * positive / profile.ratedMoves).toFixed(1) + "%" : "—") + ")." +
          (strongest ? " Phase la plus régulière de l’échantillon : " +
            ({ opening: "ouverture", middlegame: "milieu de jeu", endgame: "finale" })[strongest.phase] +
            " (" + (100 * (strongest.moves - strongest.issues) / strongest.moves).toFixed(1) + "% sans erreur classée)." : ""));
        addText(section, "p", "Faiblesses observées : " + issues + "/" + profile.ratedMoves +
          " imprécision(s), erreur(s) ou gaffe(s) (" +
          (profile.ratedMoves ? (100 * issues / profile.ratedMoves).toFixed(1) + "%" : "—") + ")." +
          (weakest ? " Phase la plus fragile parmi celles avec au moins 3 coups notés : " +
            ({ opening: "ouverture", middlegame: "milieu de jeu", endgame: "finale" })[weakest.phase] +
            " (" + (100 * weakest.issues / weakest.moves).toFixed(1) + "% de coups concernés)." :
            " Échantillon trop court pour conclure sur une phase."));

        const recommendations = personalizedPath(profile);
        const path = doc.createElement("section");
        path.className = "review-personalized-path";
        addText(path, "strong", "Parcours personnalisé proposé");
        const steps = doc.createElement("ol");
        path.appendChild(steps);
        for (const recommendation of recommendations) {
          const step = doc.createElement("li");
          step.className = "review-path-step";
          addText(step, "strong", recommendation.skill + " · " + recommendation.program);
          addText(step, "p", recommendation.evidence + ". Confiance : " + recommendation.confidence + ".");
          addText(step, "p", recommendation.practice);
          steps.appendChild(step);
        }
        const openPath = addText(path, "button", "Enregistrer et ouvrir ce parcours dans l’Académie");
        openPath.type = "button";
        openPath.className = "btn review-path-action";
        openPath.addEventListener("click", () => {
          try {
            root.localStorage.setItem("supachess_personalized_path", JSON.stringify({
              player: profile.name, gameCount: profile.games, createdAt: new Date().toISOString(),
              recommendations
            }));
            root.location.href = "book-lessons.html#parcours-pgn";
          } catch (_) {
            status.textContent = "Le navigateur n’a pas pu enregistrer ce parcours sur cet appareil.";
          }
        });
        section.appendChild(path);

        addText(section, "strong", "Lacunes tactiques diagnostiquées");
        const diagnoses = Object.entries(profile.diagnostics).sort((a, b) => b[1].count - a[1].count);
        if (diagnoses.length) {
          const listNode = doc.createElement("ul");
          section.appendChild(listNode);
          for (const [code, detail] of diagnoses) {
            const label = code === "PIECE_EN_PRISE_EN_UN_COUP"
              ? "Pièce exposée à une capture immédiate" : code;
            addText(listNode, "li", label + " : " + detail.count + " occurrence(s)." +
              (detail.habit ? " Habitude proposée : " + detail.habit : ""));
          }
        } else addText(section, "p", "Aucun thème récurrent confirmé par les diagnostics tactiques disponibles.");

        const details = doc.createElement("details");
        section.appendChild(details);
        addText(details, "summary", "Voir les coups les plus coûteux");
        if (profile.worstMoves.length) {
          const listNode = doc.createElement("ol");
          details.appendChild(listNode);
          for (const move of profile.worstMoves) {
            addText(listNode, "li", move.moveNumber + (move.color === "b" ? "… " : ". ") + move.san +
              " — perte mesurée : " + (move.lossCp / 100).toFixed(2) + " pion(s)" +
              (move.event ? " · " + move.event : ""));
          }
        } else addText(details, "p", "Aucun coup classé comme erreur dans ces parties.");
      }
      if (result.skippedGames) addText(report, "p", result.skippedGames +
        " ancienne(s) analyse(s) ignorée(s), car elles ne contiennent pas encore les mesures détaillées. Réanalyse-les pour les inclure.");
      addText(report, "p", "Ces résultats résument l’échantillon sélectionné : les classements de coups, les phases repérées et les diagnostics disponibles ne suffisent pas, seuls, à conclure sur le niveau général.", "review-insights-note");
    }

    const originalRender = root.reviewHistoryRender;
    root.reviewHistoryRender = function () {
      const value = originalRender.apply(this, arguments);
      decorateRows();
      syncControls();
      return value;
    };
    list.addEventListener("change", (event) => {
      const checkbox = event.target.closest("input[data-review-insights-id]");
      if (!checkbox) return;
      if (checkbox.checked) selectedIds.add(checkbox.dataset.reviewInsightsId);
      else selectedIds.delete(checkbox.dataset.reviewInsightsId);
      syncControls();
    });
    allButton.addEventListener("click", () => {
      const items = loadItems();
      const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
      if (allSelected) selectedIds.clear();
      else items.forEach((item) => selectedIds.add(item.id));
      decorateRows();
      syncControls();
    });
    runButton.addEventListener("click", async () => {
      const selected = loadItems().filter((item) => selectedIds.has(item.id));
      const pending = selected.filter((item) => !item.analysis || item.analysis.version !== 1);
      if (pending.length) {
        if (typeof root.reviewRunBatch !== "function") {
          status.textContent = "L’analyse groupée n’est pas disponible dans cette version.";
          return;
        }
        runButton.disabled = true;
        for (const item of pending) {
          const currentIndex = pending.indexOf(item) + 1;
          status.textContent = "Analyse Stockfish " + currentIndex + "/" + pending.length + " · " +
            (item.white || "Blancs") + " vs " + (item.black || "Noirs");
          const results = await root.reviewRunBatch([item]);
          if (!results.length || !results[0].completed) {
            status.textContent = "Analyse interrompue. Les PGN déjà terminés restent enregistrés sur cet appareil.";
            syncControls();
            return;
          }
        }
        root.reviewHistoryRender("Analyse des PGN sélectionnés terminée.");
        status.textContent = "Analyse terminée. Calcul du bilan de l’échantillon sélectionné…";
      }
      renderReport();
      syncControls();
    });
    importButton.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", async () => {
      const files = Array.from(importInput.files || []);
      let imported = 0, rejected = 0;
      importButton.disabled = true;
      status.textContent = "Lecture et validation des fichiers PGN…";
      try {
        for (const file of files) {
          const parsed = validatePgnCollection(await file.text());
          rejected += parsed.invalid.length;
          for (const game of parsed.valid) {
            if (imported >= 50) { rejected++; continue; }
            root.reviewHistorySave(game.pgn, game.headers, [], null);
            const normalized = game.pgn.replace(/\r\n?/g, "\n").trim();
            const saved = loadItems().find((item) => item.pgn.replace(/\r\n?/g, "\n").trim() === normalized);
            if (saved) selectedIds.add(saved.id);
            imported++;
          }
        }
        root.reviewHistoryRender();
        decorateRows();
        syncControls();
        status.textContent = imported + " PGN valide(s) importé(s), " + rejected +
          " entrée(s) invalide(s). Les PGN importés sont sélectionnés; lance leur analyse Stockfish.";
      } catch (error) {
        status.textContent = "Import impossible : " + (error && error.message ? error.message : "lecture du fichier échouée.");
      } finally {
        importButton.disabled = false;
        importInput.value = "";
      }
    });
    root.reviewHistoryRender();
  }

  return { buildGameSummary, aggregate, personalizedPath, splitPgnCollection, validatePgnCollection, phaseOf, attachUI, GRADE_IDS, ISSUE_IDS, PHASES };
});

