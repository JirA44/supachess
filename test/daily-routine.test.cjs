/* Run with: node --test test/daily-routine.test.cjs */
const test = require("node:test");
const assert = require("node:assert/strict");
const routine = require("../js/daily-routine.js");

function memoryStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
    get size() { return data.size; },
  };
}

test("a local day key is built from the local calendar, not from UTC", () => {
  assert.equal(routine.localDayKey(new Date(2026, 10, 27, 23, 30)), "2026-11-27");
  assert.equal(routine.localDayKey(new Date(2026, 10, 27, 0, 5)), "2026-11-27");
  assert.equal(routine.localDayKey(new Date("nope")), "");
});

test("day keys can be shifted and compared", () => {
  assert.equal(routine.dayKeyOffset("2026-11-27", 1), "2026-11-28");
  assert.equal(routine.dayKeyOffset("2026-11-30", 1), "2026-12-01");
  assert.equal(routine.dayDistance("2026-11-26", "2026-11-27"), 1);
  assert.equal(routine.dayDistance("2026-11-25", "2026-11-27"), 2);
  assert.equal(routine.dayDistance("bad", "2026-11-27"), null);
});

test("the streak counts consecutive days and resets when a day is skipped", () => {
  assert.equal(routine.computeStreak([], "2026-11-27"), 0);
  assert.equal(routine.computeStreak(["2026-11-27"], "2026-11-27"), 1);
  assert.equal(routine.computeStreak(["2026-11-25", "2026-11-26", "2026-11-27"], "2026-11-27"), 3);
  assert.equal(routine.computeStreak(["2026-11-26"], "2026-11-27"), 1);
  assert.equal(routine.computeStreak(["2026-11-25", "2026-11-27"], "2026-11-27"), 1);
  assert.equal(routine.computeStreak(["2026-11-24"], "2026-11-27"), 0);
  assert.equal(routine.computeStreak(["2026-11-27", "2026-11-27"], "2026-11-27"), 1);
});

test("a new day starts a fresh routine but keeps the streak history", () => {
  const storage = memoryStorage();
  const yesterday = routine.createState("2026-11-26");
  routine.completeStep(yesterday, "lesson", 1000);
  routine.completeStep(yesterday, "woodpecker", 1000);
  routine.completeStep(yesterday, "slowgame", 1000);
  routine.registerCompletion(yesterday, "2026-11-26");
  routine.saveState(storage, yesterday);

  const today = routine.loadState(storage, "2026-11-27");
  assert.equal(today.dayKey, "2026-11-27");
  assert.equal(today.steps.lesson.done, false);
  assert.equal(routine.isComplete(today), false);
  assert.deepEqual(today.completedDays, ["2026-11-26"]);
  assert.equal(today.streak, 1);
});

test("a skipped day breaks the streak when the routine is loaded again", () => {
  const storage = memoryStorage();
  const old = routine.createState("2026-11-24");
  routine.registerCompletion(old, "2026-11-24");
  routine.saveState(storage, old);

  const today = routine.loadState(storage, "2026-11-27");
  assert.equal(today.streak, 0);
  assert.deepEqual(today.completedDays, ["2026-11-24"]);
});

test("the routine runs the three steps in order and ends complete", () => {
  const state = routine.createState("2026-11-27");
  assert.equal(routine.currentStep(state), "lesson");
  routine.completeStep(state, "lesson", 1000);
  assert.equal(routine.currentStep(state), "woodpecker");
  routine.completeStep(state, "woodpecker", 2000);
  assert.equal(routine.currentStep(state), "slowgame");
  routine.completeStep(state, "slowgame", 3000);
  assert.equal(routine.currentStep(state), null);
  assert.equal(routine.isComplete(state), true);
  routine.registerCompletion(state, "2026-11-27");
  assert.equal(state.completed, true);
  assert.equal(state.streak, 1);
});

test("each step counts down fifteen minutes and pauses without losing time", () => {
  const state = routine.createState("2026-11-27");
  const start = 1000000;
  routine.startStep(state, "lesson", start);
  assert.equal(routine.stepElapsedMs(state, "lesson", start + 60000), 60000);
  assert.equal(routine.stepRemainingMs(state, "lesson", start + 60000), 14 * 60 * 1000);
  routine.pauseStep(state, "lesson", start + 60000);
  assert.equal(routine.stepElapsedMs(state, "lesson", start + 600000), 60000);
  routine.startStep(state, "lesson", start + 600000);
  assert.equal(routine.stepElapsedMs(state, "lesson", start + 660000), 120000);
  assert.equal(routine.stepRemainingMs(state, "lesson", start + 660000), 13 * 60 * 1000);
});

test("a step never counts more than its duration", () => {
  const state = routine.createState("2026-11-27");
  routine.startStep(state, "lesson", 0);
  assert.equal(routine.stepRemainingMs(state, "lesson", 60 * 60 * 1000), 0);
});

test("the daily lesson is stable for a given day and differs across days", () => {
  const lessons = [
    { id: "first-plan", title: "Plan d'ouverture" },
    { id: "fork-pattern", title: "Motif de fourchette" },
  ];
  const first = routine.selectDailyLesson(lessons, "2026-11-27");
  const again = routine.selectDailyLesson(lessons, "2026-11-27");
  assert.equal(first.id, again.id);
  assert.ok(first.id.length > 0);
  assert.ok(first.title.length > 0);
  assert.ok(first.groupLabel.length > 0);
  const ids = new Set();
  for (let day = 1; day <= 28; day++) {
    ids.add(routine.selectDailyLesson(lessons, routine.dayKeyOffset("2026-11-27", day)).id);
  }
  assert.ok(ids.size > 1);
});

test("a lesson counts as done only on the day it was completed", () => {
  const progress = { "curriculum-fork-pattern": { completed: true, completedAt: "2026-11-27T18:04:00.000Z" } };
  assert.equal(routine.lessonCompletedOn(progress, "curriculum-fork-pattern", "2026-11-27"), true);
  assert.equal(routine.lessonCompletedOn(progress, "curriculum-fork-pattern", "2026-11-28"), false);
  assert.equal(routine.lessonCompletedOn(progress, "curriculum-other", "2026-11-27"), false);
  assert.equal(routine.lessonCompletedOn({}, "curriculum-fork-pattern", "2026-11-27"), false);
});

test("the woodpecker lot holds fifty fixed puzzles", () => {
  const lot = routine.woodpeckerLot();
  assert.equal(lot.length, 50);
  assert.equal(new Set(lot).size, 50);
  assert.equal(lot[0], "knight-fork-A");
});

test("the woodpecker skips puzzles already solved and stops at the end of the lot", () => {
  const state = routine.createState("2026-11-27");
  const solved = new Set(["knight-fork-A", "knight-fork-B"]);
  assert.equal(routine.nextWoodpeckerIndex(state, solved), 2);
  const all = new Set(routine.woodpeckerLot());
  assert.equal(routine.nextWoodpeckerIndex(state, all), 50);
});

test("each solved puzzle records its time and the summary averages it", () => {
  const state = routine.createState("2026-11-27");
  routine.recordPuzzleTime(state, 0, 30000);
  routine.recordPuzzleTime(state, 1, 60000);
  const summary = routine.woodpeckerSummary(state, new Set(["knight-fork-A", "knight-fork-B"]));
  assert.equal(summary.timed, 2);
  assert.equal(summary.solved, 2);
  assert.equal(summary.total, 50);
  assert.equal(summary.averageMs, 45000);
});

test("the routine picks the two worst evaluation swings", () => {
  const grades = [
    { ply: 3, color: "w", category: "blunder", lossCp: 320 },
    { ply: 5, color: "b", category: "inaccuracy", lossCp: 80 },
    { ply: 7, color: "w", category: "error", lossCp: 150 },
  ];
  const moments = routine.findEvaluationFlips(grades, [], { limit: 2, color: "w" });
  assert.equal(moments.length, 2);
  assert.equal(moments[0].ply, 3);
  assert.equal(moments[1].ply, 7);
});

test("the routine falls back on the evaluation history when no grade is available", () => {
  const moments = routine.findEvaluationFlips([], [20, -20, -180], { limit: 1 });
  assert.equal(moments.length, 1);
  assert.equal(moments[0].lossCp, 160);
  assert.equal(moments[0].ply, 3);
  assert.equal(moments[0].color, "w");
});
