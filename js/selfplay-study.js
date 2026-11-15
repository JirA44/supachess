/* Extract legal study positions from completed Supa-vs-Supa games. */
(function (root) {
  "use strict";

  function buildSelfPlayEntries(games, ChessCtor) {
    if (typeof ChessCtor !== "function") throw new TypeError("Un constructeur Chess est requis.");
    const entries = [];
    for (const game of Array.isArray(games) ? games : []) {
      if (!game || game.selfPlayMode !== "supa-vs-supa" || game.abandoned || game.stopped ||
          !["1-0", "0-1", "1/2-1/2"].includes(game.result) || typeof game.pgn !== "string") continue;

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
        entries.push({
          key: "selfplay:" + gameId + ":" + ply + ":" + fen.split(" ").slice(0, 4).join("_"),
          id: "selfplay-" + gameId + "-" + ply,
          kind: "selfplay",
          title: "Auto-jeu · partie n°" + (game.gameNumber || game.id || "?") + " · " + side + " " + applied.san,
          theme: String(game.engineName || "Supa contre Supa"),
          level: "Avancé",
          fen: fen,
          expectedUci: move.from + move.to + (move.promotion || ""),
          playedSan: applied.san,
          sourceGameId: String(game.id || ""),
          sourceGameNumber: Number(game.gameNumber) || null,
          sourcePly: ply,
          sourceEngineName: String(game.engineName || "Supa contre Supa"),
          sourceResult: game.result
        });
      }
    }
    return entries;
  }

  const api = { buildSelfPlayEntries };
  root.SupaSelfPlayStudy = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);

