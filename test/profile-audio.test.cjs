const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const audioSource = fs.readFileSync("js/sounds.js", "utf8");

function createAudioEnvironment(enabled = false) {
  const storage = new Map(enabled ? [["supachess-sounds-enabled-v1", "true"]] : []);
  const oscillators = [];
  class FakeAudioContext {
    constructor() { this.state = "running"; this.currentTime = 2; this.destination = {}; }
    createOscillator() {
      const oscillator = { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {}, type: "" };
      oscillators.push(oscillator);
      return oscillator;
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }
  const window = {
    AudioContext: FakeAudioContext,
    localStorage: { getItem(key) { return storage.get(key) ?? null; }, setItem(key, value) { storage.set(key, value); } }
  };
  vm.runInNewContext(audioSource, { window, globalThis: window });
  return { window, oscillators, storage };
}

test("sound effects are off by default and can be enabled per device", () => {
  const { window, oscillators } = createAudioEnvironment();
  assert.equal(window.SupaChessAudio.isEnabled(), false);
  assert.equal(window.SupaChessAudio.play("move"), false);
  assert.equal(oscillators.length, 0);
  window.SupaChessAudio.setEnabled(true);
  assert.equal(window.SupaChessAudio.isEnabled(), true);
  assert.equal(window.SupaChessAudio.play("move"), true);
  assert.equal(oscillators.length, 1);
});

test("sound effects distinguish captures, correct answers, errors, checks and lesson completion", () => {
  const { window, oscillators } = createAudioEnvironment(true);
  for (const kind of ["capture", "correct", "incorrect", "check", "complete"]) {
    assert.equal(window.SupaChessAudio.play(kind), true, kind);
  }
  assert.equal(oscillators.length, 11);
});

test("the profile exposes sound preferences and both training pages load the audio service", () => {
  const profile = fs.readFileSync("js/profile.js", "utf8");
  const mainPage = fs.readFileSync("index.html", "utf8");
  const lessonsPage = fs.readFileSync("book-lessons.html", "utf8");
  const app = fs.readFileSync("js/app.js", "utf8");
  const lessons = fs.readFileSync("js/book-lessons.js", "utf8");
  assert.match(profile, /data-profile-sounds/);
  assert.match(profile, /sound\.setEnabled\(soundControl\.checked\)/);
  assert.match(mainPage, /js\/sounds\.js[^\n]*\n[\s\S]*?js\/app\.js/);
  assert.match(lessonsPage, /js\/sounds\.js[^\n]*\n[\s\S]*?js\/book-lessons\.js/);
  assert.match(app, /SupaChessAudio[^\n]*play/);
  assert.match(lessons, /SupaChessAudio[^\n]*play/);
});
