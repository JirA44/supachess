/* Parcours local personnalisé à partir des erreurs observées dans les parties analysées. */
"use strict";

const LEARNING_PROGRESS_KEY = "supachess_learning_path_v1";
const LEARNING_SAMPLE_SIZE = 3;

const LEARNING_FOCI = {
  tactics: {
    title: "Tactique et pièces en prise",
    lesson: "Avant chaque coup, cherche les échecs, les captures et les menaces des deux camps. Vérifie quelles pièces sont attaquées et défendues.",
  },
  "king-safety": {
    title: "Sécurité du roi",
    lesson: "Avant d’ouvrir les pions devant ton roi, repère les lignes et diagonales disponibles pour l’adversaire et compte ses pièces attaquantes.",
  },
  development: {
    title: "Développement et coordination",
    lesson: "Dans l’ouverture, développe tes pièces mineures, évite de les déplacer plusieurs fois sans raison et cherche à connecter tes tours.",
  },
  calculation: {
    title: "Calcul des variantes",
    lesson: "Pour chaque candidat, calcule au moins la meilleure réponse adverse et vérifie les échecs, captures et menaces avant de jouer.",
  },
};

function classifyLearningTheme(reasons, moveNumber) {
  const text = (Array.isArray(reasons) ? reasons : [reasons]).filter(Boolean).join(" ").toLowerCase();
  if (/roi|mat forc|mat !|structure de pions devant/.test(text)) return "king-safety";
  if (/en prise|fourchette|matériel|gagne du matériel|attaque .* mal défendu/.test(text)) return "tactics";
  if (Number(moveNumber) <= 15 && /développement|cavalier au bord|bloque un pion|recule une pièce/.test(text)) return "development";
  return "calculation";
}

function learningPlayerColor(game) {
  if (game && (game.userColor === "w" || game.userColor === "b")) return game.userColor;
  if (game?.review?.userColor === "w" || game?.review?.userColor === "b") return game.review.userColor;
  const pgn = String(game?.pgn || "");
  if (/\[White\s+"Joueur"\]/i.test(pgn)) return "w";
  if (/\[Black\s+"Joueur"\]/i.test(pgn)) return "b";
  return null;
}

function learningReviewedGames(games) {
  return (Array.isArray(games) ? games : []).filter((game) =>
    game && game.review && game.review.analyzedAt != null && Number.isFinite(Number(game.review.analyzedAt)) &&
    learningPlayerColor(game) && Array.isArray(game.review.themes)
  );
}

function ownAccuracy(game) {
  if (game?.review?.ownAccuracy == null) return null;
  const value = Number(game?.review?.ownAccuracy);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function recommendLearningFocus(games) {
  const gamesByTheme = {};
  for (const game of games) {
    const color = learningPlayerColor(game);
    const seen = new Set();
    for (const item of game.review.themes) {
      const id = typeof item === "string" ? item : item?.id;
      const themeColor = typeof item === "object" && item ? item.color : null;
      if (themeColor && themeColor !== color) continue;
      if (LEARNING_FOCI[id]) seen.add(id);
    }
    for (const id of seen) (gamesByTheme[id] ||= new Set()).add(game.id);
  }
  const counts = Object.fromEntries(Object.entries(gamesByTheme).map(([id, ids]) => [id, ids.size]));
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [id, count] = ranked[0] || ["calculation", 0];
  return {
    id,
    title: LEARNING_FOCI[id].title,
    lesson: LEARNING_FOCI[id].lesson,
    count,
    confidence: count >= 3 ? "high" : count >= 2 ? "low" : "provisional",
  };
}

function startLearningCycle(games, now = Date.now()) {
  const reviewed = learningReviewedGames(games)
    .filter((game) => Number(game.review.analyzedAt) <= Number(now))
    .sort((a, b) => Number(b.review.analyzedAt) - Number(a.review.analyzedAt));
  const baseline = reviewed.slice(0, LEARNING_SAMPLE_SIZE);
  return {
    startedAt: Number(now),
    focusId: recommendLearningFocus(reviewed).id,
    baselineIds: baseline.map((game) => game.id),
    baselineAccuracy: average(baseline.map(ownAccuracy)),
  };
}

function buildLearningPath(games, progress = {}) {
  const reviewed = learningReviewedGames(games);
  const focus = recommendLearningFocus(reviewed);
  const startedAt = Number(progress.startedAt) || 0;
  const cycleGames = startedAt
    ? reviewed.filter((game) => Number(game.review.analyzedAt) > startedAt &&
      Number.isFinite(Date.parse(game.date)) && Date.parse(game.date) > startedAt &&
      !(Array.isArray(progress.baselineIds) && progress.baselineIds.includes(game.id)))
    : [];
  const currentAccuracy = average(cycleGames.map(ownAccuracy));
  const baselineAccuracy = progress.baselineAccuracy != null && Number.isFinite(Number(progress.baselineAccuracy))
    ? Number(progress.baselineAccuracy)
    : null;
  const phase = reviewed.length < LEARNING_SAMPLE_SIZE
    ? "diagnosis"
    : !startedAt
      ? "focus"
      : cycleGames.length < LEARNING_SAMPLE_SIZE
        ? "practice"
        : "complete";

  return {
    phase,
    reviewedGames: reviewed.length,
    targetGames: LEARNING_SAMPLE_SIZE,
    focus: progress.focusId && LEARNING_FOCI[progress.focusId]
      ? { ...focus, id: progress.focusId, title: LEARNING_FOCI[progress.focusId].title, lesson: LEARNING_FOCI[progress.focusId].lesson }
      : focus,
    cycleGames: cycleGames.length,
    baselineAccuracy,
    currentAccuracy,
    accuracyChange: baselineAccuracy !== null && currentAccuracy !== null
      ? Math.round((currentAccuracy - baselineAccuracy) * 10) / 10
      : null,
  };
}

function loadLearningProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (_error) {
    return {};
  }
}

function saveLearningProgress(progress) {
  try { localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress)); } catch (_error) { /* local-only progress */ }
}

function learningEscape(value) {
  if (typeof esc === "function") return esc(String(value));
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function learningPathRender() {
  const panel = document.getElementById("learning-path-content");
  if (!panel || typeof gamesLoad !== "function") return;
  const games = gamesLoad();
  const progress = loadLearningProgress();
  const path = buildLearningPath(games, progress);
  const pct = Math.min(100, Math.round((Math.min(path.reviewedGames, path.targetGames) / path.targetGames) * 100));
  let body = "";

  if (path.phase === "diagnosis") {
    const nextGame = games.find((game) => !game.review?.analyzedAt && game.pgn);
    body = `<p>Analyse ${path.targetGames} de tes parties pour repérer les erreurs qui reviennent. Les analyses restent dans ce navigateur.</p>` +
      `<button class="btn mini" data-learning-action="analyze"${nextGame ? ` data-game-id="${learningEscape(nextGame.id)}"` : ""}>${nextGame ? "Analyser une partie disponible" : "Analyser un PGN"}</button>`;
  } else if (path.phase === "focus") {
    const confidence = path.focus.confidence === "high" ? "motif récurrent" : path.focus.confidence === "low" ? "piste à confirmer" : "première piste";
    body = `<p><strong>Priorité suggérée : ${learningEscape(path.focus.title)}</strong> (${confidence}).</p>` +
      `<p>${learningEscape(path.focus.lesson)}</p>` +
      `<button class="btn mini" data-learning-action="start">Commencer ce cycle</button>`;
  } else if (path.phase === "practice") {
    body = `<p><strong>Focus : ${learningEscape(path.focus.title)}</strong></p><p>${learningEscape(path.focus.lesson)}</p>` +
      `<p>Après avoir travaillé ce thème, analyse 3 nouvelles parties pour mesurer l’évolution.</p>` +
      `<div class="learning-cycle-progress">${path.cycleGames}/${path.targetGames} nouvelles parties analysées</div>`;
  } else {
    const change = path.accuracyChange;
    const result = change === null ? "Précision comparable indisponible." :
      `Précision moyenne : ${path.baselineAccuracy}% avant, ${path.currentAccuracy}% après (${change > 0 ? "+" : ""}${change} point${Math.abs(change) === 1 ? "" : "s"}).`;
    body = `<p><strong>Cycle terminé : ${learningEscape(path.focus.title)}</strong></p>` +
      `<p>${learningEscape(result)} Échantillon de 3 parties, indicatif et non causal.</p>` +
      `<button class="btn mini" data-learning-action="restart">Choisir la prochaine priorité</button>`;
  }

  const countLabel = `${Math.min(path.reviewedGames, path.targetGames)}/${path.targetGames} parties analysées`;
  panel.innerHTML = `<div class="learning-progress-label"><span>Diagnostic</span><span>${countLabel}</span></div>` +
    `<div class="learning-progress-track"><div class="learning-progress-fill" style="width:${pct}%"></div></div>` + body;

  panel.onclick = (event) => {
    const button = event.target.closest("button[data-learning-action]");
    if (!button) return;
    const action = button.dataset.learningAction;
    if (action === "analyze") {
      const game = games.find((item) => String(item.id) === button.dataset.gameId);
      if (game && typeof reviewStart === "function") reviewStart(game.pgn, game.id);
      else if (typeof reviewStart === "function") reviewStart("");
    } else if (action === "start") {
      saveLearningProgress(startLearningCycle(games));
      learningPathRender();
    } else if (action === "restart") {
      saveLearningProgress({});
      learningPathRender();
    }
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildLearningPath, classifyLearningTheme, recommendLearningFocus, startLearningCycle };
}
if (typeof window !== "undefined") {
  window.SupaLearningPath = { buildLearningPath, classifyLearningTheme, recommendLearningFocus, startLearningCycle };
  window.learningPathRender = learningPathRender;
  learningPathRender();
}

