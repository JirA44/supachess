/* engine.js — wrapper UCI autour de Stockfish 19, avec délai de réponse et reprise du Worker. */
"use strict";

class StockfishEngine {
  constructor(workerPath) {
    this.workerPath = workerPath;
    this.queue = [];
    this.busy = false;
    this.current = null;
    this.engineName = "Stockfish";
    this.worker = null;
    this.isReady = false;
    this.readyResolve = null;
    this.readyReject = null;
    this.readyTimer = null;
    this.ready = Promise.resolve();
    this._startWorker();
  }

  _error(message, code) {
    const error = new Error(message);
    error.code = code;
    error.retryable = true;
    return error;
  }

  _startWorker() {
    if (this.worker) return;
    const worker = new Worker(this.workerPath);
    this.worker = worker;
    this.isReady = false;
    this.ready = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.ready.catch(() => {});
    this.readyTimer = setTimeout(() => {
      this._failWorker(worker, this._error("Stockfish n’a pas terminé son initialisation dans les 30 secondes.", "ENGINE_STARTUP_TIMEOUT"));
    }, 30000);
    worker.onmessage = (event) => {
      if (this.worker === worker) this._onLine(String(event.data));
    };
    worker.onerror = (event) => {
      const detail = event && (event.message || event.type);
      this._failWorker(worker, this._error("Le Worker Stockfish a échoué" + (detail ? " : " + detail : "."), "ENGINE_WORKER_ERROR"));
    };
    worker.onmessageerror = () => {
      this._failWorker(worker, this._error("La réponse du Worker Stockfish est illisible.", "ENGINE_WORKER_ERROR"));
    };
    try {
      worker.postMessage("uci");
    } catch (error) {
      this._failWorker(worker, this._error("Impossible de démarrer le Worker Stockfish : " + (error.message || error), "ENGINE_WORKER_ERROR"));
    }
  }

  _send(command) {
    if (!this.worker) throw this._error("Le Worker Stockfish n’est pas disponible.", "ENGINE_WORKER_ERROR");
    this.worker.postMessage(command);
  }

  _failWorker(worker, error) {
    if (!worker || this.worker !== worker) return;
    if (this.readyTimer) clearTimeout(this.readyTimer);
    this.readyTimer = null;
    const current = this.current;
    if (current && current.timer) clearTimeout(current.timer);
    const queued = this.queue.splice(0);
    this.current = null;
    this.busy = false;
    this.isReady = false;
    this.worker = null;
    try { worker.terminate(); } catch (_error) {}
    if (this.readyReject) this.readyReject(error);
    this.readyResolve = null;
    this.readyReject = null;
    if (current) current.reject(error);
    queued.forEach((job) => job.reject(error));
  }

  _onLine(line) {
    if (line.startsWith("id name")) {
      this.engineName = line.slice(8).trim();
      return;
    }
    if (line === "uciok") {
      try { this._send("isready"); }
      catch (error) { this._failWorker(this.worker, this._error(error.message || String(error), "ENGINE_WORKER_ERROR")); }
      return;
    }
    if (line === "readyok") {
      if (this.readyTimer) clearTimeout(this.readyTimer);
      this.readyTimer = null;
      this.isReady = true;
      if (this.readyResolve) this.readyResolve();
      this.readyResolve = null;
      this.readyReject = null;
      this._next();
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
      if (job.timer) clearTimeout(job.timer);
      this.current = null;
      this.busy = false;
      job.resolve({ bestmove: best, lines });
      this._next();
    }
  }

  /* options: { fen, multipv=1, movetime=1500, elo=0, timeoutMs? } */
  analyze(options) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.worker) this._startWorker();
        this.queue.push({ options, resolve, reject, lines: {}, timer: null });
        this._next();
      } catch (error) {
        reject(error);
      }
    });
  }

  _next() {
    if (this.busy || !this.isReady || this.queue.length === 0) return;
    this.busy = true;
    const job = this.queue.shift();
    this.current = job;
    const options = job.options;
    const elo = options.elo | 0;
    const defaultTimeout = Math.max(15000, (options.movetime || 1500) * 10 + 5000);
    const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs : defaultTimeout;
    job.timer = setTimeout(() => {
      if (this.current !== job) return;
      this._failWorker(this.worker, this._error("Stockfish n’a pas répondu dans les " + timeoutMs + " ms.", "ENGINE_TIMEOUT"));
    }, timeoutMs);
    try {
      if (elo > 0) {
        this._send("setoption name UCI_LimitStrength value true");
        this._send("setoption name UCI_Elo value " + Math.max(1320, Math.min(3190, elo)));
      } else {
        this._send("setoption name UCI_LimitStrength value false");
      }
      this._send("setoption name MultiPV value " + (options.multipv || 1));
      this._send("position fen " + options.fen);
      this._send("go movetime " + (options.movetime || 1500));
    } catch (error) {
      this._failWorker(this.worker, this._error(error.message || String(error), "ENGINE_WORKER_ERROR"));
    }
  }

  stop() {
    if (!this.worker) return;
    try { this._send("stop"); }
    catch (error) { this._failWorker(this.worker, this._error(error.message || String(error), "ENGINE_WORKER_ERROR")); }
  }
}

/* Parse une ligne "info depth .. multipv N score cp X .. pv e2e4 e7e5 ..."
   Retourne { multipv, depth, scoreCp, mate, pv:[uci...] } — score côté trait. */
function parseInfoLine(line) {
  const tokens = line.split(/\s+/);
  const output = { multipv: 1, depth: 0, scoreCp: null, mate: null, pv: [] };
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index] === "multipv") output.multipv = parseInt(tokens[index + 1], 10);
    else if (tokens[index] === "depth") output.depth = parseInt(tokens[index + 1], 10);
    else if (tokens[index] === "score") {
      if (tokens[index + 1] === "cp") output.scoreCp = parseInt(tokens[index + 2], 10);
      else if (tokens[index + 1] === "mate") output.mate = parseInt(tokens[index + 2], 10);
      index += 2;
    } else if (tokens[index] === "pv") {
      output.pv = tokens.slice(index + 1);
      break;
    }
  }
  if (output.scoreCp === null && output.mate === null) return null;
  if (output.pv.length === 0) return null;
  return output;
}

/* Convertit un score (cp/mate, côté trait) en valeur comparable en centipawns. */
function scoreValue(lineInfo) {
  if (lineInfo.mate !== null) {
    return lineInfo.mate > 0 ? 100000 - lineInfo.mate * 100 : -100000 - lineInfo.mate * 100;
  }
  return lineInfo.scoreCp;
}

function formatScore(lineInfo, sideIsWhite) {
  const sign = sideIsWhite ? 1 : -1;
  if (lineInfo.mate !== null) {
    const mate = lineInfo.mate * sign;
    return (mate > 0 ? "#+" : "#") + mate;
  }
  const value = (lineInfo.scoreCp * sign) / 100;
  return (value > 0 ? "+" : "") + value.toFixed(2);
}
