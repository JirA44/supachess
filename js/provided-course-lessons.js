/* Leçons originales bâties à partir des thèmes des quatre cours fournis. */
(function (root) {
  "use strict";

  const lessons = [
    {
      id: "provided-nunn-01-temporary-advantage",
      kind: "method", level: "Avancé", title: "Exploiter un avantage temporaire avant qu’il ne s’éteigne",
      category: "Milieu de jeu · avantage et décision", program: "Cours · milieu de jeu et conversion",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_3_-_Le_milieu_de_partie.pdf; texte et diagrammes non repris.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5", "c3", "d6", "O-O", "O-O", "Re1", "h6"], color: "w",
      question: "Tu as terminé ton développement. Quel plan central peut transformer ce temps d’avance en activité concrète ?",
      choices: [
        { text: "Préparer et jouer d4, puis calculer les prises qui ouvrent le centre", correct: true },
        { text: "Promener une pièce plusieurs fois sans examiner la réaction noire", correct: false },
        { text: "Lancer un pion devant le roi sans ligne calculée", correct: false }
      ],
      principle: "Un avantage de développement peut diminuer si l’adversaire termine tranquillement ses pièces. Une rupture centrale peut ouvrir des lignes, mais seulement si les reprises et la sécurité du roi tiennent.",
      transfer: "Avant de manœuvrer, demande si l’avantage est temporaire ou durable et quel contre-jeu l’adversaire prépare.",
      pitfall: "Ne confonds pas « jouer vite » avec « jouer une attaque automatique » : la rupture doit rester calculée.",
      hints: ["Tes pièces sont prêtes à soutenir le centre.", "Après d4, vérifie …exd4 et la reprise cxd4."],
      sequence: [
        { side: "user", uci: "d3d4", explanation: "d4 conteste le centre pendant que les pièces blanches sont développées." },
        { side: "book", uci: "e5d4", explanation: "…exd4 transforme le centre; les Blancs doivent comparer les reprises." },
        { side: "user", uci: "c3d4", explanation: "cxd4 reprend le pion; évalue l’ouverture des lignes et les pièces actives." }
      ]
    },
    {
      id: "provided-nunn-02-restrict-counterplay",
      kind: "method", level: "Avancé", title: "Réduire le contre-jeu avant d’améliorer le roi",
      category: "Milieu de jeu · avantage et décision", program: "Cours · milieu de jeu et conversion",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_3_-_Le_milieu_de_partie.pdf; texte et diagrammes non repris.",
      setup: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e6", "Qd2", "Be7", "O-O-O", "O-O"], color: "w",
      question: "Les Noirs ont déjà sécurisé leur roi et peuvent préparer …d5. Quelle décision garde l’initiative au centre ?",
      choices: [
        { text: "Préparer f3 et g4 seulement si les réponses centrales …d5 sont calculées", correct: true },
        { text: "Manœuvrer lentement le roi sans surveiller la rupture …d5", correct: false },
        { text: "Pousser tous les pions de l’aile-roi immédiatement", correct: false }
      ],
      principle: "Une attaque sur les ailes ne doit pas laisser une rupture centrale adverse sans réponse. Il faut évaluer le contre-jeu avant de choisir une manœuvre lente.",
      transfer: "Quand tu as l’avantage, identifie d’abord la ressource active adverse et décide si elle doit être empêchée, échangée ou acceptée.",
      pitfall: "Le roque opposé n’autorise pas automatiquement une course de pions : le centre peut s’ouvrir contre ton roi.",
      hints: ["La poussée …d5 est le levier central noir.", "Vérifie si tes pions avancés laissent le roi blanc exposé."],
      sequence: [
        { side: "user", uci: "f2f3", explanation: "f3 renforce e4 et prépare éventuellement g4, sans encore lancer le pion g." },
        { side: "book", uci: "b7b5", explanation: "…b5 crée du contre-jeu à l’aile-dame; réévalue la course des deux camps." },
        { side: "user", uci: "g2g4", explanation: "g4 devient une décision de plan; calcule les prises, les échecs et l’ouverture des lignes." }
      ]
    },
    {
      id: "provided-nunn-03-simplify-selectively",
      kind: "method", level: "Expert", title: "Choisir les échanges selon la position obtenue",
      category: "Milieu de jeu · avantage et décision", program: "Cours · milieu de jeu et conversion",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_3_-_Le_milieu_de_partie.pdf; texte et diagrammes non repris.",
      setup: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7", "Bg5", "O-O", "e3", "h6", "Bh4", "b6", "Bd3", "Bb7"], color: "w",
      question: "Avant d’échanger une pièce active, quel bilan est le plus utile ?",
      choices: [
        { text: "Comparer les faiblesses, les pièces restantes, le roi et les possibilités de contre-jeu après l’échange", correct: true },
        { text: "Échanger dès que deux pièces se regardent", correct: false },
        { text: "Garder toutes les pièces sans calculer la position qui en résulte", correct: false }
      ],
      principle: "La valeur d’un échange dépend de la structure et de l’activité après les reprises; une simplification peut aider un camp ou supprimer ses chances pratiques.",
      transfer: "Écris une ligne de reprise pour chaque candidat d’échange et compare les positions finales avant de décider.",
      pitfall: "Ne présente pas un échange comme bon uniquement parce qu’il réduit le nombre de pièces.",
      hints: ["Repère le fou h4, le fou b7 et les tensions centrales.", "Imagine l’échiquier après les deux reprises, pas seulement la première capture."],
      sequence: [
        { side: "user", uci: "h4f6", explanation: "Bxf6 échange le fou contre un défenseur actif; la reprise noire doit être calculée avant le bilan." },
        { side: "book", uci: "e7f6", explanation: "…Fxf6 reprend; compare la structure, les diagonales et les pièces restantes." }
      ]
    },
    {
      id: "provided-nunn-04-reassess-after-combination",
      kind: "method", level: "Expert", title: "Réévaluer après une combinaison, pas seulement le gain matériel",
      category: "Milieu de jeu · avantage et décision", program: "Cours · milieu de jeu et conversion",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_3_-_Le_milieu_de_partie.pdf; texte et diagrammes non repris.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nbxd2", "d5"], color: "w",
      question: "Après la rupture …d5, quelle discipline empêche une combinaison séduisante de masquer une perte de tempo ?",
      choices: [
        { text: "Calculer les reprises, les échecs et l’activité obtenue pour les deux camps", correct: true },
        { text: "Compter seulement les pions capturés pendant la variante", correct: false },
        { text: "Conclure qu’une combinaison gagne parce qu’elle force une capture", correct: false }
      ],
      principle: "Une variante doit être évaluée à sa position finale : matériel, sécurité des rois, initiative et ressources défensives comptent ensemble.",
      transfer: "Après chaque séquence forcée, arrête-toi sur la position finale et reconstruis les menaces des deux camps.",
      pitfall: "Ne t’arrête pas au premier gain apparent si la dame ou le roi reste exposé.",
      hints: ["La position vient de changer au centre.", "Compte aussi les pièces qui ont quitté leurs cases et les échecs disponibles."],
      sequence: [
        { side: "user", uci: "e4d5", explanation: "exd5 capture au centre; la réponse des Noirs doit être calculée avant tout bilan." },
        { side: "book", uci: "f6d5", explanation: "…Cxd5 reprend le pion et place le cavalier au centre." },
        { side: "user", uci: "c4d5", explanation: "Bxd5 échange le cavalier; compare l’activité et les pièces restantes." }
      ]
    },
    {
      id: "provided-junior-01-strength-weakness-threat",
      kind: "method", level: "Débutant", title: "Séparer forces, faiblesses et menaces",
      category: "Milieu de jeu · diagnostic et plans", program: "Cours · milieu de jeu : forces et plans",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis ECHECS_CoursNo1-Milieudepartie.pdf; texte et diagrammes non repris.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"], color: "w",
      question: "Avant de choisir un plan, quelle grille décrit correctement les deux camps ?",
      choices: [
        { text: "Noter une force, une faiblesse et une menace active pour chaque camp", correct: true },
        { text: "Chercher uniquement une tactique pour les Blancs", correct: false },
        { text: "Compter seulement les pièces sans regarder les cases ni les pions", correct: false }
      ],
      principle: "Un diagnostic positionnel distingue les ressources durables, les cibles vulnérables et les menaces qui demandent une réponse immédiate.",
      transfer: "Dans une position nouvelle, formule six observations courtes : force, faiblesse et menace pour chacun des deux camps.",
      pitfall: "Une faiblesse n’est utile comme cible que si tes pièces peuvent réellement l’attaquer.",
      hints: ["Regarde le centre et les pièces développées.", "Distingue une menace immédiate d’un défaut structurel à long terme."],
      sequence: [
        { side: "user", uci: "d2d3", explanation: "d3 soutient le centre; l’exercice porte sur la qualité du diagnostic qui précède le plan." },
        { side: "book", uci: "b7b5", explanation: "…b5 attaque le fou; la menace immédiate modifie les candidats blancs." }
      ]
    },
    {
      id: "provided-junior-02-strong-square",
      kind: "method", level: "Intermédiaire", title: "Évaluer si une case forte peut vraiment être occupée",
      category: "Milieu de jeu · diagnostic et plans", program: "Cours · milieu de jeu : forces et plans",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis ECHECS_CoursNo1-Milieudepartie.pdf; texte et diagrammes non repris.",
      setup: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e6", "Qd2", "Be7"], color: "w",
      question: "Quelle démarche permet de transformer une case centrale durable en avant-poste utile ?",
      choices: [
        { text: "Vérifier qu’aucun pion adverse ne peut la chasser, puis préparer une pièce qui peut y rester", correct: true },
        { text: "Envoyer immédiatement une pièce sur la case, même si elle peut être chassée par un pion", correct: false },
        { text: "Déclarer forte toute case du camp adverse sans analyser les pions", correct: false }
      ],
      principle: "Une case est un avant-poste potentiel lorsque les pions adverses ne peuvent pas l’expulser; son utilité dépend encore de l’accès et du soutien d’une pièce.",
      transfer: "Repère la case, teste les poussées de pions adverses, puis nomme la pièce qui pourrait l’occuper.",
      pitfall: "Ne confonds pas une case faible avec une pièce déjà installée dessus.",
      hints: ["Observe les pions c5, d6 et e6.", "Un cavalier peut exploiter une case protégée par un pion."],
      sequence: [
        { side: "user", uci: "f1d3", explanation: "Fd3 développe le fou et prépare le contrôle de cases centrales." },
        { side: "book", uci: "b8c6", explanation: "…Cc6 développe et augmente la pression sur d4." }
      ]
    },
    {
      id: "provided-junior-03-open-file",
      kind: "method", level: "Avancé", title: "Occuper une colonne ouverte avant d’envahir la septième rangée",
      category: "Milieu de jeu · diagnostic et plans", program: "Cours · milieu de jeu : forces et plans",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis ECHECS_CoursNo1-Milieudepartie.pdf; texte et diagrammes non repris.",
      fen: "r3k2r/pp3ppp/8/8/8/8/PP3PPP/2R1K2R w K - 0 1", color: "w",
      question: "Quelle suite développe la tour vers une colonne centrale ouverte sans prétendre que l’invasion est déjà gagnante ?",
      choices: [
        { text: "Doubler ou soutenir la colonne c, puis vérifier si la septième rangée est accessible", correct: true },
        { text: "Envoyer la tour en septième rangée sans vérifier les pièces qui la défendent", correct: false },
        { text: "Échanger toutes les tours avant d’occuper la colonne", correct: false }
      ],
      principle: "Une colonne ouverte sert de voie d’accès aux pièces lourdes; l’invasion est utile si elle crée une cible ou limite les pièces adverses.",
      transfer: "Repère d’abord la colonne, vérifie qu’elle est ouverte ou semi-ouverte, puis calcule l’accès et les échanges de tours.",
      pitfall: "La septième rangée n’est pas une destination automatique : une tour peut y être enfermée ou échangée.",
      hints: ["Les pions c ont disparu de la colonne c.", "La tour c1 est déjà placée sur cette voie."],
      sequence: [
        { side: "user", uci: "c1c7", explanation: "Tc7 teste une pénétration; la sécurité de la tour et les cases de sortie doivent être vérifiées." },
        { side: "book", uci: "a7a6", explanation: "…a6 crée une ressource sur l’aile; réévalue les cibles plutôt que de supposer un gain." }
      ]
    },
    {
      id: "provided-junior-04-pawn-majority",
      kind: "method", level: "Expert", title: "Transformer une majorité de pions en pion passé",
      category: "Milieu de jeu · diagnostic et plans", program: "Cours · milieu de jeu : forces et plans",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis ECHECS_CoursNo1-Milieudepartie.pdf; texte et diagrammes non repris.",
      fen: "4k3/pp6/8/8/8/8/PPP5/4K3 w - - 0 1", color: "w",
      question: "Les Blancs ont trois pions contre deux sur l’aile-dame. Quelle démarche transforme cette majorité en cible concrète ?",
      choices: [
        { text: "Créer une rupture, calculer les reprises, puis soutenir le pion passé avec le roi", correct: true },
        { text: "Pousser les pions sans calculer les prises ni la course des rois", correct: false },
        { text: "Ignorer les pions et promener le roi loin du secteur", correct: false }
      ],
      principle: "Une majorité ne gagne pas à elle seule; il faut créer un pion passé et vérifier si le roi peut le soutenir plus vite que l’adversaire ne l’arrête.",
      transfer: "Compte les pions par aile, trouve la poussée de rupture, puis calcule la course du roi et les échanges.",
      pitfall: "Un avantage numérique local peut être neutralisé par un roi actif ou une contre-course ailleurs.",
      hints: ["Compare le nombre de pions sur l’aile-dame.", "Cherche une poussée qui oblige un pion noir à quitter sa colonne, puis calcule sa reprise."],
      sequence: [
        { side: "user", uci: "c2c4", explanation: "c4 met la majorité en mouvement; calcule comment les pions noirs peuvent contester la poussée." },
        { side: "book", uci: "b7b5", explanation: "…b5 contre-attaque le pion c4; les Blancs doivent calculer les prises avant de pousser." },
        { side: "user", uci: "c4b5", explanation: "cxb5 transforme la structure; vérifie si le pion avancé peut être soutenu et si le roi rejoint la course." }
      ]
    },
    {
      id: "provided-pawns-01-opposition",
      kind: "method", level: "Intermédiaire", title: "Utiliser l’opposition pour laisser passer le roi",
      category: "Finales · pions et activité du roi", program: "Cours · finales de pions",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_ finales_de_pions.pdf; position et formulation originales.",
      fen: "8/4k3/8/4K3/4P3/8/8/8 w - - 0 1", color: "w",
      question: "Le roi noir contrôle l’approche directe. Quel est le principe à appliquer avant d’avancer le pion ?",
      choices: [
        { text: "Approcher le roi en gardant une distance d’opposition et en préservant le pion", correct: true },
        { text: "Pousser le pion à chaque tour sans vérifier si le roi adverse l’arrête", correct: false },
        { text: "Éloigner son roi de la case de promotion", correct: false }
      ],
      principle: "L’opposition est un outil de zugzwang et d’accès; son résultat dépend des cases, du trait et des pions présents.",
      transfer: "Avant chaque poussée, vérifie si ton roi gagne une case clé et si le roi adverse peut entrer dans le carré du pion.",
      pitfall: "Ne conclus pas « opposition = gain » sans calculer la position exacte et le trait.",
      hints: ["Le roi noir est devant le pion.", "Compare un coup de roi et une poussée immédiate."],
      sequence: [
        { side: "user", uci: "e5d5", explanation: "Kd5 garde le roi près du pion et prend une case d’approche; vérifie les réponses du roi noir." },
        { side: "book", uci: "e7d7", explanation: "…Kd7 maintient la proximité; la position doit être réévaluée selon le trait." }
      ]
    },
    {
      id: "provided-pawns-02-breakthrough",
      kind: "method", level: "Avancé", title: "Trouver la percée de pions au lieu de défendre passivement",
      category: "Finales · pions et activité du roi", program: "Cours · finales de pions",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_ finales_de_pions.pdf; position et formulation originales.",
      fen: "4k3/5ppp/8/5PPP/8/8/8/4K3 w - - 0 1", color: "w",
      question: "Comment ouvrir une voie de promotion dans cette chaîne bloquée ?",
      choices: [
        { text: "Calculer une poussée de rupture qui force un pion noir à capturer et libère un pion voisin", correct: true },
        { text: "Avancer seulement le pion le plus éloigné du roi adverse", correct: false },
        { text: "Reculer le roi sans calculer la chaîne de pions", correct: false }
      ],
      principle: "Une percée peut sacrifier un pion pour détourner un défenseur et libérer un autre pion; il faut vérifier chaque capture et la course qui suit.",
      transfer: "Cherche une suite où un pion force une capture, puis vérifie si le pion voisin devient impossible à arrêter.",
      pitfall: "Ne compte pas une percée comme gagnante si le roi adverse rejoint le pion passé à temps.",
      hints: ["Les pions f, g et h se bloquent mutuellement.", "Teste f6, puis calcule la réponse …gxf6 et la reprise gxf6."],
      sequence: [
        { side: "user", uci: "f5f6", explanation: "f6 sacrifie la première barrière pour provoquer une capture et ouvrir une colonne de promotion." },
        { side: "book", uci: "g7f6", explanation: "…gxf6 accepte le sacrifice; la reprise blanche doit être calculée." },
        { side: "user", uci: "g5g6", explanation: "g6 continue la percée; calcule …fxg6 et la reprise h5xg6 avant d’évaluer le pion passé." },
        { side: "book", uci: "f7g6", explanation: "…fxg6 capture le pion avancé; le dernier pion blanc peut maintenant reprendre." },
        { side: "user", uci: "h5g6", explanation: "hxg6 élimine le dernier bloqueur et crée une route de promotion; compte les tempos du roi." }
      ]
    },
    {
      id: "provided-pawns-03-king-activity",
      kind: "method", level: "Avancé", title: "Garder le roi actif sans abandonner le pion",
      category: "Finales · pions et activité du roi", program: "Cours · finales de pions",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_ finales_de_pions.pdf; position et formulation originales.",
      fen: "8/8/3k4/8/3P4/8/4K3/8 w - - 0 1", color: "w",
      question: "Quel coup garde le roi blanc actif tout en surveillant le pion central ?",
      choices: [
        { text: "Approcher le roi par une case sûre, puis recalculer les cases d’entrée des deux rois", correct: true },
        { text: "Éloigner le roi du pion sans calculer les cases d’entrée", correct: false },
        { text: "Pousser le pion dans le roi adverse", correct: false }
      ],
      principle: "En finale, l’activité du roi peut compter davantage qu’une poussée immédiate; conserve le contact avec le pion et calcule l’entrée du roi adverse.",
      transfer: "Compare une approche du roi et une poussée de pion, puis vérifie les cases d’entrée accessibles aux deux rois.",
      pitfall: "N’avance pas automatiquement un pion si son roi ne peut plus le soutenir.",
      hints: ["Le roi blanc est plus éloigné du pion que le roi noir.", "Cherche une case qui rapproche le roi sans le mettre en échec."],
      sequence: [
        { side: "user", uci: "e2f3", explanation: "Kf3 garde le roi dans la zone du pion et prend une case d’approche." },
        { side: "book", uci: "d6e6", explanation: "…Ke6 se rapproche du pion; les Blancs doivent comparer les cases d’entrée et le trait." }
      ]
    },
    {
      id: "provided-pawns-04-block-promotion-route",
      kind: "method", level: "Expert", title: "Bloquer la route du roi avant de pousser le pion passé",
      category: "Finales · pions et activité du roi", program: "Cours · finales de pions",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thèmes reformulés depuis echecs_ finales_de_pions.pdf; position et formulation originales.",
      fen: "8/8/8/8/P7/3p4/4k3/K7 w - - 0 1", color: "w",
      question: "Le pion a4 est passé, mais le pion d3 menace aussi de promouvoir. Quelle règle décide si l’on peut avancer ?",
      choices: [
        { text: "Calculer les tempos des deux pions et les cases d’interception du roi avant de pousser", correct: true },
        { text: "Avancer toujours le pion passé le plus éloigné du roi", correct: false },
        { text: "Ignorer le pion adverse parce qu’il est sur une autre aile", correct: false }
      ],
      principle: "Deux pions passés opposés imposent une course concrète; le roi peut couper une route ou gagner un tempo décisif.",
      transfer: "Compte les coups jusqu’à promotion pour les deux camps et cherche les échecs avec tempo ou les cases d’interception.",
      pitfall: "Ne pousse pas par réflexe : une promotion adverse avec échec peut renverser la course.",
      hints: ["Compare la distance du pion a4 et du pion d3 à leur huitième rangée.", "Teste d’abord une poussée blanche et compte la réponse noire la plus rapide."],
      sequence: [
        { side: "user", uci: "a4a5", explanation: "a5 gagne un tempo dans la course; compte immédiatement la réponse du pion d3." },
        { side: "book", uci: "d3d2", explanation: "…d2 menace la promotion au prochain coup; le roi blanc doit vérifier s’il peut intercepter." }
      ]
    },
    {
      id: "provided-basics-01-legal-check-response",
      kind: "method", level: "Débutant", title: "Répondre à un échec par une défense légale",
      category: "Fondamentaux · règles et décisions", program: "Cours · fondamentaux et règles",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Notions de règles reformulées depuis ECHECS_final-TP.pdf; exemples et formulation originaux.",
      fen: "4k3/8/8/8/8/8/8/4R2K b - - 0 1", color: "b",
      question: "Ton roi est en échec. Quelle méthode permet de choisir une réponse légale ?",
      choices: [
        { text: "Vérifier si l’attaquant peut être capturé, si la ligne peut être bloquée ou si le roi peut fuir", correct: true },
        { text: "Jouer n’importe quel coup qui attaque la dame", correct: false },
        { text: "Capturer le roi adverse", correct: false }
      ],
      principle: "Un échec doit être neutralisé par une capture de l’attaquant, une interposition quand la géométrie le permet, ou un déplacement légal du roi.",
      transfer: "Après chaque échec, énumère les trois familles de défense puis vérifie lesquelles sont légales dans cette position.",
      pitfall: "Le roi n’est jamais capturé : la partie s’arrête au mat ou selon une autre règle de fin reconnue.",
      hints: ["La dame blanche attaque le roi noir depuis f7.", "Vérifie les cases de fuite et les pièces qui défendent la dame."],
      sequence: [
        { side: "user", uci: "e8d8", explanation: "Kd8 est une fuite légale à vérifier dans cette position; ne confonds pas fuite et capture du roi." },
        { side: "book", uci: "h1h2", explanation: "Kh2 est un coup légal; la séquence permet de reconstruire la position après la défense de l’échec." }
      ]
    },
    {
      id: "provided-basics-02-king-safety",
      kind: "method", level: "Débutant", title: "Distinguer échec, mat et abandon",
      category: "Fondamentaux · règles et décisions", program: "Cours · fondamentaux et règles",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Lexique reformulé depuis ECHECS_final-TP.pdf; formulation et exemple originaux.",
      setup: ["e4", "e5", "Qh5", "Nc6", "Bc4", "g6"], color: "w",
      question: "La dame blanche est attaquée par …g6. Quelle vérification vient avant le choix du prochain coup ?",
      choices: [
        { text: "Déplacer la dame vers une case légale et vérifier si le roi est réellement en échec ou mat", correct: true },
        { text: "Annoncer échec et mat parce que le roi noir est près de la dame", correct: false },
        { text: "Ignorer l’attaque de pion car la dame donne une menace", correct: false }
      ],
      principle: "Un échec attaque le roi; le mat exige qu’aucune défense légale n’existe. L’abandon est une décision du joueur, pas une position de mat.",
      transfer: "Nomme le fait exact qui termine la partie : mat, pat, abandon, temps ou accord de nulle.",
      pitfall: "Ne déduis jamais le résultat d’une animation ou d’une attaque seule : vérifie la fin réelle de la partie.",
      hints: ["Le pion g6 attaque la dame h5.", "L’échec concerne le roi, pas une autre pièce."],
      sequence: [
        { side: "user", uci: "h5f3", explanation: "Df3 retire la dame de l’attaque; les Blancs doivent ensuite contrôler la menace noire." },
        { side: "book", uci: "g8f6", explanation: "…Cf6 développe et met la pression sur e4; ce coup n’est pas un échec et n’attaque pas directement la dame." }
      ]
    },
    {
      id: "provided-basics-03-tempo-and-threat",
      kind: "method", level: "Intermédiaire", title: "Reconnaître un tempo gagné et la menace qui l’accompagne",
      category: "Fondamentaux · règles et décisions", program: "Cours · fondamentaux et règles",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Concepts reformulés depuis ECHECS_final-TP.pdf; exemple original.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "b5"], color: "w",
      question: "Le pion …b5 attaque le fou et gagne un tempo. Quelle réponse respecte ce fait ?",
      choices: [
        { text: "Retirer le fou sur une case utile et réévaluer le plan noir", correct: true },
        { text: "Jouer comme si le fou n’était pas attaqué", correct: false },
        { text: "Appeler cela échec parce qu’une pièce est attaquée", correct: false }
      ],
      principle: "Un tempo est une unité de développement ou d’action; une attaque de pièce n’est pas un échec, mais elle impose de calculer une réponse.",
      transfer: "Après une attaque, identifie la pièce ciblée, les retraites utiles et les éventuelles contre-menaces.",
      pitfall: "Ne confonds pas les noms des menaces : échec, attaque de pièce et menace de mat sont des faits différents.",
      hints: ["Le pion b5 attaque le fou a4.", "Le fou peut reculer sur b3 ou c2."],
      sequence: [
        { side: "user", uci: "a4b3", explanation: "Fb3 préserve le fou et la diagonale; ce n’est pas une réponse à un échec puisque le roi n’est pas attaqué." },
        { side: "book", uci: "d7d6", explanation: "…d6 consolide e5; les Blancs peuvent maintenant réévaluer le centre." }
      ]
    },
    {
      id: "provided-basics-04-counterplay",
      kind: "method", level: "Avancé", title: "Créer du contre-jeu sans oublier la menace adverse",
      category: "Fondamentaux · règles et décisions", program: "Cours · fondamentaux et règles",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Notions de contre-jeu reformulées depuis ECHECS_final-TP.pdf; exemples originaux.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+"], color: "w",
      question: "En échec et sous pression centrale, quelle séquence distingue défense active et contre-jeu prématuré ?",
      choices: [
        { text: "Répondre d’abord à l’échec, puis chercher une menace qui oblige l’adversaire à réagir", correct: true },
        { text: "Ignorer l’échec et attaquer une pièce sans calculer", correct: false },
        { text: "Échanger au hasard toutes les pièces pour réduire la pression", correct: false }
      ],
      principle: "Le contre-jeu fonctionne quand il répond aux contraintes de la position et crée une menace concrète; il ne remplace pas une défense obligatoire.",
      transfer: "Classe les candidats en défense forcée, contre-menace immédiate et plan à plus long terme.",
      pitfall: "Une attaque sur la dame ne neutralise pas automatiquement un échec.",
      hints: ["Le fou noir b4 donne échec sur la diagonale vers e1.", "Une pièce peut s’interposer en d2."],
      sequence: [
        { side: "user", uci: "c1d2", explanation: "Bd2 bloque l’échec; ensuite seulement, les Blancs peuvent chercher un contre-jeu." },
        { side: "book", uci: "d7d5", explanation: "…d5 crée une nouvelle menace au centre; la réponse précédente ne dispense pas de réévaluer." }
      ]
    },
    {
      id: "provided-active-defense-01-parry-and-counterplay",
      kind: "method", level: "Débutant", title: "Parer la menace, puis activer ses pièces",
      category: "Défense active · priorité et activité", program: "Cours · défense active et ressources",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Principe reformulé à partir des thèmes de milieu de jeu de echecs_3_-_Le_milieu_de_partie.pdf et ECHECS_CoursNo1-Milieudepartie.pdf; position et formulation originales.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5"], color: "w",
      question: "Le fou a4 est attaqué par …b5. Quelle séquence combine une réponse nécessaire et un plan actif ?",
      choices: [
        { text: "Mettre le fou en sécurité, puis préparer d4 et recalculer le centre", correct: true },
        { text: "Ignorer l’attaque du fou et pousser un pion de l’aile sans menace concrète", correct: false },
        { text: "Reculer toutes les pièces sans chercher à reprendre l’initiative", correct: false }
      ],
      principle: "La défense active commence par distinguer l’urgence de la menace. Après une parade sûre, l’activité et le contre-jeu empêchent l’adversaire d’enchaîner librement.",
      transfer: "Nomme la pièce ou le point menacé, choisis une parade légale, puis cherche un coup qui développe, attaque une cible ou conteste le centre.",
      pitfall: "Une contre-menace ne sauve pas automatiquement une pièce attaquée; vérifie d’abord si elle peut être prise.",
      hints: ["Le pion b5 attaque le fou a4.", "Bb3 conserve le fou et laisse aux Blancs la possibilité de contester le centre."],
      sequence: [
        { side: "user", uci: "a4b3", explanation: "Fb3 retire le fou de l’attaque tout en gardant sa diagonale; ce coup ne prétend pas gagner un tempo." },
        { side: "book", uci: "d7d6", explanation: "…d6 consolide le centre noir; les Blancs réévaluent la position avant de préparer leur rupture." },
        { side: "user", uci: "c2c3", explanation: "c3 prépare d4; les Blancs visent le centre plutôt qu’une défense passive de chaque pièce." }
      ]
    },
    {
      id: "provided-active-defense-02-central-counterstrike",
      kind: "method", level: "Intermédiaire", title: "Répondre à une attaque par une rupture centrale calculée",
      category: "Défense active · contre-attaque centrale", program: "Cours · défense active et ressources",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Thème de contre-jeu central reformulé à partir de echecs_3_-_Le_milieu_de_partie.pdf et ECHECS_CoursNo1-Milieudepartie.pdf; exemple original.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"], color: "b",
      question: "Le cavalier g5 met f7 sous pression. Quel principe permet aux Noirs de chercher une ressource active ?",
      choices: [
        { text: "Contester le centre par …d5 et calculer les prises et les échecs après la rupture", correct: true },
        { text: "Déplacer immédiatement le roi sans vérifier les menaces", correct: false },
        { text: "Jouer un coup d’aile quelconque en laissant le centre et f7 sans examen", correct: false }
      ],
      principle: "Une contre-attaque centrale peut détourner ou ralentir une attaque, mais elle n’est valable que si les suites forcing sont calculées.",
      transfer: "Quand l’adversaire attaque une cible, vérifie si une rupture centrale crée une menace plus urgente et si elle résiste à la meilleure prise adverse.",
      pitfall: "Ne joue pas …d5 par automatisme : une rupture qui perd un pion ou ouvre ton roi peut aggraver la position.",
      hints: ["Le cavalier blanc vise f7.", "…d5 attaque le fou c4 et ouvre la position; calcule exd5 avant de conclure."],
      sequence: [
        { side: "user", uci: "d7d5", explanation: "…d5 contre-attaque le fou c4 et conteste le centre; les Blancs peuvent capturer en d5." },
        { side: "book", uci: "e4d5", explanation: "exd5 prend le pion; les Noirs doivent vérifier les réponses légales et la sécurité de leur roi." },
        { side: "user", uci: "f6d5", explanation: "…Cxd5 reprend le pion et développe le cavalier; compare matériel, activité et menaces restantes." }
      ]
    },
    {
      id: "provided-active-defense-03-remove-attacker",
      kind: "method", level: "Intermédiaire", title: "Échanger la pièce d’attaque qui rend la défense difficile",
      category: "Défense active · échange utile", program: "Cours · défense active et ressources",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Décision d’échange reformulée à partir de echecs_3_-_Le_milieu_de_partie.pdf; ligne et explication originales.",
      setup: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7", "Bg5", "O-O", "e3", "h6", "Bh4", "b6", "Bd3", "Bb7"], color: "w",
      question: "Avant de choisir une défense, comment réduire la pression du fou b7 sur le centre et décider si l’échange t’aide ?",
      choices: [
        { text: "Comparer la position après Bxf6 et la reprise, puis choisir l’échange seulement si le bilan est favorable", correct: true },
        { text: "Échanger automatiquement toute pièce dès qu’elle est attaquée", correct: false },
        { text: "Garder les pièces sans vérifier les menaces ni les suites de reprise", correct: false }
      ],
      principle: "Échanger un attaquant peut soulager une défense, mais l’échange modifie aussi les cases, les structures et les pièces actives.",
      transfer: "Pour chaque échange défensif, calcule les reprises complètes, puis compare la menace, la structure de pions et l’activité des deux camps.",
      pitfall: "Ne confonds pas retirer une pièce adverse et résoudre toute la position : une autre menace peut subsister.",
      hints: ["Le fou blanc h4 peut capturer le cavalier f6.", "Après …Bxf6, réévalue les diagonales et les pièces restantes."],
      sequence: [
        { side: "user", uci: "h4f6", explanation: "Bxf6 propose d’échanger un défenseur noir; ce choix se juge après la reprise, pas avant." },
        { side: "book", uci: "e7f6", explanation: "…Bxf6 reprend; les deux camps doivent comparer les cases centrales et les pièces actives." },
        { side: "user", uci: "d1c2", explanation: "Qc2 soutient le centre et garde la dame à l’abri; les Blancs poursuivent leur plan sans supposer que l’échange a gagné." }
      ]
    },
    {
      id: "provided-active-defense-04-blockade",
      kind: "method", level: "Avancé", title: "Bloquer un pion passé avant qu’il ne devienne une menace",
      category: "Défense active · blocage et coordination", program: "Cours · défense active et ressources",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Motif de blocage reformulé à partir de echecs_ finales de pions.pdf et des thèmes de milieu de jeu des cours fournis; position originale.",
      fen: "8/2k5/8/2P5/1P6/8/6K1/8 b - - 0 1", color: "b",
      question: "Le pion blanc c5 est passé et soutenu par b4. Quelle défense noire doit freiner sa progression tout en gardant le roi actif ?",
      choices: [
        { text: "Placer le roi ou une pièce devant le pion passé, puis attaquer sa base avec les autres unités", correct: true },
        { text: "Éloigner le roi du pion et attendre sa promotion", correct: false },
        { text: "Pousser un pion de l’autre aile sans tenir compte de c5", correct: false }
      ],
      principle: "Le blocage limite la mobilité du pion passé; la défense devient active quand le bloqueur est soutenu et que la base du pion est attaquée.",
      transfer: "Repère le pion passé, identifie sa case de blocage, puis vérifie si le roi peut y accéder sans abandonner une autre cible.",
      pitfall: "Un bloqueur isolé peut être chassé; vérifie le soutien et les pions qui peuvent attaquer sa base.",
      hints: ["Aucun pion noir ne peut capturer le pion c5; le roi doit servir de bloqueur.", "Kc6 occupe la case devant le pion, mais vérifie la réponse du pion b4."],
      sequence: [
        { side: "user", uci: "c7c6", explanation: "…Kc6 place le roi devant le pion passé; vérifie si le pion de soutien peut le chasser." },
        { side: "book", uci: "b4b5", explanation: "b5 attaque le roi bloqueur; les Noirs doivent répondre à cette menace immédiate." },
        { side: "user", uci: "c6d7", explanation: "…Kd7 sort de l’attaque du pion et garde le roi près du secteur; la défense doit continuer activement." }
      ]
    },
    {
      id: "provided-active-defense-05-turn-pressure-into-target",
      kind: "method", level: "Avancé", title: "Transformer la pression subie en cible à attaquer",
      category: "Défense active · contre-jeu et cibles", program: "Cours · défense active et ressources",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Principe de contre-jeu reformulé à partir de echecs_3_-_Le_milieu_de_partie.pdf et ECHECS_CoursNo1-Milieudepartie.pdf; position et texte originaux.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Na5", "Bc2", "c5", "d4", "Qc7"], color: "w",
      question: "Les Noirs pressent le centre par …c5. Quelle méthode permet aux Blancs de réduire cette pression puis de viser une cible concrète ?",
      choices: [
        { text: "Fermer le centre si la variante tient, puis attaquer le pion avancé avec les pions voisins", correct: true },
        { text: "Attendre passivement que les Noirs choisissent toutes les ruptures", correct: false },
        { text: "Lancer les pions du roi sans calculer les lignes qui s’ouvrent", correct: false }
      ],
      principle: "Une fermeture centrale peut réduire la pression immédiate; elle est active si elle donne ensuite une cible précise à attaquer.",
      transfer: "Quand le centre est sous pression, calcule d’abord la fermeture ou l’échange; cherche ensuite la base d’un pion avancé et les moyens légaux de l’attaquer.",
      pitfall: "Compliquer n’est pas jouer au hasard : une poussée qui expose ton roi peut supprimer tes chances de défense.",
      hints: ["Le pion d4 est attaqué par le pion c5.", "d5 ferme le centre; si …c4, vérifie si b3 peut attaquer ce pion avancé."],
      sequence: [
        { side: "user", uci: "d4d5", explanation: "d5 ferme le centre et retire le pion blanc de l’attaque de c5; la réponse noire doit être recalculée." },
        { side: "book", uci: "c5c4", explanation: "…c4 avance le pion et crée une cible; les Blancs cherchent maintenant comment l’attaquer." },
        { side: "user", uci: "b2b3", explanation: "b3 attaque le pion c4; les Blancs ont transformé une pression centrale en cible concrète." }
      ]
    },
    {
      id: "provided-active-defense-06-return-material",
      kind: "method", level: "Expert", title: "Rendre du matériel pour neutraliser l’attaque et sauver la position",
      category: "Défense active · sacrifice défensif et évaluation", program: "Cours · défense active et ressources",
      author: "SupaChess Académie", book: "Parcours original inspiré des cours fournis",
      reference: "Méthode d’évaluation défensive reformulée à partir de echecs_3_-_Le_milieu_de_partie.pdf; aucune variante ni position du support n’est reprise.",
      setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nbxd2", "d5"], color: "w",
      question: "Au centre, une capture permettrait de gagner un pion mais ouvrirait des lignes. Quel est le bon critère défensif ?",
      choices: [
        { text: "Comparer le matériel rendu ou conservé avec la sécurité du roi, l’activité et les menaces après la séquence forcée", correct: true },
        { text: "Refuser toute perte matérielle, même si l’attaque devient décisive", correct: false },
        { text: "Rendre du matériel sans calculer la position obtenue", correct: false }
      ],
      principle: "Le matériel n’est qu’un facteur : rendre un pion ou échanger une pièce peut réduire l’attaque et améliorer les chances de défense, mais la variante doit être calculée.",
      transfer: "Dans une position dangereuse, compare la ligne qui garde le matériel à celle qui l’abandonne; évalue activité, menaces et sécurité à la fin de chaque ligne.",
      pitfall: "Ne présente jamais un sacrifice défensif comme automatiquement correct : il doit résoudre une menace concrète ou obtenir une compensation vérifiable.",
      hints: ["Après …d5, le pion e4 peut capturer le pion d5.", "Calcule …Cxd5 et Bxd5 avant de juger le matériel et l’activité."],
      sequence: [
        { side: "user", uci: "e4d5", explanation: "exd5 prend le pion central; cette capture doit être évaluée avec la reprise noire et les pièces exposées." },
        { side: "book", uci: "f6d5", explanation: "…Cxd5 reprend; les Blancs calculent si l’échange du cavalier réduit la pression ou l’augmente." },
        { side: "user", uci: "c4d5", explanation: "Bxd5 échange le cavalier et transforme la position; compare maintenant sécurité du roi, matériel et activité." }
      ]
    }
  ];

  root.SUPA_PROVIDED_COURSE_LESSONS = lessons;
  if (typeof module !== "undefined" && module.exports) module.exports = lessons;
})(typeof window !== "undefined" ? window : globalThis);
