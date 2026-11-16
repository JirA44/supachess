const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

test("Berserk wrapper starts UCI and returns a move without applying Stockfish Elo limits", async () => {
  class FakeWorker {
    static instances = [];
    constructor(workerPath) {
      this.workerPath = workerPath;
      this.sent = [];
      this.terminated = false;
      FakeWorker.instances.push(this);
      queueMicrotask(() => this.emit({ type: "ready", name: "Berserk 14 · WebAssembly · 1 thread" }));
    }
    emit(data) { queueMicrotask(() => { if (!this.terminated) this.onmessage?.({ data }); }); }
    postMessage(command) {
      this.sent.push(command);
      if (command === "uci") {
        this.emit("id name Berserk 14");
        this.emit("uciok");
      } else if (command === "isready") this.emit("readyok");
      else if (command.startsWith("go ")) {
        this.emit("info depth 5 multipv 1 score cp 22 pv e2e4 e7e5");
        this.emit("bestmove e2e4 ponder e7e5");
      }
    }
    terminate() { this.terminated = true; }
  }

  const context = { Worker: FakeWorker, setTimeout, clearTimeout, console, queueMicrotask };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "engine.js"), "utf8") +
    "\nglobalThis.BerserkEngine = BerserkEngine;", context);
  const engine = new context.BerserkEngine("vendor/berserk-14-worker.js");
  await engine.ready;
  const result = await engine.analyze({ fen: "startpos", multipv: 1, movetime: 500, elo: 1700 });

  assert.equal(engine.engineName, "Berserk 14 · WebAssembly · 1 thread");
  assert.equal(result.bestmove, "e2e4");
  assert.equal(result.lines[0].scoreCp, 22);
  assert.equal(FakeWorker.instances[0].workerPath, "vendor/berserk-14-worker.js");
  assert.equal(FakeWorker.instances[0].sent.some((command) => command.includes("UCI_LimitStrength") || command.includes("UCI_Elo")), false);
  engine.stop();
  assert.equal(FakeWorker.instances[0].terminated, true);
});
