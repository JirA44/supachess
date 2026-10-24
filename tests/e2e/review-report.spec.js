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
