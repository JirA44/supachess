'use strict';
// Fischer Academy learning profile. Works only with assessed exercise outcomes.
// No engine call or account mutation. A mistake category describes the cause, not merely a loss.
const CATEGORIES = Object.freeze(['calculation','opponent_reply','tactics','endgame','strategy','opening']);
function buildTrainingPlan(attempts, { maxExercises = 12 } = {}) {
  if (!Array.isArray(attempts)) throw new TypeError('Expected attempts');
  if (!Number.isInteger(maxExercises) || maxExercises < 1 || maxExercises > 100)
    throw new RangeError('maxExercises must be 1..100');
  const stats = Object.fromEntries(CATEGORIES.map(category=>[category,{category,attempts:0,errors:0,score:0}]));
  for (const a of attempts) {
    if (!a || !CATEGORIES.includes(a.category) || typeof a.correct !== 'boolean')
      throw new TypeError('Each attempt needs a category and correct boolean');
    const s=stats[a.category]; s.attempts++;if (!a.correct) s.errors++;
  }
  for (const s of Object.values(stats)) s.score = s.attempts ? (s.attempts-s.errors)/s.attempts : null;
  const priorities=Object.values(stats).filter(s=>s.attempts).sort((a,b)=>
    a.score-b.score || b.attempts-a.attempts || a.category.localeCompare(b.category));
  const focus=priorities.slice(0,3).map(s=>s.category);
  return {
    status: attempts.length ? 'DIAGNOSTIC' : 'INSUFFICIENT_DATA',
    stats, focus,
    exercises: Array.from({length:Math.min(maxExercises,focus.length*4)},(_,i)=>({
      category:focus[i%focus.length], mode: i%3===0?'opponent-refutation':'candidate-comparison',
      // Do not expose an engine answer before the student has tried.
      revealEngineAfterAttempt:true
    })),
    warning:'A small or unrepresentative attempt sample does not establish skill.'
  };
}
module.exports={ CATEGORIES,buildTrainingPlan };
