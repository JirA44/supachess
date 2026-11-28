# Routine du Jour (45 min) et Bouclier Anti-Gaffe

Deux outils d'entraînement ajoutés à l'accueil de SupaChess (`index.html`).
Tout est calculé et stocké **localement** dans le navigateur : aucune donnée
n'est envoyée à un serveur.

## 1. Routine du Jour — pourquoi

Jouer beaucoup ne suffit pas : il faut un parcours court, répété, et orienté
vers tes erreurs du moment. La Routine du Jour transforme 45 minutes en trois
étapes de 15 minutes, toujours dans le même ordre, avec une série (streak)
locale qui mesure la régularité et non la performance.

| Étape | Durée | Contenu | Ce qui est enregistré |
| --- | --- | --- | --- |
| 1. Leçon ciblée | 15 min | Une leçon du curriculum choisie selon la date (développement, centre, tactique, finales). La leçon est validée quand elle est terminée **le jour même**. | Progression de la leçon (`supachess-book-lessons-v1`) |
| 2. Woodpecker tactique | 15 min | Un lot **fixe de 50 puzzles** du site `supachess-web` (`TRAINING_TACTICS.html`), repris dans l'ordre. Les puzzles déjà résolus sont sautés. | Puzzles résolus (`supachess_tactics_v2`) et temps par puzzle |
| 3. Partie lente | 15 min | Une partie contre Stockfish au ralenti, cadences **10 min + 5 s** ou **15 min + 10 s**, puis l'analyse de la partie pour identifier les **2 moments de bascule**. | Partie dans l'historique + analyse |

### Utilisation

1. Bouton **Routine du Jour (45 min)** dans la barre de commandes de l'échiquier.
2. Le panneau s'ouvre : les trois étapes sont listées avec un compte à rebours.
3. **Démarrer / reprendre l'étape** lance le chrono de l'étape courante.
   **Pause** l'arrête sans perdre le temps déjà écoulé.
4. Chaque étape a son action propre : *Ouvrir la leçon*, *Ouvrir le puzzle*,
   *Lancer la partie lente*, *Ouvrir l'analyse*.
5. Une étape peut être passée (*Passer cette étape*) : elle compte alors comme
   faite mais reste marquée « passée » dans le panneau.

### Série (streak)

- La série compte les **jours consécutifs** où les trois étapes sont terminées.
- Elle est remise à zéro dès qu'un jour est sauté (calcul fait à chaque
  ouverture de la routine, pas seulement à la fin d'une journée).
- Tout est stocké dans `supachess-daily-routine-v1`, sur l'appareil.
- Une nouvelle journée repart avec un panneau vierge mais **conserve** l'historique
  des jours terminés.

### Limites assumées

- La série mesure la **régularité**, pas le niveau : terminer la routine chaque
  jour ne garantit aucun progrès.
- Le lot de puzzles est fixe : la répétition est volontaire, mais elle ne
  s'adapte pas à tes erreurs.
- Le minuteur est indicatif : il ne bloque pas l'étape, il l'affiche.
- La sélection de la leçon est déterministe par date, sans analyse de tes
  erreurs réelles.
- L'analyse de la partie lente dépend de l'analyse Stockfish disponible ; sans
  moteur prêt, l'étape 3 ne peut pas être validée par l'analyse.
- Le lien du Woodpecker pointe vers la page `TRAINING_TACTICS.html` du dépôt
  jume `supachess-web` (jamais modifié ici). Au clic, l'URL relative
  `../supachess-web/TRAINING_TACTICS.html` est testée : si elle ne répond pas
  (serveur local qui n'expose pas le dépôt jume), le bouton bascule
  automatiquement sur l'URL de production
  `https://jira44.github.io/supachess-web/TRAINING_TACTICS.html`.

## 2. Bouclier Anti-Gaffe — pourquoi

La faute la plus coûteuse en partie rapide est la prise d'une pièce qu'on ne
défend plus. Le Bouclier Anti-Gaffe vérifie **avant** que le coup soit joué
ce qui se passe sur l'échiquier après ton coup :

- une pièce de ton camp est attaquée et n'a **plus aucun défenseur** ;
- l'adversaire peut ** mater en un coup**.

Quand c'est le cas, le coup est bloqué et une alerte pédagogique s'affiche :
*Vérifie : Échecs / Prises / Menaces*. Deux sorties sont proposées :
**Revérifier et rejouer** (le coup n'est pas joué) et **Jouer quand même**
(le coup est joué et la partie est marquée « avec aides »).

### Quand est-il actif

Le bouclier est **désactivé par défaut**. Evenement activé, il reste inactif :

| Situation | Bouclier | Raison |
| --- | --- | --- |
| Interrupteur sur OFF | inactif | Choix de l'utilisateur |
| Diagnostic de niveau actif | inactif | Le diagnostic mesure le niveau sans aide |
| Partie « sans aide » | inactif | La partie doit rester sans aide |
| Blitz / rapide (1, 3 ou 5 minutes, pendules égaux) | inactif | La vérification slowing le jeu |
| Partie d'entraînement (cadence lente ou sans pendule) | **actif** | C'est le cadre prévu |

Le bouclier s'appuie sur un contrôle géométrique des cases attaquées. Il ne
détecte **pas** les pièces clouées : une pièce « attaquée » par un cavalier
épinglé peut être signalée à tort. C'est une aide pédagogique, pas une
vérité d'analyse : chaque alerte indique explicitement cette limite.

La vérification a un coût mesuré : environ 5 ms en ouverture et 20 ms en
partie moyenne dense sur CPU de bureau, probablement 2 à 3 fois plus sur
mobile. Le coup n'est donc affiché qu'après ce calcul (il n'y a pas d' Freeze
de l'interface, mais un court délai perceptible avant le coup sur téléphone).
C'est pourquoi le bouclier est désactivé par défaut et réservé aux parties
d'entraînement : en blitz ou en rapide, il n'est jamais actif.

### Conséquences sur les données

Une partie pendant laquelle le bouclier a servi est marquée **« avec aides »**
(`trainingAidsUsed`) : elle n'alimente pas le classement ni les statistiques de
joueur. C'est le même mécanisme que les bulles candidates, les flèches moteur
ou la barre d'évaluation.

## 3. Pendules : incrément de Fischer

Un nouveau réglage **Incrément** (sans incrément, +5 s, +10 s) est disponible
à côté des temps de réflexion. L'incrément est ajouté à ton pendule après
chaque coup joué, sans jamais dépasser le temps initial (10 minutes + 5 s =
5 minutes + 5 s après un coup rapide). Les réglages sont mémorisés et
s'appliquent à la prochaine partie.

## 4. Fichiers concernés

| Fichier | Rôle |
| --- | --- |
| `js/daily-routine.js` | Logique de la routine (série, étapes, minuteurs, lot de puzzles) et panneau d'interface. |
| `js/anti-blunder-shield.js` | Détection géométrique des pièces en prise et du mat en un, contexte d'activation, alerte. |
| `js/app.js` | Crochet du bouclier dans `attemptUserMove`, incrément de pendule, `SupaChessStartTrainingGame`, évènement `supachess:game-over`. |
| `index.html` | Bouton et panneau de la routine, interrupteur du bouclier, alerte, réglage d'incrément. |
| `css/style.css` | Styles du panneau de routine et de l'alerte. |
| `test/daily-routine.test.cjs` | Tests unitaires de la routine (26 assertions). |
| `test/anti-blunder-shield.test.cjs` | Tests unitaires du bouclier (11 assertions). |
| `test/routine-browser.mjs` | Test navigateur : ouverture du panneau, progression, bouclier en partie, persistance. |

## 5. Vérifications

```bash
npm test                        # 171 tests (node:test)
npm run test:routine-browser    # test navigateur Playwright des deux fonctions
```

Le test navigateur `npm run test:browser-simulator` échoue déjà sur `HEAD`
avant ces ajouts (le diagnostic de niveau, actif par défaut, désactive les
boutons que le simulateur clique) : cet échec est antérieur et sans rapport.
