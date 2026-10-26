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
    reviewHistoryRender();
  });
  await expect(page.locator('#review-history-list')).toContainText('Corriger (2)');
  await page.click('#review-history-list [data-review-history-act="exercise"]');
  await expect(page.locator('#review-exercise-panel')).toBeVisible();
  const flipButton=page.locator('#btn-review-exercise-flip');
  await expect(flipButton).toHaveAttribute('aria-pressed','false');
  await flipButton.click();
  await expect(flipButton).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#board [data-square]').first()).toHaveAttribute('data-square','h8');
  await flipButton.click();
  await expect(flipButton).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#board [data-square]').first()).toHaveAttribute('data-square','a1');
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
  await expect(page.locator('#board [data-square]').first()).toHaveAttribute('data-square','h8');
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

test('offers reanalysis for a saved game without correction data',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('supachess_reviewed_pgns',JSON.stringify([{
      id:'legacy-game',pgn:'1. e4 e5',white:'Carol',black:'Dan',result:'*'
    }]));
    reviewHistoryRender();
  });
  await page.click('#review-history-list [data-review-history-act="reanalyze-corrections"]');
  await expect(page.locator('#pgn-modal')).toBeVisible();
  await expect(page.locator('#pgn-input')).toHaveValue('1. e4 e5');
});