const test = require('node:test');
const assert = require('node:assert/strict');
const {Chess} = require('chess.js');
const {levels,lessons} = require('../js/curriculum.js');

const engineSan = san => san.replace(/([CFDRT])(?=x?[a-h])/g, letter => ({C:'N',F:'B',D:'Q',R:'K',T:'R'})[letter]);

test('curriculum contains 21 original lessons across four levels', () => {
  assert.equal(levels.length,4);
  assert.equal(lessons.length,21);
  assert.equal(new Set(lessons.map(lesson=>lesson.id)).size,lessons.length);
  for(const level of levels) assert.equal(lessons.filter(lesson=>lesson.level===level).length,({Débutant:5,Intermédiaire:5,Avancé:6,Expert:5})[level],level);
});

test('every exercise position is a legal FEN and every answer is a legal move', () => {
  for(const lesson of lessons) {
    const position=new Chess();
    assert.equal(position.load_pgn(engineSan(lesson.setup)),true,`${lesson.id}: setup PGN`);
    const fen=position.fen();
    assert.equal(new Chess(fen).fen(),fen,`${lesson.id}: FEN round trip`);
    assert.ok(position.moves().includes(engineSan(lesson.answer)),`${lesson.id}: answer legal`);
    assert.ok(lesson.choices.includes(lesson.answer),`${lesson.id}: answer offered`);
    for(const choice of lesson.choices)assert.ok(position.moves().includes(engineSan(choice)),`${lesson.id}: choice ${choice} legal`);
  }
});

test('every study PGN is legal and matches a complete explained continuation', () => {
  for(const lesson of lessons) {
    const wholeGame=new Chess();
    assert.equal(wholeGame.load_pgn(engineSan(lesson.pgn)),true,`${lesson.id}: PGN legal`);
    const replay=new Chess();
    assert.equal(replay.load_pgn(engineSan(lesson.setup)),true,`${lesson.id}: setup replays`);
    assert.equal(lesson.line.length,lesson.notes.length,`${lesson.id}: one explanation per ply`);
    for(const san of lesson.line) assert.ok(replay.move(engineSan(san)),`${lesson.id}: illegal ${san}`);
    assert.deepEqual(replay.history(),wholeGame.history(),`${lesson.id}: PGN and explained line agree`);
    assert.ok(lesson.why.length>40,`${lesson.id}: solution has an explanation`);
  }
});

