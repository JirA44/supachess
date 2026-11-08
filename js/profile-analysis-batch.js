/* Runs a user-requested profile analysis queue with the local Stockfish reviewer. */
"use strict";
(() => {
  const QUEUE_KEY = "supachess_profile_analysis_batch_v1";
  const RESULT_KEY = "supachess_profile_analysis_batch_result_v1";
  let started = false;

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "null"); }
    catch (_) { return null; }
  }
  function saveQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }
    catch (_) {}
  }
  function setProgress(message) {
    const target = document.getElementById("review-progress") || document.getElementById("review-history-status");
    if (target) target.textContent = message;
  }
  function safelyReturnToProfile(url, token) {
    try {
      const target = new URL(url || "https://jira44.github.io/supachess-web/PLAYER_ANALYSIS.html", location.href);
      if (target.hostname !== "jira44.github.io" || target.pathname !== "/supachess-web/PLAYER_ANALYSIS.html") {
        target.href = "https://jira44.github.io/supachess-web/PLAYER_ANALYSIS.html";
      }
      target.searchParams.set("analysis-batch", token || "complete");
      location.replace(target.href);
    } catch (_) {
      location.replace("https://jira44.github.io/supachess-web/PLAYER_ANALYSIS.html?analysis-batch=complete");
    }
  }
  async function run() {
    if (started || document.body.dataset.engineReady !== "1" || typeof window.reviewRunBatch !== "function") return;
    const batch = readQueue();
    if (!batch || !Array.isArray(batch.items) || !["queued", "running"].includes(batch.status)) return;
    started = true;
    batch.status = "running";
    batch.startedAt = batch.startedAt || new Date().toISOString();
    saveQueue(batch);
    const startIndex = Math.max(0, Math.min(batch.items.length, Number(batch.nextIndex) || 0));
    const remaining = batch.items.slice(startIndex);
    setProgress("Analyse du profil · préparation de " + remaining.length + " partie(s) avec Stockfish local…");
    try {
      const results = await window.reviewRunBatch(remaining, (progress) => {
        const current = startIndex + progress.index;
        batch.nextIndex = startIndex + progress.index - 1;
        batch.current = current;
        batch.total = batch.items.length;
        saveQueue(batch);
        setProgress("Analyse du profil · partie " + current + "/" + batch.items.length +
          " · " + (progress.item.headers?.White || "Blancs") + " — " + (progress.item.headers?.Black || "Noirs"));
      }, async (outcome) => {
        if (outcome.completed) {
          batch.nextIndex = startIndex + outcome.index;
          batch.completed = (Number(batch.completed) || 0) + 1;
          saveQueue(batch);
          setProgress("Analyse du profil · " + batch.completed + "/" + batch.items.length + " partie(s) terminée(s).");
        } else {
          batch.status = "failed";
          batch.failedGame = startIndex + outcome.index;
          saveQueue(batch);
        }
      });
      const failed = results.some((result) => !result.completed);
      batch.status = failed ? "failed" : "completed";
      batch.nextIndex = startIndex + results.filter((result) => result.completed).length;
      batch.completed = batch.nextIndex;
      batch.finishedAt = new Date().toISOString();
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify({
          token: batch.token, status: batch.status, total: batch.items.length,
          completed: batch.completed, failedGame: batch.failedGame || null,
          gameIds: batch.items.slice(0, batch.nextIndex).map((item) => item.headers && item.headers.SupaChessSourceGameId).filter(Boolean),
          finishedAt: batch.finishedAt
        }));
        localStorage.removeItem(QUEUE_KEY);
      } catch (_) {}
      setProgress(failed
        ? "Analyse interrompue à la partie " + (batch.failedGame || (batch.completed + 1)) + "/" + batch.items.length + ". Les parties terminées sont enregistrées."
        : "Analyse terminée · " + batch.completed + " partie(s) ajoutée(s) au profil.");
      safelyReturnToProfile(batch.returnUrl, batch.token);
    } catch (error) {
      batch.status = "failed";
      batch.error = String(error && error.message || error);
      batch.finishedAt = new Date().toISOString();
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify({
          token: batch.token, status: "failed", total: batch.items.length,
          completed: Number(batch.completed) || 0,
          gameIds: batch.items.slice(0, batch.nextIndex).map((item) => item.headers && item.headers.SupaChessSourceGameId).filter(Boolean),
          error: batch.error, finishedAt: batch.finishedAt
        }));
        localStorage.removeItem(QUEUE_KEY);
      } catch (_) {}
      setProgress("Analyse interrompue : " + batch.error);
      safelyReturnToProfile(batch.returnUrl, batch.token);
    }
  }
  document.addEventListener("supachess:engine-ready", run);
  if (document.body && document.body.dataset.engineReady === "1") setTimeout(run, 0);
})();
