/* Interactive lessons adapted from Capablanca and Larsen chess books. */
(function (root) {
  "use strict";

  const LARSEN_PDF = "https://masterinchess.com/Media/2024/07/Larsen%20Best%20Move%20Guide.pdf";
  const LESSONS = [
    {
      id: "capablanca-rook-king",
      level: "Avancé",
      title: "Couper le roi avec la tour",
      category: "Finale · Tour et roi contre roi",
      author: "J. R. Capablanca",
      program: "Capablanca · fondamentaux et principes",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, exemple 1, p. 11",
      fen: "7k/8/8/8/8/8/8/R6K w - - 0 1",
      color: "w",
      question: "Quel est l’objectif du premier coup de la tour ?",
      choices: [
        { text: "Limiter l’espace du roi adverse sur la rangée", correct: true },
        { text: "Échanger immédiatement la tour", correct: false },
        { text: "Avancer le roi blanc sans regarder le roi adverse", correct: false },
      ],
      principle: "La tour coupe d’abord le roi adverse; ensuite, le roi blanc vient aider la tour à le repousser.",
      transfer: "En finale, demande-toi si ta tour peut limiter le roi adverse avant de chercher un échec. Puis active ton roi sans laisser la tour perdre sa coupure.",
      hints: ["Cherche une rangée qui empêche le roi noir de descendre vers le centre.", "Le coup de tour du livre est Ra7."],
      sequence: [
        { side: "user", uci: "a1a7", explanation: "La tour barre la septième rangée et réduit les cases du roi noir." },
        { side: "book", uci: "h8g8", explanation: "Le roi noir quitte la rangée où la tour le confinait." },
        { side: "user", uci: "h1g2", explanation: "Le roi rejoint la tour: les deux pièces coopèrent pour repousser le roi adverse." },
      ],
    },
    {
      id: "capablanca-king-pawn",
      level: "Débutant",
      title: "Activer le roi avant le pion",
      category: "Finale · Roi et pion",
      author: "J. R. Capablanca",
      program: "Capablanca · fondamentaux et principes",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, p. 15",
      fen: "8/8/5k2/8/5K2/8/4P3/8 w - - 0 1",
      color: "w",
      question: "Que faut-il améliorer avant d’avancer le pion ?",
      choices: [
        { text: "La position du roi, tout en gardant le pion défendu", correct: true },
        { text: "La vitesse du pion, même s’il n’est plus protégé", correct: false },
        { text: "La position du roi adverse en échangeant les rois", correct: false },
      ],
      principle: "En finale, le roi est une pièce active. Fais-le progresser tant que le pion reste en sécurité; pousse le pion quand la position l’exige.",
      transfer: "Avant de pousser un pion passé, vérifie l’activité des deux rois, l’opposition et si ton roi peut soutenir la case de promotion.",
      hints: ["Le roi blanc peut avancer vers le centre sans abandonner la défense du pion e2.", "Le premier coup illustré est Ke4."],
      sequence: [
        { side: "user", uci: "f4e4", explanation: "Le roi gagne une case centrale tout en gardant le pion e2 sous protection." },
        { side: "book", uci: "f6e6", explanation: "Le roi noir se rapproche du centre pour contester l’activité du roi blanc." },
        { side: "user", uci: "e2e3", explanation: "Le pion avance maintenant pour libérer la route du roi et rester défendu." },
      ],
    },
    {
      id: "larsen-center-break",
      level: "Avancé",
      title: "Trouver le moment de jouer …d5",
      category: "Milieu de jeu · Plan et centre",
      author: "Bent Larsen",
      book: "Bent Larsen’s Good Move Guide",
      reference: "Part III, game 12, pp. 74–75",
      url: LARSEN_PDF,
      setup: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nxc6", "bxc6", "Bd3"],
      color: "b",
      question: "Après Bd3, quel plan noir conteste le centre blanc ?",
      choices: [
        { text: "Ouvrir le centre par …d5", correct: true },
        { text: "Reculer toutes les pièces vers la dernière rangée", correct: false },
        { text: "Échanger le fou actif contre un pion de l’aile", correct: false },
      ],
      principle: "Quand l’adversaire installe un centre de pions, un coup central au bon moment peut éviter de subir son espace.",
      transfer: "Face à un centre adverse, cherche une rupture centrale et calcule les échanges qui en découlent. Un principe guide l’analyse; il ne remplace pas le calcul des variantes.",
      hints: ["Le pion d7 peut avancer de deux cases et attaquer le centre.", "La ligne du livre commence par …d5, puis répond à e5 par …Ng4."],
      sequence: [
        { side: "user", uci: "d7d5", explanation: "Le pion noir conteste immédiatement le centre au lieu d’attendre que les Blancs le consolident." },
        { side: "book", uci: "e4e5", explanation: "Le pion blanc avance et ferme le centre, ce qui change les cases disponibles." },
        { side: "user", uci: "f6g4", explanation: "Après la fermeture du centre, le cavalier prend une case active et met la pression sur le camp blanc." },
        { side: "book", uci: "c1f4", explanation: "Le fou blanc se développe sur une diagonale active." },
        { side: "user", uci: "f8c5", explanation: "Le fou se développe sur une diagonale active, conformément à la suite de Larsen." },
      ],
    },
      {"id":"develop-before-attack","title":"Développer avant l’attaque","category":"Ouverture · Développement","level":"Débutant","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Débutant","setup":["e4","e5"],"color":"w","question":"Quel coup développe une pièce tout en préparant le roque ?","choices":[{"text":"Développer le cavalier vers le centre","correct":true},{"text":"Avancer un pion de l’aile sans raison","correct":false},{"text":"Sortir la dame pour chasser un pion","correct":false}],"principle":"Le cavalier f3 contrôle des cases centrales et aide à préparer le roque. Un développement utile crée des options sans lancer une attaque prématurée.","transfer":"À l’ouverture, développe une pièce vers le centre, puis vérifie la sécurité du roi avant d’ouvrir le jeu.","hints":["Le cavalier g1 peut attaquer le pion e5.","Le coup de développement est Cf3."],"sequence":[{"side":"user","uci":"g1f3","explanation":"Le cavalier se développe vers le centre et attaque le pion e5."},{"side":"book","uci":"b8c6","explanation":"Le cavalier noir défend e5 et occupe une case centrale."},{"side":"user","uci":"f1c4","explanation":"Le fou vise le centre et complète le développement."}]},
    {"id":"castle-safely","title":"Roi à l’abri, pièces en jeu","category":"Ouverture · Sécurité du roi","level":"Débutant","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Débutant","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6"],"color":"w","question":"Quel coup met le roi à l’abri et active une tour ?","choices":[{"text":"Roquer côté roi","correct":true},{"text":"Pousser un pion devant le roi","correct":false},{"text":"Jouer plusieurs coups de dame","correct":false}],"principle":"Le petit roque met le roi derrière ses pions et amène la tour f1 vers le centre.","transfer":"Avant d’attaquer, demande-toi si ton roi est en sécurité et si le roque est encore possible.","hints":["Le roi blanc peut aller en g1 avec la tour h1.","Le coup est le petit roque."],"sequence":[{"side":"user","uci":"e1g1","explanation":"Le roi se met à l’abri et la tour rejoint la colonne f."},{"side":"book","uci":"f8c5","explanation":"Le fou noir sort sur une diagonale active."},{"side":"user","uci":"d2d3","explanation":"Le pion soutient le centre et ouvre la diagonale du fou c1."}]},
    {"id":"central-recapture","title":"Reprendre vers le centre","category":"Ouverture · Structure de pions","level":"Débutant","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Débutant","setup":["e4","c5","Nf3","d6","d4","cxd4"],"color":"w","question":"Quelle pièce reprend le pion central ?","choices":[{"text":"Le cavalier f3 reprend en d4","correct":true},{"text":"La dame reprend en d4","correct":false},{"text":"Ignorer le pion et jouer un coup d’aile","correct":false}],"principle":"Le cavalier reprend en développant une pièce vers le centre. La dame reste à l’abri d’un gain de tempo.","transfer":"Après une prise, compare les recaptures : développement, contrôle central et sécurité de la pièce qui reprend.","hints":["Le cavalier f3 peut atteindre d4.","Choisis la reprise qui développe une pièce."],"sequence":[{"side":"user","uci":"f3d4","explanation":"Le cavalier reprend le pion en occupant une case centrale."},{"side":"book","uci":"g8f6","explanation":"Le cavalier noir se développe et attaque le pion e4."},{"side":"user","uci":"b1c3","explanation":"Le second cavalier renforce le contrôle du centre."}]},
    {"id":"trade-not-retreat","title":"Répondre à l’attaque du fou","category":"Ouverture · Gain de temps","level":"Débutant","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Débutant","setup":["e4","e5","Nf3","Nc6","Bb5"],"color":"b","question":"Comment gagner du temps sur le fou tout en développant ?","choices":[{"text":"Jouer …a6 puis développer le cavalier","correct":true},{"text":"Déplacer un pion devant le roi","correct":false},{"text":"Échanger une pièce sans calculer","correct":false}],"principle":"…a6 demande au fou de choisir une case; …Cf6 développe ensuite une pièce avec une menace sur e4.","transfer":"Quand une pièce adverse est avancée, cherche un coup utile qui la questionne sans retarder ton propre développement.","hints":["Un pion peut attaquer le fou b5 depuis a7.","Le coup est …a6."],"sequence":[{"side":"user","uci":"a7a6","explanation":"Le pion demande au fou blanc de préciser sa case."},{"side":"book","uci":"b5a4","explanation":"Le fou se replie en gardant la pression sur la diagonale."},{"side":"user","uci":"g8f6","explanation":"Le cavalier se développe et attaque le pion e4."}]},
    {"id":"knight-fork","title":"Fourchette avec tempo","category":"Tactique · Fourchette","level":"Intermédiaire","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Intermédiaire","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Nxd5"],"color":"w","question":"Quel coup attaque deux pièces à la fois ?","choices":[{"text":"Le cavalier prend f7","correct":true},{"text":"Reculer le cavalier en h3","correct":false},{"text":"Échanger le fou contre le cavalier c6","correct":false}],"principle":"Le cavalier en f7 attaque la dame d8 et la tour h8. La suite montre que le roi peut reprendre; il faut calculer la réponse avant de jouer.","transfer":"Une fourchette n’est utile que si tu as calculé les prises et les cases de sortie des pièces attaquées.","hints":["Le cavalier g5 peut prendre le pion f7.","Après la prise, vérifie les menaces sur la dame et la tour."],"sequence":[{"side":"user","uci":"g5f7","explanation":"Le cavalier attaque simultanément la dame d8 et la tour h8."},{"side":"book","uci":"e8f7","explanation":"Le roi reprend le cavalier: cette réponse est à intégrer au calcul."},{"side":"user","uci":"d1f3","explanation":"La dame donne échec sur la colonne f et poursuit l’attaque."}]},
    {"id":"relative-pin","title":"Clouer avant de pousser","category":"Tactique · Clouage relatif","level":"Intermédiaire","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Intermédiaire","setup":["e4","e5","Nf3","Nc6","Bc4","Bc5","d3","Nf6","Nc3","d6"],"color":"w","question":"Quel plan met une pression sur le cavalier f6 ?","choices":[{"text":"Placer le fou en g5","correct":true},{"text":"Échanger le fou c4 contre le fou c5","correct":false},{"text":"Pousser les pions de l’aile sans développer","correct":false}],"principle":"Le fou g5 attaque le cavalier f6; celui-ci est lié à la dame d8 sur la diagonale vers le roi.","transfer":"Un clouage relatif vise une pièce importante derrière la pièce attaquée. Vérifie toujours si la pièce clouée peut bouger sans conséquence.","hints":["La diagonale c1–g5 est libre.","Le fou peut attaquer le cavalier f6 depuis g5."],"sequence":[{"side":"user","uci":"c1g5","explanation":"Le fou attaque le cavalier f6, placé devant la dame noire."},{"side":"book","uci":"h7h6","explanation":"Le pion demande au fou de choisir entre échange et retrait."},{"side":"user","uci":"g5h4","explanation":"Le fou se retire tout en conservant sa pression à distance."}]},
    {"id":"central-break","title":"Ouvrir le centre au bon moment","category":"Plan · Rupture centrale","level":"Intermédiaire","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Intermédiaire","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6"],"color":"w","question":"Quel coup conteste le centre noir et libère des lignes ?","choices":[{"text":"Pousser d4","correct":true},{"text":"Pousser a3","correct":false},{"text":"Reculer le fou sans raison","correct":false}],"principle":"d4 attaque le pion e5 et ouvre des lignes si les pions centraux s’échangent.","transfer":"Avant une rupture, calcule les prises possibles et vérifie quelles pièces profiteront des lignes ouvertes.","hints":["Le pion d2 peut avancer de deux cases.","Cherche un coup qui attaque e5 et libère le fou c1."],"sequence":[{"side":"user","uci":"d2d4","explanation":"Le pion attaque e5 et ouvre le centre à une éventuelle prise."},{"side":"book","uci":"e5d4","explanation":"Le pion noir prend en d4."},{"side":"user","uci":"f3d4","explanation":"Le cavalier reprend en d4 et occupe le centre."}]},
    {"id":"bishop-retreat","title":"Choisir une retraite utile","category":"Ouverture · Conservation des pièces","level":"Intermédiaire","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Intermédiaire","setup":["e4","e5","Nf3","Nc6","Bb5","a6"],"color":"w","question":"Quelle case garde le fou actif après …a6 ?","choices":[{"text":"Reculer en a4","correct":true},{"text":"Échanger en c6 sans regarder la position","correct":false},{"text":"Reculer en h4","correct":false}],"principle":"Ba4 préserve le fou et garde la diagonale vers le centre; il n’est pas nécessaire d’échanger immédiatement.","transfer":"Quand une pièce est attaquée, compare les retraites qui gardent son activité et les échanges qui changent la structure.","hints":["Le fou peut suivre la diagonale b5–a4.","La retraite en a4 garde la pression sur e8."],"sequence":[{"side":"user","uci":"b5a4","explanation":"Le fou se retire en gardant sa diagonale vers le centre."},{"side":"book","uci":"g8f6","explanation":"Le cavalier noir se développe en attaquant le pion e4."},{"side":"user","uci":"e1g1","explanation":"Les Blancs mettent le roi à l’abri avant de poursuivre le plan."}]},
    {"id":"intermezzo-check","title":"L’échec intermédiaire","category":"Tactique · Coup intermédiaire","level":"Avancé","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Avancé","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Na5"],"color":"w","question":"Avant de reprendre une pièce, quel coup force une réponse ?","choices":[{"text":"Donner échec par Fb5+","correct":true},{"text":"Reprendre immédiatement en c6","correct":false},{"text":"Déplacer la dame sans menace","correct":false}],"principle":"Fb5+ exploite la diagonale libérée par le cavalier qui a quitté c6. Après …c6, le pion d5 peut reprendre en c6.","transfer":"Dans une séquence de prises, cherche un échec ou une menace intermédiaire qui change l’ordre des échanges.","hints":["Le fou c4 peut aller en b5.","Le cavalier noir a quitté c6, libérant la diagonale vers le roi e8."],"sequence":[{"side":"user","uci":"c4b5","explanation":"Le fou donne échec sur la diagonale désormais ouverte."},{"side":"book","uci":"c7c6","explanation":"Le pion bloque l’échec et attaque le fou."},{"side":"user","uci":"d5c6","explanation":"Le pion reprend en c6 pendant que le fou est encore attaqué."}]},
    {"id":"rook-file","title":"Placer la tour sur la colonne utile","category":"Plan · Coordination des pièces","level":"Avancé","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Avancé","setup":["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6","O-O","Be7"],"color":"w","question":"Quel coup relie le roi à la tour et prépare la colonne e ?","choices":[{"text":"Jouer Te1","correct":true},{"text":"Pousser h4 immédiatement","correct":false},{"text":"Reculer le cavalier en g1","correct":false}],"principle":"Te1 place la tour derrière le pion e et prépare son soutien si le centre s’ouvre.","transfer":"Après le roque, cherche une colonne où la tour peut soutenir un pion ou une pièce active.","hints":["La tour f1 peut aller en e1.","La tour peut soutenir le pion e4."],"sequence":[{"side":"user","uci":"f1e1","explanation":"La tour soutient le pion e4 et se place sur une colonne centrale."},{"side":"book","uci":"e8g8","explanation":"Le roi noir roque et met la tour h8 en jeu."},{"side":"user","uci":"b1c3","explanation":"Le cavalier rejoint le centre pour renforcer e4 et d5."}]},
    {"id":"improve-piece","title":"Améliorer la pièce la moins active","category":"Plan · Repositionnement","level":"Avancé","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Avancé","setup":["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6","O-O","Be7","Re1","b5"],"color":"w","question":"Comment garder le fou tout en choisissant une diagonale durable ?","choices":[{"text":"Le replier en b3","correct":true},{"text":"L’échanger contre le cavalier c6","correct":false},{"text":"Le ramener en c2 sans nécessité","correct":false}],"principle":"Bb3 conserve le fou et le place sur une diagonale qui regarde le roi et le centre.","transfer":"Dans une position calme, repère ta pièce la moins active et cherche une case plus utile sans affaiblir ton roi.","hints":["Le fou a4 peut reculer sur la diagonale vers b3.","Le pion b5 attaque le fou."],"sequence":[{"side":"user","uci":"a4b3","explanation":"Le fou se retire sur une diagonale active."},{"side":"book","uci":"d7d6","explanation":"Le pion renforce e5 et ouvre la diagonale du fou c8."},{"side":"user","uci":"c2c3","explanation":"Le pion prépare un centre stable et libère la case c2 pour une pièce."}]},
    {"id":"calculate-before-capture","title":"Calculer avant de capturer","category":"Calcul · Sécurité tactique","level":"Expert","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Expert","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Nxd5"],"color":"w","question":"Après …Cxd5, que faut-il vérifier avant de prendre f7 ?","choices":[{"text":"Les réponses forcées du roi et les menaces sur les pièces lourdes","correct":true},{"text":"Uniquement la valeur du pion","correct":false},{"text":"Le nombre de pièces déjà développées","correct":false}],"principle":"Nxf7 crée une fourchette, mais …Kxf7 reprend le cavalier. La valeur du motif dépend des suites calculées, pas du seul coup spectaculaire.","transfer":"Avant toute combinaison, calcule les réponses forcées jusqu’à une position que tu peux évaluer; ne t’arrête pas à la première menace.","hints":["Le cavalier g5 peut prendre f7.","Calcule la reprise du roi puis cherche un échec utile."],"sequence":[{"side":"user","uci":"g5f7","explanation":"Le cavalier attaque la dame et la tour, mais il peut être repris."},{"side":"book","uci":"e8f7","explanation":"Le roi prend le cavalier: cette réponse doit être prévue."},{"side":"user","uci":"d1f3","explanation":"La dame donne échec au roi f7; évalue alors la suite et le matériel."}]},
    {
      "id": "pgn-queen-capture-knight",
      "kind": "reinforcement",
      "level": "Débutant",
      "title": "La dame laissée en prise",
      "category": "PGN d’entraînement · pièces en prise",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN SupaChess–Stockfish · 29 janvier 2026 · fichier game_20260129_172220.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172220.pgn",
      "fen": "rnbqkb1r/pppppppp/5n2/8/6Q1/4P3/PPPP1PPP/RNB1KBNR b KQkq - 2 2",
      "color": "b",
      "question": "Dans cette partie, quelle capture noire prend la dame blanche en g4 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cxg4",
          "correct": true
        },
        {
          "text": "Jouer Cc6",
          "correct": false
        },
        {
          "text": "Jouer Ca6",
          "correct": false
        }
      ],
      "principle": "Après 2. Dg4, la dame blanche se trouve sur une case attaquable par le cavalier noir f6. Le coup du PGN gagne la dame : avant chaque demi-coup, contrôler les pièces adverses qui peuvent capturer une pièce de grande valeur.",
      "transfer": "Repérer immédiatement la pièce adverse capable de prendre la dame.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Après 2. Dg4, la dame blanche se trouve sur une case attaquable par le cavalier noir f6. Le coup du PGN gagne la dame : avant chaque demi-coup, contrôler les pièces adverses qui peuvent capturer une pièce de grande valeur.",
      "hints": [
        "La dame blanche est restée en g4 : regarde les coups de cavalier noirs.",
        "Cherche une capture du cavalier f6 sur la case g4."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "f6g4",
          "explanation": "Le cavalier f6 capture la dame en g4. Ce coup gagne la pièce la plus précieuse sans détour."
        }
      ]
    },
    {
      "id": "pgn-win-queen-bishop",
      "kind": "reinforcement",
      "level": "Débutant",
      "title": "Prendre la dame après un échec",
      "category": "PGN d’entraînement · diagonales",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN SupaChess–Stockfish · 29 janvier 2026 · fichier game_20260129_172151.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172151.pgn",
      "fen": "rnbqkbnr/pp3ppp/2p1Q3/1B1pp3/8/4P3/PPPP1PPP/RNB1K1NR b KQkq - 1 4",
      "color": "b",
      "question": "La dame blanche vient en e6 avec échec. Quel coup noir la capture ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Fxe6",
          "correct": true
        },
        {
          "text": "Jouer De7",
          "correct": false
        },
        {
          "text": "Jouer Fe7",
          "correct": false
        }
      ],
      "principle": "Le pion d7 a quitté sa case pour aller en d5, ce qui ouvre la diagonale du fou c8 vers e6. Le fait de donner échec ne rend pas la dame intouchable : calcule les captures adverses après tout coup forcing.",
      "transfer": "Vérifier si une pièce qui donne échec peut être capturée.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le pion d7 a quitté sa case pour aller en d5, ce qui ouvre la diagonale du fou c8 vers e6. Le fait de donner échec ne rend pas la dame intouchable : calcule les captures adverses après tout coup forcing.",
      "hints": [
        "L’échec ne protège pas automatiquement la pièce qui le donne.",
        "Vérifie la diagonale du fou c8, libérée par le pion d7."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "c8e6",
          "explanation": "Le fou c8 suit la diagonale d7–e6 et capture la dame."
        }
      ]
    },
    {
      "id": "pgn-knight-fork-rook-king",
      "kind": "reinforcement",
      "level": "Intermédiaire",
      "title": "La fourchette du cavalier en c2",
      "category": "PGN d’entraînement · fourchette",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN SupaChess–Stockfish · 29 janvier 2026 · fichier game_20260129_172151.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172151.pgn",
      "fen": "r2q1bnr/pp1k1ppp/4b3/1N1pp3/Pn6/4P3/1PPP1PPP/R1B1K1NR b KQ - 4 8",
      "color": "b",
      "question": "Après 8. Cb5, quel échec de cavalier attaque le roi e1 et la tour a1 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cxc2+",
          "correct": true
        },
        {
          "text": "Jouer Tb8",
          "correct": false
        },
        {
          "text": "Jouer Tc8",
          "correct": false
        }
      ],
      "principle": "Le cavalier noir b4 peut sauter en c2 avec échec. Depuis c2, il attaque aussi la tour a1 : si le roi répond, le cavalier peut ensuite prendre la tour. C’est une fourchette royale, préparée par le coup précédent ...Cb4.",
      "transfer": "Calculer un échec de cavalier qui attaque aussi une tour.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le cavalier noir b4 peut sauter en c2 avec échec. Depuis c2, il attaque aussi la tour a1 : si le roi répond, le cavalier peut ensuite prendre la tour. C’est une fourchette royale, préparée par le coup précédent ...Cb4.",
      "hints": [
        "Le cavalier noir b4 a une entrée qui donne échec.",
        "Après l’échec, vérifie quelles pièces le cavalier attaque depuis c2."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "b4c2",
          "explanation": "Le cavalier b4 prend le pion c2 avec échec et attaque simultanément la tour a1."
        },
        {
          "side": "book",
          "uci": "e1e2",
          "explanation": "Le roi doit répondre à l’échec; la tour a1 reste attaquée."
        },
        {
          "side": "user",
          "uci": "c2a1",
          "explanation": "Le cavalier prend la tour a1 et matérialise la fourchette."
        }
      ]
    },
    {
      "id": "pgn-mate-after-g6",
      "kind": "reinforcement",
      "level": "Débutant",
      "title": "Punir le pion qui ouvre le roi",
      "category": "PGN d’entraînement · mat en un",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN Stockfish–SupaChess · 29 janvier 2026 · fichier game_20260129_172154.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172154.pgn",
      "fen": "rnbqkbnr/ppppp3/6pp/5P1Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 4",
      "color": "w",
      "question": "Après 3…g6, quel coup de dame termine la partie ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Dxg6#",
          "correct": true
        },
        {
          "text": "Jouer f6",
          "correct": false
        },
        {
          "text": "Jouer fxg6",
          "correct": false
        }
      ],
      "principle": "Le pion g6 bloque la diagonale de la dame vers le roi, mais il devient une cible et ne crée pas de case de fuite. La dame prend le pion avec échec et mat. Après chaque réponse à un échec, cherche les coups de mat adverses.",
      "transfer": "Repérer le mat immédiat après une défense qui bloque la diagonale.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le pion g6 bloque la diagonale de la dame vers le roi, mais il devient une cible et ne crée pas de case de fuite. La dame prend le pion avec échec et mat. Après chaque réponse à un échec, cherche les coups de mat adverses.",
      "hints": [
        "Le pion qui vient de bloquer la diagonale est-il défendu ?",
        "Cherche une capture de dame qui donne échec, puis vérifie toutes les cases du roi."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "h5g6",
          "explanation": "La dame prend le pion g6 et fait mat : le roi noir n’a aucune case de fuite ni pièce capable de capturer la dame."
        }
      ]
    },
    {
      "id": "pgn-capture-unprotected-bishop",
      "kind": "reinforcement",
      "level": "Débutant",
      "title": "Reprendre le fou arrivé en h6",
      "category": "PGN d’entraînement · pièce en prise",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN SupaChess–Stockfish · 29 janvier 2026 · fichier game_20260129_172204.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172204.pgn",
      "fen": "rnbq1b1r/pp1pnkpp/4p2B/1B6/3pP3/8/PPP2PPP/RN2K1NR b KQ - 1 6",
      "color": "b",
      "question": "Le fou blanc vient en h6 sans protection. Quel pion noir le capture ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer gxh6",
          "correct": true
        },
        {
          "text": "Jouer Cbc6",
          "correct": false
        },
        {
          "text": "Jouer Ca6",
          "correct": false
        }
      ],
      "principle": "Le pion noir g7 peut prendre le fou en h6. Avant de répondre à une menace ou de poursuivre son plan, faire le contrôle des pièces laissées en prise sur la dernière destination.",
      "transfer": "Contrôler les prises possibles après un coup adverse.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le pion noir g7 peut prendre le fou en h6. Avant de répondre à une menace ou de poursuivre son plan, faire le contrôle des pièces laissées en prise sur la dernière destination.",
      "hints": [
        "Le fou blanc a quitté sa diagonale pour se placer en h6.",
        "Vérifie si le pion g7 peut capturer sur h6."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "g7h6",
          "explanation": "Le pion g7 prend le fou en h6. La pièce blanche n’est pas protégée par une autre pièce."
        }
      ]
    },
    {
      "id": "pgn-open-file-mating-attack",
      "kind": "reinforcement",
      "level": "Intermédiaire",
      "title": "Ouvrir la colonne devant le roi",
      "category": "PGN d’entraînement · attaque du roi",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN Stockfish–SupaChess · 29 janvier 2026 · fichier game_20260129_172208.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172208.pgn",
      "fen": "r1bqkbnr/p1ppp2p/np4p1/5P1Q/3P4/2N5/PPP2PPP/R1B1KBNR w KQkq - 0 6",
      "color": "w",
      "question": "Dans la partie, quel coup de pion blanc prend g6 et prépare l’attaque sur h7 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer fxg6",
          "correct": true
        },
        {
          "text": "Jouer f6",
          "correct": false
        },
        {
          "text": "Jouer Dxg6+",
          "correct": false
        }
      ],
      "principle": "Le pion f5 prend le pion g6 et libère l’avancée vers h7. Après ...Rb8, le PGN se termine par gxh7#. Leçon : ne pas regarder seulement l’échec actuel; repérer la menace concrète créée au demi-coup suivant.",
      "transfer": "Reconnaître comment une prise de pion prépare une menace de mat.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le pion f5 prend le pion g6 et libère l’avancée vers h7. Après ...Rb8, le PGN se termine par gxh7#. Leçon : ne pas regarder seulement l’échec actuel; repérer la menace concrète créée au demi-coup suivant.",
      "hints": [
        "La dame blanche est déjà en h5; repère le pion avancé en f5.",
        "Quel coup du pion f5 capture g6 et menace ensuite h7 ?"
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "f5g6",
          "explanation": "Le pion f5 prend g6 et ouvre la voie à la menace sur h7."
        },
        {
          "side": "book",
          "uci": "a8b8",
          "explanation": "Les Noirs jouent ...Rb8 et ne répondent pas à la menace directe."
        },
        {
          "side": "user",
          "uci": "g6h7",
          "explanation": "Le pion prend h7 et fait mat."
        }
      ]
    },
    {
      "id": "pgn-diagonal-mate-h5",
      "kind": "reinforcement",
      "level": "Débutant",
      "title": "La diagonale vers le roi sans abri",
      "category": "PGN d’entraînement · mat en un",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "PGN Stockfish–SupaChess · 29 janvier 2026 · fichier game_20260129_172225.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "game_20260129_172225.pgn",
      "fen": "rnbqkbnr/2ppp3/p4p1p/1p4p1/P2PP2P/4B3/1PP2PP1/RN1QKBNR w KQkq - 0 6",
      "color": "w",
      "question": "Après 5…f6, quel coup de dame donne mat ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Dh5#",
          "correct": true
        },
        {
          "text": "Jouer a5",
          "correct": false
        },
        {
          "text": "Jouer axb5",
          "correct": false
        }
      ],
      "principle": "La poussée ...f6 n’empêche pas l’échec sur la diagonale et ne crée aucune fuite pour le roi noir. La dame va en h5 et fait mat. Avant de pousser un pion devant son roi, contrôler les diagonales ouvertes et les cases de fuite.",
      "transfer": "Repérer une diagonale devenue mortelle après une poussée de pion.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. La poussée ...f6 n’empêche pas l’échec sur la diagonale et ne crée aucune fuite pour le roi noir. La dame va en h5 et fait mat. Avant de pousser un pion devant son roi, contrôler les diagonales ouvertes et les cases de fuite.",
      "hints": [
        "Le pion f6 ne ferme pas la diagonale h5–e8.",
        "Cherche un échec de dame sur cette diagonale et confirme le mat."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "d1h5",
          "explanation": "La dame vient en h5 et fait mat le long de la diagonale vers le roi e8."
        }
      ]
    },
    {
      "id": "pgn-carlsen-central-capture",
      "kind": "reinforcement",
      "level": "Intermédiaire",
      "title": "Carlsen : calculer la reprise au centre",
      "category": "PGN Carlsen · calcul de captures",
      "author": "SupaChess Académie",
      "program": "Carlsen · amélioration et conversion",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Magnus Carlsen–Deepan Chakkravarthy · Dubai, 2004 · coup joué · fichier carlsen_vs_deepan_2004.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "carlsen_vs_deepan_2004.pgn",
      "fen": "r1bqkb1r/pp3ppp/2p2n2/2p1p3/4P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 6",
      "color": "w",
      "question": "Dans la partie Carlsen–Deepan, quel cavalier prend le pion e5 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cxe5",
          "correct": true
        },
        {
          "text": "Jouer Ca4",
          "correct": false
        },
        {
          "text": "Jouer Cb5",
          "correct": false
        }
      ],
      "principle": "Carlsen joue Cxe5. La partie continue par ...Cxe4 puis Cxe4 : il faut calculer la reprise adverse et sa propre reprise avant de conclure que la capture est sûre. Cette leçon étudie la séquence jouée, sans prétendre que le coup est l’unique meilleur choix moteur.",
      "transfer": "Calculer les reprises avant de prendre un pion central.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Carlsen joue Cxe5. La partie continue par ...Cxe4 puis Cxe4 : il faut calculer la reprise adverse et sa propre reprise avant de conclure que la capture est sûre. Cette leçon étudie la séquence jouée, sans prétendre que le coup est l’unique meilleur choix moteur.",
      "hints": [
        "Le pion e5 est attaqué; calcule la réponse noire sur e4.",
        "Vérifie si les Blancs peuvent reprendre après ...Cxe4."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "f3e5",
          "explanation": "Le cavalier f3 prend le pion e5."
        },
        {
          "side": "book",
          "uci": "f6e4",
          "explanation": "Le cavalier noir prend le pion e4 et crée du contre-jeu."
        },
        {
          "side": "user",
          "uci": "c3e4",
          "explanation": "Le cavalier c3 reprend le cavalier noir en e4."
        }
      ]
    },
    {
      "id": "pgn-nezhmetdinov-forcing-combination",
      "kind": "reinforcement",
      "level": "Expert",
      "title": "Nezhmetdinov : calculer la combinaison forcing",
      "category": "PGN Nezhmetdinov · sacrifices et échecs",
      "author": "SupaChess Académie",
      "program": "Tal · tactique et sacrifices à calculer",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Nezhmetdinov–Chernikov · championnat de la RSFSR, 1962 · coup joué · fichier nezhmetdinov_vs_chernikov_1962.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "nezhmetdinov_vs_chernikov_1962.pgn",
      "fen": "3q2k1/p1r2p2/3p2p1/1p2r1N1/3BPP2/1B5R/PPP3PP/5K2 w - - 2 28",
      "color": "w",
      "question": "Dans la partie Nezhmetdinov–Chernikov, quel échec lance la combinaison ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Fxf7+",
          "correct": true
        },
        {
          "text": "Jouer Ce6",
          "correct": false
        },
        {
          "text": "Jouer Cxf7",
          "correct": false
        }
      ],
      "principle": "Fxf7+ lance une suite d’échecs et de sacrifices calculée jusqu’à Nxd8, qui prend la dame noire. Il faut vérifier chaque réponse forcée du roi et ne pas juger le premier sacrifice isolément. C’est la combinaison réellement jouée dans le PGN.",
      "transfer": "Suivre une suite forcing sans s’arrêter au premier sacrifice.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Fxf7+ lance une suite d’échecs et de sacrifices calculée jusqu’à Nxd8, qui prend la dame noire. Il faut vérifier chaque réponse forcée du roi et ne pas juger le premier sacrifice isolément. C’est la combinaison réellement jouée dans le PGN.",
      "hints": [
        "Cherche un échec qui attire la tour noire sur une case calculée.",
        "La combinaison doit se terminer par un échec de cavalier qui attaque la dame d8."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "b3f7",
          "explanation": "Le fou prend f7 avec échec et force la réponse de la tour."
        },
        {
          "side": "book",
          "uci": "c7f7",
          "explanation": "La tour prend le fou en f7."
        },
        {
          "side": "user",
          "uci": "h3h8",
          "explanation": "La tour arrive en h8 avec échec, forçant le roi à la capturer."
        },
        {
          "side": "book",
          "uci": "g8h8",
          "explanation": "Le roi prend la tour en h8."
        },
        {
          "side": "user",
          "uci": "g5f7",
          "explanation": "Le cavalier prend la tour en f7 avec échec."
        },
        {
          "side": "book",
          "uci": "h8h7",
          "explanation": "Le roi se déplace vers h7."
        },
        {
          "side": "user",
          "uci": "f7d8",
          "explanation": "Le cavalier prend la dame noire en d8."
        }
      ]
    },
    {
      "id": "pgn-tarrasch-recapture-sequence",
      "kind": "reinforcement",
      "level": "Avancé",
      "title": "Tarrasch : calculer une reprise en chaîne",
      "category": "PGN Tarrasch · calcul des échanges",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Tarrasch–Marco · Dresde, 1892 · coup joué · fichier tarrasch_vs_marco_1892.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "tarrasch_vs_marco_1892.pgn",
      "fen": "3r1rk1/ppp1bppp/5n2/4N3/4b3/2N5/PPP2PPP/R1B1R1K1 w - - 0 12",
      "color": "w",
      "question": "Dans la partie Tarrasch–Marco, quel cavalier prend le fou noir en e4 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cxe4",
          "correct": true
        },
        {
          "text": "Jouer Cc6",
          "correct": false
        },
        {
          "text": "Jouer Cd7",
          "correct": false
        }
      ],
      "principle": "Tarrasch reprend le fou avec le cavalier, puis Marco reprend ce cavalier avec le sien. Nd3 termine la séquence et met le cavalier à l’abri. La leçon porte sur le calcul de la chaîne de reprises effectivement jouée.",
      "transfer": "Calculer une séquence de reprises avant de choisir une capture.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Tarrasch reprend le fou avec le cavalier, puis Marco reprend ce cavalier avec le sien. Nd3 termine la séquence et met le cavalier à l’abri. La leçon porte sur le calcul de la chaîne de reprises effectivement jouée.",
      "hints": [
        "Le fou noir en e4 est attaqué par plusieurs pièces.",
        "Calcule les deux reprises possibles avant de déplacer le cavalier restant."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "c3e4",
          "explanation": "Le cavalier prend le fou noir en e4."
        },
        {
          "side": "book",
          "uci": "f6e4",
          "explanation": "Le cavalier noir reprend la pièce en e4."
        },
        {
          "side": "user",
          "uci": "e5d3",
          "explanation": "Le cavalier blanc se retire en d3 après les échanges."
        }
      ]
    },
    {
      "id": "pgn-alphazero-bishop-sacrifice",
      "kind": "reinforcement",
      "level": "Expert",
      "title": "AlphaZero : le sacrifice ouvre le roi",
      "category": "PGN AlphaZero · sacrifice et attaque",
      "author": "SupaChess Académie",
      "program": "Stockfish · comparer et vérifier",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "AlphaZero–Stockfish 8 · partie 2017 · coup joué · fichier alphazero_vs_stockfish8_sacrificial_masterpiece.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "alphazero_vs_stockfish8_sacrificial_masterpiece.pgn",
      "fen": "2rr2k1/3q3p/p2p1bpP/1p1P4/4B1Q1/1N3P2/PPP5/1K1R3R w - - 0 25",
      "color": "w",
      "question": "Dans la partie AlphaZero–Stockfish 8, quel sacrifice de fou commence l’attaque ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Fxg6",
          "correct": true
        },
        {
          "text": "Jouer Ff5",
          "correct": false
        },
        {
          "text": "Jouer Fd3",
          "correct": false
        }
      ],
      "principle": "Le fou prend g6 et attire le pion h7 sur g6. La dame blanche entre ensuite avec échec, puis poursuit l’attaque. Le sacrifice se comprend par la suite forcing, pas par sa valeur matérielle isolée; ces coups sont ceux du PGN étudié.",
      "transfer": "Évaluer un sacrifice de fou en suivant les échecs qui l’accompagnent.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le fou prend g6 et attire le pion h7 sur g6. La dame blanche entre ensuite avec échec, puis poursuit l’attaque. Le sacrifice se comprend par la suite forcing, pas par sa valeur matérielle isolée; ces coups sont ceux du PGN étudié.",
      "hints": [
        "Le roi noir est défendu par des pions avancés; cherche une prise de fou qui les attire.",
        "Calcule la reprise du pion h7 puis l’entrée de la dame avec échec."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "e4g6",
          "explanation": "Le fou prend le pion g6 et provoque une ouverture devant le roi."
        },
        {
          "side": "book",
          "uci": "h7g6",
          "explanation": "Le pion h7 reprend le fou en g6."
        },
        {
          "side": "user",
          "uci": "g4g6",
          "explanation": "La dame prend g6 avec échec."
        },
        {
          "side": "book",
          "uci": "g8f8",
          "explanation": "Le roi se déplace en f8."
        },
        {
          "side": "user",
          "uci": "g6f6",
          "explanation": "La dame prend le fou en f6 avec échec."
        }
      ]
    },
    {
      "id": "pgn-nakamura-rook-sacrifice-check",
      "kind": "reinforcement",
      "level": "Avancé",
      "title": "Nakamura : forcer une réponse par l’échec",
      "category": "PGN Nakamura · initiative",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Nakamura–Van Wely · Tata Steel, 2010 · coup joué · fichier nakamura_vs_van_wely_2010.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "nakamura_vs_van_wely_2010.pgn",
      "fen": "1rb1k2r/2q2pp1/p1N2b2/1p1Pp2p/1P6/P2B1Q2/2P4P/1K2R2R w k h6 0 22",
      "color": "w",
      "question": "Dans la partie Nakamura–Van Wely, quel coup de tour donne échec en e5 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Txe5+",
          "correct": true
        },
        {
          "text": "Jouer Ca7",
          "correct": false
        },
        {
          "text": "Jouer Cxb8",
          "correct": false
        }
      ],
      "principle": "Txe5+ est le coup de la partie. La réponse ...Fxe5 est suivie de Te1, qui maintient l’initiative et continue l’attaque. On étudie ici le calcul de la séquence réelle; le coup est présenté comme le coup joué, pas comme une certification Stockfish.",
      "transfer": "Examiner un coup de tour avec échec et calculer la reprise adverse.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Txe5+ est le coup de la partie. La réponse ...Fxe5 est suivie de Te1, qui maintient l’initiative et continue l’attaque. On étudie ici le calcul de la séquence réelle; le coup est présenté comme le coup joué, pas comme une certification Stockfish.",
      "hints": [
        "Cherche d’abord les coups donnant échec; la tour peut capturer en e5.",
        "Après la reprise du fou, identifie la seconde tour qui peut rejoindre la colonne e."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "e1e5",
          "explanation": "La tour prend en e5 avec échec."
        },
        {
          "side": "book",
          "uci": "f6e5",
          "explanation": "Le fou noir reprend la tour."
        },
        {
          "side": "user",
          "uci": "h1e1",
          "explanation": "La seconde tour revient sur la colonne e pour poursuivre la partie."
        },
        {
          "side": "book",
          "uci": "c8g4",
          "explanation": "Le fou se développe en g4 et attaque la dame blanche."
        }
      ]
    },
    {
      "id": "pgn-ding-gukesh-defend-draw-repetition",
      "kind": "reinforcement",
      "level": "Expert",
      "title": "Ding–Gukesh : sauver la partie par répétition",
      "category": "PGN championnat du monde · répétition",
      "author": "SupaChess Académie",
      "program": "Anti-erreurs · anticiper l’adversaire",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Ding Liren–Gukesh · championnat du monde, partie 4 · 2024 · coup joué · fichier ding_liren_vs_gukesh_wcc_2024_game4.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "ding_liren_vs_gukesh_wcc_2024_game4.pgn",
      "fen": "8/p5p1/6kp/P1pr4/4K3/6PP/5P2/2R5 b - - 3 37",
      "color": "b",
      "question": "Dans cette finale, quel échec de tour commence la répétition ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Td4+",
          "correct": true
        },
        {
          "text": "Jouer a6",
          "correct": false
        },
        {
          "text": "Jouer Rf7",
          "correct": false
        }
      ],
      "principle": "Gukesh joue Td4+ puis répète les échecs et les retours de tour. La séquence reproduit la position et mène à la nulle inscrite dans le PGN. En finale, savoir reconnaître la répétition permet de défendre une position difficile et d’éviter de forcer une victoire inexistante.",
      "transfer": "Reconnaître une série d’échecs qui sécurise la nulle en finale.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Gukesh joue Td4+ puis répète les échecs et les retours de tour. La séquence reproduit la position et mène à la nulle inscrite dans le PGN. En finale, savoir reconnaître la répétition permet de défendre une position difficile et d’éviter de forcer une victoire inexistante.",
      "hints": [
        "La position est une finale de tours et le roi blanc est exposé aux échecs.",
        "Cherche une série d’échecs qui ramène le roi sur e3 puis e4."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "d5d4",
          "explanation": "La tour donne échec en d4 et force le roi à répondre."
        },
        {
          "side": "book",
          "uci": "e4e3",
          "explanation": "Le roi se place en e3."
        },
        {
          "side": "user",
          "uci": "d4d5",
          "explanation": "La tour revient en d5, sans abandonner la défense des pions."
        },
        {
          "side": "book",
          "uci": "e3e4",
          "explanation": "Le roi revient en e4."
        },
        {
          "side": "user",
          "uci": "d5d4",
          "explanation": "La tour donne à nouveau échec en d4."
        },
        {
          "side": "book",
          "uci": "e4e3",
          "explanation": "Le roi répète son déplacement en e3."
        },
        {
          "side": "user",
          "uci": "d4d5",
          "explanation": "La tour revient en d5."
        },
        {
          "side": "book",
          "uci": "e3e4",
          "explanation": "Le roi revient en e4; la répétition de la position conduit à la nulle du PGN."
        }
      ]
    },
    {
      "id": "pgn-anand-block-check",
      "kind": "reinforcement",
      "level": "Débutant",
      "title": "Anand : interposer une pièce contre l’échec",
      "category": "PGN championnat du monde · parade à l’échec",
      "author": "SupaChess Académie",
      "program": "Carlsen · amélioration et conversion",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Anand–Carlsen · championnat du monde, 2013 · coup joué · fichier lichess_study_2013-world-championship-anand-carlsen_by_Lichess_2021.11.29.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "lichess_study_2013-world-championship-anand-carlsen_by_Lichess_2021.11.29.pgn",
      "fen": "rnbqkbnr/pp2pppp/3p4/1Bp5/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 3",
      "color": "b",
      "question": "Dans la partie Anand–Carlsen, quel coup noir interpose le cavalier pour parer l’échec ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cd7",
          "correct": true
        },
        {
          "text": "Jouer Cc6",
          "correct": false
        },
        {
          "text": "Jouer Fd7",
          "correct": false
        }
      ],
      "principle": "Le cavalier d7 s’interpose sur la diagonale du fou b5 et répond à l’échec sans déplacer le roi. Il rejoint ensuite le jeu. En défense, compare les interpositions légales et vérifie si la pièce reste attaquée après avoir paré l’échec.",
      "transfer": "Trouver une interposition légale qui développe une pièce.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le cavalier d7 s’interpose sur la diagonale du fou b5 et répond à l’échec sans déplacer le roi. Il rejoint ensuite le jeu. En défense, compare les interpositions légales et vérifie si la pièce reste attaquée après avoir paré l’échec.",
      "hints": [
        "Tu peux répondre à l’échec en bloquant la diagonale avec une pièce.",
        "Cherche l’interposition jouée par le cavalier noir en d7."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "b8d7",
          "explanation": "Le cavalier va en d7 et bloque la diagonale du fou qui donne échec."
        }
      ]
    },
    {
      "id": "pgn-carlsen-centralize-knight",
      "kind": "reinforcement",
      "level": "Intermédiaire",
      "title": "Carlsen : installer le cavalier en d5",
      "category": "PGN championnat du monde · case forte",
      "author": "SupaChess Académie",
      "program": "Carlsen · amélioration et conversion",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Carlsen–Anand · championnat du monde, 2014 · coup joué · fichier lichess_study_2014-world-championship-anand-vs-carlsen-ii_by_Lichess_2021.11.29.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "lichess_study_2014-world-championship-anand-vs-carlsen-ii_by_Lichess_2021.11.29.pgn",
      "fen": "r1k2b1r/p1p2pp1/1p2b2p/2p1Pn2/8/1PN2N1P/PBP2PP1/3RR1K1 w - - 2 15",
      "color": "w",
      "question": "Quel coup joué par Carlsen place son cavalier sur la case centrale d5 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cd5",
          "correct": true
        },
        {
          "text": "Jouer b4",
          "correct": false
        },
        {
          "text": "Jouer Ca4",
          "correct": false
        }
      ],
      "principle": "Le cavalier rejoint d5, une case avancée qui organise le jeu blanc. Le PGN montre ensuite ...g5 et c4. Cette position sert à étudier une pièce centralisée et les décisions prises autour d’elle; l’exercice identifie le coup joué dans la partie.",
      "transfer": "Reconnaître l’installation d’une pièce sur une case centrale avancée.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le cavalier rejoint d5, une case avancée qui organise le jeu blanc. Le PGN montre ensuite ...g5 et c4. Cette position sert à étudier une pièce centralisée et les décisions prises autour d’elle; l’exercice identifie le coup joué dans la partie.",
      "hints": [
        "Repère le cavalier blanc placé près du centre et cherche sa case avancée.",
        "Quel coup amène le cavalier sur d5 ?"
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "c3d5",
          "explanation": "Le cavalier f4 se centralise en d5."
        },
        {
          "side": "book",
          "uci": "g7g5",
          "explanation": "Les Noirs jouent ...g5 pour contester les pièces et les cases de l’aile roi."
        },
        {
          "side": "user",
          "uci": "c2c4",
          "explanation": "Les Blancs poursuivent avec c4 et renforcent leur espace."
        },
        {
          "side": "book",
          "uci": "c8b7",
          "explanation": "Le roi noir se déplace en b7."
        }
      ]
    },
    {
      "id": "pgn-carlsen-calculate-central-capture",
      "kind": "reinforcement",
      "level": "Avancé",
      "title": "Carlsen : calculer la prise en e5",
      "category": "PGN championnat du monde · calcul de reprises",
      "author": "SupaChess Académie",
      "program": "Carlsen · amélioration et conversion",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Carlsen–Karjakin · championnat du monde, 2016 · coup joué · fichier lichess_study_2016-chess-world-championship-carlsen-vs-karjakin_by_Lichess_2021.11.29.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "lichess_study_2016-chess-world-championship-carlsen-vs-karjakin_by_Lichess_2021.11.29.pgn",
      "fen": "r1bqkb1r/pppp1ppp/2nn4/1B2p3/8/5N2/PPPP1PPP/RNBQR1K1 w kq - 2 6",
      "color": "w",
      "question": "Quel coup de Carlsen prend le pion e5 et lance la suite de reprises ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Cxe5",
          "correct": true
        },
        {
          "text": "Jouer Fa6",
          "correct": false
        },
        {
          "text": "Jouer Fxc6",
          "correct": false
        }
      ],
      "principle": "Carlsen prend le pion e5. Les Noirs jouent ...Fe7, le fou blanc recule en f1, puis ...Cxe5 est repris par la tour. Il faut suivre toute la chaîne de coups avant de juger la capture. Ce cours reprend la suite effectivement jouée dans la partie.",
      "transfer": "Calculer les réponses et les reprises après une capture centrale.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Carlsen prend le pion e5. Les Noirs jouent ...Fe7, le fou blanc recule en f1, puis ...Cxe5 est repris par la tour. Il faut suivre toute la chaîne de coups avant de juger la capture. Ce cours reprend la suite effectivement jouée dans la partie.",
      "hints": [
        "Le pion e5 est accessible au cavalier; calcule la réponse noire.",
        "Si les Noirs reprennent en e5, cherche si une tour blanche peut répondre."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "f3e5",
          "explanation": "Le cavalier blanc prend le pion e5."
        },
        {
          "side": "book",
          "uci": "f8e7",
          "explanation": "Le fou noir se développe en e7."
        },
        {
          "side": "user",
          "uci": "b5f1",
          "explanation": "Le fou blanc recule en f1, hors de la diagonale attaquée."
        },
        {
          "side": "book",
          "uci": "c6e5",
          "explanation": "Le cavalier noir prend e5."
        },
        {
          "side": "user",
          "uci": "e1e5",
          "explanation": "La tour blanche reprend ensuite le cavalier en e5."
        }
      ]
    },
    {
      "id": "pgn-carlsen-bishop-manoeuvre",
      "kind": "reinforcement",
      "level": "Avancé",
      "title": "Carlsen : manœuvrer le fou avec la dame",
      "category": "PGN championnat du monde · manœuvre",
      "author": "SupaChess Académie",
      "program": "Carlsen · amélioration et conversion",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Caruana–Carlsen · championnat du monde, 2018 · coup joué · fichier lichess_study_2018-chess-world-championship-carlsen-caruana_by_Lichess_2021.11.29.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "lichess_study_2018-chess-world-championship-carlsen-caruana_by_Lichess_2021.11.29.pgn",
      "fen": "r2qkb1r/pp1b1ppp/3p2n1/1N1Pp3/1QP5/8/PP3PPP/R1B1KB1R b KQkq - 4 11",
      "color": "b",
      "question": "Dans cette séquence, quel coup Carlsen joue pour placer son fou en f5 ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer Ff5",
          "correct": true
        },
        {
          "text": "Jouer Tb8",
          "correct": false
        },
        {
          "text": "Jouer Tc8",
          "correct": false
        }
      ],
      "principle": "Le fou va en f5, puis la partie continue par h4, ...h5 et les retours de dame et de fou. La séquence montre une manœuvre et une lutte pour les cases, pas une combinaison forcée. Le coup demandé est celui réellement joué par Carlsen.",
      "transfer": "Suivre une répétition de manœuvres et comprendre les changements d’aile.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le fou va en f5, puis la partie continue par h4, ...h5 et les retours de dame et de fou. La séquence montre une manœuvre et une lutte pour les cases, pas une combinaison forcée. Le coup demandé est celui réellement joué par Carlsen.",
      "hints": [
        "C’est le fou noir qui manœuvre entre d7 et f5.",
        "Repère le coup joué par le fou de d7 vers f5."
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "d7f5",
          "explanation": "Le fou noir se place en f5 et contrôle des cases utiles autour du roi blanc."
        },
        {
          "side": "book",
          "uci": "h2h4",
          "explanation": "Les Blancs avancent leur pion h."
        },
        {
          "side": "user",
          "uci": "h7h5",
          "explanation": "Les Noirs répondent par ...h5 et verrouillent la structure."
        },
        {
          "side": "book",
          "uci": "b4a4",
          "explanation": "La dame blanche revient en a4."
        },
        {
          "side": "user",
          "uci": "f5d7",
          "explanation": "Le fou noir revient en d7."
        },
        {
          "side": "book",
          "uci": "a4b4",
          "explanation": "La dame reprend la case b4."
        },
        {
          "side": "user",
          "uci": "d7f5",
          "explanation": "Le fou retourne en f5; les pièces répètent leur manœuvre."
        }
      ]
    },
    {
      "id": "pgn-carlsen-recapture-knight",
      "kind": "reinforcement",
      "level": "Intermédiaire",
      "title": "Carlsen–Nepo : reprendre le cavalier",
      "category": "PGN championnat du monde · reprise",
      "author": "SupaChess Académie",
      "program": "Carlsen · amélioration et conversion",
      "book": "Partie PGN · explication pédagogique originale",
      "reference": "Nepomniachtchi–Carlsen · championnat du monde, 2021 · coup joué · fichier lichess_study_2021-world-chess-championship-carlsen-nepo_2021.12.10.pgn · exercice sur un coup joué, pas un verdict Stockfish",
      "sourcePgn": "lichess_study_2021-world-chess-championship-carlsen-nepo_2021.12.10.pgn",
      "fen": "3r2k1/2pqnpp1/1p1pr2p/p3p3/P3P1n1/1QPPN2P/1P3PP1/3RR1K1 w - - 0 19",
      "color": "w",
      "question": "Après 18…C x g4, quel pion blanc reprend le cavalier dans la partie ? Ici, retrouve le coup réellement joué dans le PGN.",
      "choices": [
        {
          "text": "Jouer hxg4",
          "correct": true
        },
        {
          "text": "Jouer Db4",
          "correct": false
        },
        {
          "text": "Jouer Db5",
          "correct": false
        }
      ],
      "principle": "Le pion h3 reprend le cavalier en g4. La partie continue par ...d5 puis d4 : les deux camps jouent ensuite au centre. La leçon vérifie d’abord la reprise matérielle avant de passer à l’évaluation du contre-jeu.",
      "transfer": "Reprendre une pièce attaquante avant de calculer la rupture centrale.",
      "pitfall": "Ne suppose pas que le coup de la partie est automatiquement le meilleur. Après l’avoir trouvé, vérifie les menaces adverses, les prises et les réponses forcées dans la suite. Le pion h3 reprend le cavalier en g4. La partie continue par ...d5 puis d4 : les deux camps jouent ensuite au centre. La leçon vérifie d’abord la reprise matérielle avant de passer à l’évaluation du contre-jeu.",
      "hints": [
        "Le cavalier noir vient de prendre en g4; cherche quelle pièce blanche peut le reprendre.",
        "Le pion h3 peut-il capturer le cavalier placé en g4 ?"
      ],
      "sequence": [
        {
          "side": "user",
          "uci": "h3g4",
          "explanation": "Le pion h3 capture le cavalier noir en g4."
        },
        {
          "side": "book",
          "uci": "d6d5",
          "explanation": "Les Noirs jouent ...d5 et contestent le centre."
        },
        {
          "side": "user",
          "uci": "d3d4",
          "explanation": "Les Blancs avancent d4 pour répondre au changement de structure."
        },
        {
          "side": "book",
          "uci": "e5d4",
          "explanation": "Les Noirs capturent le pion d4 avec leur pion e5."
        }
      ]
    }
  ];

  // New, original SupaChess exercises covering the recurring themes taught in classic chess manuals.
  const expandedLessonData = [
    ["develop-second-knight","Développer les deux cavaliers","Débutant","Ouverture · Développement","w",["e4","e5"],"Quelle pièce complète le développement en attaquant le centre ?","Développer le cavalier g1 en f3","Avancer un pion de l’aile","Sortir la dame sans nécessité","Le cavalier f3 contrôle d4 et e5 et prépare le roque. Un développement harmonieux met les pièces en jeu avant de lancer une attaque.","À l’ouverture, demande-toi si chaque coup développe une pièce, contrôle le centre ou protège le roi.",["Le cavalier g1 peut attaquer e5.","Cherche une case centrale qui prépare le roque."],[["user","g1f3","Le cavalier se développe vers le centre et met e5 sous pression."],["book","b8c6","Le cavalier noir défend e5 et occupe une case centrale."],["user","f1c4","Le fou sort sur une diagonale active et complète le développement."]]],
    ["castle-before-attack","Roquer avant d’ouvrir le jeu","Débutant","Ouverture · Sécurité du roi","w",["e4","e5","Nf3","Nc6","Bc4","Nf6"],"Quel coup met le roi en sécurité tout en activant une tour ?","Roquer côté roi","Pousser un pion devant le roi","Déplacer plusieurs fois la dame","Le petit roque met le roi à l’abri et amène la tour f1 vers le centre.","Avant une poussée qui ouvre des lignes, vérifie la sécurité de ton roi et les droits au roque.",["Le roi blanc peut rejoindre g1 si le chemin est libre.","Le coup développe aussi la tour h1."],[["user","e1g1","Le roi se met à l’abri et la tour rejoint la colonne f."],["book","d7d6","Le pion renforce le centre et prépare le développement du fou."],["user","d2d3","Le pion renforce e4 et ouvre la diagonale du fou c1."]]],
    ["recapture-with-development","Reprendre en développant","Débutant","Ouverture · Centre","w",["e4","c5","Nf3","d6","d4","cxd4"],"Quelle reprise occupe le centre et développe une pièce ?","Le cavalier f3 reprend en d4","La dame reprend en d4","Ignorer le pion et jouer un coup d’aile","La reprise du cavalier gagne un temps de développement et garde la dame à l’abri des attaques avec tempo.","Après un échange, compare les reprises selon le développement, le contrôle central et la sécurité.",["Le cavalier f3 peut reprendre le pion en d4.","Choisis la reprise qui développe une pièce."],[["user","f3d4","Le cavalier reprend en occupant une case centrale."],["book","g8f6","Le cavalier noir se développe et attaque e4."],["user","b1c3","Le second cavalier renforce le centre."]]],
    ["central-break-c3","Préparer la rupture centrale","Débutant","Plan · Rupture centrale","w",["e4","e5","Nf3","Nc6","Bc4","Bc5"],"Quel plan soutient une poussée d4 ?","Jouer c3 pour soutenir le centre","Pousser un pion de l’aile sans plan","Reculer une pièce développée","c3 prépare d4 et soutient le centre; le calcul des prises reste nécessaire avant la rupture.","Quand tu prépares une poussée centrale, vérifie qui pourra reprendre et quelles lignes s’ouvriront.",["Le pion d2 peut avancer de deux cases.","Quel pion peut soutenir d4 ?"],[["user","c2c3","Le pion soutient d4 et prépare à contester e5."],["book","g8f6","Le cavalier noir se développe et attaque e4."],["user","d2d4","La poussée centrale ouvre le jeu après calcul des échanges."]]],
    ["bishop-retreat-square","Retraite active du fou","Débutant","Ouverture · Activité des pièces","w",["e4","e5","Nf3","Nc6","Bb5","a6"],"Où garder le fou sans l’échanger immédiatement ?","Le replier en a4","L’échanger en c6 sans examiner la position","Le ramener en h4","Ba4 conserve le fou et sa pression sur le centre; il ne s’agit pas d’éviter tout échange, mais de choisir le bon moment.","Quand une pièce est attaquée, compare les retraites qui gardent son activité avec les échanges possibles.",["Le fou peut suivre la diagonale b5–a4.","Cherche une case qui garde une diagonale vers le centre."],[["user","b5a4","Le fou se retire et conserve sa diagonale active."],["book","g8f6","Le cavalier se développe en attaquant e4."],["user","b1c3","Le cavalier se développe et renforce le contrôle central."]]],
    ["develop-with-tempo","Développer en attaquant","Débutant","Ouverture · Gain de temps","b",["e4","e5","Nf3","Nc6","Bb5"],"Quel coup questionne le fou tout en préparant le développement ?","Jouer …a6 puis développer","Pousser un pion devant le roi","Déplacer la dame pour attaquer un pion","…a6 demande au fou de choisir une case; …Cf6 développe ensuite une pièce avec une menace sur e4.","Cherche des coups utiles qui développent une pièce ou gagnent un tempo sans retarder ton roi.",["Le pion a7 peut attaquer le fou b5.","Le cavalier g8 peut ensuite attaquer e4."],[["user","a7a6","Le pion demande au fou de préciser sa case."],["book","b5a4","Le fou se replie en gardant sa diagonale."],["user","g8f6","Le cavalier se développe et attaque e4."]]],
    ["central-pawn-support","Soutenir le centre avant l’échange","Débutant","Ouverture · Structure de pions","w",["e4","e5","Nf3","Nc6","Bc4","Bc5"],"Quel coup soutient e4 et développe une autre pièce ensuite ?","Jouer d3 pour consolider le centre","Pousser g4 en affaiblissant le roi","Sortir la dame vers h5 sans calcul","d3 donne un appui à e4 et ouvre la diagonale du fou c1 sans créer de faiblesse autour du roi.","Un centre solide laisse tes pièces se développer derrière les pions.",["Le pion d2 peut protéger e3 et soutenir le centre.","Choisis un coup qui prépare aussi le développement du fou c1."],[["user","d2d3","Le pion renforce e4 et ouvre une diagonale au fou."],["book","g8f6","Le cavalier noir se développe vers le centre."],["user","b1c3","Le cavalier renforce e4 et contrôle d5."]]],
    ["connect-rooks","Relier les tours","Intermédiaire","Ouverture · Coordination","w",["e4","e5","Nf3","Nc6","Bc4","Bc5"],"Quel coup aide à coordonner les tours et protège le roi ?","Roquer côté roi","Avancer la tour a1 dans une colonne fermée","Pousser un pion devant le roi","Le roque met le roi à l’abri et rapproche les tours; leur coordination permettra de choisir une colonne utile.","Après le développement, relie tes tours avant de chercher une opération sur une colonne.",["Le roi blanc peut roquer.","Le coup active également la tour h1."],[["user","e1g1","Le roi se met à l’abri et les tours se rapprochent."],["book","g8f6","Le cavalier noir se développe vers le centre."],["user","b1c3","Le cavalier se développe et renforce le centre."]]],
    ["trade-when-ahead","Évaluer la position après un échange","Intermédiaire","Stratégie · Simplification","w",["e4","e5","Nf3","Nc6","Bb5","a6","Bxc6","dxc6"],"Après avoir gagné un pion, quel principe aide à convertir l’avantage ?","Échanger les pièces actives sans rendre le matériel","Lancer une attaque de pions devant le roi","Donner un pion pour garder les dames","Quand tu as un avantage matériel stable, des échanges calculés réduisent les contre-jeux; il faut encore surveiller les tactiques.","Avec un pion de plus, compare le risque de contre-attaque avant chaque échange de pièces.",["Les Noirs viennent de reprendre en c6.","Le cavalier f3 peut prendre e5; vérifie les réponses avant d’agir."],[["user","d2d3","Les Blancs consolident le centre avant de simplifier la position."],["book","g8f6","Le cavalier noir se développe vers le centre."],["user","b1c3","Le cavalier se développe et soutient le centre."]]],
    ["avoid-hanging-piece","Vérifier les pièces en prise","Débutant","Tactique · Sécurité des pièces","w",["e4","e5","Nf3","Nc6","Bc4","Nf6"],"Avant de jouer, quelle vérification évite de laisser une pièce sans défense ?","Repérer les pièces attaquées et compter les défenseurs","Chercher seulement un échec","Pousser le premier pion disponible","Une pièce attaquée n’est pas toujours perdue: compare attaquants, défenseurs et menaces plus fortes avant de conclure.","À chaque tour, repère les menaces adverses et les pièces qui n’ont pas assez de défenseurs.",["Regarde le cavalier f3 et le pion e4.","Compare le nombre de pièces qui attaquent et défendent."],[["user","d2d3","Le coup consolide e4 et ouvre la diagonale du fou c1."],["book","d7d6","Le pion défend e5 et libère le fou c8."],["user","b1c3","Le cavalier renforce le centre et soutient e4."]]],
    ["king-pawn-endgame","Activer le roi dans la finale","Débutant","Finale · Roi et pion","w",[],"Avant de pousser le pion, quelle pièce doit devenir active ?","Le roi, tout en gardant le pion défendu","La dame qui n’est plus sur l’échiquier","Le pion, sans regarder le roi adverse","En finale, le roi devient une pièce active. Il faut gagner de l’espace sans abandonner le pion.","Avant une poussée, vérifie le roi adverse, l’opposition et le chemin de promotion.",["Le roi blanc peut quitter e1 tout en restant près du pion.","Cherche une case centrale sûre pour le roi."],[["user","e1d1","Le roi avance vers le centre sans abandonner le pion e2."],["book","e4d4","Le roi noir se rapproche pour contester le pion."],["user","d1e1","Le roi garde une distance utile du pion et se prépare à soutenir sa marche."]], "8/8/8/8/4k3/8/4P3/4K3 w - - 0 1"],
    ["pawn-opposition","Prendre l’opposition","Intermédiaire","Finale · Opposition","w",[],"Quel coup rapproche le roi tout en gardant l’opposition à l’adversaire ?","Avancer le roi d’une case centrale","Pousser le pion immédiatement","Éloigner le roi du pion","L’opposition est un outil pour gagner l’accès aux cases; elle se calcule selon le trait et la position exacte des rois.","Dans les finales de pions, compte les cases entre les rois et vérifie le trait avant d’avancer.",["Les rois sont alignés sur la colonne e.","Un pas de roi peut obliger l’adversaire à céder une case."],[["user","e4d4","Le roi avance vers une case centrale."],["book","e6d6","Le roi noir conteste la route vers le pion."],["user","e3e4","Le pion avance avec le roi blanc à proximité."]], "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1"],
    ["passed-pawn-support","Soutenir un pion passé","Intermédiaire","Finale · Pion passé","w",[],"Quel plan augmente les chances de promotion du pion ?","Approcher le roi pour soutenir le pion","Pousser le pion hors de portée du roi","Échanger le roi contre le pion","Un pion passé a besoin du soutien du roi; la course à la promotion se calcule avec les tempos et les cases de contrôle.","Avant de pousser, calcule si le roi peut escorter le pion jusqu’à la promotion.",["Le roi noir est proche du pion e2.","Le roi blanc peut se rapprocher du centre."],[["user","e1d1","Le roi gagne une case de soutien vers le pion."],["book","e4d4","Le roi noir tente de barrer la route."],["user","d1c2","Le roi continue vers le pion sans le pousser trop tôt."]], "8/8/8/8/4k3/8/4P3/4K3 w - - 0 1"],
    ["rook-behind-passer","Placer la tour derrière le pion passé","Intermédiaire","Finale · Tours","w",[],"Où la tour soutient-elle le mieux un pion passé ?","Derrière le pion, sur sa colonne","Devant le pion en bloquant son avance","Sur une colonne sans lien avec le pion","Une tour placée derrière un pion passé peut soutenir sa marche; si le pion est adverse, la tour peut le freiner par derrière.","Dans les finales de tours, compare l’activité de la tour et la position du roi avant de pousser.",["La colonne a est libre.","La tour peut rejoindre la colonne a sur la case a5."],[["user","h5a5","La tour se place derrière le pion passé."],["book","g8g7","Le roi noir se rapproche du pion."],["user","a7a8q","Le pion avance en promotion avec le soutien de la tour."]], "6k1/P7/8/7R/8/8/8/7K w - - 0 1"],
    ["rook-cutoff","Couper le roi avec la tour","Intermédiaire","Finale · Tour et roi contre roi","w",[],"Quel est le premier objectif de la tour ?","Réduire l’espace du roi adverse","Donner des échecs sans plan","Éloigner son propre roi de la finale","Une tour peut couper le roi adverse sur une rangée ou une colonne; le roi ami vient ensuite participer à la poursuite.","Dans les finales de tours, cherche une coupure utile avant une série d’échecs.",["Le roi noir est sur h8.","Une tour peut barrer la septième rangée depuis a1."],[["user","a1a7","La tour coupe une rangée et limite le roi adverse."],["book","h8g8","Le roi noir quitte la rangée contrôlée."],["user","h1g2","Le roi blanc avance pour soutenir la tour."]], "7k/8/8/8/8/8/8/R6K w - - 0 1"],
    ["scholars-mate","Reconnaître le mat du berger","Intermédiaire","Tactique · Mat sur f7","w",["e4","e5","Qh5","Nc6","Bc4","Nf6"],"Quel coup exploite la faiblesse f7 et termine la partie ?","Dame prend f7 avec échec et mat","Échanger la dame contre le cavalier c6","Reculer la dame sans calculer","La dame prend f7 avec l’appui du fou c4. Le motif fonctionne dans cette position précise; les défenses antérieures peuvent l’empêcher.","Repère les cases faibles près du roi, puis vérifie les défenseurs et toutes les réponses légales.",["La case f7 est proche du roi noir.","La dame h5 et le fou c4 visent f7."],[["user","h5f7","La dame prend f7 avec le soutien du fou et mate le roi e8."]]],
    ["fools-mate","Punir un roi affaibli","Intermédiaire","Tactique · Diagonale du roi","b",["f3","e5","g4"],"Quel coup exploite la diagonale affaiblie vers le roi blanc ?","Dame h4 donne échec et mat","Développer le cavalier b8","Pousser le pion a7","Les poussées f3 et g4 ont ouvert la diagonale vers le roi; la dame peut atteindre h4 dans cette position.","Après des poussées devant le roi, vérifie les diagonales et les cases de mat avant de poursuivre l’attaque.",["La diagonale d8–h4 est libre.","Vérifie si le roi blanc possède une case de fuite."],[["user","d8h4","La dame donne mat sur la diagonale affaiblie."]]],
    ["back-rank-mate","Repérer le mat du couloir","Intermédiaire","Tactique · Mat du couloir","w",[],"Quel coup exploite les pions qui enferment le roi noir ?","Placer la tour en e8 avec échec et mat","Échanger la tour contre un pion","Déplacer le roi blanc","Les pions du roi noir lui retirent ses cases de fuite; la tour peut pénétrer sur la huitième rangée.","Quand le roi est derrière ses pions, cherche les cases de fuite et les pièces capables d’atteindre la dernière rangée.",["La colonne e est libre.","La tour e1 peut atteindre e8."],[["user","e1e8","La tour arrive sur la huitième rangée et mate le roi enfermé."]], "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1"],
    ["zwischenzug","Chercher un coup intermédiaire","Avancé","Tactique · Coup intermédiaire","w",["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Na5"],"Avant de reprendre le cavalier, quel coup force une réponse ?","Fou b5 donne échec sur la diagonale libérée","Reprendre immédiatement le cavalier c6","Déplacer un pion sans menace","Le départ du cavalier c6 libère une diagonale; l’échec intermédiaire oblige les Noirs à répondre avant de régler la tension au centre.","Dans une séquence de prises, vérifie les échecs, les menaces et les coups qui modifient l’ordre des échanges.",["Le cavalier noir a quitté c6.","Le fou c4 peut atteindre b5 avec échec."],[["user","c4b5","Le fou donne échec sur la diagonale ouverte."],["book","c7c6","Le pion bloque l’échec et attaque le fou."],["user","d5c6","Le pion reprend en c6 pendant que le fou est encore attaqué."]]],
    ["discover-check","Exploiter une attaque à découvert","Avancé","Tactique · Attaque à découvert","w",["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Na5"],"Quel échec profite du départ du cavalier c6 ?","Fou b5 donne échec à découvert","Échanger le fou contre le pion h7","Pousser le pion a2","Le cavalier a quitté la diagonale du fou c4 vers le roi e8; le fou peut donner échec depuis b5.","Quand une pièce quitte une ligne, vérifie si elle a découvert une attaque ou un échec.",["Le cavalier noir n’est plus en c6.","Le fou c4 peut se placer en b5."],[["user","c4b5","Le fou donne échec sur la diagonale dégagée."],["book","c7c6","Le pion interpose et attaque le fou."],["user","d5c6","Le pion reprend en c6 et conserve l’initiative."]]],
    ["king-safety-check","Calculer les échecs forcés","Avancé","Calcul · Coups candidats","w",["e4","e5","Nf3","Nc6","Bc4","Bc5"],"Avant un coup calme, quelle catégorie de coups candidats vérifier en premier ?","Les échecs, les prises et les menaces","Les coups de pions de l’aile seulement","Les échanges de dames automatiques","Les coups forcés réduisent les réponses possibles; examine-les avant de choisir un plan calme.","À chaque position, liste échecs, prises et menaces, puis compare-les aux coups de développement.",["Regarde les rois et les pièces attaquées.","Commence par les coups qui obligent une réponse."],[["user","d2d3","Le coup consolide le centre après l’examen des menaces."],["book","g8f6","Le cavalier se développe et attaque e4."],["user","b1c3","Le cavalier renforce le contrôle des cases centrales."]]],
    ["remove-defender","Identifier le défenseur clé","Avancé","Tactique · Défenseur","b",["e4","e5","Nf3","Nc6","Bc4","Bc5","c3"],"Avant d’échanger, quelle question révèle souvent une tactique ?","Quelle pièce défend plusieurs cases ou pièces importantes ?","Quelle pièce est la plus éloignée du roi ?","Quel pion peut avancer sans calcul ?","Une pièce qui assure plusieurs défenses peut être surchargée; son échange peut rendre une autre cible vulnérable.","Avant une prise, identifie les défenseurs et vérifie ce qui devient sans protection après l’échange.",["Repère les pièces qui défendent le roi et le centre.","Imagine la position après l’échange."],[["user","g8f6","Le cavalier se développe et attaque e4."],["book","d2d4","Les Blancs contestent le centre."],["user","e5d4","Le pion reprend au centre; les échanges doivent être recalculés."]]],
    ["weak-square","Contester le centre par d4","Avancé","Plan · Rupture centrale","w",["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6","O-O","Be7","Re1","b5","Bb3","d6"],"Quel coup conteste e5 et ouvre une ligne pour les pièces ?","Jouer d4 et reprendre avec le cavalier si nécessaire","Pousser h4 sans préparation","Échanger le fou b3 immédiatement","d4 attaque e5 et peut ouvrir des lignes après les échanges; vérifie les reprises avant de jouer.","Avant une rupture centrale, calcule les prises possibles et identifie quelles pièces profiteront des lignes ouvertes.",["La case d5 est au centre.","Le pion d2 peut avancer de deux cases et attaquer e5."],[["user","d2d4","Le pion conteste e5 et ouvre le centre."],["book","e5d4","Le pion noir capture le pion d4."],["user","f3d4","Le cavalier reprend en d4 et occupe le centre."]]],
    ["exchange-good-bad-bishop","Évaluer l’échange des fous","Intermédiaire","Stratégie · Bons et mauvais fous","w",["d4","d5","c4","e6","Nc3","Nf6","Bg5","Be7"],"Avant d’échanger le fou, quel élément de structure comparer ?","Les chaînes de pions et les cases que chaque fou contrôle","La seule valeur nominale des fous","Le nombre de coups déjà joués","L’activité d’un fou dépend souvent de la couleur des cases bloquées par les pions; un échange peut modifier durablement cette activité.","Avant un échange de fous, observe les pions centraux et les diagonales qui resteront ouvertes.",["Regarde les pions d4, c4 et e6.","Compare les diagonales de chaque fou."],[["user","e2e3","Le pion renforce le centre et libère le fou f1."],["book","e8g8","Les Noirs roquent et mettent le roi à l’abri."],["user","g1f3","Le cavalier se développe et renforce le contrôle central."]]],
    ["minority-attack","Comprendre l’attaque de majorité minoritaire","Avancé","Plan · Structure de pions","w",["d4","d5","c4","e6","Nc3","Nf6","Nf3","Be7","e3","O-O","Bd3","c5"],"Quel objectif poursuit une poussée de pions sur l’aile où tu es en minorité ?","Créer une faiblesse de pion chez l’adversaire","Ouvrir automatiquement la colonne devant son roi","Échanger tous les pions du centre","Une majorité minoritaire cherche souvent à provoquer un pion arriéré ou isolé; le plan dépend de la structure et de la coordination des pièces.","Repère les majorités de pions avant de choisir une aile où créer une cible durable.",["Compare le nombre de pions sur chaque aile.","Cherche une poussée qui force une décision structurelle."],[["user","c4d5","Le pion échange au centre et transforme la structure."],["book","e6d5","Le pion noir reprend et crée une nouvelle structure."],["user","b2b3","Le pion prépare le développement du fou et soutient le centre."]]],
    ["prophylaxis","Prévenir le plan adverse","Avancé","Stratégie · Prophylaxie","w",["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6","O-O","Be7","Re1","b5","Bb3","d6","c3","O-O"],"Avant de choisir ton plan, quelle question prophylactique poser ?","Que prépare l’adversaire et quelle réponse utile peut le limiter ?","Quel pion d’aile peut avancer le plus vite ?","Comment échanger une pièce au hasard ?","La prophylaxie commence par comprendre le plan adverse, puis trouver une mesure utile qui réduit son efficacité sans créer de faiblesse inutile.","À chaque tour, imagine le meilleur plan adverse avant de choisir le tien.",["Observe les ruptures centrales possibles.","Cherche un coup utile qui améliore aussi une pièce."],[["user","h2h3","Le pion empêche une pièce noire de venir en g4 sans raison urgente."],["book","c6b4","Le cavalier prend la case b4 et exerce une pression sur c2."],["user","d2d4","La poussée centrale conteste l’espace noir."]]],
    ["calculate-capture","Calculer toute la séquence de prise","Expert","Calcul · Variantes forcées","w",["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Nxd5"],"Que faut-il calculer avant une combinaison sur f7 ?","Les reprises, les échecs suivants et l’évaluation de la position finale","La première menace seulement","Le gain de pion sans les réponses","Une fourchette apparente peut coûter une pièce; calcule les réponses forcées jusqu’à une position que tu peux évaluer.","Pour chaque prise candidate, calcule la meilleure réponse adverse puis les coups forcés qui suivent.",["Le cavalier g5 peut prendre f7.","Le roi peut reprendre; cherche ensuite les échecs disponibles."],[["user","g5f7","Le cavalier menace deux pièces, mais peut être repris."],["book","e8f7","Le roi prend le cavalier: cette réponse doit être prévue."],["user","d1f3","La dame donne échec; il faut évaluer la suite et le matériel."]]],
    ["mate-in-one","Voir le mat en un coup","Débutant","Tactique · Mat du berger","w",["e4","e5","Qh5","Nc6","Bc4","Nf6"],"Quel coup termine la partie dans cette position ?","Prendre f7 avec la dame, protégée par le fou","Prendre le cavalier c6","Pousser le pion h2","La coordination de la dame et du fou vise le point f7; le mat existe ici car les Noirs ont laissé cette case accessible.","Dans chaque position, commence par chercher les échecs et confirme que le roi ne peut ni fuir, ni capturer, ni interposer.",["Les deux pièces blanches visent f7.","Vérifie toutes les cases de fuite du roi noir."],[["user","h5f7","La dame prend f7 avec l’appui du fou: échec et mat."]]],
    ["queen-trade-when-ahead","Échanger les dames pour réduire le contre-jeu","Intermédiaire","Stratégie · Échange des dames","w",["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6","O-O","Be7","Re1","b5","Bb3","d6","c3","O-O"],"Avant un échange de dames, quel facteur de position est prioritaire ?","La sécurité du roi et le contre-jeu qui disparaît ou apparaît","Le fait que les dames soient encore sur l’échiquier","La possibilité d’avancer un pion de l’aile","Un échange de dames peut réduire une attaque, mais aussi rendre une finale favorable à l’adversaire; il faut évaluer la position après l’échange.","Calcule la position simplifiée et compare activité des rois, structure et pions passés.",["Repère les menaces près des deux rois.","Imagine la position après l’échange de dames."],[["user","d2d4","Le centre s’ouvre seulement après vérification des menaces."],["book","c6b4","Le cavalier prend une case active et exerce une pression."],["user","h2h3","Le pion demande au cavalier s’il souhaite rester sur cette case."]]],
    ["candidate-moves","Comparer les coups candidats","Expert","Calcul · Méthode de réflexion","w",["e4","e5","Nf3","Nc6","Bc4","Bc5"],"Comment choisir entre plusieurs coups raisonnables ?","Comparer les coups candidats après les réponses adverses les plus fortes","Jouer le premier coup qui semble actif","Éviter tout calcul pour ne pas perdre de temps","Une bonne décision compare quelques candidats concrets et leurs réponses; les principes réduisent les options mais ne remplacent pas le calcul.","Choisis deux ou trois candidats, calcule les réponses forcées et évalue les positions finales.",["Liste d’abord les échecs, prises et menaces.","Puis compare un coup de développement et une poussée centrale."],[["user","c2c3","Ce coup prépare d4 tout en gardant plusieurs options."],["book","g8f6","Le cavalier se développe et attaque e4."],["user","d2d4","La poussée centrale ouvre le jeu après comparaison des réponses."]]],
    ["passed-pawn-race","Calculer une course de pions","Avancé","Finale · Course de pions","w",[],"Avant de pousser le pion, que faut-il comparer ?","Les tempos jusqu’à promotion et les cases contrôlées par les rois","La distance au bord de l’échiquier seulement","Le nombre de pièces échangées seulement","Une course de pions se calcule avec le trait, les tempos de poussée, les cases de contrôle et les échecs disponibles.","Compte les coups jusqu’à promotion et intègre les déplacements des rois, pas seulement les pions.",["Le pion blanc est en e2.","Le roi noir est proche; évalue la course avant d’avancer."],[["user","e1d1","Le roi se rapproche du pion avant la course."],["book","e4f4","Le roi noir avance pour contester la promotion."],["user","d1c2","Le roi continue à soutenir le pion." ]], "8/8/8/8/4k3/8/4P3/4K3 w - - 0 1"],
  ];
  LESSONS.push(...expandedLessonData.map((item) => {
    const [id,title,level,category,color,setup,question,correct,distractor1,distractor2,principle,transfer,hints,line,fen] = item;
    return {
      id, title, level, category, color, setup, fen,
      author: "SupaChess Académie",
      book: "Parcours original inspiré des thèmes des grands manuels d’échecs",
      reference: "Leçon pédagogique originale · " + level,
      question, principle, transfer, hints,
      choices: [{ text: correct, correct: true }, { text: distractor1, correct: false }, { text: distractor2, correct: false }],
      sequence: line.map(([side,uci,explanation]) => ({ side, uci, explanation })),
    };
  }));



  const academyData = root.SupaChessCurriculum ||
    (typeof require === "function" ? require("./curriculum.js") : null);
  const ChessClass = root.Chess || (typeof Chess !== "undefined" ? Chess : null) ||
    (typeof require === "function" ? require("chess.js").Chess : null);
  const frenchSanToEngine = (san) => String(san).replace(/([CFDRT])(?=x?[a-h])/g,
    (piece) => ({ C: "N", F: "B", D: "Q", R: "K", T: "R" })[piece]);
  const playUci = (position, uci) => position.move({
    from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || "q",
  });

  if (academyData && ChessClass) {
    for (const source of academyData.lessons || []) {
      if (LESSONS.some((lesson) => lesson.title === source.title)) continue;
      const position = new ChessClass();
      const setupPgn = frenchSanToEngine(source.setup);
      if (!position.load_pgn(setupPgn)) throw new Error("PGN de mise en place invalide: " + source.id);
      const fen = position.fen();
      const learnerColor = position.turn();
      const sequence = [];
      for (let index = 0; index < source.line.length; index++) {
        const move = position.move(frenchSanToEngine(source.line[index]));
        if (!move) throw new Error("Suite illégale du curriculum: " + source.id + " · " + source.line[index]);
        sequence.push({
          side: move.color === learnerColor ? "user" : "book",
          uci: move.from + move.to + (move.promotion || ""),
          explanation: source.notes[index],
        });
      }
      LESSONS.push({
        id: "curriculum-" + source.id,
        level: source.level,
        title: source.title,
        category: "Programme · " + source.theme,
        program: programForLesson({ category: source.theme, title: source.title }),
        author: "SupaChess Académie",
        book: "Curriculum original fusionné depuis le parcours local",
        reference: "Leçon originale · " + source.level,
        fen,
        setup: [],
        color: learnerColor,
        question: source.question,
        choices: source.choices.map((choice) => ({
          text: "Jouer " + choice,
          correct: choice === source.answer,
        })),
        principle: source.why,
        transfer: source.goal,
        hints: [source.goal, source.notes[0] || source.why],
        sequence,
        pitfall: source.pitfall || "Après chaque réponse adverse, réévalue les menaces avant de poursuivre ton idée.",
      });
    }
  }

  function programForLesson(lesson) {
    if (lesson.program) return lesson.program;
    if (lesson.kind === "anticipation") return "Anti-erreurs · anticiper l’adversaire";
    const category = String(lesson.category || "");
    const title = String(lesson.title || "");
    if (/stockfish|comparer les coups|analyse multipv/i.test(category + " " + title))
      return "Stockfish · comparer et vérifier";
    if (/tactique|clouage|fourchette|mat|sacrifice/i.test(category + " " + title))
      return "Tal · tactique et sacrifices à calculer";
    if (/calcul|candidat|défense forcing|décision/i.test(category + " " + title))
      return "Kasparov · coups candidats et calcul";
    if (/finale|roi et pion|tour et roi|conversion/i.test(category))
      return "Carlsen · amélioration et conversion";
    if (/ouverture|développement|centre/i.test(category))
      return "Fischer · préparation et précision";
    return "Carlsen · amélioration et conversion";
  }

  for (const lesson of LESSONS) {
    lesson.program = programForLesson(lesson);
    lesson.pitfall = lesson.pitfall || "Ne poursuis pas automatiquement ton plan après le coup adverse : recalcule les menaces et les réponses forcées.";
  }

  // Add 53 original application lessons at new, legal positions from the studied lines.
  // Each module asks the learner to replay a decision from a fresh point in the line;
  // it carries the original move-by-move explanations and remains separate from recall drills.
  const reinforcementSources = LESSONS.slice();
  const reinforcementPools = new Map();
  const reinforcementSeen = new Set();
  for (const source of reinforcementSources) {
    if (!Array.isArray(source.sequence) || !source.sequence.length || !Array.isArray(source.setup)) continue;
    let position;
    try { position = setupGame(source, ChessClass); } catch (_) { continue; }
    for (let index = 0; index < source.sequence.length; index++) {
      const action = source.sequence[index];
      if (action.side === "user") {
        const fen = position.fen();
        if (!reinforcementSeen.has(fen)) {
          const branch = new ChessClass(fen);
          const played = playUci(branch, action.uci);
          if (played) {
            const legal = position.moves({ verbose: true });
            const choices = [{ text: "Jouer " + played.san.replace(/N/g, "C").replace(/B/g, "F").replace(/Q/g, "D").replace(/R/g, "T").replace(/K/g, "R"), correct: true }];
            for (const option of legal) {
              if (option.from + option.to + (option.promotion || "") === action.uci) continue;
              const san = option.san.replace(/N/g, "C").replace(/B/g, "F").replace(/Q/g, "D").replace(/R/g, "T").replace(/K/g, "R");
              choices.push({ text: "Jouer " + san, correct: false });
              if (choices.length === 3) break;
            }
            if (choices.length >= 2) {
              let replay = new ChessClass(fen);
              const remaining = source.sequence.slice(index);
              let legalLine = true;
              for (const ply of remaining) {
                if (!playUci(replay, ply.uci)) { legalLine = false; break; }
              }
              if (legalLine) {
                const program = source.program || "Carlsen · amélioration et conversion";
                const item = {
                  id: "application-" + reinforcementSeen.size,
                  kind: "reinforcement",
                  level: source.level,
                  title: "Application · " + source.title + " · position " + (index + 1),
                  category: "Leçon de renforcement · " + program,
                  program,
                  author: "SupaChess Académie",
                  book: "Parcours original de renforcement SupaChess",
                  reference: "Application approfondie · " + source.level,
                  fen,
                  setup: [],
                  color: position.turn(),
                  question: "À partir de cette nouvelle position, retrouve le coup de la ligne étudiée puis calcule chaque réponse.",
                  choices,
                  principle: source.principle || "Compare les coups candidats et vérifie les menaces après la réponse adverse.",
                  transfer: source.transfer || "Recalcule la position après chaque demi-coup avant de poursuivre ton plan.",
                  hints: ["Repars des menaces et du thème de la leçon source.", "Calcule la meilleure réponse adverse avant de confirmer ton choix."],
                  sequence: remaining.map((ply) => ({ side: ply.side, uci: ply.uci, explanation: ply.explanation })),
                  pitfall: "Ne poursuis pas automatiquement la variante : arrête-toi après chaque réponse adverse et réévalue."
                };
                reinforcementSeen.add(fen);
                if (!reinforcementPools.has(program)) reinforcementPools.set(program, []);
                reinforcementPools.get(program).push(item);
              }
            }
          }
        }
      }
      if (!playUci(position, action.uci)) break;
    }
  }
  const reinforcementTargets = [
    ["Carlsen · amélioration et conversion", 14],
    ["Tal · tactique et sacrifices à calculer", 14],
    ["Kasparov · coups candidats et calcul", 13],
    ["Stockfish · comparer et vérifier", 12],
  ];
  const reinforcementAdded = [];
  const reinforcementUsed = new Set();
  for (const [program, count] of reinforcementTargets) {
    const preferred = reinforcementPools.get(program) || [];
    const fallback = Array.from(reinforcementPools.values()).flat();
    for (const item of [...preferred, ...fallback]) {
      if (reinforcementAdded.length >= reinforcementTargets.slice(0, reinforcementTargets.findIndex((entry) => entry[0] === program) + 1).reduce((sum, entry) => sum + entry[1], 0)) break;
      if (reinforcementUsed.has(item.fen)) continue;
      reinforcementUsed.add(item.fen);
      item.program = program;
      item.category = "Leçon de renforcement · " + program;
      item.id = "application-" + (reinforcementAdded.length + 1);
      item.title = "Application · " + program.split(" · ")[0] + " · " + String(reinforcementAdded.length + 1).padStart(2, "0");
      reinforcementAdded.push(item);
      if (reinforcementAdded.length === reinforcementTargets.slice(0, reinforcementTargets.findIndex((entry) => entry[0] === program) + 1).reduce((sum, entry) => sum + entry[1], 0)) break;
    }
  }
  if (reinforcementAdded.length !== 53) {
    throw new Error("Leçons de renforcement insuffisantes: " + reinforcementAdded.length + "/53 positions distinctes vérifiées.");
  }
  LESSONS.push(...reinforcementAdded);

  // Turn every studied reply into an active-recall challenge: the learner now plays
  // the opponent's half-move, then sees the original continuation and its explanation.
  const sourceLessons = LESSONS.slice();
  const responseExercises = [];
  for (const source of sourceLessons) {
    if (!source.sequence || source.sequence.length < 2) continue;
    const position = setupGame(source, ChessClass);
    for (let index = 0; index < source.sequence.length; index++) {
      const action = source.sequence[index];
      if (action.side === "book" && index > 0 && source.sequence[index - 1].side === "user") {
        const replyPosition = new ChessClass(position.fen());
        const expected = playUci(replyPosition, action.uci);
        if (expected) {
          const previous = source.sequence[index - 1];
          const priorPosition = setupGame(source, ChessClass);
          for (let prior = 0; prior < index; prior++) playUci(priorPosition, source.sequence[prior].uci);
          const priorMove = priorPosition.history({ verbose: true }).slice(-1)[0];
          const replySan = expected.san;
          responseExercises.push({
            id: source.id + "-anticipate-" + index,
            kind: "anticipation",
            level: source.level,
            title: "Anticipation · prévoir la réponse à " + source.title,
            category: "Anticipation · " + source.category,
            program: source.program === "Calcul · meilleure réponse adverse"
              ? "Calcul · meilleure réponse adverse"
              : "Anti-erreurs · anticiper l’adversaire",
            author: "SupaChess Académie",
            book: "Programme de renforcement et rappel actif",
            reference: "Exercice original de prévision du demi-coup adverse",
            fen: position.fen(),
            setup: [],
            color: position.turn(),
            question: "Après le dernier coup joué, quelle réponse de la ligne faut-il envisager avant de poursuivre ?",
            choices: [
              { text: "Anticiper " + replySan + " et vérifier ses conséquences", correct: true },
              { text: "Continuer son plan sans réexaminer la position", correct: false },
              { text: "Jouer un coup d’aile sans vérifier les menaces", correct: false },
            ],
            principle: "Réponse de la ligne étudiée : " + replySan + ". " + action.explanation,
            transfer: "Après chaque demi-coup adverse, recommence l’inventaire des échecs, prises et menaces avant de poursuivre ton plan.",
            pitfall: "Ne considère pas ton coup comme réussi tant que tu n’as pas examiné la réponse adverse la plus gênante.",
            hints: [
              "Observe ce que le dernier coup a attaqué ou laissé sans défense.",
              "Compare les échecs, prises et menaces possibles pour le camp adverse.",
            ],
            sequence: source.sequence.slice(index).map((item) => ({
              side: item.side === "book" ? "user" : "book",
              uci: item.uci,
              explanation: item.explanation,
            })),
            anticipatedMove: replySan,
            previousMove: priorMove ? priorMove.san : previous.uci,
          });
        }
      }
      if (!playUci(position, action.uci)) throw new Error("Coup illégal lors de la création du rappel: " + source.id + " · " + action.uci);
    }
  }
  LESSONS.push(...responseExercises);

  // Five explicit starter lessons make every named method a playable, searchable lesson.
  // The teaching text is original SupaChess content; Stockfish contributes live analysis only.
  LESSONS.push(
    {
      id: "method-fischer-preparer-d4",
      kind: "method",
      level: "Débutant",
      title: "Méthode Fischer · Préparer la rupture d4",
      category: "Parcours joueur · Fischer · Préparation et précision",
      program: "Fischer · préparation et précision",
      author: "SupaChess Académie",
      book: "Exercice original inspiré des thèmes de préparation et de précision associés à Fischer",
      reference: "Leçon originale SupaChess · aucun texte ni commentaire attribué à Fischer",
      pitfall: "Ne pousse pas automatiquement d4 avant d’avoir prévu la réponse centrale adverse.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6"],
      color: "w",
      question: "Pourquoi préparer c3 avant de pousser d4 dans cette position ?",
      choices: [
        { text: "Soutenir le centre et garder le choix du bon moment pour l’ouvrir", correct: true },
        { text: "Éviter tout échange de pièces jusqu’à la finale", correct: false },
        { text: "Forcer immédiatement le roi noir à quitter le centre", correct: false },
      ],
      principle: "Préparer d’abord c3 soutient le centre et laisse aux Blancs le choix du moment pour jouer d4. Le plan compte davantage que la récitation d’une suite.",
      transfer: "Dans une ouverture connue, identifie la structure, le but du coup préparatoire et les réponses adverses avant de jouer la rupture.",
      hints: ["Le pion c2 peut soutenir d4.", "Le plan est c3, puis d4 quand les pièces sont prêtes."],
      sequence: [
        { side: "user", uci: "c2c3", explanation: "c3 prépare d4 et soutient le centre; les Blancs gardent plusieurs réponses selon le jeu noir." },
        { side: "book", uci: "e8g8", explanation: "Les Noirs roquent et mettent leur roi à l’abri avant l’ouverture du centre." },
        { side: "user", uci: "d2d4", explanation: "Les Blancs ouvrent maintenant le centre après la préparation de c3." },
        { side: "book", uci: "e5d4", explanation: "Les Noirs peuvent prendre le pion d4; il faut déjà avoir calculé la reprise." },
        { side: "user", uci: "c3d4", explanation: "Le pion c reprend en d4 et maintient une présence centrale." },
      ],
    },
    {
      id: "method-carlsen-roi-actif",
      kind: "method",
      level: "Intermédiaire",
      title: "Méthode Carlsen · Gagner l’opposition avant la poussée",
      category: "Parcours joueur · Carlsen · Amélioration et conversion",
      program: "Carlsen · amélioration et conversion",
      author: "SupaChess Académie",
      book: "Exercice original inspiré des thèmes de jeu de finale associés à Carlsen",
      reference: "Leçon originale SupaChess · aucun texte ni commentaire attribué à Carlsen",
      pitfall: "Ne pousse pas le pion en oubliant de vérifier si ton roi reste assez actif.",
      fen: "8/8/4k3/8/4K3/8/4P3/8 w - - 0 1",
      color: "w",
      question: "Quel est le plan le plus sûr avant de pousser le pion ?",
      choices: [
        { text: "Centraliser le roi tout en gardant le pion sous contrôle", correct: true },
        { text: "Pousser le pion immédiatement sans calculer la réponse noire", correct: false },
        { text: "Éloigner le roi du pion pour gagner un tempo", correct: false },
      ],
      principle: "En finale, l’activité du roi peut compter davantage qu’une poussée de pion immédiate. Il faut comparer l’activité des rois et garder le pion en sécurité.",
      transfer: "Avant toute course de pions, calcule l’opposition, les cases contrôlées et les tempos de promotion.",
      hints: ["Le roi blanc peut gagner une case centrale sans abandonner le pion.", "Commence par Kd4, puis vérifie la réponse noire."],
      sequence: [
        { side: "user", uci: "e4d4", explanation: "Le roi blanc se rapproche du centre tout en restant près du pion e2." },
        { side: "book", uci: "e6d6", explanation: "Le roi noir avance lui aussi pour contester les cases centrales." },
        { side: "user", uci: "e2e3", explanation: "Le pion avance d’une case et reste défendu par le roi blanc en d4." },
        { side: "book", uci: "d6e6", explanation: "Le roi noir se replace pour suivre la progression du pion." },
      ],
    },
    {
      id: "method-tal-calcul-sacrifice",
      kind: "method",
      level: "Avancé",
      title: "Méthode Tal · Vérifier une fourchette spectaculaire",
      category: "Parcours joueur · Tal · Tactique et sacrifices à calculer",
      program: "Tal · tactique et sacrifices à calculer",
      author: "SupaChess Académie",
      book: "Exercice tactique original inspiré du calcul des positions combinatoires associé à Tal",
      reference: "Leçon originale SupaChess · position pédagogique, pas une partie historique de Tal",
      pitfall: "Ne qualifie pas la combinaison de gagnante avant d’avoir calculé la meilleure défense.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5"],
      color: "w",
      question: "Après Cxf7, quelle est la vérification tactique essentielle ?",
      choices: [
        { text: "La fourchette vise la dame et la tour; il faut calculer la meilleure défense noire avant de conclure", correct: true },
        { text: "Tout coup spectaculaire gagne forcément du matériel", correct: false },
        { text: "La tour h8 est perdue sans aucune réponse possible", correct: false },
      ],
      principle: "Cxf7 attaque la dame d8 et la tour h8. Une fourchette peut créer une menace concrète, mais on ne la juge pas gagnante sans calculer les défenses et la position après les échanges.",
      transfer: "Pour un sacrifice ou une combinaison, liste les réponses forcing, notamment les échecs et les prises, puis évalue la position obtenue.",
      hints: ["Le cavalier g5 peut prendre f7 et menacer deux pièces.", "Cherche une réponse qui sauve la dame sans laisser la tour sans défense."],
      sequence: [
        { side: "user", uci: "g5f7", explanation: "Le cavalier attaque à la fois la dame d8 et la tour h8; vérifie les défenses avant de compter un gain." },
        { side: "book", uci: "d8e7", explanation: "La dame se déplace et répond à la menace; la tactique ne gagne pas automatiquement les deux pièces." },
        { side: "user", uci: "f7h8", explanation: "Le cavalier prend la tour h8 après avoir calculé la mise à l’abri de la dame." },
      ],
    },
    {
      id: "method-kasparov-coups-candidats",
      kind: "method",
      level: "Expert",
      title: "Méthode Kasparov · Comparer les coups candidats",
      category: "Parcours joueur · Kasparov · Coups candidats et calcul",
      program: "Kasparov · coups candidats et calcul",
      author: "SupaChess Académie",
      book: "Exercice original inspiré des thèmes de calcul et d’initiative associés à Kasparov",
      reference: "Leçon originale SupaChess · aucun texte ni commentaire attribué à Kasparov",
      pitfall: "Ne t’arrête pas après ton premier candidat : calcule la réponse la plus forte.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
      color: "w",
      question: "Avant de jouer d4, quelle étape de calcul ne faut-il pas omettre ?",
      choices: [
        { text: "Comparer les coups candidats et calculer les prises ainsi que la meilleure reprise adverse", correct: true },
        { text: "Choisir le coup qui avance le plus de pièces vers le roi noir", correct: false },
        { text: "S’arrêter après avoir trouvé un coup qui attaque e5", correct: false },
      ],
      principle: "d4 est un candidat énergique, mais sa valeur dépend des prises et des réponses disponibles. Il faut comparer la position après la suite forcée.",
      transfer: "Établis plusieurs candidats, calcule les réponses les plus gênantes et compare les positions finales avant de choisir.",
      hints: ["Le coup d4 attaque le pion e5; les Noirs peuvent-ils le prendre ?", "Après …exd4, cherche une reprise qui développe une pièce."],
      sequence: [
        { side: "user", uci: "d2d4", explanation: "d4 conteste le centre et ouvre les lignes; ce coup doit être jugé après la réponse adverse." },
        { side: "book", uci: "e5d4", explanation: "Les Noirs prennent en d4; il faut recalculer au lieu de poursuivre mécaniquement le plan." },
        { side: "user", uci: "f3d4", explanation: "Le cavalier reprend en d4 et entre au centre avec tempo sur le fou c5." },
        { side: "book", uci: "c5b6", explanation: "Le fou se retire de l’attaque du cavalier." },
        { side: "user", uci: "b1c3", explanation: "Le cavalier rejoint le centre et les Blancs poursuivent leur développement." },
      ],
    },
    {
      id: "method-stockfish-comparer-lignes",
      kind: "method",
      level: "Expert",
      title: "Leçon avec Stockfish 19 · Comparer sa variante",
      category: "Parcours moteur · Stockfish · Comparer et vérifier",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Atelier original comparé à l’analyse de Stockfish 19",
      reference: "Lancer l’analyse Stockfish depuis la position de l’exercice; score dépendant du temps de recherche",
      pitfall: "Ne copie pas le premier coup du moteur sans comprendre sa variante et la réponse adverse.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4"],
      color: "b",
      question: "Que faut-il faire avant de consulter la première ligne de Stockfish ?",
      choices: [
        { text: "Noter son candidat, la réponse adverse prévue et la suite calculée", correct: true },
        { text: "Copier le premier coup affiché sans examiner sa variante", correct: false },
        { text: "Traiter l’évaluation du moteur comme une explication complète", correct: false },
      ],
      principle: "Le moteur calcule et classe des variantes selon une recherche donnée. Pour apprendre, compare sa ligne à ton calcul et explique les menaces concrètes qui changent l’évaluation.",
      transfer: "Écris ton idée avant l’analyse, confronte les réponses forcing, puis rejoue et explique chaque demi-coup de la variante retenue.",
      hints: ["Distingue ton candidat et la réponse adverse que tu crains.", "La bonne routine commence par noter ta propre variante."],
      sequence: [
        { side: "user", uci: "g8f6", explanation: "Le cavalier se développe en attaquant e4; note d’abord les réponses blanches candidates." },
        { side: "book", uci: "e1g1", explanation: "Les Blancs roquent et mettent le roi à l’abri avant de poursuivre le développement." },
        { side: "user", uci: "f8e7", explanation: "Le fou se développe et prépare le roque noir; compare cette ligne aux candidats Stockfish depuis chaque position." },
      ],
    },
  );

  // Stockfish interpretation exercises: teach search outputs, not an invented inner monologue.
  LESSONS.push(
    {
      id: "stockfish-forced-mate",
      kind: "method",
      level: "Débutant",
      title: "Stockfish · Repérer le mat forcé",
      category: "Parcours moteur · Stockfish · Recherche de mat",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Exercice original d’interprétation d’une recherche Stockfish 19",
      reference: "Position pédagogique mate en un · la recherche du moteur doit être lancée depuis l’exercice",
      fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
      color: "w",
      question: "Si Stockfish affiche #1 pour les Blancs dans cette position, que signifie ce résultat ?",
      choices: [
        { text: "Il a trouvé un mat forcé au prochain coup; la ligne montre le coup qui le réalise", correct: true },
        { text: "Les Blancs ont un avantage matériel d’un pion", correct: false },
        { text: "Le moteur affirme que tous les autres coups perdent immédiatement leur dame", correct: false },
      ],
      principle: "Un score de mat indique une ligne de mat trouvée par la recherche. Ici, Dg7 mate: le roi blanc protège la dame et la dame contrôle les cases de fuite.",
      transfer: "Quand le moteur signale un mat, rejoue la variante, vérifie les réponses légales et distingue une ligne de mat forcé d’un simple avantage matériel.",
      hints: ["Cherche les échecs qui limitent toutes les réponses noires.", "La dame peut aller en g7, protégée par le roi f6."],
      pitfall: "Ne confonds pas une évaluation en pions avec une annonce de mat, et vérifie toujours la ligne affichée.",
      sequence: [
        { side: "user", uci: "g6g7", explanation: "Dg7 est échec et mat: le roi noir n’a aucune case sûre et ne peut pas capturer la dame protégée par le roi blanc." },
      ],
    },
    {
      id: "stockfish-read-principal-variation",
      kind: "method",
      level: "Intermédiaire",
      title: "Stockfish · Lire la variante principale",
      category: "Parcours moteur · Stockfish · Variante principale",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Exercice original d’interprétation d’une variante Stockfish 19",
      reference: "Ligne pédagogique légale; les candidats affichés dépendent de la recherche lancée",
      setup: ["e4", "e5", "Nf3", "Nc6"],
      color: "w",
      question: "Pour comprendre pourquoi le moteur classe un coup en premier, que faut-il examiner ?",
      choices: [
        { text: "La variante complète et les meilleures réponses adverses, pas seulement le premier coup", correct: true },
        { text: "Le nom de l’ouverture sans regarder les coups suivants", correct: false },
        { text: "Le premier coup seul, car il donne toujours sa justification", correct: false },
      ],
      principle: "Le coup affiché est le premier d’une variante principale calculée. Les demi-coups suivants montrent les réponses que la recherche considère importantes; ils aident à vérifier les menaces et les défenses.",
      transfer: "Rejoue la ligne jusqu’à une position stable, puis compare la position finale et les autres coups candidats proposés.",
      hints: ["Un premier coup ne révèle pas à lui seul la tactique ou la défense trouvée.", "Lis la suite calculée et arrête-toi après chaque réponse adverse."],
      pitfall: "Ne présente pas la variante principale comme une explication en langage humain ni comme une vérité indépendante de la profondeur de recherche.",
      sequence: [
        { side: "user", uci: "f1b5", explanation: "Le fou vise la diagonale vers le roi et met une pression sur le cavalier c6; compare ce candidat à la ligne principale affichée par Stockfish." },
        { side: "book", uci: "a7a6", explanation: "Le pion demande au fou de choisir une case; cette réponse adverse fait partie du calcul à examiner." },
        { side: "user", uci: "b5a4", explanation: "Le fou conserve sa pression en reculant; poursuis la variante du moteur avant de conclure sur le premier coup." },
        { side: "book", uci: "g8f6", explanation: "Le cavalier se développe et attaque e4; la ligne doit être réévaluée après cette nouvelle position." },
      ],
    },
    {
      id: "stockfish-interpret-evaluation",
      kind: "method",
      level: "Avancé",
      title: "Stockfish · Interpréter l’évaluation et les candidats",
      category: "Parcours moteur · Stockfish · Évaluation et MultiPV",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Exercice original pour apprendre à lire les évaluations Stockfish 19",
      reference: "Exercice de comparaison des coups candidats; scores dépendants de la recherche et du point de vue affiché",
      setup: ["e4", "e5", "Nf3", "Nc6"],
      color: "w",
      question: "Quand tu compares deux évaluations Stockfish, quelle vérification évite une conclusion trompeuse ?",
      choices: [
        { text: "Comparer le même point de vue, la profondeur et la variante, puis examiner l’écart entre candidats", correct: true },
        { text: "Comparer uniquement les signes + et − sans vérifier quel camp a le trait", correct: false },
        { text: "Choisir systématiquement la ligne dont le nombre semble le plus grand", correct: false },
      ],
      principle: "Une évaluation dépend de la position, du point de vue indiqué, de la recherche et de la variante. MultiPV compare plusieurs candidats; l’écart aide à prioriser l’analyse mais ne remplace pas la vérification des lignes.",
      transfer: "Note le coup que tu aurais joué, lis le point de vue et la profondeur, puis rejoue les premières réponses des deux candidats pour trouver la différence concrète.",
      hints: ["Vérifie si l’évaluation est côté au trait ou côté blanc.", "Compare des scores produits dans des conditions et des points de vue cohérents."],
      pitfall: "Ne traite pas quelques centipions, une profondeur donnée ou un changement de signe isolé comme une mesure absolue de la qualité humaine du coup.",
      sequence: [
        { side: "user", uci: "d2d4", explanation: "d4 est un candidat central légal; demande à Stockfish de comparer plusieurs candidats plutôt que de supposer que ce coup est le meilleur." },
        { side: "book", uci: "e5d4", explanation: "Les Noirs prennent en d4; cette réponse modifie la position et le score doit être recalculé depuis le nouveau trait." },
        { side: "user", uci: "f3d4", explanation: "Le cavalier reprend; compare les évaluations dans le point de vue explicitement affiché et lis la variante principale." },
      ],
    },
  );

  // Original lessons about interpreting observable Stockfish search output.
  LESSONS.push(
    {
      id: "stockfish-evaluation-context",
      kind: "method",
      level: "Débutant",
      title: "Stockfish · Lire une évaluation avec le bon repère",
      category: "Parcours moteur · Stockfish · Lire une évaluation",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Leçon originale d’interprétation de Stockfish 19",
      reference: "Le score dépend de la position, du camp au trait et des paramètres de recherche",
      setup: ["e4", "e5", "Nf3", "Nc6"],
      color: "w",
      question: "Avant de tirer une conclusion d’un score Stockfish, que dois-tu vérifier ?",
      choices: [
        { text: "La position exacte, le camp au trait, le point de vue du score et s’il s’agit d’un mat ou de centipions", correct: true },
        { text: "Seulement si le nombre est positif, car cela signifie toujours que le camp au trait gagne", correct: false },
        { text: "Le niveau Elo FIDE humain que ce score attribuerait au joueur", correct: false },
      ],
      principle: "Une évaluation n’est pas un Elo FIDE. Elle décrit l’estimation du moteur pour une position et une recherche données; son signe dépend de la convention d’affichage, et un score de mat n’est pas un score en pions.",
      transfer: "Avant de comparer deux analyses, vérifie que tu regardes la même position, le même camp au trait, le même point de vue et des réglages de recherche comparables.",
      hints: ["Lis l’indication de perspective et regarde qui doit jouer.", "Distingue un score en centipions d’une annonce de mat."],
      pitfall: "Ne convertis pas un score de position en Elo FIDE et ne compare pas des nombres sans vérifier leur point de vue.",
      sequence: [
        { side: "user", uci: "f1c4", explanation: "Le fou se développe; note la position et le camp au trait avant de relever une évaluation." },
        { side: "book", uci: "g8f6", explanation: "Les Noirs attaquent e4. Recalcule depuis cette nouvelle position plutôt que de reporter le score précédent." },
        { side: "user", uci: "d2d3", explanation: "Les Blancs soutiennent le centre. Une évaluation reste un repère de recherche, à confronter aux variantes." },
      ],
    },
    {
      id: "stockfish-best-reply",
      kind: "method",
      level: "Intermédiaire",
      title: "Stockfish · Vérifier la meilleure réponse adverse",
      category: "Parcours moteur · Stockfish · Réponse la plus forte",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Exercice original sur les variantes principales de Stockfish 19",
      reference: "La meilleure défense affichée dépend de la position et de la recherche",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4"],
      color: "b",
      question: "Tu as trouvé un coup candidat. Quelle étape permet de voir s’il résiste à la défense adverse ?",
      choices: [
        { text: "Calculer la réponse adverse la plus gênante, puis comparer la position après cette réponse", correct: true },
        { text: "S’arrêter dès que le moteur affiche une première ligne", correct: false },
        { text: "Supposer que l’adversaire jouera la réponse qui arrange ton plan", correct: false },
      ],
      principle: "Une variante n’est utile que si elle tient compte des réponses adverses fortes. Stockfish fournit une ligne de recherche; le joueur doit rejouer chaque demi-coup et vérifier les menaces sur l’échiquier.",
      transfer: "Annonce ta réponse adverse probable avant l’analyse, puis compare-la à la première ligne et vérifie ce qui change après la meilleure défense.",
      hints: ["Après ton coup, donne le trait à l’adversaire et cherche ses échecs, prises et menaces.", "Compare ensuite cette réponse à celle affichée dans la variante principale."],
      pitfall: "Ne valide pas un plan en ne calculant que les réponses faibles ou naturelles de l’adversaire.",
      sequence: [
        { side: "user", uci: "g8f6", explanation: "Le cavalier attaque e4; il faut déjà examiner les réponses blanches les plus actives." },
        { side: "book", uci: "e1g1", explanation: "Le roque est une réponse légale qui sécurise le roi; compare-la aux autres réponses possibles." },
        { side: "user", uci: "f8e7", explanation: "Les Noirs développent le fou. Reprends l’analyse depuis cette position, avec le trait aux Blancs." },
      ],
    },
    {
      id: "stockfish-depth-stability",
      kind: "method",
      level: "Expert",
      title: "Stockfish · Tester la stabilité d’une variante",
      category: "Parcours moteur · Stockfish · Profondeur et stabilité",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Leçon originale sur les limites d’une recherche de moteur",
      reference: "Une recherche plus longue peut modifier les candidats et leur ordre",
      setup: ["e4", "e5", "Nf3", "Nc6"],
      color: "w",
      question: "Un candidat change de rang quand la recherche s’approfondit. Comment étudier ce résultat ?",
      choices: [
        { text: "Relancer depuis la même position, comparer les variantes et réponses adverses, puis noter si le choix reste stable", correct: true },
        { text: "Conclure que la première analyse était fausse et retenir le nouveau score sans lire la ligne", correct: false },
        { text: "Additionner les scores des recherches de profondeurs différentes", correct: false },
      ],
      principle: "La profondeur indique jusqu’où la recherche a exploré, pas une garantie d’exhaustivité. Des candidats proches peuvent changer d’ordre; les variantes, les réponses adverses et la stabilité du résultat comptent davantage qu’un nombre isolé.",
      transfer: "Conserve la même position, lance une comparaison MultiPV, augmente le temps de recherche puis confronte les lignes et les évaluations avec la même perspective.",
      hints: ["Assure-toi que les comparaisons partent de la même position et du même trait.", "Lis ce qui change dans les lignes avant de comparer leur rang."],
      pitfall: "Ne traite ni une profondeur ni un classement provisoire des coups comme une preuve absolue.",
      sequence: [
        { side: "user", uci: "f1b5", explanation: "Le fou développe et met une pression sur le cavalier c6; compare ce candidat aux autres avec les mêmes conditions de recherche." },
        { side: "book", uci: "a7a6", explanation: "Le pion attaque le fou et impose une nouvelle décision. La position après cette réponse doit être analysée séparément." },
        { side: "user", uci: "b5a4", explanation: "Le fou recule. Compare les lignes complètes et leur stabilité, pas seulement leur premier coup." },
      ],
    },
  );

  // Original teaching exercises derived from TCEC Season 18 Superfinal game 6.1.
  // The move score/engine intent is not inferred; explanations describe observable board facts.
  LESSONS.push(
    {
      id: "tcec18-stockfish-question-bishop",
      kind: "method",
      level: "Intermédiaire",
      title: "Partie TCEC · Mettre le fou b4 à l’épreuve",
      category: "Parties ordinateurs · TCEC 18 · Développement et structure",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Partie TCEC S18 Superfinal · Stockfish contre LCZero · PGN CC BY-SA 3.0",
      reference: "Partie TCEC 6.1 · 20 juin 2020 · Stockfish (Blancs) gagne 1-0 · explications SupaChess",
      sourceUrl: "https://github.com/TCEC-Chess/tcecgames",
      sourceLabel: "Source du PGN et licence TCEC",
      setup: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5"],
      color: "w",
      question: "Après 4…c5, que faut-il calculer avant de jouer a3 ?",
      choices: [
        { text: "Le fou peut échanger en c3 avec échec; après bxc3, comparer structure de pions et paire de fous", correct: true },
        { text: "Le fou b4 ne peut pas être échangé et sera gagné immédiatement", correct: false },
        { text: "a3 donne mat en un coup grâce au pion e5", correct: false },
      ],
      principle: "Dans cette partie TCEC, Stockfish a joué a3, mais le fou pouvait prendre le cavalier c3 avec échec. Après bxc3, les Blancs ont la paire de fous contre des pions doublés en c3.",
      transfer: "Quand tu attaques un fou, calcule ses prises avec échec avant de décider si l’échange améliore ta structure.",
      hints: ["Le fou b4 peut capturer le cavalier c3.", "Après Bxc3+, le pion b2 peut reprendre en c3."],
      pitfall: "Ne considère pas un coup qui attaque une pièce comme un gain forcé; vérifie les captures et les échecs intermédiaires.",
      sequence: [
        { side: "user", uci: "a2a3", explanation: "a3 questionne le fou b4; les Noirs peuvent toutefois choisir l’échange Bxc3+." },
        { side: "book", uci: "b4c3", explanation: "Le fou prend le cavalier avec échec sur la diagonale vers le roi e1." },
        { side: "user", uci: "b2c3", explanation: "Le pion reprend en c3, créant une structure modifiée mais conservant la paire de fous." },
        { side: "book", uci: "d8c7", explanation: "La dame se développe en c7 et met une pression sur le centre blanc." },
      ],
    },
    {
      id: "tcec18-stockfish-anticipate-f5",
      kind: "method",
      level: "Avancé",
      title: "Partie TCEC · Anticiper …f5 contre la dame",
      category: "Parties ordinateurs · TCEC 18 · Réponse adverse et tempo",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Partie TCEC S18 Superfinal · Stockfish contre LCZero · PGN CC BY-SA 3.0",
      reference: "Partie TCEC 6.1 · 20 juin 2020 · ligne jouée 7.Dg4 f5 8.Dg3 Cc6",
      sourceUrl: "https://github.com/TCEC-Chess/tcecgames",
      sourceLabel: "Source du PGN et licence TCEC",
      setup: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Qc7"],
      color: "w",
      question: "Après 7.Dg4, quelle réponse réelle des Noirs faut-il anticiper ?",
      choices: [
        { text: "…f5 attaque la dame g4 et gagne un tempo; il faut déjà calculer sa retraite", correct: true },
        { text: "…f5 attaque directement le roi blanc et donne mat", correct: false },
        { text: "Les Noirs peuvent ignorer la dame car elle est protégée par le roi blanc", correct: false },
      ],
      principle: "Dans la partie, …f5 attaque la dame en g4 depuis f5. Stockfish a ensuite reculé en g3, puis développé le cavalier c6.",
      transfer: "Avant d’avancer une pièce vers le camp adverse, vérifie les coups avec tempo que cette pièce peut subir.",
      hints: ["Le pion noir f7 avance en f5 et attaque les cases g4 et e4.", "La partie poursuit par Dg3 puis …Cc6."],
      pitfall: "Ne calcule pas seulement ton attaque; après chaque coup, cherche les menaces adverses qui gagnent un tempo.",
      sequence: [
        { side: "user", uci: "d1g4", explanation: "Dg4 met une pression sur le flanc roi; la dame est exposée à une poussée de pion avec tempo." },
        { side: "book", uci: "f7f5", explanation: "…f5 attaque la dame g4, qui doit répondre à la menace." },
        { side: "user", uci: "g4g3", explanation: "La dame se replie en g3 et garde la pression sur la colonne g." },
        { side: "book", uci: "b8c6", explanation: "Le cavalier se développe vers le centre pendant que la position reste tendue." },
        { side: "user", uci: "g1f3", explanation: "Le cavalier se développe; après …cxd4, les Blancs devront décider comment reprendre au centre." },
        { side: "book", uci: "c5d4", explanation: "Le pion c5 prend en d4 et ouvre le centre." },
        { side: "user", uci: "c3d4", explanation: "Le pion reprend en d4 et rétablit un pion central." },
      ],
    },
    {
      id: "tcec18-stockfish-rook-sacrifice",
      kind: "method",
      level: "Expert",
      title: "Partie TCEC · Calculer le sacrifice de tour",
      category: "Parties ordinateurs · TCEC 18 · Échecs forcing et calcul",
      program: "Stockfish · comparer et vérifier",
      author: "SupaChess Académie",
      book: "Partie TCEC S18 Superfinal · Stockfish contre LCZero · PGN CC BY-SA 3.0",
      reference: "Partie TCEC 6.1 · position après 40…Ce3 · Stockfish 202006170741, pas Stockfish 19",
      sourceUrl: "https://github.com/TCEC-Chess/tcecgames",
      sourceLabel: "Source du PGN et licence TCEC",
      fen: "q3r2k/1R4p1/2n1p2p/3pP2P/5PP1/p1P1n1B1/R7/1Q4K1 w - - 1 41",
      color: "w",
      question: "Après 40…Ce3, comment évaluer 41.Txg7 ?",
      choices: [
        { text: "Calculer la prise Kxg7 puis la suite d’échecs avant de juger le sacrifice", correct: true },
        { text: "Jouer Txg7 parce qu’une prise de pion gagne automatiquement la partie", correct: false },
        { text: "Rejeter Txg7 sans examiner les échecs disponibles", correct: false },
      ],
      principle: "Dans cette partie, Stockfish a donné sa tour contre le pion g7; après Kxg7, il a enchaîné les échecs Dg6+, Dxh6+ et Dg7+. Le thème pédagogique est de calculer toute la séquence avant d’évaluer le sacrifice.",
      transfer: "Quand tu envisages un sacrifice, calcule la reprise adverse et poursuis les échecs, prises et menaces jusqu’à une position où tu peux évaluer le résultat.",
      hints: ["La tour blanche peut prendre le pion g7.", "Après …Kxg7, cherche les échecs de la dame blanche."],
      pitfall: "Ne copie pas le sacrifice historique sans recalculer: l’analyse dépend de la position, du moteur et de sa recherche.",
      sequence: [
        { side: "user", uci: "b7g7", explanation: "La tour prend le pion g7; la prise est un sacrifice candidat, pas une conclusion de gain." },
        { side: "book", uci: "h8g7", explanation: "Le roi reprend la tour; il faut poursuivre le calcul plutôt que s’arrêter au matériel sacrifié." },
        { side: "user", uci: "b1g6", explanation: "Dg6+ force une réponse du roi et ouvre une suite d’échecs." },
        { side: "book", uci: "g7f8", explanation: "Le roi se déplace en f8 pour répondre à l’échec." },
        { side: "user", uci: "g6h6", explanation: "Dxh6+ poursuit l’attaque avec échec." },
        { side: "book", uci: "f8e7", explanation: "Le roi quitte l’échec et reste exposé aux pièces blanches." },
        { side: "user", uci: "h6g7", explanation: "Dg7+ continue la séquence forcing." },
        { side: "book", uci: "e7d8", explanation: "Le roi se replie vers d8." },
        { side: "user", uci: "g3h4", explanation: "Fh4+ ajoute une pièce à l’attaque et oblige le roi à bouger de nouveau." },
        { side: "book", uci: "d8c8", explanation: "Le roi va en c8; la ligne continue dans la partie historique." },
      ],
    },
  );


  LESSONS.push(
    {
      id: "capablanca-development-tempo",
      kind: "method",
      level: "Débutant",
      title: "Développer le cavalier avec tempo",
      category: "Ouverture · Développement et attaque",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, §6, exemple 17, pp. 25–27",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      setup: ["e4", "e5"],
      color: "w",
      question: "Quel coup développe une pièce tout en attaquant le pion e5 ?",
      choices: [
        { text: "Cf3 : développer le cavalier et créer une menace sur e5", correct: true },
        { text: "Dh5 : sortir la dame avant les pièces mineures", correct: false },
        { text: "a3 : jouer un pion d’aile sans développer", correct: false },
      ],
      principle: "Un bon coup d’ouverture peut servir deux buts : développer une pièce et créer une pression utile.",
      transfer: "Avant un coup d’ouverture, vérifie s’il développe une pièce, contrôle le centre ou crée une menace concrète sans retarder la sécurité du roi.",
      pitfall: "Évite de sortir la dame ou de pousser un pion d’aile avant de développer, sauf raison tactique concrète.",
      hints: ["Le cavalier du roi peut sortir avec une attaque sur e5.", "Le coup illustré par Capablanca est Cf3."],
      sequence: [
        { side: "user", uci: "g1f3", explanation: "Le cavalier se développe et attaque le pion e5." },
        { side: "book", uci: "b8c6", explanation: "Le cavalier noir se développe en défendant e5." },
        { side: "user", uci: "b1c3", explanation: "Le second cavalier rejoint le jeu et renforce le contrôle central." },
        { side: "book", uci: "g8f6", explanation: "Les Noirs développent à leur tour leur cavalier." },
        { side: "user", uci: "f1b5", explanation: "Le fou se développe en créant une pression sur le cavalier c6." },
      ],
    },
    {
      id: "capablanca-control-centre",
      kind: "method",
      level: "Débutant",
      title: "Contester le centre au bon moment",
      category: "Ouverture · Contrôle du centre",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, §7, exemple 18, pp. 28–30",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      setup: ["e4", "e5", "Nf3", "d6"],
      color: "w",
      question: "Les Noirs ont joué …d6. Quel coup prend immédiatement de l’espace au centre ?",
      choices: [
        { text: "d4 : contester le centre et ouvrir des lignes", correct: true },
        { text: "h3 : attendre sans développer ni contester le centre", correct: false },
        { text: "a3 : déplacer un pion d’aile sans pression centrale", correct: false },
      ],
      principle: "Une avance centrale peut gagner de l’espace et faciliter le développement, mais il faut calculer la réponse adverse.",
      transfer: "Quand l’adversaire adopte une posture passive, cherche si une poussée centrale est sûre; vérifie les prises, les clouages et les pièces qui restent derrière.",
      pitfall: "Ne pousse pas au centre sans calculer les prises et les pièces qui pourraient rester en prise.",
      hints: ["Le coup central attaque e5 et ouvre une ligne pour les pièces.", "Dans l’exemple du livre, les Blancs jouent d4."],
      sequence: [
        { side: "user", uci: "d2d4", explanation: "Le pion d conteste le centre et soutient la présence blanche en e4." },
        { side: "book", uci: "b8d7", explanation: "Cette réponse développe le cavalier, mais la case d7 gêne le fou c8." },
        { side: "user", uci: "f1c4", explanation: "Le fou se développe sur une diagonale active." },
      ],
    },
    {
      id: "capablanca-unblock-bishop",
      kind: "method",
      level: "Intermédiaire",
      title: "Développer sans enfermer son fou",
      category: "Ouverture · Développement et coordination",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, §7, exemple 18, pp. 29–30",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      setup: ["e4", "e5", "Nf3", "d6", "d4"],
      color: "b",
      question: "Comment développer le cavalier sans bloquer inutilement le fou c8 ?",
      choices: [
        { text: "Cf6 : développer vers une case active", correct: true },
        { text: "Cd7 : placer le cavalier devant le fou c8", correct: false },
        { text: "h6 : pousser un pion d’aile avant de sortir une pièce", correct: false },
      ],
      principle: "Un coup de développement doit aider les pièces à coopérer; une case apparemment solide peut gêner une autre pièce.",
      transfer: "Avant de choisir une case pour un cavalier, regarde les diagonales et colonnes qu’il bloque, puis compare avec les cases actives disponibles.",
      pitfall: "Évite de placer une pièce devant une diagonale utile sans avoir vérifié le coût pour le fou.",
      hints: ["Le cavalier g8 peut sortir en attaquant e4.", "Le livre critique Cd7 parce qu’il gêne le fou c8."],
      sequence: [
        { side: "user", uci: "g8f6", explanation: "Le cavalier se développe et met une pression sur e4." },
        { side: "book", uci: "b1c3", explanation: "Les Blancs développent le second cavalier et défendent e4." },
        { side: "user", uci: "f8e7", explanation: "Le fou se développe sans être gêné par le cavalier d7." },
      ],
    }
  );


  LESSONS.push(
    {
      id: "capablanca-simple-queen-mate",
      kind: "method",
      level: "Débutant",
      title: "Finir avec le roi et la dame",
      category: "Finale · Mat élémentaire",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, §1 « Some Simple Mates », p. 3 · position originale SupaChess",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
      color: "w",
      question: "Quel coup donne immédiatement échec et mat ?",
      choices: [
        { text: "Dg7 mat : la dame est protégée par le roi", correct: true },
        { text: "Dh6 : donner un échec sans fermer les cases de fuite", correct: false },
        { text: "Reculer le roi blanc", correct: false },
      ],
      principle: "Pour mater, fais coopérer les pièces : la dame donne l’échec, tandis que le roi contrôle la case où elle se place.",
      transfer: "Avant chaque mat, vérifie les cases de fuite, les prises possibles et la protection de la pièce qui donne l’échec.",
      pitfall: "Ne donne pas un échec seulement parce qu’il est disponible : vérifie si le roi peut fuir ou prendre la pièce.",
      hints: ["Cherche un coup de dame qui attaque le roi h8 et contrôle aussi h7 et g8.", "La case g7 est protégée par le roi blanc f6."],
      sequence: [
        { side: "user", uci: "g6g7", explanation: "La dame attaque le roi h8 et contrôle les cases de fuite; le roi blanc protège la dame en g7." },
      ],
    },
    {
      id: "capablanca-promote-with-check",
      kind: "method",
      level: "Débutant",
      title: "Promouvoir avec tempo",
      category: "Finale · Promotion du pion",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, §2 « Pawn Promotion », pp. 9–12 · position originale SupaChess",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      fen: "7k/P7/8/8/8/8/8/K7 w - - 0 1",
      color: "w",
      question: "Quel choix transforme le pion tout en donnant échec ?",
      choices: [
        { text: "a8=D : promotion en dame avec échec", correct: true },
        { text: "a8=C : promouvoir en cavalier sans nécessité", correct: false },
        { text: "Avancer le roi loin du pion", correct: false },
      ],
      principle: "À la promotion, choisis la pièce qui répond au besoin concret de la position; ici, la dame gagne un tempo en donnant échec.",
      transfer: "Après une promotion, recalcule immédiatement les échecs, les prises et les menaces de l’adversaire.",
      pitfall: "Ne promeus pas automatiquement en dame sans vérifier les échecs, les pat et les réponses immédiates.",
      hints: ["La case a8 est libre et le pion peut y avancer.", "La nouvelle dame attaque le roi noir sur la huitième rangée."],
      sequence: [
        { side: "user", uci: "a7a8q", explanation: "La dame apparaît en a8 et donne échec au roi h8 sur la rangée." },
      ],
    },
    {
      id: "capablanca-castle-after-development",
      kind: "method",
      level: "Intermédiaire",
      title: "Mettre le roi à l’abri avant l’attaque",
      category: "Ouverture · Roque et développement",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre I, §6, exemple 17, pp. 25–27 · application originale",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
      color: "w",
      question: "Les cavaliers sont sortis et le fou vise f7. Quel coup sécurise le roi et active la tour ?",
      choices: [
        { text: "Roquer côté roi", correct: true },
        { text: "Sortir la dame avant de mettre le roi à l’abri", correct: false },
        { text: "Jouer un pion de l’aile sans urgence", correct: false },
      ],
      principle: "Le roque remplit deux fonctions utiles : il met le roi à l’abri et relie une tour au jeu.",
      transfer: "Avant de lancer une attaque, vérifie la sécurité de ton roi, ton développement et les cases que le roque laissera libres.",
      pitfall: "N’ouvre pas une attaque ambitieuse en laissant ton roi au centre sans avoir vérifié les coups forcing adverses.",
      hints: ["Le roi et la tour n’ont pas bougé, et les cases entre eux sont libres.", "Le roque est le coup qui active aussi la tour h1."],
      sequence: [
        { side: "user", uci: "e1g1", explanation: "Le roi se met à l’abri et la tour h1 rejoint le centre en f1." },
        { side: "book", uci: "f8c5", explanation: "Les Noirs développent leur fou sur une diagonale active." },
        { side: "user", uci: "d2d3", explanation: "Le pion soutient e4 et ouvre une diagonale au fou c1." },
      ],
    },
    {
      id: "capablanca-attack-with-support",
      kind: "method",
      level: "Avancé",
      title: "Vérifier que l’attaque est soutenue",
      category: "Milieu de jeu · Attaque du roi",
      program: "Capablanca · fondamentaux et principes",
      author: "J. R. Capablanca",
      book: "Les principes fondamentaux des échecs",
      url: "https://archive.org/download/cu31924014756724/cu31924014756724.pdf",
      reference: "Première partie, chapitre IV, §21 « Direct Attacks en masse », pp. 78–82 · motif original SupaChess",
      sourceUrl: "https://www.gutenberg.org/ebooks/33870",
      sourceLabel: "Texte intégral de l’ouvrage",
      setup: ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6"],
      color: "w",
      question: "La dame et le fou visent f7. Quel coup conclut par un mat vérifié ?",
      choices: [
        { text: "Dxf7 mat : le fou c4 protège la dame", correct: true },
        { text: "Retirer le fou c4 de la diagonale", correct: false },
        { text: "Déplacer la dame sans créer de menace", correct: false },
      ],
      principle: "Une attaque devient concrète quand les pièces se soutiennent et que les cases de fuite du roi sont contrôlées.",
      transfer: "Avant un sacrifice ou une entrée en attaque, calcule les défenses du roi, les prises possibles et la contribution de chaque pièce.",
      pitfall: "Ne lance pas une attaque spectaculaire si une pièce essentielle n’est pas prête à rejoindre l’action.",
      hints: ["La dame peut prendre le pion f7 avec échec.", "Vérifie que le fou c4 protège la dame sur f7 et que le roi n’a aucune case de fuite."],
      sequence: [
        { side: "user", uci: "h5f7", explanation: "La dame prend le pion f7; le fou c4 la protège et les cases de fuite du roi sont couvertes." },
      ],
    }
  );


  LESSONS.push(
    {
      id: "lasker-mobilize-knight",
      kind: "method",
      level: "Débutant",
      title: "Mobiliser une pièce avec tempo",
      category: "Ouverture · Mobilisation",
      program: "Lasker · mobilisation et principes",
      author: "Emanuel Lasker",
      book: "Common Sense in Chess",
      url: "https://archive.org/download/commonsenseinche00laskrich/commonsenseinche00laskrich.pdf",
      reference: "Conférences d’ouverture · mobilisation et développement · exercice original SupaChess",
      sourceUrl: "https://openlibrary.org/works/OL3782506W/Common_sense_in_chess",
      sourceLabel: "Notice bibliographique et accès au livre",
      setup: ["e4", "e5"],
      color: "w",
      question: "Quel coup développe une pièce tout en attaquant le pion e5 ?",
      choices: [
        { text: "Cf3 : sortir le cavalier en créant une menace", correct: true },
        { text: "Dh5 : exposer la dame avant de mobiliser les pièces", correct: false },
        { text: "a3 : jouer un pion d’aile sans nécessité", correct: false },
      ],
      principle: "Au début de la partie, mobilise tes pièces et donne-leur des cases actives avant de lancer une attaque lointaine.",
      transfer: "Pour chaque coup d’ouverture, vérifie le développement, le contrôle central, la sécurité du roi et la menace adverse.",
      pitfall: "Évite de promener la dame ou de multiplier les coups de pion pendant que tes pièces restent sur leur case de départ.",
      hints: ["Le cavalier g1 peut sortir en attaquant e5.", "Le coup d’ouverture est Cf3."],
      sequence: [
        { side: "user", uci: "g1f3", explanation: "Le cavalier se développe et attaque le pion e5." },
        { side: "book", uci: "b8c6", explanation: "Les Noirs développent le cavalier en défendant e5." },
        { side: "user", uci: "f1c4", explanation: "Le fou se développe et regarde la case f7." },
      ],
    },
    {
      id: "lasker-defend-while-develop",
      kind: "method",
      level: "Débutant",
      title: "Défendre sans retarder le développement",
      category: "Ouverture · Défense active",
      program: "Lasker · mobilisation et principes",
      author: "Emanuel Lasker",
      book: "Common Sense in Chess",
      url: "https://archive.org/download/commonsenseinche00laskrich/commonsenseinche00laskrich.pdf",
      reference: "Conférences d’ouverture · développement et défense du centre · exercice original SupaChess",
      sourceUrl: "https://openlibrary.org/works/OL3782506W/Common_sense_in_chess",
      sourceLabel: "Notice bibliographique et accès au livre",
      setup: ["e4", "e5", "Nf3"],
      color: "b",
      question: "Quel coup défend e5 tout en développant une pièce ?",
      choices: [
        { text: "Cc6 : développer le cavalier et protéger e5", correct: true },
        { text: "h6 : avancer un pion d’aile sans développer", correct: false },
        { text: "Dg5 : sortir tôt la dame sans résoudre le problème", correct: false },
      ],
      principle: "Une défense utile peut aussi développer une pièce et préparer les coups suivants.",
      transfer: "Quand une pièce ou un pion est attaqué, cherche une réponse qui pare la menace tout en améliorant une pièce.",
      pitfall: "N’emploie pas un coup défensif passif si une pièce peut défendre la cible en gagnant du temps.",
      hints: ["Le cavalier b8 peut se placer sur une case qui protège e5.", "Le coup est Cc6."],
      sequence: [
        { side: "user", uci: "b8c6", explanation: "Le cavalier se développe et défend le pion e5 attaqué par le cavalier f3." },
        { side: "book", uci: "f1c4", explanation: "Le fou blanc se développe sur une diagonale active." },
        { side: "user", uci: "g8f6", explanation: "Le second cavalier noir sort vers le centre et attaque e4." },
      ],
    },
    {
      id: "lasker-develop-before-repeat",
      kind: "method",
      level: "Intermédiaire",
      title: "Développer une nouvelle pièce",
      category: "Ouverture · Temps et développement",
      program: "Lasker · mobilisation et principes",
      author: "Emanuel Lasker",
      book: "Common Sense in Chess",
      url: "https://archive.org/download/commonsenseinche00laskrich/commonsenseinche00laskrich.pdf",
      reference: "Conférences d’ouverture · mobilisation des pièces · exercice original SupaChess",
      sourceUrl: "https://openlibrary.org/works/OL3782506W/Common_sense_in_chess",
      sourceLabel: "Notice bibliographique et accès au livre",
      setup: ["e4", "e5", "Nf3", "Nc6"],
      color: "w",
      question: "Quel coup mobilise le second cavalier et renforce le contrôle du centre ?",
      choices: [
        { text: "Cc3 : développer une nouvelle pièce vers le centre", correct: true },
        { text: "Cxe5 : prendre sans vérifier les reprises et les menaces", correct: false },
        { text: "h4 : pousser un pion d’aile avant la mobilisation", correct: false },
      ],
      principle: "Tant qu’aucune raison tactique ne l’exige, préfère mobiliser une nouvelle pièce plutôt que déplacer plusieurs fois la même.",
      transfer: "Compte tes pièces développées et demande-toi si un coup améliore une nouvelle pièce ou résout une menace urgente.",
      pitfall: "Ne répète pas les déplacements d’une pièce déjà active sans gain concret ou nécessité calculée.",
      hints: ["Le cavalier b1 peut sortir et soutenir d5 et e4.", "Le coup est Cc3."],
      sequence: [
        { side: "user", uci: "b1c3", explanation: "Le second cavalier se développe et renforce les cases centrales." },
        { side: "book", uci: "g8f6", explanation: "Les Noirs développent leur autre cavalier." },
        { side: "user", uci: "f1c4", explanation: "Le fou se développe et exerce une pression sur f7." },
      ],
    },
    {
      id: "lasker-attack-after-mobilization",
      kind: "method",
      level: "Avancé",
      title: "Lancer l’attaque après la mobilisation",
      category: "Ouverture · Sécurité du roi",
      program: "Lasker · mobilisation et principes",
      author: "Emanuel Lasker",
      book: "Common Sense in Chess",
      url: "https://archive.org/download/commonsenseinche00laskrich/commonsenseinche00laskrich.pdf",
      reference: "Conférences d’ouverture · mobilisation avant l’attaque · exercice original SupaChess",
      sourceUrl: "https://openlibrary.org/works/OL3782506W/Common_sense_in_chess",
      sourceLabel: "Notice bibliographique et accès au livre",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
      color: "w",
      question: "Les deux camps ont développé des cavaliers et un fou. Quel coup termine la mobilisation du roi blanc ?",
      choices: [
        { text: "O-O : sécuriser le roi et activer la tour", correct: true },
        { text: "Dh5 : lancer une attaque avant de mettre le roi à l’abri", correct: false },
        { text: "a3 : perdre un temps sans répondre à une nécessité", correct: false },
      ],
      principle: "La mobilisation ne consiste pas seulement à sortir les pièces : elle comprend aussi la sécurité du roi et la mise en jeu des tours.",
      transfer: "Avant une attaque, vérifie si ton roi est en sécurité, si tes pièces se soutiennent et si tes tours peuvent participer.",
      pitfall: "Ne commence pas une attaque à outrance tant que tes pièces ne sont pas prêtes et que ton roi reste exposé.",
      hints: ["Le roi et la tour n’ont pas bougé et le chemin est libre.", "Le roque active aussi la tour h1."],
      sequence: [
        { side: "user", uci: "e1g1", explanation: "Le roi se met à l’abri et la tour rejoint le centre." },
        { side: "book", uci: "f8c5", explanation: "Les Noirs développent le fou sur une diagonale active." },
        { side: "user", uci: "d2d3", explanation: "Le pion soutient e4 et ouvre la diagonale du fou c1." },
      ],
    },
    {
      id: "edward-lasker-simple-calculation",
      kind: "method",
      level: "Débutant",
      title: "Calculer la reprise avant de prendre",
      category: "Calcul · Prise et reprise",
      program: "Edward Lasker · calcul et stratégie",
      author: "Edward Lasker",
      book: "Chess Strategy",
      url: "https://www.gutenberg.org/ebooks/5614",
      reference: "Part I, chapter II, Simple Calculation · exercice original SupaChess",
      sourceUrl: "https://www.gutenberg.org/files/5614/5614-h/5614-h.htm",
      sourceLabel: "Texte intégral gratuit · Project Gutenberg",
      setup: ["e4", "e5", "Nf3", "Nc6"],
      color: "w",
      question: "Avant de prendre le pion e5, quelle vérification de calcul est essentielle ?",
      choices: [
        { text: "Calculer la reprise possible et l’état de mes pièces après l’échange", correct: true },
        { text: "Prendre tout pion attaqué sans regarder la réponse", correct: false },
        { text: "Jouer un échec même s’il laisse une pièce en prise", correct: false },
      ],
      principle: "Une prise ne s’évalue pas seule : calcule la reprise adverse, puis vérifie les menaces et la sécurité de tes pièces.",
      transfer: "Pour chaque capture candidate, annonce la réponse adverse la plus forte et la position après l’échange avant de décider.",
      pitfall: "Ne confonds pas une pièce qui attaque un pion avec un pion qu’on peut gagner sans contrepartie.",
      hints: ["Le cavalier f3 peut prendre e5, mais qui reprendrait ?", "Développe plutôt le cavalier b1 vers une case active."],
      sequence: [
        { side: "user", uci: "b1c3", explanation: "Le cavalier se développe, soutient le centre et évite une capture dont la reprise coûterait une pièce." },
        { side: "book", uci: "g8f6", explanation: "Les Noirs développent à leur tour et attaquent le pion e4." },
        { side: "user", uci: "f1b5", explanation: "Le fou se développe et met une pression sur le cavalier c6, sans précipiter une prise." },
      ],
    },
    {
      id: "edward-lasker-mobility",
      kind: "method",
      level: "Intermédiaire",
      title: "Donner des cases utiles à ses pièces",
      category: "Stratégie · Mobilité",
      program: "Edward Lasker · calcul et stratégie",
      author: "Edward Lasker",
      book: "Chess Strategy",
      url: "https://www.gutenberg.org/ebooks/5614",
      reference: "Part I, chapter III, General Principles · Mobility · exercice original SupaChess",
      sourceUrl: "https://www.gutenberg.org/files/5614/5614-h/5614-h.htm",
      sourceLabel: "Texte intégral gratuit · Project Gutenberg",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "d6"],
      color: "w",
      question: "Quel plan développe une pièce tout en augmentant son influence sur le centre ?",
      choices: [
        { text: "Sortir le cavalier b1 vers c3, puis continuer la mobilisation", correct: true },
        { text: "Rejouer immédiatement le fou c4 sans menace précise", correct: false },
        { text: "Lancer un pion de bord sans regarder les cases libérées", correct: false },
      ],
      principle: "La mobilité vient des cases accessibles et de la coordination : une pièce active peut contribuer à plusieurs tâches.",
      transfer: "Compare les cases atteignables par chaque pièce candidate, puis choisis une amélioration qui aide le centre ou répond à une menace.",
      pitfall: "Ne juge pas une pièce seulement par sa valeur théorique : une pièce enfermée ou sans cases utiles participe peu.",
      hints: ["Cherche une pièce encore sur sa case initiale.", "Le cavalier peut se développer en contrôlant d4 et e5."],
      sequence: [
        { side: "user", uci: "b1c3", explanation: "Le cavalier gagne des cases d’action et renforce le contrôle des cases centrales." },
        { side: "book", uci: "g8f6", explanation: "Les Noirs développent un cavalier vers le centre." },
        { side: "user", uci: "c1e3", explanation: "Le fou sort sur une diagonale utile et participe à la lutte centrale." },
      ],
    },
    {
      id: "edward-lasker-pawn-skeleton",
      kind: "method",
      level: "Avancé",
      title: "Lire la structure avant la rupture centrale",
      category: "Stratégie · Structure de pions",
      program: "Edward Lasker · calcul et stratégie",
      author: "Edward Lasker",
      book: "Chess Strategy",
      url: "https://www.gutenberg.org/ebooks/5614",
      reference: "Part I, chapter IV, The Opening · Pawn Skeleton and the Centre · exercice original SupaChess",
      sourceUrl: "https://www.gutenberg.org/files/5614/5614-h/5614-h.htm",
      sourceLabel: "Texte intégral gratuit · Project Gutenberg",
      setup: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7", "Bg5", "O-O", "e3", "h6", "Bh4", "b6"],
      color: "w",
      question: "Avant une rupture au centre, que faut-il comparer ?",
      choices: [
        { text: "Les recaptures possibles, les lignes qui s’ouvrent et l’activité des pièces", correct: true },
        { text: "Le nombre de pions avancés, sans tenir compte des pièces", correct: false },
        { text: "La possibilité d’échanger tout de suite, quel que soit le résultat", correct: false },
      ],
      principle: "La structure de pions doit être lue avec les pièces : une rupture peut ouvrir des lignes, créer des cases faibles ou libérer une pièce.",
      transfer: "Avant de pousser ou d’échanger au centre, calcule les reprises et demande-toi quelles pièces profiteront des lignes ouvertes.",
      pitfall: "N’échange pas automatiquement les pions centraux : vérifie quelle structure et quelles colonnes chaque camp obtiendra.",
      hints: ["Observe les pions d4 et c4 ainsi que les pions noirs d5 et e6.", "Termine la mobilisation avant de transformer la structure."],
      sequence: [
        { side: "user", uci: "f1e2", explanation: "Le fou se développe sans rompre prématurément la tension centrale." },
        { side: "book", uci: "c8b7", explanation: "Le fou noir rejoint une diagonale dirigée vers le centre." },
        { side: "user", uci: "e1g1", explanation: "Le roque sécurise le roi et met la tour en jeu avant les échanges centraux." },
        { side: "book", uci: "c7c5", explanation: "Les Noirs choisissent une rupture centrale; il faut maintenant recalculer les captures et les lignes ouvertes." },
      ],
    },
  );

  // Explicit progressive method: calculate the opponent's strongest practical reply at every branch.
  LESSONS.push(
    {
      id: "calculation-reflex-checklist",
      kind: "method",
      level: "Débutant",
      title: "Le réflexe de calcul · vérifier avant de jouer",
      category: "Calcul · meilleure réponse adverse",
      program: "Calcul · meilleure réponse adverse",
      author: "SupaChess Académie",
      book: "Méthode originale de réflexion",
      reference: "Leçon 1 · routine avant chaque coup",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
      color: "w",
      question: "Avant de choisir un candidat comme Cg5, quelle vérification est indispensable ?",
      choices: [
        { text: "Chercher la meilleure réponse adverse, puis vérifier échecs, captures, menaces, pièces sans défense et tactiques", correct: true },
        { text: "Supposer que l’adversaire répondra comme je le souhaite", correct: false },
        { text: "Ne calculer que ma menace et jouer immédiatement", correct: false },
      ],
      principle: "Le calcul commence par une hypothèse adverse exigeante : quelle réponse gêne le plus mon idée ? Dans cette position, après Cg5, les Noirs ont notamment …d5!, une contre-attaque centrale. On vérifie ensuite les échecs, captures, menaces, pièces attaquées ou non protégées, puis les tactiques.",
      transfer: "À chaque demi-coup, arrête la variante et recommence le même inventaire. Ne poursuis pas une ligne si tu n’as pas répondu à la meilleure réplique adverse.",
      hints: [
        "Remplace la question « que va-t-il probablement jouer ? » par « quelle est sa réponse la plus forte ? ».",
        "Après la réponse adverse, énumère les échecs, les captures et les menaces avant de continuer.",
      ],
      pitfall: "Ne confonds pas un coup légal avec un bon coup : une pièce peut bouger légalement tout en laissant une tactique ou une pièce sans défense.",
      sequence: [
        { side: "user", uci: "e1g1", explanation: "Le roque est le coup joué dans la ligne d’étude; le réflexe à entraîner reste de calculer la meilleure réponse noire après chaque candidat." },
        { side: "book", uci: "f8c5", explanation: "Les Noirs développent le fou. Vérifie ses menaces et les pièces qu’il vise avant de poursuivre." },
        { side: "user", uci: "d2d3", explanation: "Les Blancs consolident e4. Avant ce coup, ils vérifient aussi les prises et les échecs dont les Noirs pourraient disposer." },
      ],
    },
    {
      id: "calculation-reflex-counterstrike",
      kind: "method",
      level: "Intermédiaire",
      title: "Calculer la meilleure riposte · …d5!",
      category: "Calcul · meilleure réponse adverse",
      program: "Calcul · meilleure réponse adverse",
      author: "SupaChess Académie",
      book: "Méthode originale de réflexion",
      reference: "Leçon 2 · réponse forcing à une attaque",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"],
      color: "b",
      question: "Les Blancs menacent f7 avec Cg5. Quelle réponse noire forcing faut-il calculer en premier ?",
      choices: [
        { text: "…d5!, contre-attaquer le fou et contester le centre", correct: true },
        { text: "…h6, sans vérifier la prise au centre", correct: false },
        { text: "…a6, en ignorant la menace sur f7", correct: false },
      ],
      principle: "…d5! répond à l’idée blanche par une contre-attaque centrale. Il faut ensuite calculer les prises sur d5, les échecs et les menaces sur les pièces exposées.",
      transfer: "Quand l’adversaire attaque, cherche une réponse forcing qui retourne une menace : échec, capture ou attaque d’une pièce. Vérifie chaque variante jusqu’à ce que les menaces immédiates soient résolues.",
      hints: [
        "Une poussée centrale peut attaquer le fou c4 tout en ouvrant des lignes.",
        "La réponse recherchée est …d5!; calcule ensuite la reprise exd5 et la suite …Ca5.",
      ],
      pitfall: "Ne te contente pas de défendre f7 automatiquement; compare les contre-attaques forcing et vérifie les conséquences concrètes.",
      sequence: [
        { side: "user", uci: "d7d5", explanation: "…d5! attaque le fou c4 et impose une décision centrale aux Blancs." },
        { side: "book", uci: "e4d5", explanation: "Les Blancs prennent le pion d5. Il faut maintenant recalculer les menaces, pas continuer la ligne imaginée avant cette prise." },
        { side: "user", uci: "c6a5", explanation: "…Ca5! attaque le fou c4 avec tempo et poursuit la pression." },
        { side: "book", uci: "c4b5", explanation: "Fb5+ donne échec; les Noirs doivent traiter cette menace avant de poursuivre leur plan." },
        { side: "user", uci: "c7c6", explanation: "…c6 interpose le pion sur la diagonale d’échec et attaque le fou b5." },
      ],
    },
    {
      id: "calculation-reflex-forcing-check",
      kind: "method",
      level: "Avancé",
      title: "Réévaluer après la riposte · Fb5+",
      category: "Calcul · meilleure réponse adverse",
      program: "Calcul · meilleure réponse adverse",
      author: "SupaChess Académie",
      book: "Méthode originale de réflexion",
      reference: "Leçon 3 · échec, interposition et pièce attaquée",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Na5"],
      color: "w",
      question: "Après …Ca5, le fou c4 est attaqué. Quel coup donne échec tout en créant une nouvelle question à l’adversaire ?",
      choices: [
        { text: "Fb5+", correct: true },
        { text: "h3, sans traiter l’attaque du fou", correct: false },
        { text: "Cxf7, sans calculer la prise du roi", correct: false },
      ],
      principle: "Fb5+ répond à l’attaque du fou par un échec. Les Noirs doivent traiter le roi en échec; après …c6, les Blancs doivent à nouveau vérifier l’attaque du pion sur le fou.",
      transfer: "Dans une variante, chaque réponse adverse change la position. Après un échec, identifie les réponses légales; après une interposition, vérifie quelles pièces sont attaquées et où elles peuvent aller.",
      hints: [
        "Priorise les échecs disponibles; le fou c4 peut se déplacer avec échec.",
        "Joue le fou en b5. Après …c6, vérifie que le pion attaque ce fou.",
      ],
      pitfall: "Un échec ne termine pas le calcul : examine toutes les réponses légales, puis les menaces créées par l’interposition.",
      sequence: [
        { side: "user", uci: "c4b5", explanation: "Fb5+ est un échec légal et force les Noirs à répondre au roi attaqué." },
        { side: "book", uci: "c7c6", explanation: "…c6 bloque l’échec et attaque le fou b5; les Blancs doivent repérer les deux effets du coup." },
        { side: "user", uci: "b5f1", explanation: "Ff1 met le fou à l’abri après que les Blancs ont vérifié les cases de retraite." },
      ],
    },
  );

  // Active recall drills put the learner on the opponent's turn to practice the reply itself.
  LESSONS.push(
    {
      id: "calculation-reflex-exercise-counterattack",
      kind: "anticipation",
      level: "Débutant",
      title: "Exercice · trouver …d5! face à Cg5",
      category: "Calcul · réponse forcing",
      program: "Calcul · meilleure réponse adverse",
      author: "SupaChess Académie",
      book: "Rappel actif original",
      reference: "Exercice 1 · échecs, captures et menaces",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"],
      color: "b",
      question: "Les Blancs visent f7. Quel coup forcing noir faut-il calculer avant de défendre passivement ?",
      choices: [
        { text: "…d5!, contre-attaquer le fou et le centre", correct: true },
        { text: "…h6, sans analyser la prise en d5", correct: false },
        { text: "…a6, sans traiter la menace sur f7", correct: false },
      ],
      principle: "…d5! est la réponse forcing de cette ligne. Après exd5, les Noirs doivent réexaminer les prises et les menaces plutôt que suivre une variante par cœur.",
      transfer: "Cherche la réponse adverse la plus forte, puis calcule sa meilleure suite.",
      hints: ["Le coup central peut attaquer directement le fou c4.", "Joue …d5! puis vérifie la prise exd5."],
      anticipatedMove: "d5",
      previousMove: "Ng5",
      sequence: [
        { side: "user", uci: "d7d5", explanation: "…d5! attaque le fou c4 et contre le plan blanc." },
        { side: "book", uci: "e4d5", explanation: "exd5 est la prise à calculer; elle modifie les menaces et exige une nouvelle évaluation." },
        { side: "user", uci: "c6a5", explanation: "…Ca5! attaque le fou c4 avec tempo." },
      ],
    },
    {
      id: "calculation-reflex-exercise-capture",
      kind: "anticipation",
      level: "Intermédiaire",
      title: "Exercice · répondre à …d5",
      category: "Calcul · meilleure réponse adverse",
      program: "Calcul · meilleure réponse adverse",
      author: "SupaChess Académie",
      book: "Rappel actif original",
      reference: "Exercice 2 · prise et contre-menace",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5"],
      color: "w",
      question: "Après …d5, quelle prise centrale faut-il calculer en premier ?",
      choices: [
        { text: "exd5, puis calculer …Ca5 et ses menaces sur le fou", correct: true },
        { text: "h3, sans traiter l’attaque du fou", correct: false },
        { text: "Cxf7, sans vérifier la réponse du roi", correct: false },
      ],
      principle: "exd5 est la prise de la ligne. La réponse …Ca5 vise le fou c4; il faut alors calculer un échec intermédiaire avant de décider où reculer.",
      transfer: "Après chaque capture, compte les pièces attaquées et cherche les coups forcing des deux camps.",
      hints: ["Le pion e4 peut prendre en d5.", "Après exd5, la réponse …Ca5 attaque le fou c4."],
      anticipatedMove: "exd5",
      previousMove: "d5",
      sequence: [
        { side: "user", uci: "e4d5", explanation: "exd5 reprend le pion central; vérifie immédiatement la suite noire." },
        { side: "book", uci: "c6a5", explanation: "…Ca5 attaque le fou c4 et crée une menace concrète." },
        { side: "user", uci: "c4b5", explanation: "Fb5+ répond par un échec forcing avant de traiter la retraite du fou." },
        { side: "book", uci: "c7c6", explanation: "…c6 interpose et attaque le fou b5." },
      ],
    },
    {
      id: "calculation-reflex-exercise-check",
      kind: "anticipation",
      level: "Avancé",
      title: "Exercice · traiter l’échec puis la pièce attaquée",
      category: "Calcul · échec intermédiaire",
      program: "Calcul · meilleure réponse adverse",
      author: "SupaChess Académie",
      book: "Rappel actif original",
      reference: "Exercice 3 · échec, interposition et retraite",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Na5"],
      color: "w",
      question: "Après …Ca5, quel coup force d’abord une réponse du roi et prépare le traitement du fou attaqué ?",
      choices: [
        { text: "Fb5+", correct: true },
        { text: "h3, en ignorant l’attaque du fou", correct: false },
        { text: "Cxf7, sans vérifier les prises possibles", correct: false },
      ],
      principle: "Fb5+ est un échec. Après …c6, le pion attaque le fou : il faut repérer cette nouvelle menace et choisir une retraite légale.",
      transfer: "Un échec intermédiaire ne clôt pas le calcul. Après la réponse forcée, réévalue les pièces attaquées et les menaces créées.",
      hints: ["Le fou peut donner échec depuis b5.", "Après …c6, la diagonale d’échec est bloquée et le fou b5 est attaqué."],
      anticipatedMove: "Bb5+",
      previousMove: "Na5",
      sequence: [
        { side: "user", uci: "c4b5", explanation: "Fb5+ donne échec et impose une réponse aux Noirs." },
        { side: "book", uci: "c7c6", explanation: "…c6 bloque l’échec et attaque le fou b5." },
        { side: "user", uci: "b5f1", explanation: "Ff1 met le fou à l’abri après vérification de la diagonale." },
      ],
    },
  );

  const LEVEL_ORDER = { "Débutant": 0, "Intermédiaire": 1, "Avancé": 2, "Expert": 3 };
  LESSONS.sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));

  function methodPathLessonIndices(program) {
    return LESSONS.map((lesson, index) => ({ lesson, index }))
      .filter(({ lesson }) => lesson.program === program)
      .sort((a, b) => (LEVEL_ORDER[a.lesson.level] ?? 99) - (LEVEL_ORDER[b.lesson.level] ?? 99) || a.index - b.index)
      .map(({ index }) => index);
  }

  function nextMethodPathLessonIndex(currentIndex, program) {
    const path = methodPathLessonIndices(program);
    if (!path.length) return (currentIndex + 1) % LESSONS.length;
    const position = path.indexOf(currentIndex);
    return path[position < 0 ? 0 : (position + 1) % path.length];
  }

  root.SupaChessLessons = LESSONS;

  function setupGame(lesson, ChessClass) {
    const game = new ChessClass(lesson.fen);
    for (const san of lesson.setup || []) {
      if (!game.move(san)) throw new Error("Coup de mise en place illégal dans " + lesson.id + ": " + san);
    }
    return game;
  }

  function engineLineValue(line) {
    if (Number.isFinite(line.scoreCp)) return line.scoreCp;
    if (Number.isFinite(line.mate)) return line.mate > 0
      ? 100000 - line.mate * 100 : -100000 - line.mate * 100;
    return null;
  }

  function formatEngineLineScore(line) {
    if (Number.isFinite(line.mate)) return line.mate > 0 ? "#+" + line.mate : "#-" + Math.abs(line.mate);
    if (Number.isFinite(line.scoreCp)) {
      const pawns = line.scoreCp / 100;
      return (pawns > 0 ? "+" : "") + pawns.toFixed(2);
    }
    return "—";
  }

  function engineHintForMove(move, piece) {
    if (move.flags && move.flags.includes("p")) return "La promotion transforme le pion : vérifie aussi les menaces et les échecs immédiats.";
    if (move.flags && move.flags.includes("c")) return "Après cette prise, vérifie les recaptures, les pièces laissées sans défense et ce que la pièce capturée protégeait.";
    if (move.flags && move.flags.includes("k")) return "Le roque met le roi à l’abri et développe une tour : compare la sécurité des deux rois.";
    if (piece === "r") return "Pour une tour, examine les colonnes ouvertes, les rangées actives, les cibles accessibles et la coordination avec l’autre tour.";
    if (piece === "p") return "Après ce coup de pion, repère les cases libérées, les cases affaiblies et les lignes qui peuvent s’ouvrir.";
    return "Compare les cases contrôlées avant et après, les menaces créées, les pièces défendues et les réponses forcées de l’adversaire.";
  }

  function buildEngineChoices(fen, lines, ChessClass) {
    const position = new ChessClass(fen);
    const legalCount = position.moves({ verbose: true }).length;
    const ranked = (lines || []).filter((line) => line && line.pv && line.pv.length)
      .map((line) => ({ line: line, value: engineLineValue(line) }))
      .filter((entry) => entry.value !== null)
      .sort((a, b) => b.value - a.value);
    if (!ranked.length) return { legalCount: legalCount, choices: [] };
    const best = ranked[0].line;
    const choices = ranked.map((entry, index) => {
      const line = entry.line;
      const trial = new ChessClass(fen);
      let firstMove = null;
      const sanLine = [];
      for (const uci of line.pv) {
        const move = trial.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.slice(4) || "q",
        });
        if (!move) break;
        if (!firstMove) firstMove = move;
        sanLine.push(move.san);
      }
      const movedPiece = firstMove ? position.get(firstMove.from) : null;
      const comparable = Number.isFinite(best.scoreCp) && Number.isFinite(line.scoreCp);
      const deltaCp = comparable ? Math.max(0, best.scoreCp - line.scoreCp) : null;
      return {
        rank: index + 1,
        san: firstMove ? firstMove.san : line.pv[0],
        uci: line.pv[0],
        fen: fen,
        pv: line.pv.slice(),
        sanLine: sanLine,
        score: formatEngineLineScore(line),
        scoreCp: Number.isFinite(line.scoreCp) ? line.scoreCp : null,
        mate: Number.isFinite(line.mate) ? line.mate : null,
        deltaCp: deltaCp,
        depth: line.depth || 0,
        facts: firstMove ? engineHintForMove(firstMove, movedPiece && movedPiece.type) : "",
      };
    });
    return { legalCount: legalCount, choices: choices };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { LESSONS, setupGame, buildEngineChoices, engineHintForMove, methodPathLessonIndices, nextMethodPathLessonIndex };
  }

  if (typeof document === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const STORE_KEY = "supachess-book-lessons-v1";
  const boardUI = new BoardUI($("lesson-board"), onSquareClick);
  let lessonIndex = 0;
  let game = null;
  let sequenceIndex = 0;
  let selectedSquare = null;
  let attempts = 0;
  let hintsUsed = 0;
  let principleAnswered = false;
  let waitingForBook = false;
  let anticipationPractice = false;
  let anticipatingBook = false;
  let surpriseMode = false;
  let stockfishCoachMode = false;
  let stockfishReflection = null;
  let flipped = false;
  let bookReplyTimer = null;
  let progress = readProgress();
  let lessonEngine = null;
  let enginePreview = null;
  let analysisToken = 0;
  const engineCache = new Map();
  let showEvalBar = false;

  function clearEvalBar() {
    const bar = $("lesson-evalbar");
    const fill = $("lesson-evalbar-white");
    const label = $("lesson-eval-label");
    if (!bar || !fill || !label) return;
    fill.style.height = "50%";
    bar.setAttribute("aria-valuenow", "50");
    bar.setAttribute("aria-valuetext", "Évaluation non calculée");
    label.textContent = "À analyser";
  }

  function renderEvalBar(result) {
    const best = result && result.choices && result.choices[0];
    if (!best || !game) { clearEvalBar(); return; }
    const sideToMoveSign = game.turn() === "w" ? 1 : -1;
    let whitePercent = 50;
    let text = "Évaluation indisponible";
    let aria = text;
    if (Number.isFinite(best.mate)) {
      const whiteMate = best.mate * sideToMoveSign;
      whitePercent = whiteMate > 0 ? 96 : 4;
      text = whiteMate > 0 ? "Mat Blancs +" + whiteMate : "Mat Noirs #" + Math.abs(whiteMate);
      aria = "Stockfish annonce " + text;
    } else if (Number.isFinite(best.scoreCp)) {
      const whiteCp = best.scoreCp * sideToMoveSign;
      whitePercent = 50 + 45 * Math.tanh(whiteCp / 500);
      const pawns = whiteCp / 100;
      text = (pawns > 0 ? "+" : "") + pawns.toFixed(2);
      aria = "Évaluation Stockfish, avantage des Blancs " + text + " pion(s)";
    }
    const bar = $("lesson-evalbar");
    $("lesson-evalbar-white").style.height = Math.max(4, Math.min(96, whitePercent)) + "%";
    bar.setAttribute("aria-valuenow", String(Math.round(whitePercent)));
    bar.setAttribute("aria-valuetext", aria);
    $("lesson-eval-label").textContent = text;
  }

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch (_) { return {}; }
  }

  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); }
    catch (_) { /* Lessons still work when browser storage is unavailable. */ }
  }

  function renderCatalog() {
    const catalog = $("lesson-catalog");
    const search = ($("lesson-search").value || "").trim().toLocaleLowerCase("fr");
    const level = $("lesson-level-filter").value;
    const program = $("lesson-program-filter").value;
    catalog.replaceChildren();
    const visibleLessons = LESSONS.map((lesson, index) => ({ lesson, index })).filter(({ lesson }) => {
      const matchesSearch = !search || [lesson.title, lesson.category, lesson.program, lesson.question, lesson.level]
        .some((value) => String(value || "").toLocaleLowerCase("fr").includes(search));
      return matchesSearch && (!level || lesson.level === level) && (!program || lesson.program === program);
    });
    if (program) {
      visibleLessons.sort((a, b) => (LEVEL_ORDER[a.lesson.level] ?? 99) - (LEVEL_ORDER[b.lesson.level] ?? 99) || a.index - b.index);
    }
    const originalLessonCount = LESSONS.filter((lesson) => lesson.kind !== "anticipation").length;
    const anticipationCount = LESSONS.length - originalLessonCount;
    $("lesson-catalog-count").textContent = visibleLessons.length + " affiché(s) · " + originalLessonCount +
      " leçons originales + " + anticipationCount + " exercices d’anticipation · " + LESSONS.length +
      " entrées au total · " + LESSONS.filter((lesson) => progress[lesson.id] && progress[lesson.id].completed).length + " terminés.";
    if (!visibleLessons.length) {
      const empty = document.createElement("p");
      empty.className = "lesson-catalog-empty";
      empty.textContent = "Aucun exercice ne correspond à ces filtres.";
      catalog.appendChild(empty);
      return;
    }
    for (const [visibleIndex, { lesson, index }] of visibleLessons.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-catalog-button" + (lesson.kind === "anticipation" ? " anticipation-exercise" : "");
      button.dataset.program = lesson.program || "";
      button.setAttribute("aria-current", index === lessonIndex ? "true" : "false");
      const title = document.createElement("span");
      title.className = "lesson-catalog-title";
      title.textContent = (visibleIndex + 1) + ". " + lesson.title;
      const meta = document.createElement("span");
      meta.className = "lesson-catalog-meta";
      meta.textContent = lesson.level + " · " + lesson.program + " · " + lesson.author;
      const state = document.createElement("span");
      state.className = "lesson-catalog-state";
      state.textContent = progress[lesson.id] && progress[lesson.id].completed
        ? "Terminée · à revoir quand tu veux" : lesson.kind === "anticipation" ? "Défi de réponse adverse" : "À découvrir";
      button.append(title, meta, state);
      button.addEventListener("click", () => {
        loadLesson(index);
        document.querySelector(".lesson-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      catalog.appendChild(button);
    }
  }

  function renderSource(lesson) {
    const source = $("lesson-source");
    source.textContent = lesson.author + " · " + lesson.book + " · " + lesson.reference;
    if (lesson.url) {
      const link = document.createElement("a");
      link.href = lesson.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = " Ouvrir le livre";
      source.appendChild(link);
    }
    if (lesson.sourceUrl) {
      const link = document.createElement("a");
      link.href = lesson.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = " · " + (lesson.sourceLabel || "Consulter la source");
      source.appendChild(link);
    }
  }

  function nextLessonIndex(currentIndex) {
    const program = $("lesson-program-filter").value;
    if (program && LESSONS[currentIndex]?.program === program) return nextMethodPathLessonIndex(currentIndex, program);
    return (currentIndex + 1) % LESSONS.length;
  }

  function loadLesson(index, options = {}) {
    if (bookReplyTimer !== null) {
      root.clearTimeout(bookReplyTimer);
      bookReplyTimer = null;
    }
    analysisToken++;
    enginePreview = null;
    $("lesson-engine-analysis").hidden = true;
    $("lesson-engine-return").hidden = true;
    stockfishCoachMode = Boolean(options.coach);
    stockfishReflection = null;
    $("lesson-reflection").hidden = !stockfishCoachMode;
    $("lesson-reflection-candidate").value = "";
    $("lesson-reflection-reply").value = "";
    $("lesson-reflection-submit").disabled = false;
    $("lesson-reflection-submit").textContent = "Valider mon calcul et afficher Stockfish";
    $("lesson-reflection-status").textContent = "";
    $("lesson-reflection-review").hidden = true;
    $("lesson-review-status").textContent = "";
    $("lesson-engine-analyze").hidden = stockfishCoachMode;
    $("lesson-engine-analyze").disabled = false;
    $("lesson-engine-analyze").textContent = "Comparer tous les coups avec Stockfish";
    $("lesson-engine-status").textContent = "";
    $("lesson-engine-lines").textContent = "";
    lessonIndex = index;
    clearEvalBar();
    surpriseMode = Boolean(options.surprise);
    anticipationPractice = Boolean(options.anticipate);
    anticipatingBook = false;
    $("lesson-anticipate").setAttribute("aria-pressed", String(anticipationPractice));
    const lesson = LESSONS[lessonIndex];
    game = setupGame(lesson, Chess);
    sequenceIndex = 0;
    selectedSquare = null;
    attempts = 0;
    hintsUsed = 0;
    principleAnswered = false;
    waitingForBook = false;
    flipped = lesson.color === "b";
    boardUI.setFlipped(flipped);
    boardUI.flipped = flipped;
    boardUI.selected = null;
    boardUI.legalTargets = [];
    boardUI.lastMove = null;
    $("lesson-title").textContent = surpriseMode ? "Exercice au hasard" : lesson.title;
    $("lesson-goal").textContent = surpriseMode
      ? "Analyse la position sans regarder le thème. Choisis un coup, puis vérifie la réponse adverse sur l’échiquier."
      : "Observe la position. Choisis d’abord le principe qui s’applique, puis joue les coups sur l’échiquier.";
    $("lesson-question").textContent = lesson.question;
    $("lesson-principle").disabled = false;
    $("lesson-feedback").textContent = "";
    $("lesson-explanation").hidden = true;
    $("lesson-explanation").textContent = "";
    $("lesson-move-list").textContent = "";
    $("lesson-next").hidden = true;
    $("lesson-next-preview").hidden = true;
    $("lesson-next-preview").textContent = "";
    $("lesson-hint").disabled = false;
    $("lesson-flip").setAttribute("aria-pressed", String(flipped));
    renderSource(lesson);
    if (surpriseMode) $("lesson-source").textContent = "Exercice au hasard · thème révélé après la résolution";
    renderChoices(lesson);
    renderCatalog();
    renderBoard();
    updateProgressLabel();
    $("lesson-status").textContent = "À toi de jouer les " + (lesson.color === "w" ? "Blancs" : "Noirs") + ".";
  }

  function renderChoices(lesson) {
    const wrap = $("lesson-choices");
    wrap.textContent = "";
    lesson.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-choice";
      button.textContent = choice.text;
      button.addEventListener("click", () => answerPrinciple(button, choice));
      wrap.appendChild(button);
    });
  }

  function answerPrinciple(button, choice) {
    if (principleAnswered) return;
    const lesson = LESSONS[lessonIndex];
    if (!choice.correct) {
      attempts++;
      button.classList.add("incorrect");
      $("lesson-feedback").textContent = "Pas encore. Regarde les pièces actives et ce que l’adversaire menace.";
      updateProgressLabel();
      return;
    }
    principleAnswered = true;
    button.classList.add("correct");
    for (const option of $("lesson-choices").querySelectorAll("button")) option.disabled = true;
    $("lesson-feedback").textContent = "Oui. Maintenant, trouve le coup qui met ce principe en pratique.";
    $("lesson-goal").textContent = "Joue le meilleur coup de la leçon sur l’échiquier.";
    $("lesson-status").textContent = "Principe trouvé : joue un coup.";
    if (lesson.choices.length < 1) $("lesson-principle").disabled = true;
  }

  function onSquareClick(square) {
    if (!game || enginePreview || !principleAnswered || waitingForBook || sequenceIndex >= LESSONS[lessonIndex].sequence.length) return;
    const lesson = LESSONS[lessonIndex];
    const inputColor = anticipatingBook ? (lesson.color === "w" ? "b" : "w") : lesson.color;
    if (game.turn() !== inputColor) return;
    const piece = game.get(square);
    if (!selectedSquare) {
      if (piece && piece.color === inputColor) {
        selectedSquare = square;
        boardUI.selected = square;
        boardUI.legalTargets = game.moves({ square, verbose: true }).map((move) => move.to);
        renderBoard();
      }
      return;
    }
    if (selectedSquare === square) {
      clearSelection();
      renderBoard();
      return;
    }
    const move = game.move({ from: selectedSquare, to: square, promotion: "q" });
    if (!move) {
      if (piece && piece.color === inputColor) {
        selectedSquare = square;
        boardUI.selected = square;
        boardUI.legalTargets = game.moves({ square, verbose: true }).map((candidate) => candidate.to);
      } else clearSelection();
      renderBoard();
      return;
    }
    const expected = lesson.sequence[sequenceIndex];
    const uci = move.from + move.to + (move.promotion || "");
    const expectedSide = anticipatingBook ? "book" : "user";
    if (expected.side !== expectedSide || uci !== expected.uci) {
      game.undo();
      attempts++;
      clearSelection();
      renderBoard();
      $("lesson-feedback").textContent = anticipatingBook
        ? "Cette réponse légale ne correspond pas à la réponse de la ligne étudiée. Compare les variantes avec Stockfish et cherche les menaces forcées."
        : "Ce coup légal ne suit pas la ligne pédagogique. Compare-le aux autres options avec Stockfish, puis vérifie les indices sur l’échiquier.";
      updateProgressLabel();
      runEngineComparison(true);
      return;
    }
    sequenceIndex++;
    clearEvalBar();
    const anticipated = anticipatingBook;
    anticipatingBook = false;
    clearSelection();
    boardUI.lastMove = { from: move.from, to: move.to, san: move.san };
    appendMove(move.san, anticipated ? "Réponse adverse anticipée" : "Toi");
    $("lesson-feedback").textContent = expected.explanation;
    renderBoard();
    updateProgressLabel();
    advanceSequence();
  }

  function advanceSequence() {
    const lesson = LESSONS[lessonIndex];
    if (sequenceIndex >= lesson.sequence.length) {
      finishLesson();
      return;
    }
    const action = lesson.sequence[sequenceIndex];
    if (action.side === "book" && anticipationPractice) {
      anticipatingBook = true;
      $("lesson-goal").textContent = "Le camp adverse vient de jouer. À toi de prévoir sa réponse la plus gênante dans la ligne étudiée.";
      $("lesson-status").textContent = "À toi : joue la réponse adverse que tu veux anticiper.";
      return;
    }
    if (action.side === "book") {
      waitingForBook = true;
      $("lesson-status").textContent = "Réponse de la ligne du livre…";
      bookReplyTimer = root.setTimeout(() => {
        bookReplyTimer = null;
        if (!waitingForBook || !game) return;
        const move = game.move({ from: action.uci.slice(0, 2), to: action.uci.slice(2, 4), promotion: action.uci.slice(4) || "q" });
        if (!move) {
          $("lesson-status").textContent = "Cette ligne ne peut pas être rejouée dans la position chargée.";
          waitingForBook = false;
          return;
        }
        sequenceIndex++;
        clearEvalBar();
        boardUI.lastMove = { from: move.from, to: move.to, san: move.san };
        appendMove(move.san, "Ligne du livre");
        $("lesson-status").textContent = "À toi : joue la suite.";
        waitingForBook = false;
        renderBoard();
        advanceSequence();
      }, 420);
      return;
    }
    $("lesson-status").textContent = "À toi : continue la ligne.";
  }

  function appendMove(san, who) {
    const item = document.createElement("li");
    item.textContent = who + " : " + san;
    $("lesson-move-list").appendChild(item);
  }

  function finishLesson() {
    const lesson = LESSONS[lessonIndex];
    const previous = progress[lesson.id] || {};
    progress[lesson.id] = {
      completed: true,
      attempts: attempts,
      hintsUsed: hintsUsed,
      completedAt: new Date().toISOString(),
      bestAttempts: previous.bestAttempts === undefined ? attempts : Math.min(previous.bestAttempts, attempts),
    };
    saveProgress();
    renderCatalog();

    surpriseMode = false;
    anticipatingBook = false;
    $("lesson-title").textContent = lesson.title;
    renderSource(lesson);
    $("lesson-status").textContent = "Leçon terminée : " + lesson.title + ".";
    const explanation = $("lesson-explanation");
    explanation.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Ce que tu viens d’apprendre";
    const principle = document.createElement("p");
    principle.textContent = lesson.principle;
    explanation.append(heading, principle);
    const pitfallHeading = document.createElement("h4");
    pitfallHeading.textContent = "Ce qu’il ne fallait pas faire — et pourquoi";
    const avoidedChoices = lesson.choices.filter((choice) => !choice.correct).map((choice) => choice.text);
    const pitfall = document.createElement("p");
    pitfall.textContent = "À éviter : " + (lesson.pitfall || avoidedChoices.join(" · ") || "jouer sans vérifier la position.");
    const pitfallReason = document.createElement("p");
    pitfallReason.textContent = "Pourquoi : " + (lesson.pitfallReason ||
      "ces choix ne répondent pas au but de la position. " + (lesson.transfer || lesson.principle));
    explanation.append(pitfallHeading, pitfall, pitfallReason);

    const moveHeading = document.createElement("h4");
    moveHeading.textContent = "Explication de chaque demi-coup";
    const moveList = document.createElement("ul");
    const replay = setupGame(lesson, Chess);
    for (const action of lesson.sequence) {
      const move = replay.move({
        from: action.uci.slice(0, 2),
        to: action.uci.slice(2, 4),
        promotion: action.uci.slice(4) || "q",
      });
      if (!move) continue;
      const item = document.createElement("li");
      item.textContent = (action.side === "user" ? "Ton coup : " : "Réponse : ") + move.san + " — " + action.explanation;
      moveList.appendChild(item);
    }
    explanation.append(moveHeading, moveList);

    const transferHeading = document.createElement("h4");
    transferHeading.textContent = "À réutiliser dans tes parties";
    const transfer = document.createElement("p");
    transfer.textContent = lesson.transfer || lesson.principle;
    explanation.append(transferHeading, transfer);

    const nextIndex = recommendedNextLessonIndex();
    const nextLesson = LESSONS[nextIndex];
    $("lesson-next-preview").textContent = (lessonIndex + 1 < LESSONS.length ? "Prochaine étape : " : "Pour revoir le parcours : ") +
      nextLesson.title + " — " + nextLesson.category + ".";
    $("lesson-next-preview").hidden = false;
    $("lesson-next").hidden = false;
    const pathProgram = $("lesson-program-filter").value;
    const followsPath = Boolean(pathProgram && LESSONS[lessonIndex].program === pathProgram);
    $("lesson-next").textContent = followsPath ? "Étape suivante du parcours" :
      (nextIndex === (lessonIndex + 1) % LESSONS.length ? "Leçon suivante" : "Leçon recommandée");
    if (followsPath) $("lesson-next-preview").textContent = "Prochaine étape du parcours " + pathProgram + " : " +
      nextLesson.title + " (" + nextLesson.level + ") — " + nextLesson.category + ".";
    updateProgressLabel();
    $("lesson-progress").textContent = "Essais et indices utilisés : " + attempts + " · " + hintsUsed +
      (hintsUsed === 1 ? " indice." : " indices.");
    explanation.hidden = false;
  }

  function recommendedNextLessonIndex() {
    const sequential = nextLessonIndex(lessonIndex);
    const pathProgram = $("lesson-program-filter").value;
    if (pathProgram && LESSONS[lessonIndex].program === pathProgram) return sequential;
    if (attempts < 3 && hintsUsed < 2) return sequential;
    const level = LEVEL_ORDER[LESSONS[lessonIndex].level] ?? 0;
    for (let i = 0; i < LESSONS.length; i++) {
      if (i === lessonIndex || (LEVEL_ORDER[LESSONS[i].level] ?? 0) > level) continue;
      if (!(progress[LESSONS[i].id] && progress[LESSONS[i].id].completed)) return i;
    }
    return sequential;
  }

  function showHint() {
    if (!game) return;
    const lesson = LESSONS[lessonIndex];
    const hint = lesson.hints[Math.min(hintsUsed, lesson.hints.length - 1)];
    hintsUsed++;
    attempts++;
    $("lesson-feedback").textContent = "Indice : " + hint;
    updateProgressLabel();
  }

  function updateProgressLabel() {
    $("lesson-progress").textContent = "Essais : " + attempts + " · Indices utilisés : " + hintsUsed;
  }

  function clearSelection() {
    selectedSquare = null;
    boardUI.selected = null;
    boardUI.legalTargets = [];
  }

  function renderBoard() {
    if (game) boardUI.render(enginePreview || game);
  }

  function previewEngineLine(choice) {
    const preview = new Chess(choice.fen);
    let last = null;
    for (const uci of choice.pv.slice(0, 5)) {
      last = preview.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || "q" });
      if (!last) break;
    }
    if (!last) return;
    enginePreview = preview;
    clearEvalBar();
    boardUI.lastMove = { from: last.from, to: last.to, san: last.san };
    $("lesson-engine-return").hidden = false;
    $("lesson-status").textContent = "Aperçu Stockfish : " + choice.sanLine.slice(0, 5).join(" ") + ". Reviens à l’exercice pour continuer à jouer.";
    renderBoard();
  }

  function renderEngineChoices(result, fen) {
    const list = $("lesson-engine-lines");
    list.textContent = "";
    result.choices.forEach((choice) => {
      const item = document.createElement("li");
      item.className = "lesson-engine-line" + (choice.rank === 1 ? " best" : "");
      const heading = document.createElement("div");
      heading.className = "lesson-engine-line-head";
      const move = document.createElement("span");
      move.textContent = choice.rank + ". " + choice.san + (choice.rank === 1 ? " · meilleur de cette recherche" : "");
      const evaluation = document.createElement("span");
      evaluation.textContent = "Éval. côté au trait : " + choice.score;
      const delta = document.createElement("span");
      delta.className = "lesson-engine-delta";
      delta.textContent = choice.deltaCp === null ? "Écart : mat ou score incomparable" : "Écart avec le premier : " + (choice.deltaCp / 100).toFixed(2) + " pion(s)";
      heading.append(move, evaluation, delta);
      const facts = document.createElement("p");
      facts.className = "lesson-engine-facts";
      facts.textContent = "À examiner : " + choice.facts;
      const pv = document.createElement("p");
      pv.className = "lesson-engine-pv";
      pv.textContent = "Suite calculée : " + (choice.sanLine.length ? choice.sanLine.join(" ") : "non disponible");
      const preview = document.createElement("button");
      preview.type = "button";
      preview.className = "lesson-engine-preview";
      preview.textContent = "Voir cette suite sur l’échiquier";
      preview.addEventListener("click", () => previewEngineLine(choice));
      item.append(heading, facts, pv, preview);
      list.appendChild(item);
    });
    const depth = result.choices.reduce((max, choice) => Math.max(max, choice.depth), 0);
    $("lesson-engine-status").textContent = "Stockfish a évalué " + result.choices.length + " ligne(s) sur " + result.legalCount + " coup(s) légal(aux), profondeur maximale " + depth + ". L’évaluation est côté au trait; elle dépend de la recherche et ne constitue pas seule une explication humaine.";
    $("lesson-engine-analysis").hidden = false;
  }

  async function runEngineComparison(automatic) {
    if (!game) return;
    const fen = game.fen();
    const token = ++analysisToken;
    const panel = $("lesson-engine-analysis");
    const button = $("lesson-engine-analyze");
    panel.hidden = false;
    button.disabled = true;
    button.textContent = "Stockfish analyse…";
    $("lesson-engine-status").textContent = "Analyse des coups légaux avec Stockfish 19…";
    try {
      let result = engineCache.get(fen);
      if (!result) {
        if (!lessonEngine) lessonEngine = new StockfishEngine("vendor/stockfish-19-lite-single.js");
        await lessonEngine.ready;
        if (token !== analysisToken || !game || game.fen() !== fen) return;
        const legalCount = game.moves({ verbose: true }).length;
        const response = await lessonEngine.analyze({ fen: fen, multipv: Math.max(1, legalCount), movetime: 1800, elo: 0 });
        result = buildEngineChoices(fen, response.lines, Chess);
        engineCache.set(fen, result);
      }
      if (token !== analysisToken || !game || game.fen() !== fen) return;
      renderEngineChoices(result, fen);
      renderEvalBar(result);
      $("lesson-engine-status").setAttribute("data-source", "stockfish-19");
      if (stockfishCoachMode && stockfishReflection) {
        const bestLine = result.choices[0] ? result.choices[0].sanLine.join(" ") : "aucune variante disponible";
        $("lesson-reflection-review").hidden = false;
        $("lesson-reflection-summary").textContent = "Ton candidat : " + stockfishReflection.candidate + " | Réponse adverse prévue : " + stockfishReflection.reply + " | Première ligne Stockfish : " + bestLine + ". Compare les menaces et chaque demi-coup avant de décider quoi revoir.";
        $("lesson-review-save").disabled = false;
        renderStockfishReviewQueue();
      }
    } catch (error) {
      if (token === analysisToken) $("lesson-engine-status").textContent = "Analyse indisponible : " + (error && error.message ? error.message : "le moteur n’a pas répondu.");
    } finally {
      if (token === analysisToken) {
        button.disabled = false;
        button.textContent = "Actualiser la comparaison Stockfish";
      }
    }
  }

  $("lesson-search").addEventListener("input", renderCatalog);
  $("lesson-level-filter").addEventListener("change", renderCatalog);
  $("lesson-program-filter").addEventListener("change", renderCatalog);
  $("lesson-anticipate").addEventListener("click", () => {
    anticipationPractice = !anticipationPractice;
    $("lesson-anticipate").setAttribute("aria-pressed", String(anticipationPractice));
    $("lesson-status").textContent = anticipationPractice
      ? "Mode anticipation actif : tu joueras chaque réponse de la ligne adverse."
      : "Mode anticipation désactivé : les réponses de la ligne seront jouées automatiquement.";
  });
  $("lesson-surprise").addEventListener("click", () => {
    const candidates = LESSONS.map((lesson, index) => ({ lesson, index }))
      .filter(({ lesson }) => lesson.kind === "anticipation");
    if (!candidates.length) return;
    let choices = candidates.filter(({ lesson }) => !(progress[lesson.id] && progress[lesson.id].completed));
    if (!choices.length) choices = candidates;
    const lastId = sessionStorage.getItem("supachess-last-surprise");
    const fresh = choices.filter(({ lesson }) => lesson.id !== lastId);
    const selected = (fresh.length ? fresh : choices)[Math.floor(Math.random() * (fresh.length || choices.length))];
    sessionStorage.setItem("supachess-last-surprise", selected.lesson.id);
    $("lesson-search").value = "";
    $("lesson-level-filter").value = "";
    $("lesson-program-filter").value = "";
    loadLesson(selected.index, { surprise: true, anticipate: false });
    document.querySelector(".lesson-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("lesson-reflection-submit").addEventListener("click", () => {
    const candidate = $("lesson-reflection-candidate").value.trim();
    const reply = $("lesson-reflection-reply").value.trim();
    if (!candidate || !reply) {
      $("lesson-reflection-status").textContent = "Note ton coup candidat et au moins une réponse adverse avant de regarder Stockfish.";
      return;
    }
    stockfishReflection = { candidate: candidate, reply: reply };
    $("lesson-reflection-submit").disabled = true;
    $("lesson-reflection-submit").textContent = "Calcul enregistré";
    $("lesson-reflection-status").textContent = "Ta prévision est gardée dans cette page. Lance maintenant la comparaison Stockfish.";
    $("lesson-engine-analyze").hidden = false;
    $("lesson-engine-analyze").focus();
  });
  $("lesson-eval-toggle").addEventListener("click", () => {
    showEvalBar = !showEvalBar;
    $("lesson-eval-widget").hidden = !showEvalBar;
    $("lesson-eval-toggle").setAttribute("aria-pressed", String(showEvalBar));
    $("lesson-eval-toggle").textContent = "Barre d’évaluation : " + (showEvalBar ? "On" : "Off");
    if (showEvalBar && game) {
      const cached = engineCache.get(game.fen());
      if (cached) renderEvalBar(cached);
      else clearEvalBar();
    }
  });
    $("lesson-engine-analyze").addEventListener("click", () => runEngineComparison(false));
  $("lesson-review-save").addEventListener("click", () => {
    if (!stockfishCoachMode || !stockfishReflection || !game) return;
    const result = engineCache.get(game.fen());
    const record = {
      id: game.fen() + "|" + Date.now(),
      title: LESSONS[lessonIndex].title,
      fen: game.fen(),
      candidate: stockfishReflection.candidate,
      reply: stockfishReflection.reply,
      engineMove: result && result.choices[0] ? result.choices[0].sanLine.join(" ") : "",
      savedAt: new Date().toISOString(),
    };
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem("supachess_stockfish_review") || "[]"); } catch (_) {}
    if (!Array.isArray(queue)) queue = [];
    queue.unshift(record);
    try {
      localStorage.setItem("supachess_stockfish_review", JSON.stringify(queue.slice(0, 100)));
      $("lesson-review-save").disabled = true;
      $("lesson-review-status").textContent = "Position ajoutée à ta liste locale de révision.";
      renderStockfishReviewQueue();
    } catch (_) {
      $("lesson-review-status").textContent = "Impossible d’enregistrer dans ce navigateur.";
    }
  });
  $("lesson-engine-return").addEventListener("click", () => {
    enginePreview = null;
    boardUI.lastMove = null;
    $("lesson-engine-return").hidden = true;
    $("lesson-status").textContent = "Retour à la position de l’exercice. À toi de jouer.";
    renderBoard();
  });
  $("lesson-flip").addEventListener("click", () => {
    flipped = !flipped;
    boardUI.setFlipped(flipped);
    boardUI.flipped = flipped;
    $("lesson-flip").setAttribute("aria-pressed", String(flipped));
    renderBoard();
  });
  $("lesson-hint").addEventListener("click", showHint);
  $("lesson-restart").addEventListener("click", () => loadLesson(lessonIndex));
  $("lesson-next").addEventListener("click", () => loadLesson(nextLessonIndex(lessonIndex)));
  function renderStockfishReviewQueue() {
    const target = $("lesson-review-queue");
    if (!target) return;
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem("supachess_stockfish_review") || "[]"); } catch (_) {}
    if (!Array.isArray(queue) || !queue.length) {
      target.textContent = "Aucune position enregistrée pour le moment.";
      return;
    }
    const heading = document.createElement("p");
    heading.textContent = "Positions à revoir : " + queue.length;
    const list = document.createElement("ol");
    queue.slice(0, 5).forEach((item) => {
      const row = document.createElement("li");
      row.textContent = item.title + " · ton candidat : " + item.candidate + " · première ligne Stockfish : " + (item.engineMove || "indisponible");
      list.appendChild(row);
    });
    target.replaceChildren(heading, list);
  }

  function renderPersonalizedPgnPath() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("supachess_personalized_path") || "null"); } catch (_) {}
    const recommendations = saved && Array.isArray(saved.recommendations) ? saved.recommendations : [];
    const tools = document.querySelector(".lesson-tools");
    if (!tools || !recommendations.length || document.getElementById("personalized-pgn-path")) return;
    const section = document.createElement("section");
    section.id = "personalized-pgn-path";
    section.className = "method-paths";
    section.setAttribute("aria-labelledby", "personalized-pgn-path-title");
    const heading = document.createElement("div");
    heading.className = "method-paths-heading";
    const title = document.createElement("h2");
    title.id = "personalized-pgn-path-title";
    title.textContent = "Ton parcours après l’analyse de tes PGN";
    const summary = document.createElement("p");
    summary.textContent = "Profil : " + (saved.player || "joueur") + " · " +
      (saved.gameCount || 0) + " partie(s) analysée(s). Chaque étape vient des points observés dans cet échantillon.";
    heading.append(title, summary);
    section.appendChild(heading);
    const list = document.createElement("ol");
    list.className = "method-path-grid";
    recommendations.forEach((step, index) => {
      const item = document.createElement("li");
      item.className = "method-path";
      const label = document.createElement("div");
      label.className = "method-path-kicker";
      label.textContent = "Étape " + (index + 1) + " · " + step.confidence;
      const skill = document.createElement("h3");
      skill.textContent = step.skill + " · " + step.program;
      const evidence = document.createElement("p");
      evidence.textContent = "Observation : " + step.evidence + ".";
      const practice = document.createElement("p");
      practice.textContent = step.practice;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn method-path-action";
      button.textContent = "Commencer cette étape";
      button.addEventListener("click", () => {
        const program = step.program;
        let index = LESSONS.findIndex((lesson) => lesson.program === program);
        if (index < 0 && program === "Stockfish · comparer et vérifier") {
          index = LESSONS.findIndex((lesson) => lesson.kind !== "anticipation");
        }
        if (index < 0) {
          $("lesson-status").textContent = "Aucune leçon n’est encore reliée à ce parcours.";
          return;
        }
        $("lesson-program-filter").value = program;
        $("lesson-search").value = "";
        renderCatalog();
        loadLesson(index, { coach: program === "Stockfish · comparer et vérifier" });
        document.querySelector(".lesson-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      item.append(label, skill, evidence, practice, button);
      list.appendChild(item);
    });
    section.appendChild(list);
    tools.parentNode.insertBefore(section, tools);
    if (location.hash === "#parcours-pgn") section.scrollIntoView({ block: "start" });
  }

  root.startSupaChessStockfishCoach = function () {
    const path = methodPathLessonIndices("Stockfish · comparer et vérifier");
    const evaluationBasics = LESSONS.findIndex((lesson) => lesson.id === "stockfish-evaluation-context");
    const index = path.includes(evaluationBasics)
      ? evaluationBasics
      : path.find((lessonIndex) => LESSONS[lessonIndex].kind === "method");
    if (index === undefined) return false;
    $("lesson-program-filter").value = "";
    $("lesson-search").value = "";
    renderCatalog();
    loadLesson(index, { coach: true });
    return true;
  };

  renderCatalog();
  const requestedNext = new URLSearchParams(location.search).get("next") === "1";
  const firstIncomplete = LESSONS.findIndex((lesson) => !(progress[lesson.id] && progress[lesson.id].completed));
  loadLesson(requestedNext && firstIncomplete >= 0 ? firstIncomplete : 0);
  renderPersonalizedPgnPath();
})(typeof window !== "undefined" ? window : globalThis);
