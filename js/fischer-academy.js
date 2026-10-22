'use strict';

const CATEGORIES = Object.freeze(['calculation', 'opponent_reply', 'tactics', 'endgame', 'strategy', 'opening', 'candidate_selection']);
const STORAGE_KEY = 'supachess_fischer_attempts_v1';
const MAX_ATTEMPTS = 5000;
const DAY_MS = 86_400_000;
const REVIEW_INTERVALS_DAYS = Object.freeze([1, 7, 30]);

function validateAttempt(attempt) {
  if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)
      || !CATEGORIES.includes(attempt.category) || typeof attempt.correct !== 'boolean'
      || typeof attempt.exerciseId !== 'string' || attempt.exerciseId.length < 1 || attempt.exerciseId.length > 160
      || !Number.isSafeInteger(attempt.attemptedAt) || attempt.attemptedAt <= 0) {
    throw new TypeError('Attempt requires a known category, result, exercise id, and valid timestamp');
  }
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch (_error) { return null; }
}

function loadAttempts(storage) {
  storage = resolveStorage(storage);
  if (!storage) return { status: 'PERSISTENCE_UNAVAILABLE', attempts: [] };
  try {
    const value = storage.getItem(STORAGE_KEY);
    const attempts = value ? JSON.parse(value) : [];
    if (!Array.isArray(attempts) || attempts.length > MAX_ATTEMPTS) return { status: 'INVALID_STORED_DATA', attempts: [] };
    attempts.forEach(validateAttempt);
    return { status: 'OK', attempts };
  } catch (_error) {
    return { status: 'INVALID_STORED_DATA', attempts: [] };
  }
}

function recordAttempt(attempt, { storage } = {}) {
  storage = resolveStorage(storage);
  validateAttempt(attempt);
  const loaded = loadAttempts(storage);
  if (loaded.status !== 'OK') return { status: loaded.status, attempt: null };
  if (loaded.attempts.length >= MAX_ATTEMPTS) return { status: 'STORAGE_LIMIT', attempt: null };
  const saved = { ...attempt };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...loaded.attempts, saved]));
  } catch (_error) {
    return { status: 'PERSISTENCE_UNAVAILABLE', attempt: null };
  }
  renderLearningStatus(storage);
  return { status: 'RECORDED', attempt: saved };
}

function buildTrainingPlan(attempts, { maxExercises = 12 } = {}) {
  if (!Array.isArray(attempts)) throw new TypeError('Expected attempts');
  if (!Number.isInteger(maxExercises) || maxExercises < 1 || maxExercises > 100)
    throw new RangeError('maxExercises must be 1..100');
  const stats = Object.fromEntries(CATEGORIES.map(category => [category, { category, attempts: 0, errors: 0, score: 0 }]));
  for (const attempt of attempts) {
    validateAttempt(attempt);
    const stat = stats[attempt.category];
    stat.attempts++;
    if (!attempt.correct) stat.errors++;
  }
  for (const stat of Object.values(stats)) stat.score = stat.attempts ? (stat.attempts - stat.errors) / stat.attempts : null;
  const priorities = Object.values(stats).filter(stat => stat.attempts)
    .sort((a, b) => a.score - b.score || b.attempts - a.attempts || a.category.localeCompare(b.category));
  const focus = priorities.slice(0, 3).map(stat => stat.category);
  return {
    status: attempts.length ? 'DIAGNOSTIC' : 'INSUFFICIENT_DATA',
    stats,
    focus,
    exercises: focus.length ? Array.from({ length: Math.min(maxExercises, focus.length * 4) }, (_, index) => ({
      category: focus[index % focus.length],
      mode: index % 3 === 0 ? 'opponent-refutation' : 'candidate-comparison',
      revealEngineAfterAttempt: true,
    })) : [],
    warning: 'A small or unrepresentative attempt sample does not establish skill.',
  };
}

function buildReviewSchedule(attempts, now = Date.now()) {
  if (!Array.isArray(attempts) || !Number.isSafeInteger(now) || now <= 0) throw new TypeError('Invalid attempts or clock');
  const grouped = new Map();
  for (const attempt of attempts) {
    validateAttempt(attempt);
    const group = grouped.get(attempt.exerciseId) || [];
    group.push(attempt);
    grouped.set(attempt.exerciseId, group);
  }
  return [...grouped.entries()].map(([exerciseId, history]) => {
    history.sort((a, b) => a.attemptedAt - b.attemptedAt);
    let correctStreak = 0;
    for (let index = history.length - 1; index >= 0 && history[index].correct; index--) correctStreak++;
    const latest = history[history.length - 1];
    const streakStart = history[history.length - correctStreak]?.attemptedAt;
    const intervalDays = correctStreak ? REVIEW_INTERVALS_DAYS[Math.min(correctStreak - 1, REVIEW_INTERVALS_DAYS.length - 1)] : 1;
    const dueAt = latest.attemptedAt + intervalDays * DAY_MS;
    return {
      exerciseId, category: latest.category, attempts: history.length, correctStreak, dueAt, due: dueAt <= now,
      durable: correctStreak >= 3 && streakStart !== undefined && latest.attemptedAt - streakStart >= 30 * DAY_MS,
    };
  }).sort((a, b) => a.dueAt - b.dueAt || a.exerciseId.localeCompare(b.exerciseId));
}

function renderLearningStatus(storage) {
  const summary = globalThis.document?.getElementById('fischer-learning-summary');
  const planEl = globalThis.document?.getElementById('fischer-learning-plan');
  if (!summary || !planEl) return;
  const loaded = loadAttempts(storage);
  if (loaded.status !== 'OK' || !loaded.attempts.length) {
    summary.textContent = loaded.status === 'OK' ? 'Aucun exercice évalué pour le moment.' : 'Historique d’apprentissage indisponible.';
    planEl.textContent = '';
    return;
  }
  const plan = buildTrainingPlan(loaded.attempts);
  const schedule = buildReviewSchedule(loaded.attempts);
  const candidate = plan.stats.candidate_selection;
  const rate = candidate.attempts ? Math.round(candidate.score * 100) + '%' : 'données insuffisantes';
  summary.textContent = loaded.attempts.length + ' décisions évaluées · choix top-1 : ' + rate
    + ' · acquis durables : ' + schedule.filter(item => item.durable).length;
  planEl.textContent = 'Priorités : ' + (plan.focus.length ? plan.focus.join(', ') : 'données insuffisantes')
    + ' · positions à revoir : ' + schedule.filter(item => item.due).length;
}

const FischerAcademy = { CATEGORIES, STORAGE_KEY, loadAttempts, recordAttempt, buildTrainingPlan, buildReviewSchedule, renderLearningStatus };
if (typeof module !== 'undefined' && module.exports) module.exports = FischerAcademy;
if (typeof window !== 'undefined') window.FischerAcademy = FischerAcademy;
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => renderLearningStatus());
  else renderLearningStatus();
}

