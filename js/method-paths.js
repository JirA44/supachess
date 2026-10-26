(function () {
  "use strict";

  const paths = Array.from(document.querySelectorAll("[data-method-path]"));
  const catalog = document.getElementById("lesson-catalog");
  const search = document.getElementById("lesson-search");
  const levelFilter = document.getElementById("lesson-level-filter");
  const programFilter = document.getElementById("lesson-program-filter");
  function updatePathCounts() {
    const lessons = Array.isArray(window.SupaChessLessons) ? window.SupaChessLessons : [];
    const originalLessons = lessons.filter((lesson) => lesson.kind !== "anticipation");
    for (const path of paths) {
      const program = path.dataset.methodPath;
      const count = program === "Stockfish · comparer et vérifier"
        ? originalLessons.length
        : originalLessons.filter((lesson) => lesson.program === program).length;
      const label = path.querySelector("[data-method-count]");
      if (label) {
        const subject = program === "Stockfish · comparer et vérifier" ? "positions de leçons analysables" : "leçons du parcours";
        label.textContent = count + " " + subject;
      }
      path.setAttribute("aria-label", path.querySelector("h3").textContent + " · " + count + " leçons");
    }
  }

  function openPath(path) {
    const program = path.dataset.methodPath;
    for (const item of paths) item.setAttribute("aria-current", String(item === path));
    if (search) search.value = "";
    if (levelFilter) levelFilter.value = "";
    programFilter.value = program === "Stockfish · comparer et vérifier" ? "" : program;
    programFilter.dispatchEvent(new Event("change", { bubbles: true }));

    if (program === "Stockfish · comparer et vérifier") {
      const firstLesson = catalog.querySelector(".lesson-catalog-button:not(.anticipation-exercise)");
      if (firstLesson) firstLesson.click();
    } else {
      const firstLesson = catalog.querySelector(".lesson-catalog-button");
      if (firstLesson) firstLesson.click();
    }
    catalog.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  for (const path of paths) {
    const button = path.querySelector("[data-method-action]");
    button.addEventListener("click", () => openPath(path));
    path.addEventListener("focusin", () => {
      for (const item of paths) item.setAttribute("aria-current", String(item === path));
    });
  }
  if (programFilter) {
    programFilter.addEventListener("change", () => {
      const selected = paths.find((path) => path.dataset.methodPath === programFilter.value);
      if (selected) {
        for (const item of paths) item.setAttribute("aria-current", String(item === selected));
      } else {
        for (const item of paths) item.removeAttribute("aria-current");
      }
    });
  }
  updatePathCounts();
})();
