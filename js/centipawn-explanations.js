/* Explanations for EVERY half-move, grounded in Stockfish values and legal
 * continuations. CP loss is NOT the same as change in the White evaluation.
 * No invented positional causes: evidence first, uncertain otherwise. */
"use strict";
const SupaChessCentipawns = (() => {
  const other = c => c==="w"?"b":"w";
  const pieceNames={p:"pion",n:"cavalier",b:"fou",r:"tour",q:"dame",k:"roi"};
  const causeCatalog = [
    {id:"HANGING_PIECE",group:"Matériel",label:"Pièce ou pion en prise",level:"confirmable",rule:"Prise légale immédiate, puis vérification de la suite."},
    {id:"LOST_DEFENDER",group:"Matériel",label:"Défenseur déplacé ou supprimé",level:"candidate",rule:"Comparer les attaquants et défenseurs avant/après le coup."},
    {id:"OUTNUMBERED_ATTACK",group:"Matériel",label:"Pièce attaquée plus souvent qu’elle n’est défendue",level:"candidate",rule:"Comparer les attaques géométriques; vérifier clouages et échanges."},
    {id:"MISSED_CHECK",group:"Calcul",label:"Échec utile manqué",level:"engine-line",rule:"Le meilleur coup moteur donne échec; vérifier la variante forcée."},
    {id:"MISSED_CAPTURE",group:"Calcul",label:"Prise candidate manquée",level:"engine-line",rule:"Le meilleur coup moteur capture; calculer reprises et bilan matériel."},
    {id:"OPPONENT_CHECK",group:"Calcul",label:"Réponse adverse avec échec",level:"engine-line",rule:"La première réponse de la variante après le coup joué est un échec."},
    {id:"OPPONENT_CAPTURE",group:"Calcul",label:"Réponse adverse avec prise",level:"engine-line",rule:"La première réponse de la variante après le coup joué capture une pièce."},
    {id:"FORK",group:"Tactique",label:"Fourchette et double attaque",level:"deeper-analysis",rule:"Un coup attaque deux cibles; contrôler les échecs, prises, valeurs et réponses légales."},
    {id:"PIN_SKEWER",group:"Tactique",label:"Clouage et enfilade",level:"deeper-analysis",rule:"Une pièce gêne une ligne vers une cible plus importante; vérifier si elle peut bouger légalement."},
    {id:"DISCOVERED_ATTACK",group:"Tactique",label:"Attaque ou échec à la découverte",level:"deeper-analysis",rule:"Le déplacement libère une ligne d’attaque; vérifier les cases traversées et les parades."},
    {id:"DOUBLE_CHECK",group:"Tactique",label:"Échec double",level:"deeper-analysis",rule:"Deux pièces donnent échec simultanément; le roi doit généralement répondre."},
    {id:"DEFLECTION_OVERLOAD",group:"Tactique",label:"Déviation, surcharge ou élimination du défenseur",level:"deeper-analysis",rule:"Une défense est détournée ou ne peut répondre à toutes les menaces."},
    {id:"DECOY_CLEARANCE",group:"Tactique",label:"Attirance, dégagement ou obstruction",level:"deeper-analysis",rule:"Une pièce est attirée, une case libérée ou une ligne bloquée pour créer une tactique."},
    {id:"INTERMEZZO",group:"Tactique",label:"Coup intermédiaire",level:"deeper-analysis",rule:"Avant une reprise attendue, chercher un échec, une prise ou une menace plus forte."},
    {id:"MATE_NET",group:"Roi",label:"Réseau de mat, mat du couloir ou roi exposé",level:"deeper-analysis",rule:"Vérifier les échecs forcés, les cases de fuite et les défenses dans la variante."},
    {id:"PERPETUAL_STALEMATE",group:"Roi",label:"Échec perpétuel, pat ou ressource de nulle",level:"deeper-analysis",rule:"Comparer les suites forcées et les règles de nulle; un avantage matériel ne suffit pas."},
    {id:"TRAPPED_PIECE",group:"Pièces",label:"Pièce enfermée ou manque de cases",level:"deeper-analysis",rule:"Analyser les cases de repli légales, les menaces de capture et les moyens de libération."},
    {id:"PAWN_STRUCTURE",group:"Positionnel",label:"Pion isolé, doublé, arriéré ou faible",level:"positional-review",rule:"Évaluer la structure et les cibles à long terme; ne pas déduire cela des seuls centipions."},
    {id:"WEAK_SQUARE",group:"Positionnel",label:"Case faible, avant-poste ou contrôle du centre",level:"positional-review",rule:"Comparer les cases contrôlées, occupables et défendables par les deux camps."},
    {id:"KING_SAFETY",group:"Positionnel",label:"Sécurité du roi et abri de pions",level:"positional-review",rule:"Comparer l’abri, les lignes ouvertes, les cases d’entrée et les attaques disponibles."},
    {id:"ACTIVITY_TEMPO",group:"Positionnel",label:"Activité, développement, tempo ou coordination",level:"positional-review",rule:"Comparer options, tempos et coordination; aucune règle statique ne suffit."},
    {id:"OPEN_FILE_BAD_BISHOP",group:"Positionnel",label:"Colonne ouverte, tour active ou mauvais fou",level:"positional-review",rule:"Évaluer les lignes disponibles, les pièces actives et les chaînes de pions."},
    {id:"PASSED_PAWN",group:"Finales",label:"Pion passé, course de promotion ou sous-promotion",level:"deeper-analysis",rule:"Calculer les tempos, cases d’arrêt, prises en passant et choix de promotion."},
    {id:"ENDGAME_PLAN",group:"Finales",label:"Roi actif, opposition, zugzwang ou forteresse",level:"positional-review",rule:"Calculer les finales; consulter une tablebase seulement si la position est couverte."}
  ];
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
  function playedMove(fen,uci) {
    if(!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))return null;
    return new Chess(fen).move({from:uci.slice(0,2),to:uci.slice(2,4),
      promotion:uci.length===5?uci[4]:undefined});
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
    const candidatePosition=candidateUci?new Chess(fenBefore):null;
    const bestCandidate=candidateUci&&candidateUci!==uci
      ?candidatePosition.move({from:candidateUci.slice(0,2),to:candidateUci.slice(2,4),
        promotion:candidateUci.length===5?candidateUci[4]:undefined}) : null;
    const beforeCp=cp(bestBefore), afterCp=cp(bestAfter);
    // UCI output is always POV side-to-move. After the move, the opposite
    // player moves: multiply by -1 to express both evaluations in mover POV.
    const afterMoverCp=afterCp===null?null:-afterCp;
    const loss=beforeCp===null||afterMoverCp===null?null:Math.max(0,beforeCp-afterMoverCp);
    const signedSwing=beforeCp===null||afterMoverCp===null?null:afterMoverCp-beforeCp;
    const beforeWhiteCp=beforeCp===null?null:(mover==="w"?beforeCp:-beforeCp);
    const afterWhiteCp=afterCp===null?null:(mover==="w"?-afterCp:afterCp);
    const whiteSwing=beforeWhiteCp===null||afterWhiteCp===null?null:afterWhiteCp-beforeWhiteCp;
    const principles=[];
    if(bestCandidate&&loss!==null&&loss>=30&&bestCandidate.san.includes("+")) {
      principles.push({code:"LOOK_FOR_CHECKS",label:"Chercher les échecs utiles",
        evidence:"ENGINE_PREFERRED_CHECK",confidence:"candidate",
        text:`Stockfish privilégie ${bestCandidate.san}, un échec, dans cette position.`,
        caveat:"Cette piste ne prouve pas que tout échec est bon."});
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
    const pressure=captureFacts.filter(f=>f&&f.id==="PRESSURE_OR_DEFENDER_CHANGE").slice(0,6);
    for(const fact of pressure) {
      const attackers=(fact.enemyAttackers||[]).map(p=>p.square).join(", ")||"aucun compté";
      const defenders=(fact.defenders||[]).map(p=>p.square).join(", ")||"aucun compté";
      const attackerCount=fact.enemyAttackers?.length||0, defenderCount=fact.defenders?.length||0;
      observations.push({code:fact.outnumbered?"OUTNUMBERED_ATTACK":"DEFENDER_CHANGE",
        evidence:"GEOMETRIC_ATTACK_DEFENDER_COUNT",
        text:`Pression sur le ${pieceNames[fact.piece]||fact.piece} en ${fact.square} : ${attackerCount} attaquant${attackerCount>1?"s":""} (${attackers}) contre ${defenderCount} défenseur${defenderCount>1?"s":""} (${defenders}) après le coup; avant, ${fact.previousEnemyAttackers} attaquant(s) et ${fact.previousDefenders} défenseur(s).`});
    }
    const opponentReply=bestAfter?.pv?.[0]?playedMove(fenAfter,bestAfter.pv[0]):null;
    if(opponentReply && opponentReply.san.includes("+")) observations.push({
      code:"OPPONENT_CHECK",evidence:"ENGINE_PV",
      text:`Dans la variante Stockfish après ${played}, la meilleure réponse commence par ${opponentReply.san}, un échec. Il faut vérifier les réponses forcées du roi.`
    });
    if(opponentReply && opponentReply.captured) observations.push({
      code:"OPPONENT_CAPTURE",evidence:"ENGINE_PV",
      text:`Dans la variante Stockfish après ${played}, la meilleure réponse commence par ${opponentReply.san}, une prise de ${opponentReply.captured}. Cela ne suffit pas seul à établir le bilan de l'échange.`
    });
    if(bestMove && bestBefore.pv[0] !== uci && loss!==null && loss>=30) {
      observations.push({code:"ENGINE_PREFERS_ALTERNATIVE",evidence:"ENGINE_PV",
        text:`Stockfish préfère ${bestMove} à ${played} dans cette analyse.`});
    }
    if(bestCandidate&&loss!==null&&loss>=30&&typeof ChessBlindspots!=="undefined"&&typeof ChessBlindspots.pressureTargets==="function") {
      const targets=ChessBlindspots.pressureTargets(candidatePosition,mover);
      const target=targets[0];
      if(target) {
        const attackers=target.attackers.map(p=>`${pieceNames[p.type]||p.type} en ${p.square}`).join(", ");
        const defenders=target.defenders.map(p=>`${pieceNames[p.type]||p.type} en ${p.square}`).join(", ");
        observations.push({code:"BEST_MOVE_OUTNUMBERED_ATTACK",evidence:"ENGINE_LINE_AND_GEOMETRIC_COUNT",
          text:`Avec ${bestCandidate.san}, le meilleur coup calculé, Stockfish met la ${pieceNames[target.piece]||target.piece} adverse en ${target.square} sous une pression de ${target.attackers.length} attaquants (${attackers}) contre ${target.defenders.length} défenseur${target.defenders.length>1?"s":""} (${defenders}). C’est un motif candidat à vérifier dans la variante.`});
      }
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
    if(loss<=10) explanation=`${played} : perte de ${pretty(loss)} centipion(s) face au meilleur coup calculé. Ce coup préserve presque toute l'évaluation, sans démontrer qu'il est objectivement parfait.`;
    else explanation=`${played} : perte estimée de ${pretty(loss)} centipion(s) par rapport au meilleur coup${bestMove?" ("+bestMove+")":""}. Les constats vérifiés et les pistes à confirmer sont détaillés ci-dessous; les centipions mesurent l'écart mais ne suffisent pas à prouver seuls une cause positionnelle.`;
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
  return {explain,uciSan,causeCatalog};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=SupaChessCentipawns;
