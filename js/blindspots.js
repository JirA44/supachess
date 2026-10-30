/* SupaChess: evidence-based tactical blind-spot detection.
   Works with chess.js 0.13.x, never claims a forced material loss solely
   from an attacked square. An immediate legal capture is demonstrable. */
"use strict";

const ChessBlindspots = (() => {
  const names = { p:"pion",n:"cavalier",b:"fou",r:"tour",q:"dame",k:"roi" };
  const worth = {p:1,n:3,b:3,r:5,q:9,k:100};
  const other = c => c === "w" ? "b" : "w";
  const pieceName = p => names[p] || p;
  const legalCaptures = (chess, victimColor) =>
    chess.moves({verbose:true}).filter(m => m.captured && m.color === other(victimColor));

  // Geometric pressure is useful for explaining attacks/defenders, but it is
  // deliberately labeled as a candidate: this map does not remove pinned
  // pieces or prove that an exchange wins material.
  function geometricAttackers(chess, target, color) {
    const files="abcdefgh", ranks="87654321";
    const tf=files.indexOf(target[0]), tr=ranks.indexOf(target[1]);
    const attackers=[];
    for(const row of chess.board()) for(const p of row) {
      if(!p || p.color!==color) continue;
      const pf=files.indexOf(p.square[0]), pr=ranks.indexOf(p.square[1]);
      const df=tf-pf, dr=tr-pr, adf=Math.abs(df), adr=Math.abs(dr);
      let attacks=false, sliding=false;
      if(p.type==="p") attacks=adf===1 && dr===(color==="w"?-1:1);
      else if(p.type==="n") attacks=(adf===1&&adr===2)||(adf===2&&adr===1);
      else if(p.type==="k") attacks=Math.max(adf,adr)===1;
      else if(p.type==="b") attacks=adf===adr && adf>0, sliding=attacks;
      else if(p.type==="r") attacks=((df===0&&dr!==0)||(dr===0&&df!==0)), sliding=attacks;
      else if(p.type==="q") attacks=((adf===adr&&adf>0)||((df===0&&dr!==0)||(dr===0&&df!==0))), sliding=attacks;
      if(!attacks) continue;
      if(sliding) {
        const sf=Math.sign(df), sr=Math.sign(dr); let f=pf+sf,r=pr+sr,blocked=false;
        while(f!==tf||r!==tr) {
          if(chess.get(files[f]+ranks[r])) { blocked=true; break; }
          f+=sf; r+=sr;
        }
        if(blocked) continue;
      }
      attackers.push({square:p.square,type:p.type});
    }
    return attackers;
  }

  function pressureChanges(before, after, color) {
    const beforeAt=new Map(before.board().flat().filter(Boolean).map(p=>[p.square,p]));
    const facts=[];
    for(const p of after.board().flat().filter(p=>p&&p.color===color&&p.type!=="k")) {
      const old=beforeAt.get(p.square);
      if(!old || old.color!==color || old.type!==p.type) continue;
      const enemyAfter=geometricAttackers(after,p.square,other(color));
      const friendsAfter=geometricAttackers(after,p.square,color);
      const enemyBefore=geometricAttackers(before,p.square,other(color));
      const friendsBefore=geometricAttackers(before,p.square,color);
      const newlyAttacked=enemyAfter.length>enemyBefore.length;
      const lostDefender=friendsAfter.length<friendsBefore.length;
      if(!newlyAttacked&&!lostDefender) continue;
      facts.push({id:"PRESSURE_OR_DEFENDER_CHANGE",square:p.square,piece:p.type,
        enemyAttackers:enemyAfter,defenders:friendsAfter,
        previousEnemyAttackers:enemyBefore.length,previousDefenders:friendsBefore.length,
        newlyAttacked,lostDefender,
        outnumbered:enemyAfter.length>friendsAfter.length});
    }
    return facts;
  }

  function pressureTargets(chess, attackerColor) {
    const targets=[];
    for(const piece of chess.board().flat().filter(p=>p&&p.color===other(attackerColor)&&p.type!=="k")) {
      const attackers=geometricAttackers(chess,piece.square,attackerColor);
      const defenders=geometricAttackers(chess,piece.square,other(attackerColor));
      if(attackers.length>=2&&attackers.length>defenders.length)
        targets.push({square:piece.square,piece:piece.type,attackers,defenders,
          outnumberedBy:attackers.length-defenders.length});
    }
    return targets.sort((a,b)=>b.outnumberedBy-a.outnumberedBy||worth[b.piece]-worth[a.piece]);
  }

  function tacticalMisses(beforeFen, playedUci, opts = {}) {
    const original = new Chess(beforeFen);
    const game = new Chess(beforeFen);
    const side = game.turn();
    const from = playedUci.slice(0,2), to = playedUci.slice(2,4);
    const promotion = playedUci.length === 5 ? playedUci[4] : undefined;
    const legal = game.moves({verbose:true}).find(m =>
      m.from===from && m.to===to && (!m.promotion || m.promotion===promotion));
    if (!legal) return {status:"INVALID_MOVE",facts:[],diagnostics:[]};
    const result = game.move({from,to,promotion});
    if (!result) return {status:"INVALID_MOVE",facts:[],diagnostics:[]};
    // Compare against the same board with the opponent to move BEFORE the played
    // move. This detects an actually *new* immediate threat. The hypothetical
    // board is only a baseline; never display it as a real game state.
    const beforeParts = beforeFen.trim().split(/\s+/);
    beforeParts[1] = other(side);
    beforeParts[3] = "-";
    const baseline = new Chess(beforeParts.join(" "));
    const existing = new Set(legalCaptures(baseline, side).map(m =>
      m.from + ":" + m.to + ":" + (m.captured||"")));
    const now = legalCaptures(game,side);
    const facts = [];
    for (const move of now) {
      const victim = game.get(move.to);
      if (!victim || victim.color!==side || victim.type==="k") continue;
      // A capture that was already legal BEFORE this move must not be blamed
      // on this move. Legal capture also need not be a profitable exchange.
      const newlyExposed = !existing.has(move.from + ":" + move.to + ":" + move.captured);
      facts.push({
        id:"LEGAL_CAPTURE_NEXT_PLY",square:move.to,from:move.from,
        piece:victim.type,attacker:move.piece,
        captureSan:move.san,materialPoints:worth[victim.type],
        newlyExposed,fenAfter:game.fen()
      });
    }
    const pressure = pressureChanges(original,game,side);
    facts.push(...pressure);
    const seen = new Set();
    const diagnostics = [];
    for (const fact of facts.filter(f=>f.newlyExposed).sort((a,b)=>b.materialPoints-a.materialPoints)) {
      if (seen.has(fact.square)) continue;
      seen.add(fact.square);
      const significant = Number.isFinite(opts.lossCp) && opts.lossCp>=60;
      if (!significant) continue; // No learning-deficit claim without a corroborating engine loss.
      diagnostics.push({
        code:"PIECE_EN_PRISE_EN_UN_COUP",
        square:fact.square,
        move:result.san,
        severity:"erreur_probable",
        evidence:"CAPTURE_LEGALE_IMMEDIATE",
        text:`Après ${result.san}, ta ${names[fact.piece]} en ${fact.square} pouvait être prise immédiatement par ${fact.captureSan}. Avais-tu vérifié cette capture adverse avant de jouer ?`,
        caveat:"La capture est légale, mais cela ne prouve pas une perte nette de matériel : vérifier les échanges et l'analyse moteur.",
        suggestedHabit:"Avant chaque coup : quels sont les échecs, prises et menaces adverses ?"
      });
    }
    for(const fact of pressure) {
      const significant=Number.isFinite(opts.lossCp)&&opts.lossCp>=30;
      if(!significant) continue;
      const ratio=`${fact.enemyAttackers.length} attaquant(s) contre ${fact.defenders.length} défenseur(s)`;
      diagnostics.push({code:fact.outnumbered?"PIECE_SOUS_PRESSION_SUPERIEURE":"DEFENSE_A_VERIFIER",
        square:fact.square,move:result.san,severity:"piste_a_verifier",
        evidence:"GEOMETRIC_ATTACK_DEFENDER_COUNT",
        text:fact.lostDefender&&fact.enemyAttackers.length
          ?`Après ${result.san}, ta ${pieceName(fact.piece)} en ${fact.square} a perdu un défenseur et reste attaquée (${ratio}).`
          :fact.lostDefender
            ?`Après ${result.san}, ta ${pieceName(fact.piece)} en ${fact.square} a perdu un défenseur géométrique; aucune prise immédiate n’est confirmée par ce constat seul.`
            :`Après ${result.san}, ta ${pieceName(fact.piece)} en ${fact.square} est davantage attaquée (${ratio}).`,
        attackers:fact.enemyAttackers,defenders:fact.defenders,
        caveat:"Comptage géométrique indicatif : les pièces clouées, les échanges et la valeur des captures doivent être vérifiés dans la variante Stockfish.",
        suggestedHabit:"Après chaque coup candidat, vérifie quelles pièces sont attaquées, combien les défendent, puis calcule les prises et reprises."});
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
  return {tacticalMisses,analyzePgn,pressureTargets};
})();
if(typeof module!=="undefined"&&module.exports) module.exports=ChessBlindspots;
