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
      book: "Les principes fondamentaux des échecs",
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
      book: "Les principes fondamentaux des échecs",
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
    {"id":"calculate-before-capture","title":"Calculer avant de capturer","category":"Calcul · Sécurité tactique","level":"Expert","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Expert","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Nxd5"],"color":"w","question":"Après …Cxd5, que faut-il vérifier avant de prendre f7 ?","choices":[{"text":"Les réponses forcées du roi et les menaces sur les pièces lourdes","correct":true},{"text":"Uniquement la valeur du pion","correct":false},{"text":"Le nombre de pièces déjà développées","correct":false}],"principle":"Nxf7 crée une fourchette, mais …Kxf7 reprend le cavalier. La valeur du motif dépend des suites calculées, pas du seul coup spectaculaire.","transfer":"Avant toute combinaison, calcule les réponses forcées jusqu’à une position que tu peux évaluer; ne t’arrête pas à la première menace.","hints":["Le cavalier g5 peut prendre f7.","Calcule la reprise du roi puis cherche un échec utile."],"sequence":[{"side":"user","uci":"g5f7","explanation":"Le cavalier attaque la dame et la tour, mais il peut être repris."},{"side":"book","uci":"e8f7","explanation":"Le roi prend le cavalier: cette réponse doit être prévue."},{"side":"user","uci":"d1f3","explanation":"La dame donne échec au roi f7; évalue alors la suite et le matériel."}]}
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

  // Add 43 original application lessons at new, legal positions from the studied lines.
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
            const choices = [{ text: "Jouer " + frenchSanToEngine(played.san).replace(/N/g, "C").replace(/B/g, "F").replace(/Q/g, "D").replace(/R/g, "T").replace(/K/g, "R"), correct: true }];
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
      item.title = "Application · " + program.split(" · ")[0] + " · " + item.title.split(" · ").slice(1).join(" · ");
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
            title: "Surprise · prévoir la réponse à " + source.title,
            category: "Anticipation · " + source.category,
            program: "Anti-erreurs · anticiper l’adversaire",
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

  const LEVEL_ORDER = { "Débutant": 0, "Intermédiaire": 1, "Avancé": 2, "Expert": 3 };
  LESSONS.sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));
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
        deltaCp: deltaCp,
        depth: line.depth || 0,
        facts: firstMove ? engineHintForMove(firstMove, movedPiece && movedPiece.type) : "",
      };
    });
    return { legalCount: legalCount, choices: choices };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { LESSONS, setupGame, buildEngineChoices, engineHintForMove };
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
  let flipped = false;
  let bookReplyTimer = null;
  let progress = readProgress();
  let lessonEngine = null;
  let enginePreview = null;
  let analysisToken = 0;
  const engineCache = new Map();

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
    const originalLessonCount = LESSONS.filter((lesson) => lesson.kind !== "anticipation").length;
    const anticipationCount = LESSONS.length - originalLessonCount;
    $("lesson-catalog-count").textContent = visibleLessons.length + " affiché(s) · " + originalLessonCount +
      " leçons originales + " + anticipationCount + " exercices d’anticipation · " + LESSONS.length +
      " entrées au total · " + Object.values(progress).filter((item) => item && item.completed).length + " terminés.";
    if (!visibleLessons.length) {
      const empty = document.createElement("p");
      empty.className = "lesson-catalog-empty";
      empty.textContent = "Aucun exercice ne correspond à ces filtres.";
      catalog.appendChild(empty);
      return;
    }
    for (const { lesson, index } of visibleLessons) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-catalog-button" + (lesson.kind === "anticipation" ? " anticipation-exercise" : "");
      button.dataset.program = lesson.program || "";
      button.setAttribute("aria-current", index === lessonIndex ? "true" : "false");
      const title = document.createElement("span");
      title.className = "lesson-catalog-title";
      title.textContent = (index + 1) + ". " + lesson.title;
      const meta = document.createElement("span");
      meta.className = "lesson-catalog-meta";
      meta.textContent = lesson.level + " · " + lesson.program + " · " + lesson.author;
      const state = document.createElement("span");
      state.className = "lesson-catalog-state";
      state.textContent = progress[lesson.id] && progress[lesson.id].completed
        ? "Terminée · à revoir quand tu veux" : lesson.kind === "anticipation" ? "Défi de réponse adverse" : "À découvrir";
      button.append(title, meta, state);
      button.addEventListener("click", () => loadLesson(index));
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
    $("lesson-engine-analyze").disabled = false;
    $("lesson-engine-analyze").textContent = "Comparer tous les coups avec Stockfish";
    $("lesson-engine-status").textContent = "";
    $("lesson-engine-lines").textContent = "";
    lessonIndex = index;
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
    $("lesson-title").textContent = surpriseMode ? "Exercice surprise" : lesson.title;
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
    if (surpriseMode) $("lesson-source").textContent = "Défi surprise · thème révélé après l’exercice";
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
    const pitfall = document.createElement("p");
    pitfall.textContent = "À ne pas faire : " + (lesson.pitfall || "ne pas poursuivre son plan sans recalculer les réponses adverses.");
    explanation.appendChild(pitfall);

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
    $("lesson-next").textContent = nextIndex === (lessonIndex + 1) % LESSONS.length ? "Leçon suivante" : "Leçon recommandée";
    updateProgressLabel();
    $("lesson-progress").textContent = "Essais et indices utilisés : " + attempts + " · " + hintsUsed +
      (hintsUsed === 1 ? " indice." : " indices.");
    explanation.hidden = false;
  }

  function recommendedNextLessonIndex() {
    const sequential = (lessonIndex + 1) % LESSONS.length;
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
      $("lesson-engine-status").setAttribute("data-source", "stockfish-19");
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
    loadLesson(selected.index, { surprise: true, anticipate: false });
  });
  $("lesson-engine-analyze").addEventListener("click", () => runEngineComparison(false));
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
  $("lesson-next").addEventListener("click", () => loadLesson((lessonIndex + 1) % LESSONS.length));
  renderCatalog();
  const requestedNext = new URLSearchParams(location.search).get("next") === "1";
  const firstIncomplete = LESSONS.findIndex((lesson) => !(progress[lesson.id] && progress[lesson.id].completed));
  loadLesson(requestedNext && firstIncomplete >= 0 ? firstIncomplete : 0);
})(typeof window !== "undefined" ? window : globalThis);
