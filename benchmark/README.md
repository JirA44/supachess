# SupaChess — Benchmark Lichess 1–8 et coaching tactique

## Périmètre de l'expérience

**8 niveaux × 100 parties réelles = 800 parties**, cadence **3+2** (180 secondes + 2 secondes par coup).
Pour chaque niveau : exactement 50 parties avec les Blancs et 50 avec les Noirs.
Le même participant, ou une cohorte explicitement identifiée, doit jouer toutes les
conditions; mélanger anonymement des joueurs de forces différentes détruit la comparaison.

Une partie Lichess jouée contre « Stockfish niveau 8 » est une observation d'un **bot
Lichess et de sa configuration au moment de la partie**, pas un étalonnage Elo FIDE.
Ne pas annoncer une conversion FIDE, Chess.com ou Elo moteur sans un protocole
d'étalonnage indépendant. Version serveur/bot éventuellement inconnue : la noter,
ne pas l'inventer.

Le script **n'organise aucune partie** et n'interagit avec aucun compte Lichess.
Il importe des PGN enregistrés et un manifeste déclaré par l'opérateur.
L'identité de l'adversaire et la cadence ne sont PAS vérifiées automatiquement contre
l'API Lichess; la provenance doit être auditée séparément à partir des URL de partie.
Un PGN sans URL vérifiée est un résultat **non authentifié**, même si son contenu est valide.

### Manifeste CSV

Chemin `benchmark/manifest.csv` (gabarit : `manifest.example.csv`) :

```csv
level,game_id,player_color,pgn_file
1,lichess-original-id-01,w,pgns/game01.pgn
1,lichess-original-id-02,b,pgns/game02.pgn
```

Chaque PGN contient une partie légale complète et un résultat final (1-0, 0-1 ou 1/2-1/2).
Ne pas utiliser des PGN fictifs pour le rapport final. L'application refuse les doublons,
les résultats incomplets, les parties illisibles et, par défaut, une distribution autre que
100 parties par niveau avec 50 Blancs/50 Noirs.

### Exécution sous Windows PowerShell 7

```powershell
cd C:\CHEMIN\VERS\supachess
python -m pip install python-chess
python benchmark/lichess_levels.py --manifest benchmark/manifest.csv --pgn-root benchmark --out benchmark/results.json
# ACPL reproductible avec le moteur d'analyse choisi (exemple de paramètres) :
python benchmark/lichess_levels.py --manifest benchmark/manifest.csv --pgn-root benchmark --out benchmark/results_with_acpl.json --uci "C:\CHEMIN\stockfish.exe" --depth 18 --threads 1 --hash-mb 64
# Diagnostics du module pédagogique (si npm install déjà fait) :
npm test
```

`--allow-incomplete` sert uniquement au développement : tout rapport partiel doit
mentionner explicitement `n<100` et ne constitue pas la campagne terminée.

### Métriques

- W/D/L compté du point de vue du joueur humain ; score moyen = (W+½D)/N.
- Intervalle de confiance 95 % de score : borne de concentration de Hoeffding,
  conservatrice pour les valeurs [0,1] ; Wilson 95 % séparément pour le
  **taux de victoires** (pas pour le score W+½D).
- ACPL : meilleur score moteur *avant* le coup moins score moteur *après* le
  coup joué, du point de vue du même joueur, tronqué à 0. Les positions où
  un mat est évalué sont exclues du calcul CP. Ne pas appeler ces exclusions
  des coups parfaits. ACPL du joueur humain uniquement, pondérée par le nombre
  de coups évaluables.
- Fixer l'exécutable du moteur d'analyse, le SHA256, la profondeur, Threads=1,
  Hash=64, la version de python-chess, le système, le processeur et
  la cadence. Stocker PGN bruts, SHA256 et rapport JSON ensemble.
- Pour interpréter les écarts entre niveaux, examiner l'IC et la dispersion
  par couleur. Répliquer sur d'autres sessions et séries d'ouvertures.
  Le logiciel ne calcule pas de classement Elo FIDE.

### Plan de reproductibilité

1. Conserver les URL des parties, dates, identifiants adversaires, cadences
   et résultats originaux; vérifier qu'il s'agit bien de niveaux Lichess.
2. Alterner les couleurs par niveau, contrebalancer l'ordre des niveaux,
   limiter les répétitions de lignes d'ouverture; définir les exclusions *avant*
   les parties (déconnexion, abandon technique).
3. Préenregistrer le participant, ses règles de jeu, sa disponibilité et
   son équipement. Refaire à matériel et connexion comparables.
4. Effectuer deux lectures : résultats W/D/L à partir des PGN et analyses
   Stockfish **après** les parties. Ne jamais utiliser les recommandations
   moteur pendant une partie jouée contre un humain ou un bot en ligne.
5. Produire un rapport non rempli tant que le manifeste des 800 parties
   n'est pas complet. Les analyses partielles doivent être marquées partielles.

## Coaching : erreurs observées, pas hallucinations

L'UI de SupaChess charge `js/blindspots.js` pendant l'analyse PGN.
Après chaque coup, le moteur de règles parcourt **les prises légalement disponibles
à l'adversaire immédiatement après le coup**. Il affiche notamment :

> Après ce coup, ta dame en d1 pouvait être prise immédiatement par ...Txd1.
> Avais-tu vérifié cette prise adverse avant de jouer ?

Une capture possible ne signifie pas une perte matérielle nette : l'échange,
les défenses, les clouages et les suites tactiques requièrent vérification.
La présence d'un diagnostic ne prouve pas non plus la *cause psychologique* :
on décrit ce que le joueur **n'a peut-être pas vu**, sans prétendre lire ses pensées.

L'objectif suivant est un profil pédagogique multi-parties : fréquence des
erreurs corroborées par Stockfish, motifs récurrents, exercices de remédiation,
réévaluation à 7/30 jours. Ne pas générer « tu ne sais pas calculer » à partir
d'un seul coup, ni étiqueter les utilisateurs sans incertitude.

## État et limites

Ce chantier ajoute une **première détection tactique** et un moteur de rapport PGN,
pas une IA pédagogique complète ni un résultat de 800 parties exécutées.
La force des niveaux Lichess est variable dans le temps. La récupération automatique
des PGN, la validation des métadonnées par API, la persistance des profils utilisateurs
et les évaluations E2E en navigateur sont encore à tester/intégrer.

## Explication pédagogique de chaque demi-coup

`js/centipawn-explanations.js` calcule deux grandeurs **distinctes** à partir
des meilleures lignes Stockfish obtenues avant et après le demi-coup :

- **Perte en centipions / meilleur coup** : `max(0, évaluation du meilleur coup
  avant − évaluation du coup réellement joué après)`, avec les deux scores
  ramenés du point de vue du joueur qui vient de jouer.
- **Variation brute de l'évaluation côté Blancs** : `score après − score avant`
  en gardant toujours la perspective des Blancs. Elle peut être positive alors
  que le coup des Noirs est mauvais, et elle **n'est pas** la perte centipion.

Ces nombres sont sensibles à la profondeur, au temps de recherche et aux versions
du moteur. Une évaluation de **mat** est affichée séparément et n'est jamais
transformée artificiellement en centipions. Si l'analyse manque, la valeur reste
**inconnue**, pas zéro.

Pour chaque demi-coup, l'interface présente la perte chiffrable, la variation
de score, le meilleur coup proposé par le moteur et les faits démontrés :
notamment captures adverses immédiatement légales. En absence de preuve,
le coach dit explicitement que la cause exacte n'est pas établie, plutôt que
de déclarer arbitrairement « faiblesse tactique » ou « mauvais plan ».

**À venir** : comparer des variantes suffisamment profondes (matériel à la fin
de la PV, changements de structure de pions, déséquilibres positionnels,
menaces tactiques), puis valider les explications sur un corpus étiqueté par
des entraîneurs. Une variation de centipions ne démontre pas à elle seule
la cause stratégique de la variation.

Vérification ciblée : `npm test` (Node, chess.js), puis tests navigateur.
