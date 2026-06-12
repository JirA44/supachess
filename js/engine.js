/* engine.js — wrapper UCI autour de stockfish-18-lite-single.js (Web Worker).
   File de requêtes séquentielle : une analyse à la fois. */
"use strict";

class StockfishEngine {
  constructor(workerPath) {
    this.worker = new Worker(workerPath);
    this.queue = [];
    this.busy = false;
    this.current = null;
    this.engineName = "Stockfish";
    this.readyResolve = null;
    this.ready = new Promise((res) => { this.readyResolve = res; });
    this.worker.onmessage = (e) => this._onLine(String(e.data));
    this.worker.onerror = (e) => console.error("[engine] worker error:", e.message || e);
    this._send("uci");
  }

  _send(cmd) { this.worker.postMessage(cmd); }

  _onLine(line) {
    if (line.startsWith("id name")) {
      this.engineName = line.slice(8).trim();
      return;
    }
    if (line === "uciok") {
      this._send("isready");
      return;
    }
    if (line === "readyok") {
      if (this.readyResolve) { this.readyResolve(); this.readyResolve = null; }
      return;
    }
    const job = this.current;
    if (!job) return;
    if (line.startsWith("info ") && line.includes(" pv ")) {
      const parsed = parseInfoLine(line);
      if (parsed) job.lines[parsed.multipv] = parsed;
      return;
    }
    if (line.startsWith("bestmove")) {
      const best = line.split(/\s+/)[1] || null;
      const lines = Object.values(job.lines).sort((a, b) => a.multipv - b.multipv);
      this.current = null;
      this.busy = false;
      job.resolve({ bestmove: best, lines });
      this._next();
    }
  }

  /* options: { fen, multipv=1, movetime=1500, elo=0 (0 = pleine force) } */
  analyze(options) {
    return new Promise((resolve, reject) => {
      this.queue.push({ options, resolve, reject, lines: {} });
      this._next();
    });
  }

  _next() {
    if (this.busy || this.queue.length === 0) return;
    this.busy = true;
    const job = this.queue.shift();
    this.current = job;
    const o = job.options;
    const elo = o.elo | 0;
    if (elo > 0) {
      this._send("setoption name UCI_LimitStrength value true");
      this._send("setoption name UCI_Elo value " + Math.max(1320, Math.min(3190, elo)));
    } else {
      this._send("setoption name UCI_LimitStrength value false");
    }
    this._send("setoption name MultiPV value " + (o.multipv || 1));
    this._send("position fen " + o.fen);
    this._send("go movetime " + (o.movetime || 1500));
  }

  stop() { this._send("stop"); }
}

/* Parse une ligne "info depth .. multipv N score cp X .. pv e2e4 e7e5 ..."
   Retourne { multipv, depth, scoreCp, mate, pv:[uci...] } — score côté trait. */
function parseInfoLine(line) {
  const t = line.split(/\s+/);
  const out = { multipv: 1, depth: 0, scoreCp: null, mate: null, pv: [] };
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "multipv") out.multipv = parseInt(t[i + 1], 10);
    else if (t[i] === "depth") out.depth = parseInt(t[i + 1], 10);
    else if (t[i] === "score") {
      if (t[i + 1] === "cp") out.scoreCp = parseInt(t[i + 2], 10);
      else if (t[i + 1] === "mate") out.mate = parseInt(t[i + 2], 10);
      i += 2;
    } else if (t[i] === "pv") {
      out.pv = t.slice(i + 1);
      break;
    }
  }
  if (out.scoreCp === null && out.mate === null) return null;
  if (out.pv.length === 0) return null;
  return out;
}

/* Convertit un score (cp/mate, côté trait) en valeur comparable en centipawns. */
function scoreValue(lineInfo) {
  if (lineInfo.mate !== null) {
    return lineInfo.mate > 0 ? 100000 - lineInfo.mate * 100 : -100000 - lineInfo.mate * 100;
  }
  return lineInfo.scoreCp;
}

function formatScore(lineInfo, sideIsWhite) {
  const sign = sideIsWhite ? 1 : -1; // affichage côté Blancs
  if (lineInfo.mate !== null) {
    const m = lineInfo.mate * sign;
    return (m > 0 ? "#+" : "#") + m;
  }
  const v = (lineInfo.scoreCp * sign) / 100;
  return (v > 0 ? "+" : "") + v.toFixed(2);
}
