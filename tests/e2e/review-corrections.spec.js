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
      }]
    }]));
    reviewHistoryRender();
  });
  await expect(page.locator('#review-history-list')).toContainText('Corriger (1)');
  await page.click('#review-history-list [data-review-history-act="exercise"]');
  await expect(page.locator('#review-exercise-panel')).toBeVisible();
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