const {test,expect}=require('@playwright/test');
test('progression utilisateur: erreurs, réussite, reprise et remise à zéro',async({page})=>{
 await page.goto('/learn-progressive.html');
 await expect(page.locator('#progress')).toHaveText('Étape 1 / 5');
 await expect(page.locator('#next')).toBeDisabled();
 await page.getByRole('button',{name:/B\) Le fou blanc c4/}).click();
 await expect(page.locator('#feedback')).toContainText('Pas encore');
 await expect(page.locator('#next')).toBeDisabled();
 await page.getByRole('button',{name:/A\) Le pion blanc e4/}).click();
 await expect(page.locator('#next')).toBeEnabled();
 await page.locator('#next').click();
 await expect(page.locator('#progress')).toHaveText('Étape 2 / 5');
 await page.reload();
 await expect(page.locator('#progress')).toHaveText('Étape 2 / 5');
 const answers=[1,0,1,1];
 for(const answer of answers){
   await page.locator('#choices button').nth(answer).click();
   await expect(page.locator('#feedback')).toContainText('Exact');
   await page.locator('#next').click();
 }
 await expect(page.locator('#feedback')).toContainText('Parcours terminé');
 await page.locator('#restart').click();
 await expect(page.locator('#progress')).toHaveText('Étape 1 / 5');
});
test('navigation depuis la leçon',async({page})=>{
 await page.goto('/learn-moves.html');
 await page.getByRole('link',{name:/Commencer les exercices progressifs/}).click();
 await expect(page).toHaveURL(/learn-progressive\.html$/);
});
test('page principale et navigation de base',async({page})=>{
 await page.goto('/index.html');
 await expect(page.locator('#board')).toBeVisible();
 await expect(page.getByRole('link',{name:/Apprendre à compter/})).toBeVisible();
});
