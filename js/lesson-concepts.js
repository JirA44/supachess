(() => {
  "use strict";
  const glossary = document.getElementById("lesson-concept-glossary");
  if (!glossary) return;

  const search = document.getElementById("lesson-concept-search");
  const cards = [...glossary.querySelectorAll(".lesson-concept-card")];
  const status = document.getElementById("lesson-concept-status");

  function filterConcepts() {
    const query = (search?.value || "").trim().toLocaleLowerCase("fr");
    let visible = 0;
    for (const card of cards) {
      const matches = !query || card.textContent.toLocaleLowerCase("fr").includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    }
    if (status) status.textContent = visible + " concept" + (visible === 1 ? "" : "s") + " affiché" + (visible === 1 ? "" : "s") + ".";
  }

  search?.addEventListener("input", filterConcepts);
  glossary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lesson-concept-search]");
    if (!button) return;
    const lessonSearch = document.getElementById("lesson-search");
    if (!lessonSearch) return;
    lessonSearch.value = button.dataset.lessonConceptSearch || "";
    lessonSearch.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("lesson-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const matchCount = document.getElementById("lesson-catalog-count");
    if (status && matchCount) status.textContent = "Leçons liées filtrées : " + matchCount.textContent;
  });

  filterConcepts();
})();
