/* Extract legal study positions from completed engine games stored on this device. */
(function (root) {
  "use strict";

  function buildEngineGameEntries(games, ChessCtor) {
    if (typeof ChessCtor !== "function") throw new TypeError("Un constructeur Chess est requis.");
    const entries = [];
    for (const game of Array.isArray(games) ? games : []) {
      if (!game || game.abandoned || game.stopped || !["1-0", "0-1", "1/2-1/2"].includes(game.result) || typeof game.pgn !== "string") continue;
      const opponentTag = game.pgn.match(/^\[SupaChessOpponent\s+"([^"]+)"\]/mi);
      const engineName = String(game.engineName || opponentTag?.[1] || "");
      const selfPlay = game.selfPlayMode === "supa-vs-supa";
      if (!selfPlay && !/stockfish|berserk/i.test(engineName)) continue;

      const parsed = new ChessCtor();
      if (parsed.load_pgn(game.pgn) === false) continue;
      const history = parsed.history({ verbose: true });
      if (!history.length) continue;

      const replay = new ChessCtor();
      const gameId = String(game.gameNumber || game.id || "partie").replace(/[^a-z0-9-]/gi, "-");
      for (let index = 0; index < history.length; index += 1) {
        const move = history[index];
        const fen = replay.fen();
        const applied = replay.move(move.san);
        if (!applied) break;
        const ply = index + 1;
        const side = move.color === "w" ? "Blancs" : "Noirs";
        const gameNumber = game.gameNumber || game.id || "?";
        const sourceLabel = selfPlay
          ? "Partie Supa contre Supa n°" + gameNumber
          : "Partie contre " + engineName + " n°" + gameNumber;
        entries.push({
          key: (selfPlay ? "selfplay:" : "engine-game:") + gameId + ":" + ply + ":" + fen.split(" ").slice(0, 4).join("_"),
          id: (selfPlay ? "selfplay-" : "engine-game-") + gameId + "-" + ply,
          kind: selfPlay ? "selfplay" : "engine-game",
          title: (selfPlay ? "Auto-jeu" : "Partie moteur") + " · partie n°" + gameNumber + " · " + side + " " + applied.san,
          theme: engineName || "Supa contre Supa",
          level: "Avancé",
          fen: fen,
          expectedUci: move.from + move.to + (move.promotion || ""),
          playedSan: applied.san,
          sourceGameId: String(game.id || ""),
          sourceGameNumber: Number(game.gameNumber) || null,
          sourcePly: ply,
          sourceEngineName: engineName || "Supa contre Supa",
          sourceLabel: sourceLabel,
          sourceResult: game.result
        });
      }
    }
    return entries;
  }

  function formatPgn(chess, metadata, result) {
    const escapeTag = (value) => String(value || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/[\r\n]/g, " ");
    const history = chess.history({ verbose: true });
    const now = metadata.date instanceof Date ? metadata.date : new Date(metadata.date || Date.now());
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join(".");
    const tags = [
      ["Event", "SupaChess · partie d’étude moteur"], ["Site", "SupaChess"], ["Date", date],
      ["Round", String(metadata.gameNumber || "-")], ["White", metadata.white], ["Black", metadata.black],
      ["Result", result], ["SupaChessGameNumber", metadata.gameNumber || "-"],
      ["SupaChessOpponent", metadata.engineName], ["SupaChessSelfPlayMode", "supa-vs-supa"],
      ["Termination", metadata.termination || "Partie terminée"]
    ].map(([name, value]) => `[${name} "${escapeTag(value)}"]`).join("\n");
    const tokens = [];
    history.forEach((move, index) => {
      if (move.color === "w") tokens.push(Math.floor(index / 2) + 1 + ".", move.san);
      else if (index === 0) tokens.push("1...", move.san);
      else tokens.push(move.san);
    });
    tokens.push(result);
    let body = "";
    for (const token of tokens) {
      const next = body ? body + " " + token : token;
      if (next.length > 80 && body) body += "\n" + token;
      else body = next;
    }
    return tags + "\n\n" + body;
  }

  function storeGeneratedEngineGame(options) {
    const storage = options.storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) throw new Error("Le stockage local n’est pas disponible.");
    const ChessCtor = options.ChessCtor;
    if (typeof ChessCtor !== "function" || !options.chess) throw new TypeError("La partie et le validateur PGN sont requis.");
    const result = options.result;
    if (!["1-0", "0-1", "1/2-1/2"].includes(result)) throw new Error("Le résultat de la partie n’est pas finalisé.");
    const key = "supachess_games";
    let games = [];
    try { const parsed = JSON.parse(storage.getItem(key) || "[]"); games = Array.isArray(parsed) ? parsed : []; } catch (_) {}
    const sequenceKey = "supachess_game_sequence_v1";
    let sequence = 0;
    try { sequence = Math.max(0, Math.floor(Number(storage.getItem(sequenceKey)) || 0)); } catch (_) {}
    const maxNumber = games.reduce((max, game) => Math.max(max, Number(game && game.gameNumber) || 0), 0);
    const gameNumber = Math.max(sequence, maxNumber) + 1;
    const id = "engine-study-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const date = options.date instanceof Date ? options.date : new Date(options.date || Date.now());
    const meta = {
      date, gameNumber, white: options.white, black: options.black,
      engineName: options.engineName, termination: options.termination
    };
    const pgn = formatPgn(options.chess, meta, result);
    const verifier = new ChessCtor();
    if (verifier.load_pgn(pgn) === false || verifier.history().length !== options.chess.history().length) {
      throw new Error("La validation PGN a échoué; la partie n’a pas été enregistrée.");
    }
    const entry = {
      id, gameNumber, date: date.toISOString(), pgn, result,
      selfPlayMode: "supa-vs-supa", engineName: "Supa contre Supa · " + options.engineName,
      playerName: "Supa Blancs · Supa Noirs", stopped: false, abandoned: false,
      unassistedMode: true, trainingAidsUsed: false, diagnosticMode: false,
      generatedStudyGame: true, termination: options.termination || "Partie terminée"
    };
    games.unshift(entry);
    try {
      storage.setItem(key, JSON.stringify(games));
      storage.setItem(sequenceKey, String(gameNumber));
    } catch (error) {
      throw new Error("La partie est légale, mais le stockage local a échoué : " + (error.message || error));
    }
    return entry;
  }

  const api = { buildEngineGameEntries, formatPgn, storeGeneratedEngineGame };
  root.SupaSelfPlayStudy = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
