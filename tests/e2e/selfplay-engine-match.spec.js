const { test, expect } = require("@playwright/test");
const { Chess } = require("chess.js");
const { buildEngineGameEntries } = require("../../js/selfplay-study.js");

test("academy generates a legal Stockfish versus Berserk PGN for study", async ({ page }) => {
  const moves = ["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"];
  const movesByFen = {};
  const expectedGame = new Chess();
  for (const uci of moves) {
    movesByFen[expectedGame.fen()] = uci;
    expectedGame.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
  }
  await page.addInitScript((movesByFen) => {
    class FakeWorker {
      constructor(path) {
        this.path = path;
        this.terminated = false;
        this.positionFen = "";
        if (path.includes("berserk")) queueMicrotask(() => this.emit({ type: "ready", name: "Berserk 14 · WebAssembly · 1 thread" }));
      }
      emit(data) { if (!this.terminated) this.onmessage && this.onmessage({ data }); }
      postMessage(command) {
        if (command === "uci") {
          queueMicrotask(() => { this.emit("id name " + (this.path.includes("berserk") ? "Berserk 14" : "Stockfish 19")); this.emit("uciok"); });
        } else if (command === "isready") queueMicrotask(() => this.emit("readyok"));
        else if (command.startsWith("position fen ")) this.positionFen = command.slice("position fen ".length);
        else if (command.startsWith("go ")) {
          const move = movesByFen[this.positionFen] || "0000";
          queueMicrotask(() => {
            if (move !== "0000") this.emit("info depth 1 multipv 1 score cp 0 pv " + move);
            this.emit("bestmove " + move);
          });
        }
      }
      terminate() { this.terminated = true; }
    }
    window.Worker = FakeWorker;
  }, movesByFen);

  await page.goto("/book-lessons.html");
  await page.locator("[data-sf-match-time]").selectOption("150");
  await page.locator("[data-sf-generate]").click();
  await expect(page.locator("[data-sf-status]")).toContainText("PGN légal vérifié");

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("supachess_games") || "[]")[0]);
  expect(saved).toMatchObject({
    gameNumber: 1,
    result: "1-0",
    selfPlayMode: "supa-vs-supa",
    engineName: "Supa contre Supa · Stockfish 19 vs Berserk 14",
    stopped: false,
    abandoned: false
  });
  const replay = new Chess();
  expect(replay.load_pgn(saved.pgn)).not.toBe(false);
  expect(replay.history()).toHaveLength(7);
  expect(buildEngineGameEntries([saved], Chess)).toHaveLength(7);
});

test("rush preset runs Stockfish 19 against itself at 150 ms per half-move", async ({ page }) => {
  const moves = ["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"];
  const movesByFen = {};
  const expectedGame = new Chess();
  for (const uci of moves) {
    movesByFen[expectedGame.fen()] = uci;
    expectedGame.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
  }
  await page.addInitScript((movesByFen) => {
    class FakeWorker {
      constructor(path) { this.path = path; this.terminated = false; this.positionFen = ""; }
      emit(data) { if (!this.terminated) this.onmessage && this.onmessage({ data }); }
      postMessage(command) {
        if (command === "uci") queueMicrotask(() => { this.emit("id name Stockfish 19"); this.emit("uciok"); });
        else if (command === "isready") queueMicrotask(() => this.emit("readyok"));
        else if (command.startsWith("position fen ")) this.positionFen = command.slice("position fen ".length);
        else if (command.startsWith("go ")) {
          const move = movesByFen[this.positionFen] || "0000";
          queueMicrotask(() => {
            if (move !== "0000") this.emit("info depth 1 multipv 1 score cp 0 pv " + move);
            this.emit("bestmove " + move);
          });
        }
      }
      terminate() { this.terminated = true; }
    }
    window.Worker = FakeWorker;
  }, movesByFen);

  await page.goto("/book-lessons.html");
  await page.locator("[data-sf-match-white]").selectOption("berserk");
  await page.locator("[data-sf-match-time]").selectOption("600");
  await page.locator("[data-sf-rush]").click();
  await expect(page.locator("[data-sf-status]")).toContainText("PGN légal vérifié");

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("supachess_games") || "[]")[0]);
  expect(saved.engineName).toBe("Supa contre Supa · Stockfish 19 vs Stockfish 19");
  expect(saved.white).toBe("Stockfish 19");
  expect(saved.black).toBe("Stockfish 19");
  const replay = new Chess();
  expect(replay.load_pgn(saved.pgn)).not.toBe(false);
  expect(replay.history()).toHaveLength(7);
});
