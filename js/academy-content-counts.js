(() => {
  "use strict";

  const set = (name, value) => {
    const node = document.querySelector('[data-academy-count="' + name + '"]');
    if (node) node.textContent = Number.isFinite(value) ? String(value) : "—";
  };
  const setText = (name, value) => {
    const node = document.querySelector('[data-academy-progress="' + name + '"]');
    if (node) node.textContent = value;
  };
  const updateLessons = (counts) => {
    if (!counts) return;
    set("lessons", counts.lessons);
    setText("lessons", counts.completedLessons + "/" + counts.lessons + " terminées");
    set("anticipation", counts.anticipation);
    setText("anticipation", counts.completedAnticipation + "/" + counts.anticipation + " terminés");
    set("principles", counts.principleCount);
    set("masteredLessons", counts.masteredLessons);
    set("competencies", counts.competencies);
    setText("competencies", counts.masteredCompetencies + "/" + counts.competencies + " avec au moins une leçon maîtrisée");
    set("complex", counts.complexPositions);
  };
  const updateConcepts = (counts) => {
    if (!counts) return;
    set("concepts", counts.total);
    setText("concepts", counts.passed + "/" + counts.total + " réussis · " + counts.families + " familles");
  };
  const countTopLevelObjects = (source, marker) => {
    const declaration = source.indexOf(marker);
    if (declaration < 0) return null;
    const open = source.indexOf("[", declaration);
    if (open < 0) return null;
    let depth = 1, count = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
    for (let i = open + 1; i < source.length && depth > 0; i++) {
      const ch = source[i], next = source[i + 1];
      if (lineComment) { if (ch === "\n") lineComment = false; continue; }
      if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === quote) quote = "";
        continue;
      }
      if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
      if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
      if (depth === 1 && ch === "{") count++;
      if (ch === "[" || ch === "{" || ch === "(") depth++;
      else if (ch === "]" || ch === "}" || ch === ")") depth--;
    }
    return depth === 0 ? count : null;
  };
  const loadPuzzleCount = async () => {
    try {
      const url = new URL("../supachess-web/TRAINING_TACTICS.html", location.href);
      const response = await fetch(url, { credentials: "omit" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const source = await response.text();
      const total = countTopLevelObjects(source, "const PUZZLES = [");
      if (!Number.isFinite(total)) throw new Error("Catalogue introuvable");
      set("puzzles", total);
      setText("puzzles", "Puzzles tactiques disponibles");
    } catch (_) {
      set("puzzles", NaN);
      setText("puzzles", "Catalogue tactique indisponible hors connexion");
    }
  };

  const paths = document.querySelectorAll("[data-method-path]").length;
  set("paths", paths);
  window.addEventListener("supachess:academy-lessons-counts", (event) => updateLessons(event.detail));
  window.addEventListener("supachess:academy-concept-counts", (event) => updateConcepts(event.detail));
  updateLessons(window.SupaChessAcademyLessonCounts);
  updateConcepts(window.SupaChessAcademyConceptCounts);
  const status = document.querySelector("[data-academy-summary-status]");
  if (status) status.textContent = "Compteurs actualisés depuis les catalogues chargés; l’avancement est conservé sur cet appareil.";
  loadPuzzleCount();
})();
