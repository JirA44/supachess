/* Explanations for EVERY half-move, grounded in Stockfish values and legal
 * continuations. CP loss is NOT the same as change in the White evaluation.
 * No invented positional causes: evidence first, uncertain otherwise. */
"use strict";
const SupaChessCentipawns = (() => {
  const other = c => c==="w"?"b":"w";
  function finite(x){return typeof x==="number"&&Number.isFinite(x);}
  const cp = line => line && line.mate == null && finite(line.scoreCp) ? line.scoreCp : null;
  const mate = line => line && Number.isInteger(line.mate) ? line.mate : null;
  function uciSan(fen, uci) {
    if(!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))return null;
    const game=new Chess(fen);
    const played=game.move({from:uci.slice(0,2),to:uci.slice(2,4),
                           promotion:uci.length===5?uci[4]:undefined});
    return played?played.san:null;
  }
  function explain(input) {
    const {fenBefore, fenAfter, uci, bestBefore, bestAfter, captureFacts=[]}=input;
    const chess=new Chess(fenBefore), mover=chess.turn();
    const played=uciSan(fenBefore,uci);
    if(!played)return {status:"INVALID_MOVE"};
    const after=new Chess(fenAfter);
    if(after.turn()===mover)return {status:"INVALID_POSITIONS"};
    const bestMove=bestBefore && bestBefore.pv && uciSan(fenBefore,bestBefore.pv[0]);
    const candidateUci=bestBefore?.pv?.[0];
    const playedEngineBest=candidateUci===uci;
    const candidatePosition=candidateUci?new Chess(fenBefore):null;
    const bestCandidate=candidateUci&&candidateUci!==uci
      ?candidatePosition.move({from:candidateUci.slice(0,2),to:candidateUci.slice(2,4),
        promotion:candidateUci.length===5?candidateUci[4]:undefined}) : null;
    const beforeCp=cp(bestBefore), afterCp=cp(bestAfter);
    // UCI output is always POV side-to-move. After the move, the opposite
    // player moves: multiply by -1 to express both evaluations in mover POV.
    const afterMoverCp=afterCp===null?null:-afterCp;
    const loss=beforeCp===null||afterMoverCp===null?null:
      playedEngineBest?0:Math.max(0,beforeCp-afterMoverCp);
    const signedSwing=beforeCp===null||afterMoverCp===null?null:afterMoverCp-beforeCp;
    const beforeWhiteCp=beforeCp===null?null:(mover==="w"?beforeCp:-beforeCp);
    const afterWhiteCp=afterCp===null?null:(mover==="w"?-afterCp:afterCp);
    const whiteSwing=beforeWhiteCp===null||afterWhiteCp===null?null:afterWhiteCp-beforeWhiteCp;
    const principles=[];
    if(bestCandidate&&loss!==null&&loss>=30&&bestCandidate.san.includes("+")) {
      principles.push({code:"LOOK_FOR_CHECKS",label:"Chercher les échecs utiles",
        evidence:"ENGINE_PREFERRED_CHECK",confidence:"candidate",
        text:`Stockfish privilégie ${bestCandidate.san}, un échec, dans cette position.`,
        caveat:"C'est une piste calculée par le moteur, pas la preuve que tout échec est bon."});
    }
    if(bestCandidate&&bestCandidate.captured&&loss!==null&&loss>=30) {
      principles.push({code:"LOOK_FOR_CAPTURES",label:"Examiner les prises candidates",
        evidence:"ENGINE_PREFERRED_CAPTURE",confidence:"candidate",
        text:`Stockfish privilégie ${bestCandidate.san}, une prise, dans cette position.`,
        caveat:"Vérifier la suite avant de conclure que la prise gagne du matériel."});
    }
    const newlyExposed=captureFacts.filter(f=>f&&f.id==="LEGAL_CAPTURE_NEXT_PLY"&&f.newlyExposed);
    if(newlyExposed.length&&loss!==null&&loss>=60) {
      principles.push({code:"CHECK_OPPONENT_THREATS",label:"Vérifier les menaces adverses avant de jouer",
        evidence:"NEW_LEGAL_CAPTURE_NEXT_PLY",confidence:"evidence",
        text:`Après ${played}, une pièce est exposée à une prise légale immédiate (${newlyExposed.slice(0,3).map(f=>f.captureSan).join(", ")}).`,
        caveat:"Une prise légale ne prouve pas à elle seule une perte nette de matériel."});
    }

    const observations=[];
    const legalCaptures=captureFacts.filter(f=>f&&f.id==="LEGAL_CAPTURE_NEXT_PLY")
      .slice(0,5);
    if(legalCaptures.length) observations.push({
      code:"LEGAL_CAPTURE_NEXT_PLY",evidence:"LEGAL_MOVE",
      text:`Après ce coup, l'adversaire peut légalement jouer ${legalCaptures.map(f=>f.captureSan).join(", ")}. Cela ne démontre pas une perte de matériel nette.`
    });
    if(bestMove && bestBefore.pv[0] !== uci && loss!==null && loss>=30) {
      observations.push({code:"ENGINE_PREFERS_ALTERNATIVE",evidence:"ENGINE_PV",
        text:`Stockfish préfère ${bestMove} à ${played} dans cette analyse.`});
    }
    if(mate(bestBefore)!==null || mate(bestAfter)!==null || after.in_checkmate()) {
      return {
        status:"MATE_EVALUATION",played,mover,bestMove,principles,
        lossCp:null,swingWhiteCp:null,beforeWhiteCp:null,afterWhiteCp:null,
        observations,
        explanation:after.in_checkmate()?"Ce coup conclut par échec et mat. Une valeur en centipions serait trompeuse.":
          "La position comprend une évaluation de mat forcé : comparer les distances au mat, pas les centipions.",
        analysisDepthBefore:bestBefore?.depth??null,analysisDepthAfter:bestAfter?.depth??null
      };
    }
    if(loss===null) return {
      status:"UNKNOWN_CP",played,mover,bestMove,principles,lossCp:null,swingWhiteCp:null,
      observations,explanation:"Évaluation moteur incomplète : impossible de quantifier honnêtement la différence en centipions.",
      analysisDepthBefore:bestBefore?.depth??null,analysisDepthAfter:bestAfter?.depth??null
    };
    const pretty=n=>(Math.round(n*10)/10).toLocaleString("fr-FR");
    let explanation;
    if(playedEngineBest&&Math.abs(signedSwing)>10) {
      const swing=`${whiteSwing>=0?"+":""}${pretty(whiteSwing)}`;
      explanation=`${played} : Stockfish classe ce coup en tête dans la position avant le demi-coup, donc 0 cp de perte relative au meilleur coup. Les deux évaluations séparées divergent toutefois de ${swing} cp côté Blancs; cette variation ne concorde pas avec le classement du coup.`;
    }
    else if(loss<=10) explanation=`${played} : perte de ${pretty(loss)} centipion(s) face au meilleur coup calculé. Ce coup préserve presque toute l'évaluation, sans démontrer qu'il est objectivement parfait.`;
    else explanation=`${played} : perte estimée de ${pretty(loss)} centipion(s) par rapport au meilleur coup${bestMove?" ("+bestMove+")":""}. ${legalCaptures.length?"Prises possibles vérifiées ci-dessous.":"La cause tactique ou positionnelle exacte reste à établir par une variante et une analyse plus profonde."}`;
    return {
      status:"OK",played,mover,bestMove,principles,
      beforeWhiteCp,afterWhiteCp,swingWhiteCp:whiteSwing,
      lossCp:loss, signedMoverSwingCp:signedSwing,
      observations,explanation,
      analysisDepthBefore:bestBefore?.depth??null,
      analysisDepthAfter:bestAfter?.depth??null,
      caveat:"Le changement brut de l'évaluation et la perte en centipions relativement au meilleur coup sont deux métriques différentes; les scores dépendent de la version, profondeur et réglages moteur."
    };
  }
  return {explain,uciSan};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=SupaChessCentipawns;
