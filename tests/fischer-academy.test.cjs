'use strict';

const assert = require('node:assert/strict');
const {
  STORAGE_KEY,
  buildTrainingPlan,
  buildReviewSchedule,
  loadAttempts,
  recordAttempt,
} = require('../js/fischer-academy');

const memory = new Map();
const storage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
const day = 86_400_000;
const firstAt = 1_700_000_000_000;

assert.equal(buildTrainingPlan([]).status, 'INSUFFICIENT_DATA');
assert.throws(() => buildTrainingPlan([{ category: 'unknown', correct: true }]), TypeError);
assert.throws(() => buildTrainingPlan([], { maxExercises: 0 }), RangeError);

const first = { category: 'candidate_selection', exerciseId: 'fen:startpos', correct: true, attemptedAt: firstAt };
assert.equal(recordAttempt(first, { storage }).status, 'RECORDED');
assert.equal(recordAttempt({ ...first, exerciseId: 'fen:mistake', correct: false, attemptedAt: firstAt }, { storage }).status, 'RECORDED');
const stored = loadAttempts(storage);
assert.equal(stored.status, 'OK');
assert.equal(stored.attempts.length, 2);
assert.equal(stored.attempts[0].exerciseId, 'fen:startpos');
assert.equal(buildTrainingPlan(stored.attempts).focus[0], 'candidate_selection');

const durableHistory = [
  { ...first, attemptedAt: firstAt },
  { ...first, attemptedAt: firstAt + 7 * day },
  { ...first, attemptedAt: firstAt + 38 * day },
];
const schedule = buildReviewSchedule(durableHistory, firstAt + 69 * day);
assert.equal(schedule[0].correctStreak, 3);
assert.equal(schedule[0].durable, true);
assert.equal(schedule[0].due, true);
assert.equal(buildReviewSchedule([{ ...first, correct: false }], firstAt + day).at(0).durable, false);

const damagedStorage = { getItem: () => '{invalid', setItem: () => { throw new Error('must not overwrite damaged history'); } };
assert.equal(recordAttempt(first, { storage: damagedStorage }).status, 'INVALID_STORED_DATA');
assert.equal(recordAttempt(first, { storage: null }).status, 'PERSISTENCE_UNAVAILABLE');
assert.equal(STORAGE_KEY, 'supachess_fischer_attempts_v1');
console.log('Fischer Academy persistence and spaced-learning tests passed');

