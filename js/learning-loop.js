/* SupaChess learning loop: prioritize remediations, not raw mistake counts.
   Pure, deterministic, explainable, no rating claims from insufficient evidence. */
"use strict";

const SupaChessLearning = (() => {
  const RULES = {
    PIECE_EN_PRISE_EN_UN_COUP: {
      skill:"Vérifier les prises adverses",
      practice:"Avant de valider chaque coup, énumère les échecs, prises et menaces adverses. Trouve toutes les captures légales possibles au coup suivant.",
      reviewDelayDays:[1,3,7,21],
    },
  };
  function plan(report, history=[]) {
    if (!report || !Array.isArray(report.reports)) throw Error("Analyse de partie manquante");
    const rows = report.reports;
    const totalByColor={w:0,b:0};
    for(const r of rows) if(r.color==="w"||r.color==="b") totalByColor[r.color]++;
    const list=[];
    for(const color of ["w","b"]) {
      const byCode=new Map();
      for(const r of rows.filter(r=>r.color===color)) {
        const once=new Set();
        for(const diag of (r.diagnostics||[])) {
          if(!diag || !RULES[diag.code] || once.has(diag.code)) continue;
          once.add(diag.code);
          const current=byCode.get(diag.code)||{count:0,examples:[]};
          current.count++;
          if(current.examples.length<3)current.examples.push({ply:r.ply,san:r.san,square:diag.square,fenBefore:r.fenBefore});
          byCode.set(diag.code,current);
        }
      }
      for(const [code,item] of byCode.entries()) {
        const previous=history.filter(h=>h.color===color&&h.code===code&&h.verified===true);
        const played=totalByColor[color];
        const rate=played ? item.count/played : 0;
        const repeatAcrossGames=new Set(previous.map(h=>h.gameId)).size;
        list.push({
          color,code,skill:RULES[code].skill,
          count:item.count,movesObserved:played,observedRate:rate,
          observedAcrossPreviousGames:repeatAcrossGames,
          confidence: item.count>=3&&repeatAcrossGames>=1?"pattern_supported":"insufficient_evidence",
          practice:RULES[code].practice,
          exercisesToTry:Math.min(12,Math.max(3,item.count*2)),
          reviewDelayDays:RULES[code].reviewDelayDays,
          evidence:item.examples,
          status:"PRACTICE_RECOMMENDATION_NOT_PROVEN_CAUSE",
        });
      }
    }
    return list.sort((a,b)=>b.count/(b.movesObserved||1)-a.count/(a.movesObserved||1));
  }
  function assessLearning(pre,post) {
    // Repeated evaluation must use matched time control, difficulty and sample sizes.
    if (!pre || !post || pre.sampleN<20 || post.sampleN<20 ||
        pre.timeControl!==post.timeControl || pre.difficulty!==post.difficulty)
      return {status:"INSUFFICIENT_COMPARABLE_DATA"};
    const before=pre.errors/pre.sampleN, after=post.errors/post.sampleN;
    return {status:"MEASURED_CHANGE_NOT_CAUSAL_PROOF",rateBefore:before,
      rateAfter:after,absoluteImprovement:before-after,
      relativeImprovement:before?((before-after)/before):null};
  }
  return {plan,assessLearning};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=SupaChessLearning;
