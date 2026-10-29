const {test,expect}=require('@playwright/test');

test('plays correction exercises from a saved analyzed game',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('#review-history-list')).toBeVisible();
  await page.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('supachess_reviewed_pgns',JSON.stringify([{
      id:'correction-game',pgn:'1. f3 e5',white:'Alice',black:'Bob',result:'*',
      correctionExercises:[{
        fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        bestUci:'e2e4',bestScoreCp:12,bestMate:null,moveNumber:1,color:'w',
        playedSan:'f3',classification:'ok',lossCp:4.2
      },{
        fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
        bestUci:'e7e5',bestScoreCp:-8,bestMate:null,moveNumber:1,color:'b',
        playedSan:'d5',classification:'ok',lossCp:2.5
      }]
    }]));
    const saved=JSON.parse(localStorage.getItem('supachess_reviewed_pgns'));
    saved[0].correctionExercises.reverse();
    localStorage.setItem('supachess_reviewed_pgns',JSON.stringify(saved));
    reviewHistoryRender();
  });
  await expect(page.locator('#review-history-list')).toContainText('Corriger (2)');
  await page.click('#review-history-list [data-review-history-act="exercise"]');
  const exercisePanel=page.locator('#review-exercise-panel');
  await expect(exercisePanel).toBeVisible();
  await expect.poll(()=>exercisePanel.evaluate(el=>Math.abs(el.getBoundingClientRect().top))).toBeLessThan(5);
  expect(await page.evaluate(()=>state.chess.fen())).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const phase=page.locator('#review-exercise-phase');
  await phase.selectOption('endgame');
  await expect(page.locator('#review-exercise-heading')).toHaveText('Aucun exercice dans cette phase.');
  await phase.selectOption('opening');
  await expect(page.locator('#review-exercise-heading')).toContainText('Exercice 1/2');
  const flipButton=page.locator('#btn-review-exercise-flip');
  await expect(flipButton).toHaveAttribute('aria-pressed','false');
  await flipButton.click();
  await expect(flipButton).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#board [data-square]').first()).toHaveAttribute('data-square','h1');
  await flipButton.click();
  await expect(flipButton).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#board [data-square]').first()).toHaveAttribute('data-square','a8');
  await expect(page.locator('#review-exercise-prompt')).toContainText('4,2 centipions');
  await expect(page.locator('#review-exercise-prompt')).toContainText('coup ok');
  await expect(page.locator('#review-exercise-prompt')).toContainText('f3');

  await page.locator('#board [data-square="e2"]').click();
  await page.locator('#board [data-square="e3"]').click();
  await expect(page.locator('#review-exercise-feedback')).toContainText('ne corrige pas l’erreur');
  await expect(page.locator('#btn-review-exercise-next')).toBeDisabled();
  await expect(page.locator('#btn-review-exercise-retry')).toBeVisible();
  await page.click('#btn-review-exercise-retry');
  await expect(page.locator('#review-exercise-feedback')).toContainText('À toi de jouer');

  await page.locator('#board [data-square="e2"]').click();
  await page.locator('#board [data-square="e4"]').click();
  await expect(page.locator('#review-exercise-feedback')).toContainText('Bien joué');
  await expect(page.locator('#btn-review-exercise-next')).toBeEnabled();
  await page.click('#btn-review-exercise-next');
  await expect(page.locator('#review-exercise-panel')).toBeVisible();
  await expect(page.locator('#review-exercise-heading')).toContainText('Bob');
  await expect(flipButton).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#board [data-square]').first()).toHaveAttribute('data-square','h1');
  await flipButton.click();
  await expect(flipButton).toHaveAttribute('aria-pressed','false');
  await page.locator('#board [data-square="e7"]').click();
  await page.locator('#board [data-square="e5"]').click();
  await expect(page.locator('#review-exercise-feedback')).toContainText('Bien joué');
  await page.click('#btn-review-exercise-next');
  await expect(page.locator('#review-exercise-panel')).toBeHidden();
  await expect(page.locator('#review-history-list')).toContainText('Alice vs Bob');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('supachess_reviewed_pgns')).length)).toBe(1);
});

test('reanalyzes invalid saved corrections and opens the first error directly',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready','1',{timeout:30000});
  await page.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('supachess_reviewed_pgns',JSON.stringify([{
      id:'legacy-game',pgn:'1. f3 e5 2. g4 Qh4#',white:'Carol',black:'Dan',result:'0-1',
      correctionExercises:[{fen:'',bestUci:''}]
    }]));
    reviewHistoryRender();
  });
  await page.click('#review-history-list [data-review-history-act="reanalyze-corrections"]');
  await expect(page.locator('#review-exercise-panel')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>({
    running:reviewState.running,
    first:reviewState.exercise?.items?.[0]&&{
      moveNumber:reviewState.exercise.items[0].moveNumber,
      color:reviewState.exercise.items[0].color,
      playedSan:reviewState.exercise.items[0].playedSan
    }
  })),{timeout:60000}).toEqual({
    running:false,first:{moveNumber:1,color:'w',playedSan:'f3'}
  });
  await expect(page.locator('#review-exercise-heading')).toContainText('Exercice 1/');
});

test('adds a correction button to saved games and starts at their first reviewed error',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready','1',{timeout:30000});
  await page.evaluate(()=>{
    localStorage.clear();
    const pgn='1. f3 e5';
    localStorage.setItem('supachess_games',JSON.stringify([{
      id:'saved-game',date:'2026-10-28T19:59:00.000Z',pgn,result:'*',accuracyW:92.8,accuracyB:null
    }]));
    localStorage.setItem('supachess_reviewed_pgns',JSON.stringify([{
      id:'saved-review',pgn,white:'Alice',black:'Bob',result:'*',
      correctionExercises:[
        {fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',bestUci:'e7e5',bestScoreCp:-8,bestMate:null,moveNumber:1,color:'b',playedSan:'d5',classification:'ok',lossCp:2.5},
        {fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',bestUci:'e2e4',bestScoreCp:12,bestMate:null,moveNumber:1,color:'w',playedSan:'f3',classification:'ok',lossCp:4.2}
      ]
    }]));
    gamesRenderPanel();
    reviewHistoryRender();
  });
  await expect(page.locator('.game-row [data-act="correct"]')).toBeVisible();
  await page.click('.game-row [data-act="correct"]');
  await expect(page.locator('#review-exercise-panel')).toBeVisible();
  await expect(page.locator('#review-exercise-heading')).toContainText('Exercice 1/2');
  await expect(page.locator('#review-exercise-prompt')).toContainText('1. f3');
  const boardInView=await page.locator('#board').evaluate(el=>{
    const box=el.getBoundingClientRect();
    return box.bottom>0&&box.top<window.innerHeight;
  });
  expect(boardInView).toBe(true);
  expect(await page.evaluate(()=>state.chess.fen())).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
});

test('resumes saved correction exercises from a profile link',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('supachess_reviewed_pgns',JSON.stringify([{
    id:'resume-game',pgn:'1. f3 e5',white:'Alice',black:'Bob',result:'*',correctionExercises:[{
      fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      bestUci:'e2e4',bestScoreCp:12,bestMate:null,moveNumber:1,color:'w',playedSan:'f3',classification:'ok',lossCp:4.2
    }]
  }])));
  await page.goto('/index.html?resume-exercises=resume-game');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready','1',{timeout:30000});
  await expect(page.locator('#review-exercise-panel')).toBeVisible({timeout:10000});
  await expect(page.locator('#review-exercise-heading')).toContainText('Exercice 1/1');
  expect(await page.evaluate(()=>reviewState.currentHeaders.White)).toBe('Alice');
});


test('opens PGN analysis from a profile link when no game is saved yet',async({page})=>{
  await page.goto('/index.html?open-review=1');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready','1',{timeout:30000});
  await expect(page.locator('#pgn-modal')).toBeVisible({timeout:10000});
  await expect(page.locator('#pgn-input')).toBeEmpty();
});
test('Stockfish completes a 67-halfmove PGN analysis and retries once after a worker failure',async({page})=>{
  test.setTimeout(150000);
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-engine-ready','1',{timeout:30000});
  const setup=await page.evaluate(()=>{
    const game=new Chess();
    const seen=new Set([game.fen()]);
    const sans=[];
    for(let ply=0;ply<67;ply++){
      const candidates=game.moves({verbose:true});
      let chosen=null;
      for(let offset=0;offset<candidates.length;offset++){
        const candidate=candidates[(ply*11+offset)%candidates.length];
        const played=game.move({from:candidate.from,to:candidate.to,promotion:candidate.promotion});
        const fen=game.fen();
        if(!game.game_over()&&!seen.has(fen)){
          chosen=played;
          seen.add(fen);
          break;
        }
        game.undo();
      }
      if(!chosen)throw new Error('Could not construct a 67-ply legal PGN at ply '+(ply+1));
      sans.push(chosen.san);
    }
    const pgn=sans.map((san,index)=>(index%2===0?(Math.floor(index/2)+1)+'. ':'')+san).join(' ')+' *';
    const parsed=new Chess();
    if(!parsed.load_pgn(pgn,{sloppy:true})||parsed.history().length!==67)throw new Error('Generated PGN did not contain 67 legal half-moves');
    document.getElementById('pgn-input').value=pgn;
    const originalAnalyze=state.engine.analyze.bind(state.engine);
    let injectFailure=true;
    state.engine.analyze=function(options){
      if(injectFailure){
        injectFailure=false;
        const error=new Error('Simulated temporary Stockfish worker failure');
        error.retryable=true;
        return Promise.reject(error);
      }
      return originalAnalyze(options);
    };
    window.__reviewProgress=[];
    const setProgress=reviewSetProgress;
    reviewSetProgress=function(text){
      window.__reviewProgress.push(text);
      setProgress(text);
    };
    window.__reviewResult=null;
    window.__reviewPromise=reviewRun({batch:true}).then(result=>{
      window.__reviewResult=result;
      return result;
    },error=>{
      window.__reviewResult=false;
      throw error;
    });
    return {plies:sans.length};
  });
  expect(setup.plies).toBe(67);
  await page.waitForFunction(()=>window.__reviewResult!==null,null,{timeout:120000});
  const result=await page.evaluate(()=>({
    ok:window.__reviewResult,
    moves:reviewState.moves.length,
    progress:window.__reviewProgress
  }));
  expect(result.ok).toBe(true);
  expect(result.moves).toBe(67);
  expect(result.progress).toContain('Stockfish ne répond pas au demi-coup 1/67 — redémarrage du moteur et nouvelle tentative…');
  expect(result.progress).toContain('Analyse Stockfish… coup 67/67');
  expect(result.progress.at(-1)).toBe('Analyse Stockfish terminée — bilan en cours…');
});
