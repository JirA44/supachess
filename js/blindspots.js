/* SupaChess: evidence-based tactical blind-spot detection.
   Works with chess.js 0.13.x, never claims a forced material loss solely
   from an attacked square. An immediate legal capture is demonstrable. */
"use strict";

const ChessBlindspots = (() => {
  const names = { p:"pion",n:"cavalier",b:"fou",r:"tour",q:"dame",k:"roi" };
  const worth = {p:1,n:3,b:3,r:5,q:9,k:100};
  const other = c => c === "w" ? "b" : "w";
  const legalCaptures = (chess, victimColor) =>
    chess.moves({verbose:true}).filter(m => m.captured && m.color === other(victimColor));

  function tacticalMisses(beforeFen, playedUci, opts = {}) {
    const game = new Chess(beforeFen);
    const side = game.turn();
    const from = playedUci.slice(0,2), to = playedUci.slice(2,4);
    const promotion = playedUci.length === 5 ? playedUci[4] : undefined;
    const legal = game.moves({verbose:true}).find(m =>
      m.from===from && m.to===to && (!m.promotion || m.promotion===promotion));
    if (!legal) return {status:"INVALID_MOVE",facts:[],diagnostics:[]};
    const previous = new Chess(beforeFen);
    const oldLegal = previous.moves({verbose:true});
    const result = game.move({from,to,promotion});
    if (!result) return {status:"INVALID_MOVE",facts:[],diagnostics:[]};
    const now = legalCaptures(game,side);
    const facts = [];
    for (const move of now) {
      const victim = game.get(move.to);
      if (!victim || victim.color!==side || victim.type==="k") continue;
      const existedBefore = oldLegal.some(m => m.from===move.from && m.to===move.to &&
        m.color===other(side) && m.captured);
      // Must never claim the loss is forced; defended captures can be bad.
      facts.push({
        id:"LEGAL_CAPTURE_NEXT_PLY",square:move.to,from:move.from,
        piece:victim.type,attacker:move.piece,
        captureSan:move.san,materialPoints:worth[victim.type],
        newlyExposed: !existedBefore,
        fenAfter:game.fen()
      });
    }
    const seen = new Set();
    const diagnostics = [];
    for (const fact of facts.filter(f=>f.newlyExposed).sort((a,b)=>b.materialPoints-a.materialPoints)) {
      if (seen.has(fact.square)) continue;
      seen.add(fact.square);
      const significant = Number.isFinite(opts.lossCp) && opts.lossCp>=60;
      diagnostics.push({
        code:"PIECE_IN_PRİSE_ONE_MOVE".replace("İ","I"),
        square:fact.square,
        move:result.san,
        severity:significant?"erreur_probable":"attention",
        evidence:"CAPTURE_LEGALE_IMMEDIATE",
        text:`Après ${result.san}, ta ${names[fact.piece]} en ${fact.square} pouvait être prise immédiatement par ${fact.captureSan}. Avais-tu vérifié cette capture adverse avant de jouer ?`,
        caveat:"La capture est légale, mais cela ne prouve pas une perte nette de matériel : vérifier les échanges et l'analyse moteur.",
        suggestedHabit:"Avant chaque coup : quels sont les échecs, prises et menaces adverses ?"
      });
    }
    return {status:"OK",move:result.san,fenAfter:game.fen(),facts,diagnostics};
  }

  function analyzePgn(pgn, options={}) {
    const chess = new Chess();
    if (!chess.load_pgn(pgn,{sloppy:true})) throw new Error("PGN invalide");
    const headers = chess.header();
    const moves=chess.history({verbose:true});
    const replay=headers.FEN?new Chess(headers.FEN):new Chess();
    const reports=[];
    for (let i=0;i<moves.length;i++) {
      const m=moves[i], fen=replay.fen();
      const res=tacticalMisses(fen,m.from+m.to+(m.promotion||""),{
        lossCp:Array.isArray(options.lossCp)?options.lossCp[i]:undefined
      });
      if(res.status!=="OK") throw new Error("Coup illégal dans le PGN au ply "+(i+1));
      reports.push({ply:i+1,color:m.color,san:m.san,fenBefore:fen,...res});
      replay.move(m.san);
    }
    const byColor={w:{moves:0,exposures:0},b:{moves:0,exposures:0}};
    for(const r of reports){byColor[r.color].moves++;if(r.diagnostics.length)byColor[r.color].exposures++;}
    return {headers,reports,byColor};
  }
  return {tacticalMisses,analyzePgn};
})();
if(typeof module!=="undefined"&&module.exports) module.exports=ChessBlindspots;
