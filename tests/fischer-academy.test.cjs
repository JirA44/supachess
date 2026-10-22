'use strict';
const assert=require('node:assert/strict');
const {buildTrainingPlan}=require('../js/fischer-academy.js');
assert.equal(buildTrainingPlan([]).status,'INSUFFICIENT_DATA');
const p=buildTrainingPlan([
  {category:'tactics',correct:true},
  {category:'opponent_reply',correct:false},
  {category:'opponent_reply',correct:false},
  {category:'calculation',correct:true}
]);
assert.equal(p.focus[0],'opponent_reply');
assert.ok(p.exercises.every(e=>e.revealEngineAfterAttempt));
assert.equal(p.stats.opponent_reply.score,0);
assert.throws(()=>buildTrainingPlan([{category:'unknown',correct:true}]),TypeError);
assert.throws(()=>buildTrainingPlan([], {maxExercises:0}),RangeError);
console.log('Fischer Academy tests passed');
