const {test,expect}=require('@playwright/test');
test('PGN report: per-ply losses, evidence and training are actually rendered',async({page})=>{
  await page.goto('/index.html');
  const ready=await page.evaluate(()=>{
    if(typeof reviewRenderLocal!=="function" || typeof SupaChessCentipawns==="undefined" ||
       typeof SupaChessLearning==="undefined" || typeof ChessBlindspots==="undefined") return false;
    const rows=[
      {n:1,color:"w",san:"e4",delta:0,lossCp:0,tag:"",diagnostics:[],
       centipawns:{status:"OK",lossCp:0,swingWhiteCp:0,
         explanation:"e4 : coup proche du meilleur.",observations:[]}},
      {n:1,color:"b",san:"e5",delta:0.8,lossCp:80,tag:"?",
       diagnostics:[{code:"PIECE_EN_PRISE_EN_UN_COUP",text:"Prise légale démontrée en d8",caveat:"Échange à vérifier."}],
       centipawns:{status:"OK",lossCp:80,swingWhiteCp:80,
         explanation:"e5 : perte estimée face au meilleur coup.",observations:[]}}
    ];
    reviewRenderLocal(rows,98,72,{White:"Test",Black:"Test",Result:"*"});
    return true;
  });
  expect(ready).toBe(true);
  await expect(page.locator('#review-report')).toContainText('Chaque demi-coup expliqué');
  await expect(page.locator('#review-report')).toContainText('80 cp');
  await expect(page.locator('#review-report')).toContainText('Prise légale démontrée');
  await expect(page.locator('#review-report')).toContainText('Plan d’entraînement personnalisé');
});

test('PGN halfmove link replays the exact resulting position and synchronizes the report',async({page})=>{
  await page.goto('/index.html');
  const result=await page.evaluate(async()=>{
    if(typeof replayGoto!=="function" || typeof reviewRenderLocal!=="function") return {ready:false};
    const savedGame=new Chess();
    savedGame.move('d4');
    const savedFen=savedGame.fen();
    state.gen++;
    state.chess=savedGame;
    state.phase='userTurn';
    state.fenHistory=[fenKey(savedFen)];
    state.evalHistory=[];
    state.candidates=[];
    state.pendingMove=null;
    state.accuracy={w:[],b:[],pendingEngine:null};
    renderAll();
    const game=new Chess();
    const fens=[game.fen()];
    const moves=[];
    for(const san of ['e4','e5']){
      moves.push(game.move(san));
      fens.push(game.fen());
    }
    reviewState.fens=fens;
    reviewState.moves=moves;
    reviewState.grades=moves.map(()=>({deltaCp:0,brilliant:false}));
    const rows=moves.map((move,i)=>({
      n:1,color:move.color,san:move.san,delta:0,lossCp:0,tag:'',diagnostics:[],
      centipawns:{status:'OK',lossCp:0,swingWhiteCp:0,explanation:'Coup proche du meilleur.',observations:[]}
    }));
    document.getElementById('review-panel').classList.remove('hidden');
    reviewRenderLocal(rows,99,99,{White:'Test',Black:'Test',Result:'*'});
    window.analyzeForUser=async()=>{};
    document.querySelector('.review-ply-link[data-review-ply="2"]').click();
    await new Promise(resolve=>setTimeout(resolve,0));
    return {
      ready:true,idx:state.replayIdx,fen:state.chess.fen(),expectedFen:fens[2],savedFen,
      fromHighlighted:document.querySelector("[data-square='e7']")?.classList.contains('lastmove'),
      toHighlighted:document.querySelector("[data-square='e5']")?.classList.contains('lastmove'),
      selected:document.querySelector('.review-ply[data-review-ply="2"]')?.classList.contains('selected'),
      ariaCurrent:document.querySelector('.review-ply-link[data-review-ply="2"]')?.getAttribute('aria-current'),
      replayBarVisible:!document.getElementById('replay-bar').classList.contains('hidden')
    };
  });
  expect(result.ready).toBe(true);
  expect(result.idx).toBe(2);
  expect(result.fen).toBe(result.expectedFen);
  expect(result.fromHighlighted).toBe(true);
  expect(result.toHighlighted).toBe(true);
  expect(result.selected).toBe(true);
  expect(result.ariaCurrent).toBe('step');
  expect(result.replayBarVisible).toBe(true);
  const restored=await page.evaluate(()=>{
    document.getElementById('btn-replay-quit').click();
    return {
      fen:state.chess.fen(),
      reportVisible:!document.getElementById('review-panel').classList.contains('hidden'),
      replayBarHidden:document.getElementById('replay-bar').classList.contains('hidden')
    };
  });
  expect(restored.fen).toBe(result.savedFen);
  expect(restored.reportVisible).toBe(true);
  expect(restored.replayBarHidden).toBe(true);
});
