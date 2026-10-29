# Simulateur navigateur SupaChess

Le scénario Playwright ouvre une fenêtre Chrome headless et un profil vierge. Il ne lit pas les données locales du navigateur habituel et utilise une partie fictive avec deux exercices.

Depuis la racine du projet, après `npm ci` :

```powershell
npm run test:browser-simulator
```

Pour cibler une page publiée au lieu des fichiers locaux :

```powershell
$env:SUPACHESS_TEST_URL = "https://jira44.github.io/supachess/"
npm run test:browser-simulator
Remove-Item Env:SUPACHESS_TEST_URL
```

Si Playwright ne trouve pas Chromium, indique le chemin d’un Chrome installé :

```powershell
$env:SUPACHESS_CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run test:browser-simulator
Remove-Item Env:SUPACHESS_CHROME_PATH
```

Le scénario vérifie le rendu de l’échiquier, les boutons d’affichage, le refus d’un coup incorrect, l’acceptation de la bonne réponse, le passage au prochain exercice, la sortie du parcours, les erreurs JavaScript et les ressources manquantes. Il mesure aussi le débordement horizontal à 375, 768 et 1440 px. Les captures complètes sont produites dans `test/.scratch-browser-simulator/`.

L’analyse moteur et le contenu de test sont simulés. Ce scénario valide les interactions de l’interface; il ne certifie ni les évaluations Stockfish, ni les exercices réels de chaque partie, ni le rendu exact de chaque appareil iOS/Android.

