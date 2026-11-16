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

  const api = { buildEngineGameEntries };
  root.SupaSelfPlayStudy = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);

