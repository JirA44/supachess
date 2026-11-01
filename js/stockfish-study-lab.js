/* Stockfish-based audit and local exercise generation for SupaChess Academy. */
(function (root) {
  "use strict";
  if (!root.document || !root.SupaChessLessons || !root.SupaChessAcademy || root.__supaStockfishStudyLab) return;
  root.__supaStockfishStudyLab = true;

  const AUDIT_KEY = "supachess-stockfish-study-audit-v1";
  const DERIVED_KEY = "supachess-stockfish-derived-lessons-v1";
  const PUZZLE_URL = "data/stockfish-tactics-audit.json";
  const MOVE_TIME = 500;
  const MIN_GAP_CP = 35;
  let engine = null;
  let paused = false;
  let running = false;
  let sourceEntries = [];
  let audit = readAudit();
  let visibleCount = 25;

  function readAudit() {
    try {
      const value = JSON.parse(localStorage.getItem(AUDIT_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) { return {}; }
  }

  function saveAudit() {
    try { localStorage.setItem(AUDIT_KEY, JSON.stringify(audit)); }
    catch (_) { setStatus("Stockage local saturé : l’audit s’arrête pour éviter de perdre les résultats."); paused = true; }
  }

  function addStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .sf-study-lab{margin:18px auto;padding:18px;max-width:1180px;background:#101b16;border:1px solid #4b795d;border-radius:14px;color:#f3f7f4}
      .sf-study-lab h2{margin:0 0 8px;font-size:1.3rem}
      .sf-study-lab p{line-height:1.5}
      .sf-study-controls{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}
      .sf-study-status{min-height:1.6em;color:#d1ead8;font-weight:700}
      .sf-study-progress{height:12px;background:#26352c;border-radius:10px;overflow:hidden}
      .sf-study-progress span{display:block;height:100%;width:0;background:#59ce83;transition:width .2s}
      .sf-study-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:9px;margin:12px 0}
      .sf-study-result{padding:12px;border:1px solid #47584b;border-radius:9px;background:#17231b}
      .sf-study-result strong{display:block;margin-bottom:5px}
      .sf-study-result p{margin:5px 0;font-size:.92rem}
      .sf-study-muted{color:#c4d0c7}
      .sf-study-result .btn{margin-top:6px}
      @media(max-width:600px){.sf-study-lab{padding:13px}.sf-study-results{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    addStyle();
    const section = document.createElement("section");
    section.className = "sf-study-lab";
    section.setAttribute("aria-labelledby", "sf-study-title");
    section.innerHTML = `
      <h2 id="sf-study-title">Atelier Stockfish · audit et nouvelles maîtrises</h2>
      <p>Stockfish 19 passe en revue les positions des leçons, exercices de l’Académie et puzzles tactiques. Il fournit des coups, évaluations et variantes calculées; les principes pédagogiques ci-dessous sont des consignes originales de vérification, pas des explications internes du moteur. L’audit reprend où il s’est arrêté et garde ses données dans ce navigateur.</p>
      <div class="sf-study-controls">
        <button class="btn" type="button" data-sf-audit>Auditer tout le corpus</button>
        <button class="btn" type="button" data-sf-pause disabled>Mettre en pause</button>
        <button class="btn" type="button" data-sf-lessons>Auditer les leçons et exercices</button>
        <button class="btn" type="button" data-sf-puzzles>Auditer les puzzles tactiques</button>
      </div>
      <p class="sf-study-status" role="status" aria-live="polite" data-sf-status></p>
      <div class="sf-study-progress" aria-label="Progression de l’audit"><span data-sf-progress></span></div>
      <label for="sf-study-search">Rechercher une position analysée</label>
      <input id="sf-study-search" data-sf-search type="search" placeholder="Titre, joueur, thème…" style="width:min(100%,520px);padding:10px;margin:6px 0">
      <div class="sf-study-results" data-sf-results></div>
      <button class="btn" type="button" data-sf-more hidden>Afficher davantage</button>
      <p class="sf-study-muted">Un exercice de choix unique n’est créé que si Stockfish classe nettement le premier coup (écart d’au moins 0,35 pion dans cette recherche). Les puzzles dont la solution publiée diffère du premier coup moteur sont signalés, pas réécrits silencieusement. Les analyses et exercices ajoutés sont locaux à cet appareil.</p>
    `;
    const intro = document.querySelector(".lesson-intro");
    if (intro) intro.insertAdjacentElement("afterend", section);
    else document.getElementById("lesson-catalog")?.insertAdjacentElement("beforebegin", section);
    section.querySelector("[data-sf-audit]").addEventListener("click", () => startAudit("all"));
    section.querySelector("[data-sf-lessons]").addEventListener("click", () => startAudit("lessons"));
    section.querySelector("[data-sf-puzzles]").addEventListener("click", () => startAudit("puzzles"));
    section.querySelector("[data-sf-pause]").addEventListener("click", () => { paused = true; setStatus("Pause demandée; le calcul en cours va se terminer avant l’arrêt."); });
    section.querySelector("[data-sf-more]").addEventListener("click", () => { visibleCount += 25; renderResults(); });
    return section;
  }

  const ui = createUI();
  const statusNode = ui.querySelector("[data-sf-status]");
  const progressNode = ui.querySelector("[data-sf-progress]");
  const pauseButton = ui.querySelector("[data-sf-pause]");

  function setStatus(text) { statusNode.textContent = text; }

  async function collectLessonEntries() {
    const entries = [];
    for (const lesson of root.SupaChessLessons) {
      if (!lesson || lesson.kind === "engine-derived") continue;
      try {
        const position = new Chess(lesson.fen);
        for (const san of lesson.setup || []) {
          if (!position.move(san)) throw new Error("setup illégal");
        }
        entries.push({
          key: "lesson:" + lesson.id + ":" + position.fen(),
          id: lesson.id,
          kind: "lesson",
          title: lesson.title,
          theme: lesson.category || "Leçon",
          level: lesson.level || "Intermédiaire",
          fen: position.fen(),
          expectedUci: lesson.sequence && lesson.sequence.find((move) => move.side === "user")?.uci || ""
        });
      } catch (error) {
        entries.push({ key: "invalid:" + lesson.id, id: lesson.id, kind: "invalid", title: lesson.title,
          theme: lesson.category || "Leçon", error: "Position non vérifiable : " + error.message });
      }
    }
    return entries;
  }

  async function collectPuzzleEntries() {
    const response = await fetch(PUZZLE_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error("Banque de puzzles tactiques indisponible (HTTP " + response.status + ").");
    const data = await response.json();
    const puzzles = Array.isArray(data) ? data : data.puzzles;
    if (!Array.isArray(puzzles)) throw new Error("Format de banque de puzzles non reconnu.");
    return puzzles.map((puzzle) => {
      const fen = puzzle.fen || (puzzle.board + " " + puzzle.turn + " - - 0 1");
      return { key: "puzzle:" + puzzle.id + ":" + fen, id: puzzle.id, kind: "puzzle",
        title: puzzle.title, theme: "Puzzle tactique · " + puzzle.theme,
        level: levelFromRating(puzzle.rating), fen, answerUci: puzzle.answerUci || puzzle.answer || "" };
    });
  }

  function levelFromRating(rating) {
    if (rating <= 1300) return "Débutant";
    if (rating <= 1800) return "Intermédiaire";
    if (rating <= 2200) return "Avancé";
    return "Expert";
  }

  function renderProgress(done, total) {
    const percent = total ? Math.round(done * 100 / total) : 0;
    progressNode.style.width = percent + "%";
    ui.querySelector(".sf-study-progress").setAttribute("aria-valuenow", String(percent));
  }

  async function startAudit(scope) {
    if (running) return;
    running = true;
    paused = false;
    pauseButton.disabled = false;
    const buttons = ui.querySelectorAll("[data-sf-audit],[data-sf-lessons],[data-sf-puzzles]");
    buttons.forEach((button) => { button.disabled = true; });
    try {
      let lessons = [];
      let puzzles = [];
      if (scope !== "puzzles") lessons = await collectLessonEntries();
      if (scope !== "lessons") {
        try { puzzles = await collectPuzzleEntries(); }
        catch (error) { if (scope === "puzzles" || scope === "all") throw error; }
      }
      sourceEntries = scope === "lessons" ? lessons : scope === "puzzles" ? puzzles : lessons.concat(puzzles);
      const valid = sourceEntries.filter((entry) => entry.kind !== "invalid");
      const uniquePositions = new Map();
      valid.forEach((entry) => {
        if (audit[entry.key]) return;
        if (!uniquePositions.has(entry.fen)) uniquePositions.set(entry.fen, []);
        uniquePositions.get(entry.fen).push(entry);
      });
      const work = Array.from(uniquePositions.entries());
      const processedStart = valid.filter((entry) => audit[entry.key]).length;
      setStatus("Corpus chargé : " + lessons.length + " leçons/exercices et " + puzzles.length +
        " puzzles. Positions distinctes à analyser maintenant : " + work.length + ".");
      if (!engine) {
        engine = new StockfishEngine("vendor/stockfish-19-lite-single.js");
        await engine.ready;
      }
      let doneEntries = 0;
      for (const [fen, entries] of work) {
        if (paused) break;
        const position = new Chess(fen);
        const legalCount = position.moves({ verbose: true }).length;
        const response = await engine.analyze({ fen: fen, multipv: Math.min(4, legalCount), movetime: MOVE_TIME, elo: 0 });
        const result = root.SupaChessAcademy.buildEngineChoices(fen, response.lines);
        for (const entry of entries) {
          audit[entry.key] = {
            key: entry.key, id: entry.id, kind: entry.kind, title: entry.title, theme: entry.theme,
            level: entry.level, fen: fen, choices: result.choices, legalCount: result.legalCount,
            depth: result.choices.reduce((max, choice) => Math.max(max, choice.depth), 0),
            puzzleAnswer: entry.answerUci || "", expectedUci: entry.expectedUci || "",
            analyzedAt: new Date().toISOString(), moveTimeMs: MOVE_TIME
          };
        }
        saveAudit();
        doneEntries += entries.length;
        renderProgress(processedStart + doneEntries, valid.length);
        if (doneEntries % 5 === 0) setStatus("Stockfish a terminé " + Math.min(processedStart + doneEntries, valid.length) +
          "/" + valid.length + " entrée(s) du corpus…");
      }
      if (paused) setStatus("Audit mis en pause : " + Object.keys(audit).length + " position(s) enregistrée(s). Relance pour reprendre.");
      else {
        renderProgress(valid.length, valid.length);
        setStatus("Audit terminé : " + work.length + " position(s) distincte(s) analysée(s), " +
          valid.length + " entrée(s) vérifiée(s) et sauvegardée(s) localement.");
      }
      renderResults();
      autoUseAuditResults();
    } catch (error) {
      setStatus("Audit interrompu : " + (error && error.message ? error.message : "Stockfish n’a pas répondu."));
      renderResults();
    } finally {
      running = false;
      pauseButton.disabled = true;
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  function resultEligibility(record) {
    const best = record.choices && record.choices[0];
    const second = record.choices && record.choices[1];
    if (!best || !second) return { ok: false, reason: "Lignes insuffisantes pour créer un choix comparatif." };
    if (record.kind === "puzzle" && record.puzzleAnswer && best.uci.slice(0, 4) !== record.puzzleAnswer.slice(0, 4))
      return { ok: false, reason: "À vérifier : réponse publiée différente du premier coup Stockfish." };
    if (record.kind === "lesson" && record.expectedUci && best.uci.slice(0, 4) !== record.expectedUci.slice(0, 4))
      return { ok: false, reason: "À revoir : le premier coup de la leçon diffère du premier choix Stockfish." };
    if (!Number.isFinite(second.deltaCp) || second.deltaCp < MIN_GAP_CP)
      return { ok: false, analysisOnly: true, reason: "Écart trop faible pour un coup forcé : proposé comme exercice d’analyse comparative, pas comme solution unique." };
    return { ok: true, reason: "Écart moteur " + (second.deltaCp / 100).toFixed(2) + " pion(s), profondeur " + record.depth + "." };
  }

  function buildDerivedLesson(record) {
    const eligibility = resultEligibility(record);
    if (!eligibility.ok && !eligibility.analysisOnly) return null;
    const candidates = record.choices.slice(0, 3).filter((choice) => choice && choice.uci && choice.san);
    if (candidates.length < 2) return null;
    const base = record.key.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const id = "engine-derived-" + base.slice(-90);
    if (root.SupaChessLessons.some((lesson) => lesson.id === id)) return null;
    const play = new Chess(record.fen);
    const sequence = [];
    for (const [index, uci] of (candidates[0].pv || []).slice(0, 7).entries()) {
      const move = play.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || "q" });
      if (!move) break;
      sequence.push({
        side: index % 2 === 0 ? "user" : "book",
        uci: uci,
        explanation: index % 2 === 0
          ? "Demi-coup de la variante Stockfish classée première dans cette recherche; vérifie les réponses et la position obtenue."
          : "Réponse calculée dans cette variante; cherche aussi si une défense plus résistante existe."
      });
    }
    if (!sequence.length || sequence[0].side !== "user") return null;
    const choices = candidates.map((choice, index) => ({ text: "Jouer " + choice.san, correct: index === 0 }));
    const analysisOnly = Boolean(eligibility.analysisOnly);
    return {
      id: id, kind: "engine-derived", exerciseMode: analysisOnly ? "analysis" : "single-best", level: record.level || "Intermédiaire",
      title: (analysisOnly ? "Analyse comparative · " : "Maîtrise moteur · ") + record.title,
      category: (analysisOnly ? "Classement de recherche, sans coup forcé · " : "Exercice Stockfish dérivé · ") + record.theme,
      author: "Atelier Stockfish · variantes calculées",
      program: "Stockfish · comparer et vérifier",
      book: "Position analysée localement",
      reference: (record.kind === "puzzle" ? "Puzzle tactique " : "Leçon/exercice ") + record.id +
        " · recherche Stockfish 19 · " + record.depth + " ply · " + MOVE_TIME + " ms par position",
      fen: record.fen, color: record.fen.split(/\s+/)[1] || "w",
      question: analysisOnly
        ? "Quel coup Stockfish classe en tête dans cette recherche rapide ? Ce classement ne signifie pas que le coup soit unique ou forcé."
        : "Quel premier coup Stockfish classe en tête dans cette recherche ?",
      choices: choices,
      principle: analysisOnly
        ? "Exercice d’analyse comparative : le moteur n’a pas départagé nettement les candidats. Joue la ligne classée première, puis compare-la aux autres choix légaux et explique le plan obtenu; ne traite pas ce classement comme un coup forcé."
        : "Routine de maîtrise : établis des coups candidats, anticipe la meilleure réponse adverse, puis compare les variantes jusqu’à une position que tu peux évaluer. Stockfish fournit un classement issu de cette recherche, pas une explication humaine ni une certitude absolue.",
      transfer: "Refais cette position sans moteur. Note deux coups candidats, la meilleure réponse adverse à chacun, puis compare la position finale.",
      hints: [
        "Vérifie d’abord échecs, captures, menaces, pièces attaquées et pièces non protégées.",
        "Après chaque candidat, cherche la meilleure réponse adverse, pas celle que tu souhaites voir."
      ],
      sequence: sequence
    };
  }

  function saveGenerated(lesson) {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(DERIVED_KEY) || "[]"); } catch (_) {}
    if (!Array.isArray(saved)) saved = [];
    if (saved.some((item) => item.id === lesson.id)) return false;
    saved.push(lesson);
    try { localStorage.setItem(DERIVED_KEY, JSON.stringify(saved)); }
    catch (_) { setStatus("Stockage local saturé : exercice non enregistré."); return false; }
    if (!root.SupaChessAcademy.addDerivedLesson(lesson)) {
      setStatus("L’exercice est enregistré; recharge la page pour l’ouvrir.");
      return true;
    }
    setStatus("Exercice ajouté à ton Académie locale. Sa validation et ses révisions suivent ensuite le parcours habituel.");
    return true;
  }

  function autoUseAuditResults() {
    const records = Object.values(audit).filter((record) => record && Array.isArray(record.choices))
      .sort((a,b) => {
        const rank = (record) => { const e=resultEligibility(record); return e.ok?0:e.analysisOnly?1:2; };
        const priority = rank(a) - rank(b);
        if (priority) return priority;
        const gapA = a.choices[1] && Number.isFinite(a.choices[1].deltaCp) ? a.choices[1].deltaCp : -1;
        const gapB = b.choices[1] && Number.isFinite(b.choices[1].deltaCp) ? b.choices[1].deltaCp : -1;
        return gapB - gapA;
      });
    if (!records.length) return;
    const signature = records.length + ":" + records.reduce((latest, record) => {
      const time = Date.parse(record.analyzedAt || "") || 0;
      return Math.max(latest, time);
    }, 0);
    const marker = "supachess-stockfish-auto-used-v1";
    if (localStorage.getItem(marker) === signature) return;
    const stored = (() => { try { const x=JSON.parse(localStorage.getItem(DERIVED_KEY)||"[]"); return Array.isArray(x)?x:[]; } catch (_) { return []; } })();
    const known = new Set(stored.map((lesson) => lesson && lesson.id).filter(Boolean));
    root.SupaChessLessons.forEach((lesson) => known.add(lesson.id));
    const generated = [];
    const limit = 40;
    for (const record of records) {
      const lesson = buildDerivedLesson(record);
      if (!lesson || known.has(lesson.id)) continue;
      known.add(lesson.id); generated.push(lesson);
      if (generated.length >= limit) break;
    }
    try {
      const next = stored.concat(generated);
      localStorage.setItem(DERIVED_KEY, JSON.stringify(next));
    } catch (_) {
      setStatus("Audit conservé, mais le stockage des exercices est saturé; aucun lot n’a été ajouté.");
      return;
    }
    localStorage.setItem(marker, signature);
    if (!generated.length) {
      const previouslyAvailable = stored.find((lesson) => lesson && lesson.id && root.SupaChessLessons.some((x) => x.id === lesson.id));
      if (previouslyAvailable && root.SupaChessAcademy.openLesson) {
        root.SupaChessAcademy.openLesson(previouslyAvailable.id);
        setStatus("Les analyses sauvegardées ont déjà été converties. Le premier exercice est ouvert dans l’Académie.");
      } else {
        setStatus("Audit sauvegardé. Aucun exercice automatique n’est possible : les entrées restantes ont un désaccord ou des lignes moteur insuffisantes.");
      }
      return;
    }
    const opened = root.SupaChessAcademy.addDerivedLessons
      ? root.SupaChessAcademy.addDerivedLessons(generated, generated[0].id)
      : root.SupaChessAcademy.addDerivedLesson(generated[0]);
    setStatus((opened ? generated.length + " exercice(s) créé(s) depuis les analyses; le premier s’ouvre maintenant dans l’Académie. " :
      generated.length + " exercice(s) sauvegardé(s); ouvre l’Académie pour les jouer. ") +
      (generated.filter((lesson) => lesson.exerciseMode === "analysis").length
        ? "Les exercices à candidats proches sont des comparaisons, pas des coups forcés."
        : ""));
  }

  function renderResults() {
    const target = ui.querySelector("[data-sf-results]");
    const more = ui.querySelector("[data-sf-more]");
    const query = (ui.querySelector("[data-sf-search]").value || "").trim().toLocaleLowerCase("fr");
    const records = Object.values(audit).filter((record) =>
      record && Array.isArray(record.choices) &&
      (!query || (record.title + " " + record.theme + " " + record.id).toLocaleLowerCase("fr").includes(query)))
      .sort((a, b) => (b.choices[0]?.deltaCp || 0) - (a.choices[0]?.deltaCp || 0));
    const page = records.slice(0, visibleCount);
    target.replaceChildren();
    page.forEach((record) => {
      const card = document.createElement("article");
      card.className = "sf-study-result";
      const title = document.createElement("strong");
      title.textContent = record.title;
      const context = document.createElement("p");
      context.textContent = record.theme + " · " + (record.kind === "puzzle" ? "Puzzle" : "Académie") +
        " · " + record.depth + " ply";
      const best = record.choices[0];
      const choice = document.createElement("p");
      choice.textContent = "Premier coup : " + (best ? best.san + " · " + best.score : "indisponible");
      const comparison = document.createElement("p");
      comparison.textContent = resultEligibility(record).reason;
      comparison.className = "sf-study-muted";
      card.append(title, context, choice, comparison);
      const sequence = document.createElement("p");
      sequence.textContent = "Variante : " + (best && best.sanLine ? best.sanLine.join(" ") : "non disponible");
      card.appendChild(sequence);
      if (record.kind === "puzzle" && record.puzzleAnswer) {
        const checked = document.createElement("p");
        checked.textContent = "Solution enregistrée : " + record.puzzleAnswer +
          (best && best.uci.slice(0, 4) === record.puzzleAnswer.slice(0, 4) ? " · conforme au premier coup" : " · à contrôler");
        card.appendChild(checked);
      } else if (record.kind === "lesson" && record.expectedUci && best &&
          best.uci.slice(0, 4) !== record.expectedUci.slice(0, 4)) {
        const checked = document.createElement("p");
        checked.textContent = "À revoir : le premier coup de la séquence (" + record.expectedUci +
          ") diffère du premier choix de cette recherche Stockfish (" + best.san + ").";
        card.appendChild(checked);
      }
      if (record.kind === "lesson" && root.SupaChessAcademy.openLesson) {
        const sourceButton = document.createElement("button");
        sourceButton.type = "button";
        sourceButton.className = "btn";
        sourceButton.textContent = "Ouvrir la leçon source";
        sourceButton.addEventListener("click", () => root.SupaChessAcademy.openLesson(record.id));
        card.appendChild(sourceButton);
      }
      const lesson = buildDerivedLesson(record);
      if (lesson) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = lesson.exerciseMode === "analysis" ? "Analyser et jouer cette position" : "Créer et jouer cet exercice";
        button.addEventListener("click", () => saveGenerated(lesson));
        card.appendChild(button);
      }
      target.appendChild(card);
    });
    more.hidden = records.length <= visibleCount;
    more.textContent = "Afficher davantage (" + Math.min(25, records.length - visibleCount) + ")";
  }

  ui.querySelector("[data-sf-search]").addEventListener("input", () => { visibleCount = 25; renderResults(); });
  renderResults();
  autoUseAuditResults();
})(window);
