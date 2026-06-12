/* coach.js — génération heuristique d'arguments POUR / CONTRE pour chaque coup
   candidat, à partir de chess.js (légalité, attaques) et des lignes MultiPV. */
"use strict";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_NAMES = { p: "le pion", n: "le cavalier", b: "le fou", r: "la tour", q: "la dame", k: "le roi" };
const CENTER_SQUARES = ["e4", "d4", "e5", "d5"];
const INITIAL_SQUARES = {
  w: { n: ["b1", "g1"], b: ["c1", "f1"], r: ["a1", "h1"], q: ["d1"] },
  b: { n: ["b8", "g8"], b: ["c8", "f8"], r: ["a8", "h8"], q: ["d8"] },
};

function sqRC(sq) { return { c: sq.charCodeAt(0) - 97, r: 8 - parseInt(sq[1], 10) }; }
function rcSq(r, c) { return String.fromCharCode(97 + c) + (8 - r); }
function inBoard(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

/* Toutes les pièces de couleur byColor qui attaquent la case `square`
   (indépendamment du trait et des clouages — détection géométrique). */
function attackersOf(chess, square, byColor) {
  const board = chess.board();
  const { r, c } = sqRC(square);
  const out = [];
  const push = (pr, pc) => {
    const p = board[pr][pc];
    out.push({ type: p.type, from: rcSq(pr, pc), value: PIECE_VALUES[p.type] });
  };
  // Pions
  const pr = byColor === "w" ? r + 1 : r - 1;
  for (const pc of [c - 1, c + 1]) {
    if (inBoard(pr, pc)) {
      const p = board[pr][pc];
      if (p && p.color === byColor && p.type === "p") push(pr, pc);
    }
  }
  // Cavaliers
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nr = r + dr, nc = c + dc;
    if (inBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === "n") push(nr, nc);
    }
  }
  // Roi
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nr = r + dr, nc = c + dc;
    if (inBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === "k") push(nr, nc);
    }
  }
  // Glisseurs
  const rays = [
    { dirs: [[-1,0],[1,0],[0,-1],[0,1]], types: ["r", "q"] },
    { dirs: [[-1,-1],[-1,1],[1,-1],[1,1]], types: ["b", "q"] },
  ];
  for (const { dirs, types } of rays) {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (inBoard(nr, nc)) {
        const p = board[nr][nc];
        if (p) {
          if (p.color === byColor && types.includes(p.type)) push(nr, nc);
          break;
        }
        nr += dr; nc += dc;
      }
    }
  }
  return out;
}

/* Pièce en prise : attaquants > 0 et (aucun défenseur OU l'attaquant le moins
   cher vaut moins que la pièce). Approximation SEE simple. */
function isHanging(chess, square, pieceType, pieceColor) {
  const enemy = pieceColor === "w" ? "b" : "w";
  const atk = attackersOf(chess, square, enemy);
  if (atk.length === 0) return false;
  const def = attackersOf(chess, square, pieceColor);
  if (def.length === 0) return true;
  const minAtk = Math.min(...atk.map((a) => a.value));
  return minAtk < PIECE_VALUES[pieceType];
}

function materialOf(chess, color) {
  let total = 0;
  for (const row of chess.board()) for (const p of row) {
    if (p && p.color === color) total += PIECE_VALUES[p.type];
  }
  return total;
}

/* Delta matériel pour `color` après `plies` demi-coups de la PV. */
function pvMaterialDelta(fen, pv, plies, color) {
  const c = new Chess(fen);
  const before = materialOf(c, color) - materialOf(c, color === "w" ? "b" : "w");
  for (let i = 0; i < Math.min(plies, pv.length); i++) {
    const mv = uciToMoveObj(pv[i]);
    if (!c.move(mv)) break;
  }
  const after = materialOf(c, color) - materialOf(c, color === "w" ? "b" : "w");
  return after - before;
}

function uciToMoveObj(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined };
}

function isPassedPawn(chess, square, color) {
  const board = chess.board();
  const { r, c } = sqRC(square);
  const dir = color === "w" ? -1 : 1;
  for (let nr = r + dir; inBoard(nr, 0); nr += dir) {
    for (const nc of [c - 1, c, c + 1]) {
      if (!inBoard(nr, nc)) continue;
      const p = board[nr][nc];
      if (p && p.type === "p" && p.color !== color) return false;
    }
  }
  return true;
}

function fileIsOpenFor(chess, file, color) {
  const board = chess.board();
  const c = file.charCodeAt(0) - 97;
  for (let r = 0; r < 8; r++) {
    const p = board[r][c];
    if (p && p.type === "p" && p.color === color) return false;
  }
  return true;
}

/* ── Génération des arguments ──────────────────────────────────────────────
   fenBefore : position avant le coup (trait au joueur)
   line      : { pv, scoreCp, mate } (score côté trait = côté joueur)
   bestLine  : ligne multipv 1
   history   : liste de FEN (4 premiers champs) déjà vues             */
function buildArguments(fenBefore, line, bestLine, history) {
  const pros = [];
  const cons = [];
  const uci = line.pv[0];
  const before = new Chess(fenBefore);
  const color = before.turn();
  const moveObj = uciToMoveObj(uci);
  const verbose = before.moves({ verbose: true }).find(
    (m) => m.from === moveObj.from && m.to === moveObj.to &&
           (!moveObj.promotion || m.promotion === moveObj.promotion)
  );
  if (!verbose) return { san: uci, pros, cons };

  const after = new Chess(fenBefore);
  const played = after.move(moveObj);
  const san = played ? played.san : uci;
  const deltaCp = scoreValue(bestLine) - scoreValue(line); // perte vs meilleur (≥0)
  const evalTxt = formatScore(line, color === "w");

  /* ---------- POUR ---------- */
  if (line.mate !== null && line.mate > 0) {
    pros.push(line.mate === 1 ? "Mat immédiat !" : `Mat forcé en ${line.mate} coups`);
  }
  if (deltaCp <= 5) pros.push(`Meilleur coup selon le moteur (éval ${evalTxt})`);
  else if (line.scoreCp !== null && line.scoreCp > 50) pros.push(`Garde un bon avantage (éval ${evalTxt})`);

  if (after.in_checkmate()) { /* déjà couvert par mate */ }
  else if (after.in_check()) pros.push("Donne échec : force la réponse adverse");

  // Gain de matériel net sur la suite forcée (4 demi-coups)
  const matDelta = pvMaterialDelta(fenBefore, line.pv, 4, color);
  if (matDelta >= 1) pros.push(`Gagne du matériel sur la suite (+${matDelta} point${matDelta > 1 ? "s" : ""})`);

  if (verbose.flags.includes("k") || verbose.flags.includes("q")) {
    pros.push("Roque : met le roi en sécurité et connecte les tours");
  }
  // Développement
  const init = INITIAL_SQUARES[color][verbose.piece];
  if (init && init.includes(verbose.from) && ["n", "b"].includes(verbose.piece)) {
    pros.push(`Développe ${PIECE_NAMES[verbose.piece]} vers le jeu`);
  }
  // Centre
  if (CENTER_SQUARES.includes(verbose.to)) {
    pros.push("Occupe une case centrale (contrôle du centre)");
  } else if (verbose.piece === "p" && ["c", "d", "e", "f"].includes(verbose.to[0])) {
    const ctrl = CENTER_SQUARES.some((cs) => {
      const a = sqRC(verbose.to), b = sqRC(cs);
      return Math.abs(a.c - b.c) === 1 && (color === "w" ? b.r === a.r - 1 : b.r === a.r + 1);
    });
    if (ctrl) pros.push("Soutient le centre");
  }
  // Menace : notre coup suivant dans la PV est une capture
  if (line.pv.length >= 3) {
    const c2 = new Chess(fenBefore);
    c2.move(uciToMoveObj(line.pv[0]));
    c2.move(uciToMoveObj(line.pv[1]));
    const next = c2.moves({ verbose: true }).find((m) => m.from === line.pv[2].slice(0, 2) && m.to === line.pv[2].slice(2, 4));
    if (next && next.captured) {
      pros.push(`Crée une menace : ${PIECE_NAMES[next.captured]} adverse en ${next.to} est visé ensuite`);
    }
  }
  // Attaque une pièce adverse mal défendue
  const enemyColor = color === "w" ? "b" : "w";
  const boardAfter = after.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = boardAfter[r][c];
    if (p && p.color === enemyColor && p.type !== "k") {
      const sq = rcSq(r, c);
      const atkUs = attackersOf(after, sq, color);
      if (atkUs.some((a) => a.from === verbose.to) && isHanging(after, sq, p.type, enemyColor)) {
        pros.push(`Attaque ${PIECE_NAMES[p.type]} mal défendu en ${sq}`);
      }
    }
  }
  // Pion passé
  if (verbose.piece === "p" && isPassedPawn(after, verbose.to, color)) {
    pros.push(`Crée ou avance un pion passé en ${verbose.to}`);
  }
  // Ouverture de colonne par capture de pion
  if (verbose.piece === "p" && verbose.captured && fileIsOpenFor(after, verbose.from[0], color)) {
    pros.push(`Ouvre la colonne ${verbose.from[0]} pour les tours`);
  }
  if (verbose.captured && matDelta >= 0 && !pros.some((s) => s.startsWith("Gagne"))) {
    pros.push(`Capture ${PIECE_NAMES[verbose.captured]} sans perte nette`);
  }

  /* ---------- CONTRE ---------- */
  if (line.mate !== null && line.mate < 0) {
    cons.push(`Se fait mater de force en ${-line.mate} coups !`);
  }
  if (deltaCp > 5) {
    cons.push(`Perd ${(deltaCp / 100).toFixed(2)} point d'éval vs le meilleur coup`);
  }
  if (matDelta <= -1) {
    cons.push(`Perd du matériel sur la suite (${matDelta} point${matDelta < -1 ? "s" : ""})`);
  }
  // Pièces en prise après le coup (côté joueur)
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = boardAfter[r][c];
    if (p && p.color === color && p.type !== "k" && p.type !== "p") {
      const sq = rcSq(r, c);
      if (isHanging(after, sq, p.type, color)) {
        cons.push(`Laisse ${PIECE_NAMES[p.type]} en prise en ${sq}`);
      }
    }
  }
  // Affaiblit le roi : pion f/g/h bougé du côté du roi
  if (verbose.piece === "p") {
    const kingSq = findKing(after, color);
    if (kingSq && ["f", "g", "h"].includes(verbose.from[0]) && kingSq[0] >= "e") {
      cons.push("Affaiblit la structure de pions devant le roi");
    } else if (kingSq && ["a", "b", "c"].includes(verbose.from[0]) && kingSq[0] <= "d") {
      cons.push("Affaiblit la structure de pions devant le roi");
    }
  }
  // Pièce qui recule
  if (["n", "b", "q", "r"].includes(verbose.piece)) {
    const fr = parseInt(verbose.from[1], 10), tr = parseInt(verbose.to[1], 10);
    if ((color === "w" && tr < fr) || (color === "b" && tr > fr)) {
      cons.push("Recule une pièce : perte de temps possible");
    }
  }
  // Cavalier au bord
  if (verbose.piece === "n" && ["a", "h"].includes(verbose.to[0])) {
    cons.push("Cavalier au bord de l'échiquier : rayon d'action réduit");
  }
  // Bloque le développement (pièce devant un pion c2/d2/e2 non poussé)
  const blockSquares = color === "w" ? ["d3", "e3"] : ["d6", "e6"];
  const pawnHomes = color === "w" ? ["d2", "e2"] : ["d7", "e7"];
  const bi = blockSquares.indexOf(verbose.to);
  if (bi >= 0 && verbose.piece !== "p") {
    const home = after.get(pawnHomes[bi]);
    if (home && home.type === "p" && home.color === color) {
      cons.push("Bloque un pion central et freine le développement");
    }
  }
  // Répétition
  if (history) {
    const key = after.fen().split(" ").slice(0, 4).join(" ");
    if (history.filter((h) => h === key).length >= 1) {
      cons.push("Répète une position déjà vue");
    }
  }
  if (line.scoreCp !== null && line.scoreCp < -100 && line.mate === null) {
    cons.push(`Position défavorable après ce coup (éval ${evalTxt})`);
  }

  return { san, pros: dedup(pros), cons: dedup(cons) };
}

/* ── SAN français (K→R, Q→D, R→T, B→F, N→C) ── */
function sanFr(san) {
  return String(san).replace(/[KQRBN]/g, (c) => ({ K: "R", Q: "D", R: "T", B: "F", N: "C" }[c]));
}

function lcFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

/* ── Comparaison candidat A vs candidat suivant B du classement ──
   Retourne une phrase "Mieux que <B> (+Δ) : <argument concret>". */
function buildComparison(candA, candB) {
  if (!candB) return null;
  const deltaCp = scoreValue(candA.line) - scoreValue(candB.line);
  const delta = (Math.max(0, deltaCp) / 100).toFixed(2);
  // Arguments que A possède et pas B (hors phrases purement liées à l'éval)
  const generic = (s) => /^(Meilleur coup|Garde un bon avantage)/.test(s);
  const aOnly = candA.args.pros.filter((p) => !candB.args.pros.includes(p) && !generic(p));
  // Défauts de B que A n'a pas
  const bCons = candB.args.cons.filter((c) => !candA.args.cons.includes(c) && !/^Perd \d/.test(c) && !c.startsWith("Perd 0") && !/point d'éval/.test(c));
  let why;
  if (aOnly.length) why = lcFirst(aOnly[0]);
  else if (bCons.length) why = "évite : " + lcFirst(bCons[0]);
  else why = "légèrement mieux évalué par le moteur";
  return `Mieux que ${sanFr(candB.san)} (+${delta}) : ${why}`;
}

/* ── Riposte adverse attendue à partir de la PV du candidat ──
   pv[0] = notre coup, pv[1] = riposte adverse. Analyse la position après
   pv[0]+pv[1] : échec, capture, fourchette, pièce menacée, centre, matériel.
   Retourne { san, text, punish } ou null. */
function buildReplyInfo(fenBefore, pv) {
  if (!pv || pv.length < 1) return null;
  const c = new Chess(fenBefore);
  const color = c.turn();
  const enemy = color === "w" ? "b" : "w";
  const m0 = c.move(uciToMoveObj(pv[0]));
  if (!m0) return null;
  if (pv.length < 2 || c.game_over()) return null;
  const m1 = c.move(uciToMoveObj(pv[1]));
  if (!m1) return null;
  // Affichage : "…Cf6" si l'adversaire est Noir, "Cf3" sinon
  const replySan = (color === "w" ? "…" : "") + sanFr(m1.san);

  const conseq = [];
  if (c.in_checkmate()) conseq.push("mat !");
  else if (c.in_check()) conseq.push("donne échec");
  if (m1.captured) conseq.push(`prend ${PIECE_NAMES[m1.captured]} en ${m1.to}`);

  // Fourchette / menace : la pièce arrivée en m1.to attaque nos pièces
  const board = c.board();
  const targets = [];
  for (let r = 0; r < 8; r++) for (let cc = 0; cc < 8; cc++) {
    const p = board[r][cc];
    if (p && p.color === color && p.type !== "p") {
      const sq = rcSq(r, cc);
      const atk = attackersOf(c, sq, enemy);
      if (atk.some((a) => a.from === m1.to)) {
        targets.push({ sq, type: p.type, hang: p.type !== "k" && isHanging(c, sq, p.type, color) });
      }
    }
  }
  if (targets.length >= 2) {
    conseq.push(`fourchette sur ${targets.map((t) => `${PIECE_NAMES[t.type]} ${t.sq}`).join(" et ")}`);
  } else {
    const h = targets.find((t) => t.hang);
    if (h) conseq.push(`menace ${PIECE_NAMES[h.type]} en ${h.sq} (mal défendu)`);
  }
  // Pression : pion adverse qui prend ou contrôle le centre
  if (!conseq.length && m1.piece === "p" && CENTER_SQUARES.includes(m1.to)) {
    conseq.push("prend le centre");
  }
  // Gain de matériel adverse dans la suite de la PV (6 demi-coups)
  const matD = pvMaterialDelta(fenBefore, pv, 6, color);
  if (matD <= -1) conseq.push(`gagne du matériel sur la suite (${matD} pour toi)`);
  // Pression sur colonne ouverte vers notre roi
  if (!conseq.length && ["r", "q"].includes(m1.piece)) {
    const kingSq = findKing(c, color);
    if (kingSq && kingSq[0] === m1.to[0] && fileIsOpenFor(c, m1.to[0], enemy)) {
      conseq.push(`pression sur la colonne ${m1.to[0]} vers ton roi`);
    }
  }

  const text = conseq.length
    ? `${replySan}, puis ${dedup(conseq).join(", ")}`
    : `${replySan} (position équilibrée)`;
  const punish = conseq.length ? dedup(conseq).join(", ") : null;
  return { san: replySan, text, punish };
}

function findKing(chess, color) {
  const board = chess.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p && p.type === "k" && p.color === color) return rcSq(r, c);
  }
  return null;
}

function dedup(arr) { return [...new Set(arr)]; }

/* ── Décomposition heuristique de l'évaluation ─────────────────────────────
   evalBreakdown(fenAfter, povColor) → composantes en PIONS du point de vue
   de povColor : { materiel, roi, activite, centre, structure }.
   NOTE: Stockfish NNUE ne publie pas sa décomposition — ceci est une
   ESTIMATION heuristique déterministe. Le "reste" (dynamique) est calculé
   par l'appelant : évalTotale − somme(composantes).
   Valeurs matérielles en centipawns : 100/320/330/500/900. */
const CP_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evalBreakdown(fenAfter, povColor) {
  const chess = new Chess(fenAfter);
  const board = chess.board();

  function sideScore(col) {
    let mat = 0, roi = 0, act = 0, centre = 0, struct = 0;
    const pawnFiles = {};
    let kingSq = null;
    for (let r = 0; r < 8; r++) for (let cc = 0; cc < 8; cc++) {
      const p = board[r][cc];
      if (!p || p.color !== col) continue;
      const sq = rcSq(r, cc);
      mat += CP_VALUES[p.type];
      if (p.type === "k") kingSq = sq;
      if (p.type === "p") {
        (pawnFiles[sq[0]] = pawnFiles[sq[0]] || []).push(sq);
        if (isPassedPawn(chess, sq, col)) struct += 20; // pion passé
      }
      // Activité / développement : pièces mineures sorties de leur case initiale
      if (["n", "b"].includes(p.type)) {
        const init = INITIAL_SQUARES[col][p.type];
        if (init && !init.includes(sq)) act += 15;
      }
      // Occupation du centre
      if (CENTER_SQUARES.includes(sq)) centre += 15;
    }
    // Contrôle du centre (attaques sur e4/d4/e5/d5)
    for (const cs of CENTER_SQUARES) centre += attackersOf(chess, cs, col).length * 5;
    // Structure : pions doublés / isolés
    for (const f of Object.keys(pawnFiles)) {
      const n = pawnFiles[f].length;
      if (n > 1) struct -= 15 * (n - 1); // doublés
      const fi = f.charCodeAt(0);
      const hasAdj = [String.fromCharCode(fi - 1), String.fromCharCode(fi + 1)]
        .some((a) => pawnFiles[a] && pawnFiles[a].length);
      if (!hasAdj) struct -= 15 * n; // isolés
    }
    // Sécurité du roi : pions boucliers manquants (3 colonnes devant le roi)
    if (kingSq) {
      const { r, c: kc } = sqRC(kingSq);
      const dir = col === "w" ? -1 : 1;
      for (const nc of [kc - 1, kc, kc + 1]) {
        if (nc < 0 || nc > 7) continue;
        let shielded = false;
        for (const dist of [1, 2]) {
          const nr = r + dir * dist;
          if (!inBoard(nr, nc)) continue;
          const p = board[nr][nc];
          if (p && p.type === "p" && p.color === col) { shielded = true; break; }
        }
        if (!shielded) roi -= 20;
      }
    }
    // Échec subi
    if (chess.turn() === col && chess.in_check()) roi -= 50;
    return { mat, roi, act, centre, struct };
  }

  const us = sideScore(povColor);
  const them = sideScore(povColor === "w" ? "b" : "w");
  return {
    materiel: (us.mat - them.mat) / 100,
    roi: (us.roi - them.roi) / 100,
    activite: (us.act - them.act) / 100,
    centre: (us.centre - them.centre) / 100,
    structure: (us.struct - them.struct) / 100,
  };
}
