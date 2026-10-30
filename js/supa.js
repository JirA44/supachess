/* supa.js — enrichissement IA du coach via le serveur local Supa (port 8778).
   Tout est best-effort : si le serveur est absent, rien ne casse. */
"use strict";

const SUPA_BASE = "http://localhost:8778";
const SUPA_FETCH_TIMEOUT_MS = 150000; // budget total /coach (nemotron free peut être lent; cache serveur ensuite)

const supaState = { online: false, model: null, lastFen: null };

function supaFetch(url, options = {}, timeoutMs = SUPA_FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

function setSupaConnection(online, model) {
  supaState.online = online;
  const el = document.getElementById("supa-label");
  const dot = document.getElementById("supa-dot");
  if (el) el.textContent = online
    ? "Coach Supa local : connecté" + (model ? " (" + model + ")" : "")
    : "Coach Supa local : indisponible";
  if (dot) dot.className = online ? "status-dot ready" : "status-dot";
}

/* Appelé quand le panneau coach s'ouvre. Enrichit chaque carte candidat
   avec une section "🤖 Supa" quand la réponse arrive. */
async function supaEnrichCoach(fen, playedSan, candidates) {
  const payload = {
    fen,
    played_move: playedSan,
    candidates: candidates.map((c) => ({
      move: c.san,
      rank: c.rank,
      eval: formatScore(c.line, fen.split(" ")[1] === "w"),
      pv: c.line.pv.slice(0, 8).join(" "),
    })),
  };
  let resp;
  try {
    const r = await supaFetch(SUPA_BASE + "/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, SUPA_FETCH_TIMEOUT_MS);
    if (!r.ok) throw new Error("Coach local HTTP " + r.status);
    resp = await r.json();
  } catch (_e) {
    setSupaConnection(false);
    return; // serveur absent / timeout → on garde les heuristiques
  }
  setSupaConnection(true, resp && resp.source);
  if (!resp || !resp.comments) return;
  // Le panneau a peut-être changé de position entre temps
  if (supaState.lastFen !== fen) return;
  const panel = document.getElementById("coach-ranking");
  if (!panel) return;
  const escFn = typeof esc === "function" ? esc : (s) => String(s);
  for (const card of panel.querySelectorAll(".cand[data-san]")) {
    const san = card.dataset.san;
    const cm = resp.comments[san];
    if (!cm || card.querySelector(".supa-section")) continue;
    const div = document.createElement("div");
    div.className = "supa-section";
    const pour = (cm.pour || []).map((a) => `<div class="arg-pro">🤖 ${escFn(a)}</div>`).join("");
    const contre = (cm.contre || []).map((a) => `<div class="arg-con">🤖 ${escFn(a)}</div>`).join("");
    div.innerHTML = `<div class="supa-head">🤖 Supa <span class="supa-model">${escFn(resp.source || "")}</span></div>` +
      (cm.resume ? `<div class="supa-resume">${escFn(cm.resume)}</div>` : "") + pour + contre;
    card.appendChild(div);
  }
}

