const {test,expect}=require('@playwright/test');
test('PGN report separates best-move loss from an inconsistent evaluation swing',async({page})=>{
  await page.goto('/index.html');
  const shown=await page.evaluate(()=>{
    const game=new Chess();game.move('e4');const fenBefore=game.fen();game.move('e5');
    const cp=SupaChessCentipawns.explain({fenBefore,fenAfter:game.fen(),uci:'e7e5',
      bestBefore:{scoreCp:-30,mate:null,depth:18,pv:['e7e5']},
      bestAfter:{scoreCp:125,mate:null,depth:18,pv:['g1f3']}});
    const row={n:1,color:'b',san:'e5',bestMove:true,delta:0,lossCp:cp.lossCp,tag:'',diagnostics:[],centipawns:cp};
    reviewState.grades=[{deltaCp:cp.lossCp,brilliant:false}];
    reviewRenderLocal([row],99,99,{White:'Carlsen',Black:'Anand',Result:'1-0'});
    return {lossCp:cp.lossCp,report:document.querySelector('#review-report').innerText};
  });
  expect(shown.lossCp).toBe(0);
  expect(shown.report).toContain('0 cp de perte relative au meilleur coup');
  expect(shown.report).toContain('+95 cp côté Blancs');
  await expect(page.locator('.review-player-b .review-grade-best')).toContainText('1');
  await expect(page.locator('.review-player-b .review-grade-mistake')).toContainText('0');
});

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
         explanation:"e5 : perte estimée face au meilleur coup.",observations:[],
         principles:[{code:"CHECK_OPPONENT_THREATS",confidence:"evidence",label:"Vérifier les menaces adverses avant de jouer",text:"Une pièce est exposée à une prise légale.",caveat:"Une prise légale ne prouve pas une perte nette."}]}}
    ];
    reviewRenderLocal(rows,98,72,{White:"Test",Black:"Test",Result:"*"});
    return true;
  });
  expect(ready).toBe(true);
  await expect(page.locator('#review-report')).toContainText('Chaque demi-coup expliqué');
  await expect(page.locator('#review-report')).toContainText('80 cp');
  await expect(page.locator('#review-report')).toContainText('Prise légale démontrée');
  await expect(page.locator('#review-report')).toContainText('Principe à vérifier');
  await expect(page.locator('#review-report')).toContainText('Vérifier les menaces adverses avant de jouer');
  await expect(page.locator('#review-report')).toContainText('Principes et fondamentaux à travailler');
  await expect(page.locator('#review-report')).toContainText('Observation ponctuelle, récurrence à confirmer');
  await expect(page.locator('#review-report')).toContainText('Plan d’entraînement personnalisé');
});

test('PGN report: two player columns show move symbols and stack on narrow screens',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{
    const moves=[
      {n:1,color:'w',san:'e4',bestMove:true,delta:0,lossCp:0,tag:'',diagnostics:[],centipawns:{status:'OK',lossCp:0,swingWhiteCp:0,explanation:'Proche du meilleur coup.',observations:[]}},
      {n:1,color:'b',san:'e5',bestMove:false,delta:.8,lossCp:80,tag:'?',diagnostics:[],centipawns:{status:'OK',lossCp:80,swingWhiteCp:80,explanation:'Perte évaluée.',observations:[]}}
    ];
    reviewState.grades=moves.map(()=>({deltaCp:0,brilliant:false}));
    reviewRenderLocal(moves,89.7,94.1,{White:'th7mas',Black:'HeyoAP',Result:'0-1'});
  });
  await expect(page.locator('.review-player-card')).toHaveCount(2);
  await expect(page.locator('.review-player-w .review-grade-best')).toContainText('★');
  await expect(page.locator('.review-player-b .review-grade-mistake')).toContainText('1');
  await expect(page.locator('#review-report')).toContainText('89.7%');
  await expect(page.locator('#review-report')).toContainText('94.1%');
  await page.setViewportSize({width:375,height:800});
  const mobileLayout=await page.locator('.review-player-grid').evaluate((node)=>({
    media:matchMedia('(max-width: 560px)').matches,
    columns:getComputedStyle(node).gridTemplateColumns
  }));
  expect(mobileLayout.media).toBe(true);
  expect(mobileLayout.columns).toBe('minmax(0px, 1fr)');
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

test('practice resets a wrong move, teaches White and Black errors, and preserves the analyzed game',async({page})=>{
  await page.goto('/index.html');
  const setup=await page.evaluate(()=>{
    const source=new Chess();
    const fens=[source.fen()];
    const moves=[source.move('e4')];
    fens.push(source.fen());
    moves.push(source.move('e5'));
    reviewState.fens=fens;
    reviewState.moves=moves;
    reviewState.grades=[{deltaCp:30,brilliant:false},{deltaCp:60,brilliant:false}];
    const rows=[
      {n:1,ply:1,color:'w',san:'e4',classification:'inaccuracy',lossCp:30,bestMoveUci:'d2d4',bestMoveSan:'d4',bestLine:['d2d4','d7d5'],diagnostics:[],centipawns:{explanation:'Le centre pouvait être contesté plus directement.',principles:[{label:'Contrôler le centre',text:'Occupe ou attaque les cases centrales.',caveat:'À confirmer selon la position.'}]}},
      {n:1,ply:2,color:'b',san:'e5',classification:'mistake',lossCp:60,bestMoveUci:'d7d5',bestMoveSan:'d5',bestLine:['d7d5','c4d5'],diagnostics:[],centipawns:{explanation:'Le pion d5 conteste le centre blanc.',principles:[]}}
    ];
    reviewRenderLocal(rows,80,70,{White:'Blanc',Black:'Noir',Result:'*'});
    const mainFen=state.chess.fen();
    document.getElementById('btn-practice-errors').click();
    return {mainFen,startFen:fens[0],count:reviewState.trainingRows.length};
  });
  expect(setup.count).toBe(2);
  await expect(page.locator('#review-training-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#review-training-progress')).toContainText('Ouverture');
  await page.locator('#review-training-phase').selectOption('endgame');
  await expect(page.locator('#review-training-progress')).toContainText('Aucun demi-coup');
  await page.locator('#review-training-phase').selectOption('all');
  await expect(page.locator('#review-training-progress')).toContainText('Exercice 1/2');
  await page.locator('#review-training-board .sq[data-square="a2"]').click();
  await page.locator('#review-training-board .sq[data-square="a3"]').click();
  await expect(page.locator('#review-training-feedback')).toContainText('revient à la position initiale');
  await expect.poll(()=>page.evaluate(()=>reviewState.training.game.fen())).toBe(setup.startFen);
  await page.locator('#review-training-board .sq[data-square="d2"]').click();
  await page.locator('#review-training-board .sq[data-square="d4"]').click();
  await expect(page.locator('#review-training-feedback')).toContainText('meilleur coup trouvé par Stockfish');
  await page.locator('#btn-review-training-next').click();
  await expect(page.locator('#review-training-progress')).toContainText('Noirs');
  await expect(page.locator('#btn-review-training-flip')).toHaveAttribute('aria-pressed','true');
  await page.locator('#review-training-board .sq[data-square="d7"]').click();
  await page.locator('#review-training-board .sq[data-square="d5"]').click();
  await expect(page.locator('#review-training-feedback')).toContainText('meilleur coup trouvé par Stockfish');
  const final=await page.evaluate(()=>({mainFen:state.chess.fen(),trainingIndex:reviewState.training.index,trainingFen:reviewState.training.game.fen()}));
  expect(final.mainFen).toBe(setup.mainFen);
  await page.locator('#btn-review-training-next').click();
  await expect(page.locator('#review-training-progress')).toContainText('Entraînement terminé');
});
