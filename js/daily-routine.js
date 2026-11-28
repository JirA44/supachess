"use strict";

(function (root) {
  const STORAGE_KEY = "supachess-daily-routine-v1";
  const LESSON_PROGRESS_KEY = "supachess-book-lessons-v1";
  const TACTICS_SOLVED_KEY = "supachess_tactics_v2";
  const GAMES_KEY = "supachess_games";
  const STEP_IDS = ["lesson", "woodpecker", "slowgame"];
  const STEP_LABELS = {
    lesson: "Leçon ciblée",
    woodpecker: "Woodpecker",
    slowgame: "Partie lente",
  };
  const STEP_DURATION_MS = 15 * 60 * 1000;
  const SLOW_GAME_CONTROLS = {
    "10+5": { minutes: 10, incrementSeconds: 5 },
    "15+10": { minutes: 15, incrementSeconds: 10 },
  };
  const WOODPECKER_PUZZLE_IDS = Object.freeze([
    "knight-fork-A", "knight-fork-B", "knight-fork-C", "knight-fork-D",
    "pawn-fork-A", "pawn-fork-B", "pawn-fork-C", "pawn-fork-D",
    "absolute-pin-A", "absolute-pin-B", "absolute-pin-C", "absolute-pin-D",
    "rook-skewer-A", "rook-skewer-B", "rook-skewer-C", "rook-skewer-D",
    "discovered-A", "discovered-B", "discovered-C", "discovered-D",
    "backrank-A", "backrank-B", "backrank-C", "backrank-D",
    "smothered-A", "smothered-B", "smothered-C", "smothered-D",
    "double-check-A", "double-check-B", "double-check-C", "double-check-D",
    "bishop-fork-A", "bishop-fork-B", "bishop-fork-C", "bishop-fork-D",
    "xray-A", "xray-B", "xray-C", "xray-D",
    "lichess-q2cun", "lichess-IGs0J", "lichess-9brtS", "lichess-QCPaS",
    "lichess-fEz5o", "lichess-YS5D6", "lichess-7nrsg", "lichess-187ff",
    "lichess-vLDbN", "lichess-3i59Q",
  ]);
  const LESSON_GROUPS = Object.freeze([
    {
      id: "developpement",
      label: "Développement rapide et roque avant le 10e coup",
      lessonIds: Object.freeze([
        "curriculum-first-plan",
        "curriculum-king-safety",
        "develop-before-attack",
        "castle-safely",
        "phase-opening-02-king-safety",
      ]),
    },
    {
      id: "centre",
      label: "Contrôle du centre",
      lessonIds: Object.freeze([
        "curriculum-hanging-piece",
        "curriculum-strategy-plan-build-center",
        "central-recapture",
        "phase-opening-01-center",
      ]),
    },
    {
      id: "tactique",
      label: "Clouage, fourchette et attaque double",
      lessonIds: Object.freeze([
        "curriculum-fork-pattern",
        "curriculum-pin-choice",
        "curriculum-pin-the-knight",
        "curriculum-trap-queen-fork-parry",
        "curriculum-trap-queen-fork-punish",
      ]),
    },
    {
      id: "finales",
      label: "Finales Roi+Tour et Roi+Pions",
      lessonIds: Object.freeze([
        "phase-endgame-01-king",
        "phase-endgame-02-opposition",
        "phase-endgame-04-rook",
        "phase-endgame-05-rook-king",
      ]),
    },
  ]);
  const LESSON_TITLES = Object.freeze({
    "develop-before-attack": "Développer avant l'attaque",
    "castle-safely": "Roi à l'abri, pièces en jeu",
    "central-recapture": "Reprendre vers le centre",
    "phase-opening-01-center": "Contrôler le centre",
    "phase-opening-02-king-safety": "Mettre le roi en sécurité",
    "phase-endgame-01-king": "Activer le roi",
    "phase-endgame-02-opposition": "Utiliser l'opposition",
    "phase-endgame-04-rook": "Placer la tour derrière le pion passé",
    "phase-endgame-05-rook-king": "Coordonner roi et tour",
  });

  function localDayKey(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (!value || Number.isNaN(value.getTime())) return "";
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function parseDayKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function localMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function dayDistance(fromKey, toKey) {
    const from = parseDayKey(fromKey);
    const to = parseDayKey(toKey);
    if (!from || !to) return null;
    return Math.round((localMidnight(to) - localMidnight(from)) / 86400000);
  }

  function dayIndex(key) {
    const date = parseDayKey(key);
    if (!date) return 0;
    const reference = new Date(2020, 0, 1);
    return Math.round((localMidnight(date) - localMidnight(reference)) / 86400000);
  }

  function dayKeyOffset(key, days) {
    const date = parseDayKey(key);
    if (!date) return "";
    date.setDate(date.getDate() + Number(days || 0));
    return localDayKey(date);
  }

  function computeStreak(completedDays, todayKey) {
    const days = [...new Set((Array.isArray(completedDays) ? completedDays : []).filter((key) => parseDayKey(key)))].sort();
    if (!days.length) return 0;
    const distance = dayDistance(days[days.length - 1], todayKey);
    if (distance === null || distance > 1) return 0;
    let streak = 1;
    for (let index = days.length - 1; index > 0; index--) {
      if (dayDistance(days[index - 1], days[index]) === 1) streak++;
      else break;
    }
    return streak;
  }

  function hashString(text) {
    let hash = 5381;
    const value = String(text || "");
    for (let index = 0; index < value.length; index++) {
      hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
    }
    return hash;
  }

  function createStep(extra) {
    return { done: false, skipped: false, startedAt: null, elapsedMs: 0, ...(extra || {}) };
  }

  function createState(todayKey) {
    return {
      version: 1,
      dayKey: todayKey,
      startedAt: null,
      steps: {
        lesson: createStep({ lessonId: "", lessonTitle: "", lessonGroup: "" }),
        woodpecker: createStep({ puzzleIndex: 0, puzzleTimes: {}, puzzleStartedAt: null }),
        slowgame: createStep({ control: "10+5", gameStartedAt: null, gameFinishedAt: null, analysisOpened: false, moments: [] }),
      },
      completedDays: [],
      streak: 0,
      lastCompletedAt: null,
      completed: false,
    };
  }

  function normalizeSteps(saved, base) {
    const steps = {};
    for (const stepId of STEP_IDS) {
      const source = saved && saved[stepId] && typeof saved[stepId] === "object" ? saved[stepId] : {};
      steps[stepId] = { ...base.steps[stepId], ...source };
    }
    return steps;
  }

  function loadState(storage, todayKey) {
    let raw = null;
    try {
      raw = storage && typeof storage.getItem === "function" ? storage.getItem(STORAGE_KEY) : null;
    } catch (_error) {
      raw = null;
    }
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch (_error) {
      parsed = null;
    }
    const completedDays = Array.isArray(parsed && parsed.completedDays)
      ? parsed.completedDays.filter((key) => parseDayKey(key))
      : [];
    const base = createState(todayKey);
    const streak = computeStreak(completedDays, todayKey);
    if (!parsed || typeof parsed !== "object" || parsed.dayKey !== todayKey) {
      return { ...base, completedDays, streak };
    }
    return {
      ...base,
      ...parsed,
      steps: normalizeSteps(parsed.steps, base),
      completedDays,
      streak,
      dayKey: todayKey,
    };
  }

  function saveState(storage, state) {
    try {
      if (!storage || typeof storage.setItem !== "function") return false;
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function currentStep(state) {
    if (!state || !state.steps) return STEP_IDS[0];
    for (const stepId of STEP_IDS) {
      const step = state.steps[stepId];
      if (!step || !step.done) return stepId;
    }
    return null;
  }

  function isComplete(state) {
    return STEP_IDS.every((stepId) => Boolean(state && state.steps && state.steps[stepId] && state.steps[stepId].done));
  }

  function stepElapsedMs(state, stepId, now) {
    const step = state && state.steps ? state.steps[stepId] : null;
    if (!step) return 0;
    const running = step.startedAt !== null && step.startedAt !== undefined
      ? Math.max(0, Number(now) - Number(step.startedAt))
      : 0;
    return Math.max(0, Number(step.elapsedMs) || 0) + running;
  }

  function stepRemainingMs(state, stepId, now) {
    return Math.max(0, STEP_DURATION_MS - stepElapsedMs(state, stepId, now));
  }

  function startStep(state, stepId, now) {
    if (!state || !state.steps || !state.steps[stepId]) return state;
    const step = state.steps[stepId];
    if (step.done) return state;
    const stamp = Number(now);
    const moment = Number.isFinite(stamp) ? stamp : Date.now();
    if (step.startedAt === null || step.startedAt === undefined) step.startedAt = moment;
    if (!state.startedAt) state.startedAt = step.startedAt;
    return state;
  }

  function pauseStep(state, stepId, now) {
    if (!state || !state.steps || !state.steps[stepId]) return state;
    const step = state.steps[stepId];
    if (step.startedAt !== null && step.startedAt !== undefined) {
      const stamp = Number(now);
      const moment = Number.isFinite(stamp) ? stamp : Date.now();
      step.elapsedMs = Math.max(0, Number(step.elapsedMs) || 0) + Math.max(0, moment - Number(step.startedAt));
      step.startedAt = null;
    }
    return state;
  }

  function completeStep(state, stepId, now) {
    if (!state || !state.steps || !state.steps[stepId]) return state;
    pauseStep(state, stepId, now);
    state.steps[stepId].done = true;
    state.steps[stepId].skipped = false;
    return state;
  }

  function skipStep(state, stepId, now) {
    if (!state || !state.steps || !state.steps[stepId]) return state;
    pauseStep(state, stepId, now);
    state.steps[stepId].done = true;
    state.steps[stepId].skipped = true;
    return state;
  }

  function registerCompletion(state, todayKey) {
    if (!state) return state;
    const completedDays = [...new Set([...(state.completedDays || []), todayKey])].sort();
    state.completedDays = completedDays;
    state.streak = computeStreak(completedDays, todayKey);
    state.completed = true;
    state.lastCompletedAt = new Date().toISOString();
    return state;
  }

  function selectDailyLesson(lessons, dayKey) {
    const available = new Map();
    for (const lesson of Array.isArray(lessons) ? lessons : []) {
      if (!lesson || !lesson.id) continue;
      available.set("curriculum-" + lesson.id, lesson.title || lesson.id);
    }
    const group = LESSON_GROUPS[Math.abs(dayIndex(dayKey)) % LESSON_GROUPS.length];
    const known = group.lessonIds.filter((id) => available.has(id) || LESSON_TITLES[id]);
    const fallback = LESSON_GROUPS.flatMap((entry) => entry.lessonIds).filter((id) => available.has(id) || LESSON_TITLES[id]);
    const pool = known.length ? known : fallback;
    if (!pool.length) return { id: "", title: "", group: group.id, groupLabel: group.label };
    const id = pool[hashString(dayKey + "|" + group.id) % pool.length];
    return {
      id,
      title: available.get(id) || LESSON_TITLES[id] || id,
      group: group.id,
      groupLabel: group.label,
    };
  }

  function lessonCompletedOn(progress, lessonId, dayKey) {
    const record = progress && typeof progress === "object" ? progress[lessonId] : null;
    if (!record || record.completed !== true) return false;
    const completedAt = String(record.completedAt || "");
    if (!completedAt) return false;
    const parsed = new Date(completedAt);
    if (Number.isNaN(parsed.getTime())) return false;
    return localDayKey(parsed) === dayKey;
  }

  function woodpeckerLot() {
    return [...WOODPECKER_PUZZLE_IDS];
  }

  function solvedSet(storage) {
    try {
      const raw = storage && typeof storage.getItem === "function" ? storage.getItem(TACTICS_SOLVED_KEY) : null;
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map((id) => String(id)) : []);
    } catch (_error) {
      return new Set();
    }
  }

  function nextWoodpeckerIndex(state, solved) {
    const set = solved instanceof Set ? solved : new Set(Array.isArray(solved) ? solved : []);
    const step = state && state.steps ? state.steps.woodpecker : null;
    const start = Math.max(0, Math.min(WOODPECKER_PUZZLE_IDS.length - 1, Number(step && step.puzzleIndex) || 0));
    for (let offset = 0; offset < WOODPECKER_PUZZLE_IDS.length; offset++) {
      const index = (start + offset) % WOODPECKER_PUZZLE_IDS.length;
      if (!set.has(WOODPECKER_PUZZLE_IDS[index])) return index;
    }
    return WOODPECKER_PUZZLE_IDS.length;
  }

  function recordPuzzleTime(state, index, elapsedMs) {
    const step = state && state.steps ? state.steps.woodpecker : null;
    if (!step) return state;
    const position = Math.max(0, Math.min(WOODPECKER_PUZZLE_IDS.length - 1, Number(index) || 0));
    const id = WOODPECKER_PUZZLE_IDS[position];
    if (!id) return state;
    if (!step.puzzleTimes || typeof step.puzzleTimes !== "object") step.puzzleTimes = {};
    step.puzzleTimes[id] = Math.max(0, Math.round(Number(elapsedMs) || 0));
    step.puzzleIndex = Math.min(WOODPECKER_PUZZLE_IDS.length - 1, position + 1);
    step.puzzleStartedAt = Date.now();
    return state;
  }

  function woodpeckerSummary(state, solved) {
    const set = solved instanceof Set ? solved : new Set(Array.isArray(solved) ? solved : []);
    const step = state && state.steps ? state.steps.woodpecker : null;
    const times = step && step.puzzleTimes && typeof step.puzzleTimes === "object" ? step.puzzleTimes : {};
    const entries = Object.values(times).filter((value) => Number.isFinite(Number(value)));
    const total = entries.reduce((sum, value) => sum + Number(value), 0);
    return {
      total: WOODPECKER_PUZZLE_IDS.length,
      solved: WOODPECKER_PUZZLE_IDS.filter((id) => set.has(id)).length,
      timed: entries.length,
      averageMs: entries.length ? Math.round(total / entries.length) : 0,
      lastMs: entries.length ? Number(entries[entries.length - 1]) : 0,
      times: { ...times },
    };
  }

  function findEvaluationFlips(grades, evalHistory, options = {}) {
    const limit = Math.max(1, Math.floor(Number(options.limit) || 2));
    const color = options.color || null;
    const rows = [];
    for (const entry of Array.isArray(grades) ? grades : []) {
      if (!entry) continue;
      const ply = Number(entry.ply);
      if (!Number.isFinite(ply) || ply < 1) continue;
      const loss = Number(entry.lossCp);
      rows.push({
        ply,
        color: entry.color || (ply % 2 === 1 ? "w" : "b"),
        category: entry.category || "unrated",
        lossCp: Number.isFinite(loss) ? loss : null,
      });
    }
    if (!rows.some((row) => row.lossCp !== null && row.lossCp > 0)) {
      const history = Array.isArray(evalHistory) ? evalHistory : [];
      let previous = null;
      for (let index = 0; index < history.length; index++) {
        const value = Number(history[index]);
        const current = Number.isFinite(value) ? value : null;
        if (current !== null && previous !== null) {
          rows.push({
            ply: index + 1,
            color: index % 2 === 0 ? "w" : "b",
            category: "evaluation",
            lossCp: Math.max(0, previous - current),
          });
        }
        if (current !== null) previous = current;
      }
    }
    const filtered = color ? rows.filter((row) => row.color === color) : rows;
    const scored = filtered.filter((row) =>
      (row.lossCp !== null && row.lossCp > 0) ||
      ["blunder", "error", "mistake", "inaccuracy"].includes(String(row.category)));
    scored.sort((a, b) => (b.lossCp || 0) - (a.lossCp || 0) || a.ply - b.ply);
    return scored.slice(0, limit);
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.round(Number(ms) / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function readJson(storage, key, fallback) {
    try {
      const raw = storage && typeof storage.getItem === "function" ? storage.getItem(key) : null;
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (_error) {
      return fallback;
    }
  }

  const api = {
    STORAGE_KEY,
    LESSON_PROGRESS_KEY,
    TACTICS_SOLVED_KEY,
    STEP_IDS,
    STEP_LABELS,
    STEP_DURATION_MS,
    SLOW_GAME_CONTROLS,
    WOODPECKER_PUZZLE_IDS,
    LESSON_GROUPS,
    localDayKey,
    parseDayKey,
    dayDistance,
    dayIndex,
    dayKeyOffset,
    computeStreak,
    createState,
    loadState,
    saveState,
    currentStep,
    isComplete,
    stepElapsedMs,
    stepRemainingMs,
    startStep,
    pauseStep,
    completeStep,
    skipStep,
    registerCompletion,
    selectDailyLesson,
    lessonCompletedOn,
    woodpeckerLot,
    nextWoodpeckerIndex,
    recordPuzzleTime,
    woodpeckerSummary,
    findEvaluationFlips,
    formatDuration,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.SupaChessDailyRoutine = api;

  if (typeof document === "undefined") return;

  let routineState = api.loadState(safeStorage(), api.localDayKey(new Date()));
  let timerId = null;

  function safeStorage() {
    try {
      return window.localStorage;
    } catch (_error) {
      return null;
    }
  }

  function element(id) {
    return document.getElementById(id);
  }

  function currentLesson() {
    const lessons = root.SupaChessCurriculum && Array.isArray(root.SupaChessCurriculum.lessons)
      ? root.SupaChessCurriculum.lessons
      : [];
    const selection = api.selectDailyLesson(lessons, routineState.dayKey);
    const step = routineState.steps.lesson;
    if (!step.lessonId || step.lessonGroup !== selection.group) {
      step.lessonId = selection.id;
      step.lessonTitle = selection.title;
      step.lessonGroup = selection.group;
    }
    return selection;
  }

  function tacticsFallbackUrl() {
    return "https://jira44.github.io/supachess-web/TRAINING_TACTICS.html";
  }

  function relativeTacticsUrl() {
    try {
      const url = new URL("../supachess-web/TRAINING_TACTICS.html", window.location.href).href;
      return url.indexOf("file:") === 0 ? "" : url;
    } catch (_error) {
      return "";
    }
  }

  let tacticsTarget = "";

  async function resolveTacticsTarget() {
    const relative = relativeTacticsUrl();
    if (!relative) {
      tacticsTarget = tacticsFallbackUrl();
      return tacticsTarget;
    }
    tacticsTarget = relative;
    try {
      const response = await fetch(relative, { method: "HEAD" });
      if (!response.ok) tacticsTarget = tacticsFallbackUrl();
    } catch (_error) {
      tacticsTarget = tacticsFallbackUrl();
    }
    return tacticsTarget;
  }

  function tacticsUrl() {
    return tacticsTarget || relativeTacticsUrl() || tacticsFallbackUrl();
  }

  function lessonUrl(lessonId) {    return "book-lessons.html?lesson=" + encodeURIComponent(lessonId);
  }

  function renderStreak() {
    const target = element("daily-routine-streak");
    if (!target) return;
    const streak = Math.max(0, Number(routineState.streak) || 0);
    target.textContent = "Série : " + streak + (streak > 1 ? " jours" : " jour");
  }

  function renderStatus(text) {
    const target = element("daily-routine-status");
    if (target && text) target.textContent = text;
  }

  function renderStep(stepId, now) {
    const step = routineState.steps[stepId];
    const timer = document.querySelector('[data-routine-timer="' + stepId + '"]');
    if (timer) {
      timer.textContent = api.formatDuration(api.stepRemainingMs(routineState, stepId, now));
      timer.setAttribute("aria-label", "Temps restant pour l'étape " + api.STEP_LABELS[stepId]);
    }
    const row = document.querySelector('[data-routine-step="' + stepId + '"]');
    if (row) {
      row.classList.toggle("is-done", Boolean(step.done));
      row.classList.toggle("is-skipped", Boolean(step.skipped));
      row.classList.toggle("is-running", Boolean(step.startedAt));
      row.setAttribute("aria-current", String(api.currentStep(routineState) === stepId));
    }
  }

  function renderLesson(now) {
    const selection = currentLesson();
    const step = routineState.steps.lesson;
    const detail = document.querySelector('[data-routine-detail="lesson"]');
    if (detail) {
      if (!selection.id) {
        detail.textContent = "Aucune leçon disponible dans le catalogue local. Passe à l'étape suivante ou réessaie plus tard.";
      } else {
        const progress = readJson(safeStorage(), api.LESSON_PROGRESS_KEY, {});
        const done = api.lessonCompletedOn(progress, selection.id, routineState.dayKey);
        detail.textContent = "Leçon du jour : " + (selection.title || selection.id) + " — " + selection.groupLabel +
          (done ? " · validée aujourd'hui." : " · termine la leçon et le mini-exercice pour la valider.");
      }
    }
    const open = document.querySelector('[data-routine-action="lesson-open"]');
    if (open) {
      open.disabled = !selection.id;
      open.textContent = step.done ? "Revoir la leçon" : "Ouvrir la leçon";
    }
    renderStep("lesson", now);
  }

  function renderWoodpecker(now) {
    const solved = solvedSet(safeStorage());
    const step = routineState.steps.woodpecker;
    const summary = api.woodpeckerSummary(routineState, solved);
    const index = api.nextWoodpeckerIndex(routineState, solved);
    const id = api.WOODPECKER_PUZZLE_IDS[index] || "";
    step.puzzleIndex = index;
    const detail = document.querySelector('[data-routine-detail="woodpecker"]');
    if (detail) {
      detail.textContent = id
        ? "Puzzle " + (index + 1) + "/" + api.WOODPECKER_PUZZLE_IDS.length + " · " + id +
          " · résolus : " + summary.solved + "/" + summary.total +
          " · temps moyen : " + api.formatDuration(summary.averageMs)
        : "Les 50 puzzles du lot sont résolus.";
    }
    const open = document.querySelector('[data-routine-action="woodpecker-open"]');
    if (open) {
      open.disabled = !id;
      open.textContent = id ? "Ouvrir le puzzle" : "Lot terminé";
    }
    const next = document.querySelector('[data-routine-action="woodpecker-next"]');
    if (next) next.disabled = !id;
    renderStep("woodpecker", now);
  }

  function renderSlowGame(now) {
    const step = routineState.steps.slowgame;
    const detail = document.querySelector('[data-routine-detail="slowgame"]');
    if (detail) {
      const control = step.control || "10+5";
      const moments = Array.isArray(step.moments) ? step.moments : [];
      const momentText = moments.length
        ? " Moments de bascule : " + moments.map((moment) => "demi-coup " + moment.ply +
          (moment.lossCp ? " (" + (moment.lossCp / 100).toFixed(2) + " pion)" : "")).join(" · ")
        : " · la partie n'est pas encore analysée.";
      detail.textContent = "Partie lente " + control + " contre Stockfish" +
        (step.gameFinishedAt ? " · partie terminée." : " · lance la partie puis ouvre l'analyse.") + momentText;
    }
    const start = document.querySelector('[data-routine-action="slowgame-start"]');
    if (start) start.textContent = step.gameFinishedAt ? "Relancer une partie lente" : "Lancer la partie lente";
    const analysis = document.querySelector('[data-routine-action="slowgame-analysis"]');
    if (analysis) analysis.disabled = !step.gameFinishedAt;
    renderStep("slowgame", now);
  }

  function render(now) {
    const moment = now || Date.now();
    renderStreak();
    renderLesson(moment);
    renderWoodpecker(moment);
    renderSlowGame(moment);
    const button = element("btn-daily-routine");
    if (button) {
      const stepId = api.currentStep(routineState);
      button.textContent = api.isComplete(routineState)
        ? "Routine du Jour (45 min) · terminée"
        : "Routine du Jour (45 min)";
      button.setAttribute("aria-expanded", String(!element("daily-routine-panel")?.hidden));
    }
    const summary = element("daily-routine-summary");
    if (summary) {
      const stepId = api.currentStep(routineState);
      summary.textContent = api.isComplete(routineState)
        ? "Routine du jour terminée · série : " + Math.max(0, Number(routineState.streak) || 0) + " jour(s)."
        : "Étape en cours : " + (stepId ? api.STEP_LABELS[stepId] : "—") + " · 3 étapes de 15 minutes.";
    }
  }

  function persist() {
    api.saveState(safeStorage(), routineState);
  }

  function checkLessonCompletion() {
    const selection = currentLesson();
    if (!selection.id) return false;
    const progress = readJson(safeStorage(), api.LESSON_PROGRESS_KEY, {});
    if (!api.lessonCompletedOn(progress, selection.id, routineState.dayKey)) return false;
    if (routineState.steps.lesson.done) return true;
    api.completeStep(routineState, "lesson", Date.now());
    persist();
    render();
    return true;
  }

  function checkWoodpeckerProgress() {
    const solved = solvedSet(safeStorage());
    const step = routineState.steps.woodpecker;
    const index = api.nextWoodpeckerIndex(routineState, solved);
    const id = api.WOODPECKER_PUZZLE_IDS[index] || "";
    if (!id) {
      if (!step.done) {
        api.completeStep(routineState, "woodpecker", Date.now());
        persist();
        render();
      }
      return true;
    }
    if (step.puzzleStartedAt && api.WOODPECKER_PUZZLE_IDS[step.puzzleIndex] && solved.has(api.WOODPECKER_PUZZLE_IDS[step.puzzleIndex])) {
      api.recordPuzzleTime(routineState, step.puzzleIndex, Date.now() - step.puzzleStartedAt);
      persist();
      render();
    }
    return false;
  }

  function lastSavedGamePgn() {
    const games = readJson(safeStorage(), GAMES_KEY, []);
    if (!Array.isArray(games)) return "";
    for (let index = games.length - 1; index >= 0; index--) {
      const pgn = games[index] && typeof games[index].pgn === "string" ? games[index].pgn : "";
      if (pgn.trim()) return pgn;
    }
    return "";
  }

  function collectMoments() {
    const gameState = typeof window !== "undefined" && window.SupaChessGameState ? window.SupaChessGameState : null;
    if (!gameState) return [];
    const grades = Array.isArray(gameState.moveGradeHistory) ? gameState.moveGradeHistory : [];
    const history = Array.isArray(gameState.evalHistory) ? gameState.evalHistory : [];
    const moments = api.findEvaluationFlips(grades, history, { limit: 2, color: gameState.userColor || null });
    return moments.map((moment) => ({ ...moment }));
  }

  function completeRoutineIfReady() {
    if (!api.isComplete(routineState)) return false;
    if (routineState.completed) return false;
    api.registerCompletion(routineState, routineState.dayKey);
    persist();
    render();
    renderStatus("Routine du jour terminée. Série : " + routineState.streak + " jour(s).");
    return true;
  }

  function startOrResumeStep() {
    const stepId = api.currentStep(routineState);
    if (!stepId) {
      completeRoutineIfReady();
      return;
    }
    api.startStep(routineState, stepId, Date.now());
    const step = routineState.steps[stepId];
    if (stepId === "woodpecker" && !step.puzzleStartedAt) step.puzzleStartedAt = Date.now();
    persist();
    render();
    renderStatus("Étape " + api.STEP_LABELS[stepId] + " démarrée · 15 minutes.");
  }

  function pauseCurrentStep() {
    const stepId = api.currentStep(routineState);
    if (!stepId) return;
    api.pauseStep(routineState, stepId, Date.now());
    persist();
    render();
    renderStatus("Étape " + api.STEP_LABELS[stepId] + " en pause. Reprends quand tu veux.");
  }

  function handleAction(action) {
    const now = Date.now();
    if (action === "start") {      startOrResumeStep();
      return;
    }
    if (action === "pause") {
      pauseCurrentStep();
      return;
    }
    if (action === "reset") {
      const completedDays = routineState.completedDays;
      const streak = routineState.streak;
      routineState = api.createState(routineState.dayKey);
      routineState.completedDays = completedDays;
      routineState.streak = streak;
      persist();
      render();
      renderStatus("Routine du jour réinitialisée. La série est conservée.");
      return;
    }
    if (action === "lesson-open") {
      const selection = currentLesson();
      if (!selection.id) {
        renderStatus("Leçon indisponible : catalogue local vide. Tu peux passer l'étape et continuer.");
        return;
      }
      api.startStep(routineState, "lesson", now);
      persist();
      window.location.href = lessonUrl(selection.id);
      return;
    }
    if (action === "lesson-skip") {
      api.skipStep(routineState, "lesson", now);
      persist();
      render();
      completeRoutineIfReady();
      renderStatus("Étape 1 passée. Tu peux y revenir plus tard si tu le souhaites.");
      return;
    }
    if (action === "woodpecker-open") {
      const solved = solvedSet(safeStorage());
      const index = api.nextWoodpeckerIndex(routineState, solved);
      const id = api.WOODPECKER_PUZZLE_IDS[index] || "";
      if (!id) {
        checkWoodpeckerProgress();
        return;
      }
      api.startStep(routineState, "woodpecker", now);
      routineState.steps.woodpecker.puzzleIndex = index;
      routineState.steps.woodpecker.puzzleStartedAt = now;
      persist();
      renderStatus("Ouverture du puzzle tactique…");
      resolveTacticsTarget().then((target) => {
        window.location.href = (target || tacticsUrl()) + "?puzzle=" + encodeURIComponent(id);
      }).catch(() => {
        window.location.href = tacticsFallbackUrl() + "?puzzle=" + encodeURIComponent(id);
      });
      return;
    }
    if (action === "woodpecker-next") {
      const step = routineState.steps.woodpecker;
      const index = Number(step.puzzleIndex) || 0;
      if (step.puzzleStartedAt) api.recordPuzzleTime(routineState, index, now - step.puzzleStartedAt);
      persist();
      render();
      renderStatus("Puzzle suivant prêt. Le temps par puzzle est enregistré.");
      return;
    }
    if (action === "woodpecker-skip") {
      api.skipStep(routineState, "woodpecker", now);
      persist();
      render();
      completeRoutineIfReady();
      renderStatus("Étape 2 passée.");
      return;
    }
    if (action === "slowgame-start") {
      const step = routineState.steps.slowgame;
      const control = SLOW_GAME_CONTROLS[step.control] ? step.control : "10+5";
      const settings = SLOW_GAME_CONTROLS[control];
      if (typeof root.SupaChessStartTrainingGame !== "function") {
        renderStatus("Partie d'entraînement indisponible : le moteur n'est pas prêt. Réessaie dans un instant.");
        return;
      }
      api.startStep(routineState, "slowgame", now);
      step.gameStartedAt = now;
      step.gameFinishedAt = null;
      step.analysisOpened = false;
      step.moments = [];
      persist();
      root.SupaChessStartTrainingGame({ minutes: settings.minutes, incrementSeconds: settings.incrementSeconds });
      renderStatus("Partie lente " + control + " lancée. Joue jusqu'au bout, puis ouvre l'analyse.");
      render();
      return;
    }
    if (action === "slowgame-analysis") {
      const step = routineState.steps.slowgame;
      const pgn = lastSavedGamePgn();
      if (!pgn) {
        renderStatus("Analyse indisponible : aucune partie enregistrée sur cet appareil.");
        return;
      }
      if (typeof root.reviewStart !== "function") {
        renderStatus("Analyse indisponible : le module de relecture n'est pas chargé.");
        return;
      }
      step.analysisOpened = true;
      persist();
      try {
        root.reviewStart(pgn);
        if (typeof root.reviewRun === "function") root.reviewRun();
      } catch (error) {
        renderStatus("Analyse interrompue : " + String(error && error.message ? error.message : error).slice(0, 160));
        return;
      }
      api.completeStep(routineState, "slowgame", now);
      persist();
      render();
      completeRoutineIfReady();
      return;
    }
    if (action === "slowgame-skip") {
      api.skipStep(routineState, "slowgame", now);
      persist();
      render();
      completeRoutineIfReady();
      renderStatus("Étape 3 passée.");
    }
  }

  function bindUi() {
    const button = element("btn-daily-routine");
    if (button) {
      button.addEventListener("click", () => {
        const panel = element("daily-routine-panel");
        if (panel) {
          panel.hidden = false;
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        startOrResumeStep();
      });
    }
    const panel = element("daily-routine-panel");
    if (panel) {
      panel.addEventListener("click", (event) => {
        const target = event.target.closest("[data-routine-action]");
        if (!target) return;
        handleAction(target.dataset.routineAction);
      });
    }
    const control = element("routine-slowgame-control");
    if (control) {
      control.addEventListener("change", () => {
        routineState.steps.slowgame.control = control.value;
        persist();
        render();
      });
    }
    window.addEventListener("supachess:game-over", (event) => {
      const step = routineState.steps.slowgame;
      if (!step.gameStartedAt || step.gameFinishedAt) return;
      const reason = event && event.detail ? event.detail.reason : "finished";
      if (reason !== "finished") {
        step.gameStartedAt = null;
        persist();
        render();
        renderStatus("Partie lente interrompue (" + reason + "). Relance-la pour valider l'étape.");
        return;
      }
      step.gameFinishedAt = Date.now();
      step.moments = collectMoments();
      api.pauseStep(routineState, "slowgame", Date.now());
      persist();
      render();
      renderStatus("Partie lente terminée. Ouvre l'analyse pour identifier les 2 moments de bascule.");
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      checkLessonCompletion();
      checkWoodpeckerProgress();
      render();
    });
    window.addEventListener("focus", () => {
      checkLessonCompletion();
      checkWoodpeckerProgress();
      render();
    });
  }

  function startTimer() {
    if (timerId !== null) return;
    timerId = window.setInterval(() => {
      const today = api.localDayKey(new Date());
      if (today && today !== routineState.dayKey) {
        const completedDays = routineState.completedDays;
        const streak = routineState.streak;
        routineState = api.createState(today);
        routineState.completedDays = completedDays;
        routineState.streak = streak;
        persist();
      }
      render(Date.now());
    }, 1000);
  }

  function init() {
    if (!element("daily-routine-panel")) return;
    bindUi();
    checkLessonCompletion();
    checkWoodpeckerProgress();
    const control = element("routine-slowgame-control");
    if (control && SLOW_GAME_CONTROLS[control.value]) routineState.steps.slowgame.control = control.value;
    persist();
    render();
    startTimer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);
