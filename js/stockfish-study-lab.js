/* Stockfish-based audit and local exercise generation for SupaChess Academy. */
(function (root) {
  "use strict";
  if (!root.document || !root.SupaChessLessons || !root.SupaChessAcademy || root.__supaStockfishStudyLab) return;
  root.__supaStockfishStudyLab = true;

  const AUDIT_KEY = "supachess-stockfish-study-audit-v1";
  const DERIVED_KEY = "supachess-stockfish-derived-lessons-v1";
  const PUZZLE_URL = "../supachess-web/TRAINING_TACTICS.html";
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
      <input id="sf-study-search" type="search" placeholder="Titre, joueur, thème…" style="width:min(100%,520px);padding:10px;margin:6px 0">
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
    section.querySelector("[data-sf-search]").addEventListener("input", () => { visibleCount = 25; renderResults(); });
    renderResults();
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
        const position = new root.Chess(lesson.fen);
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
    if (!response.ok) throw new Error("Puzzles tactiques indisponibles (HTTP " + response.status + ").");
    const source = await response.text();
    const marker = source.indexOf("const PUZZLES =");
    if (marker < 0) throw new Error("La banque tactique ne contient pas de tableau PUZZLES reconnu.");
    const start = source.indexOf("[", marker);
    let depth = 0, quote = "", inString = false, escaped = false, end = -1;
    for (let i = start; i < source.length; i++) {
      const c = source[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === "\\\\") escaped = true;
        else if (c === quote) inString = false;
        continue;
      }
      if (c === "\"" || c === "'" || c === "`") { quote = c; inString = true; continue; }
      if (c === "[") depth++;
      else if (c === "]" && --depth === 0) { end = i + 1; break; }
    }
    if (end < 0) throw new Error("Impossible de lire la banque de puzzles.");
    const puzzles = JSON.parse(source.slice(start, end));
    return puzzles.map((puzzle) => {
      const fen = puzzle.board + " " + puzzle.turn + " - - 0 1";
      return { key: "puzzle:" + puzzle.id + ":" + fen, id: puzzle.id, kind: "puzzle",
        title: puzzle.title, theme: "Puzzle tactique · " + puzzle.theme,
        level: levelFromRating(puzzle.rating), fen, answerUci: puzzle.answer || "" };
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
      valid.forEach((entry) => { if (!audit[entry.key]) uniquePositions.set(entry.fen, entry); });
      const work = Array.from(uniquePositions.values());
      const processedStart = valid.filter((entry) => audit[entry.key]).length;
      setStatus("Corpus chargé : " + lessons.length + " leçons/exercices et " + puzzles.length +
        " puzzles. Positions distinctes à analyser maintenant : " + work.length + ".");
      if (!engine) {
        engine = new root.StockfishEngine("vendor/stockfish-19-lite-single.js");
        await engine.ready;
      }
      let done = 0;
      for (const entry of work) {
        if (paused) break;
        const position = new root.Chess(entry.fen);
        const legalCount = position.moves({ verbose: true }).length;
        const response = await engine.analyze({ fen: entry.fen, multipv: Math.min(4, legalCount), movetime: MOVE_TIME, elo: 0 });
        const result = root.SupaChessAcademy.buildEngineChoices(entry.fen, response.lines);
        const stored = {
          key: entry.key, id: entry.id, kind: entry.kind, title: entry.title, theme: entry.theme,
          level: entry.level, fen: entry.fen, choices: result.choices, legalCount: result.legalCount,
          depth: result.choices.reduce((max, choice) => Math.max(max, choice.depth), 0),
          puzzleAnswer: entry.answerUci || "", expectedUci: entry.expectedUci || "",
          analyzedAt: new Date().toISOString(), moveTimeMs: MOVE_TIME
        };
        audit[entry.key] = stored;
        saveAudit();
        done++;
        renderProgress(processedStart + done, valid.length);
        if (done % 5 === 0) setStatus("Stockfish analyse " + (processedStart + done) + "/" +
          valid.length + " positions distinctes du corpus…");
      }
      if (paused) setStatus("Audit mis en pause : " + Object.keys(audit).length + " position(s) enregistrée(s). Relance pour reprendre.");
      else setStatus("Audit terminé : " + valid.length + " entrée(s), " + Object.keys(audit).length +
        " positions analysées et sauvegardées localement.");
      renderResults();
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
    if (!Number.isFinite(second.deltaCp) || second.deltaCp < MIN_GAP_CP)
      return { ok: false, reason: "Pas de meilleur coup assez distinct dans cette recherche; aucun choix forcé ne sera créé." };
    return { ok: true, reason: "Écart moteur " + (second.deltaCp / 100).toFixed(2) + " pion(s), profondeur " + record.depth + "." };
  }

  function buildDerivedLesson(record) {
    const eligibility = resultEligibility(record);
    if (!eligibility.ok) return null;
    const candidates = record.choices.slice(0, 3).filter((choice) => choice && choice.uci && choice.san);
    if (candidates.length < 2) return null;
    const base = record.key.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const id = "engine-derived-" + base.slice(-90);
    if (root.SupaChessLessons.some((lesson) => lesson.id === id)) return null;
    const play = new root.Chess(record.fen);
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
    return {
      id: id, kind: "engine-derived", level: record.level || "Intermédiaire",
      title: "Maîtrise moteur · " + record.title,
      category: "Exercice Stockfish dérivé · " + record.theme,
      author: "Atelier Stockfish · variantes calculées",
      program: "Stockfish · comparer et vérifier",
      book: "Position analysée localement",
      reference: (record.kind === "puzzle" ? "Puzzle tactique " : "Leçon/exercice ") + record.id +
        " · recherche Stockfish 19 · " + record.depth + " ply · " + MOVE_TIME + " ms par position",
      fen: record.fen, color: record.fen.split(/\s+/)[1] || "w",
      question: "Quel premier coup Stockfish classe en tête dans cette recherche ?",
      choices: choices,
      principle: "Routine de maîtrise : établis des coups candidats, anticipe la meilleure réponse adverse, puis compare les variantes jusqu’à une position que tu peux évaluer. Stockfish fournit un classement issu de cette recherche, pas une explication humaine ni une certitude absolue.",
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
      }
      const lesson = buildDerivedLesson(record);
      if (lesson) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = "Créer et jouer cet exercice";
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
})(window);
