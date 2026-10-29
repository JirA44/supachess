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
  await expect(page.locator('#review-exercise-feedback')).toContainText('Essaie une autre idée');
  await expect(page.locator('#btn-review-exercise-next')).toBeDisabled();

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
