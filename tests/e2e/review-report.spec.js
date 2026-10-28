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
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => page.evaluate(() => state.replayIdx)).toBe(1);
  await expect.poll(() => page.locator('.review-ply[data-review-ply="1"]').evaluateAll(nodes => nodes.length > 0 && nodes.every(node => node.classList.contains('selected')))).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => state.replayIdx)).toBe(2);
  await expect.poll(() => page.locator('.review-ply[data-review-ply="2"]').evaluateAll(nodes => nodes.length > 0 && nodes.every(node => node.classList.contains('selected')))).toBe(true);
  const restored=await page.evaluate(()=>{
    document.getElementById('btn-replay-quit').click();
    return {
      fen:state.chess.fen(),
      reportVisible:!document.getElementById('review-panel').classList.contains('hidden'),
      replayBarVisible:!document.getElementById('replay-bar').classList.contains('hidden'),
      previousDisabled:document.getElementById('btn-replay-prev').disabled,
      nextDisabled:document.getElementById('btn-replay-next').disabled
    };
  });
  expect(restored.fen).toBe(result.savedFen);
  expect(restored.reportVisible).toBe(true);
  expect(restored.replayBarVisible).toBe(true);
  expect(restored.previousDisabled).toBe(true);
  expect(restored.nextDisabled).toBe(true);
});



test('selected PGNs show a cautious FIDE-like baseline and a comparable error trend', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    const analysis = {
      version: 1,
      players: [
        { name: 'Alice', color: 'w', moves: 10, ratedMoves: 10, accuracy: 82,
          grades: { brilliant: 0, best: 1, 'very-good': 2, good: 2, ok: 3, inaccuracy: 1, mistake: 1, blunder: 0 },
          phases: { opening: { moves: 4, issues: 1 }, middlegame: { moves: 4, issues: 1 }, endgame: { moves: 2, issues: 1 } },
          diagnostics: {}, worstMoves: [] },
        { name: 'Opponent', color: 'b', moves: 10, ratedMoves: 10, accuracy: 80,
          grades: { brilliant: 0, best: 1, 'very-good': 2, good: 2, ok: 3, inaccuracy: 1, mistake: 1, blunder: 0 },
          phases: { opening: { moves: 4, issues: 1 }, middlegame: { moves: 4, issues: 1 }, endgame: { moves: 2, issues: 1 } },
          diagnostics: {}, worstMoves: [] }
      ]
    };
    const games = Array.from({ length: 10 }, (_, index) => ({
      id: 'rated-' + index, pgn: 'rated-game-' + index, white: 'Alice', black: 'Opponent',
      whiteElo: '2100', blackElo: '1900', result: index < 6 ? '1-0' : '0-1',
      date: '2026.03.' + String(index + 1).padStart(2, '0'), timeControl: '600+0', analysis
    }));
    localStorage.setItem('supachess_reviewed_pgns', JSON.stringify(games));
  });
  await page.reload();
  const panel = page.locator('#review-insights-panel');
  await panel.locator('[data-review-insights-select-all]').click();
  await panel.locator('[data-review-fide-confirm]').check();
  await panel.locator('[data-review-insights-run]').click();
  await expect(panel).toContainText('Performance FIDE-like indicative');
  await expect(panel).toContainText('sur 10 résultat(s)');
  await expect(panel).toContainText('Évolution Stockfish (600+0)');
  await expect(panel).toContainText('erreurs 10.0→10.0 par 100 demi-coups');
  await expect(panel).toContainText('sans prouver à elle seule que la leçon en est la cause');
});

test('PGN analysis automatically opens replay and keeps previous/next controls visible',async({page})=>{
  await page.goto('/index.html');
  await page.waitForFunction(()=>document.body.dataset.engineReady==='1');
  await expect(page.locator('#replay-bar')).toBeVisible();
  await expect(page.locator('#btn-replay-prev')).toBeDisabled();
  await expect(page.locator('#btn-replay-next')).toBeDisabled();
  const result=await page.evaluate(async()=>{
    state.engine.analyze=async({fen})=>{
      const position=new Chess(fen);
      return {lines:[{scoreCp:0,mate:null,pv:[position.turn()==='w'?'e2e4':'e7e5'],depth:1}]};
    };
    window.analyzeForUser=async()=>{};
    window.fetch=async()=>({ok:false,status:503,json:async()=>({})});
    document.getElementById('pgn-input').value='[Event "Automatic replay"]\\n[White "Alice"]\\n[Black "Bob"]\\n[Result "*"]\\n\\n1. e4 *';
    return reviewRun();
  });
  expect(result).toBe(true);
  await expect(page.locator('#replay-bar')).toBeVisible();
  await expect(page.locator('#replay-label')).toHaveText('Coup 0/1');
  await expect(page.locator('#btn-replay-prev')).toBeEnabled();
  await expect(page.locator('#btn-replay-next')).toBeEnabled();
  await page.keyboard.press('ArrowRight');
  await expect.poll(()=>page.evaluate(()=>state.replayIdx)).toBe(1);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(()=>page.evaluate(()=>state.replayIdx)).toBe(0);
});
