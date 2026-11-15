/* Parcours original : apprendre des matchs d’auto-évaluation sans prétendre entraîner Stockfish. */
(function () {
  "use strict";
  const KEY = "supachess-stockfish-derived-lessons-v1";
  const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const PROGRAM = "SupaEngine · auto-évaluation et auto-jeu";
  const SHARED_SEQUENCE = [
    { side: "user", uci: "e2e4", explanation: "On fixe le même premier coup pour comparer des recherches depuis un cadre reproductible. e4 sert ici de repère pédagogique, pas d’affirmation qu’il soit l’unique meilleur coup." },
    { side: "book", uci: "e7e5", explanation: "La réponse noire conserve le même scénario de départ dans cet exercice." },
    { side: "user", uci: "g1f3", explanation: "On poursuit une ligne légale et connue pour disposer d’une position reproductible à analyser." }
  ];
  const lessons = [
    {
      id: "engine-derived-selfplay-01-controlled-test",
      level: "Débutant",
      title: "Comparer les temps de recherche proprement",
      category: "SupaEngine · méthode expérimentale",
      author: "SupaChess Académie",
      program: PROGRAM,
      question: "Pour comparer 0,8 s, 1,5 s et 3 s, quel protocole permet d’attribuer les différences au temps de recherche ?",
      choices: [
        { text: "Garder la même position et la même version, ne changer que le temps, puis inverser les couleurs sur plusieurs parties", correct: true },
        { text: "Changer simultanément l’ouverture, la version et le temps de réflexion", correct: false },
        { text: "Conclure à partir d’une seule partie gagnée par le moteur qui a réfléchi le plus longtemps", correct: false }
      ],
      principle: "Une comparaison utile garde les conditions constantes et ne fait varier qu’un paramètre à la fois. Une seule partie ne suffit pas à établir une supériorité.",
      transfer: "Note la position de départ, la version du moteur, le temps de recherche, le nombre de parties et les couleurs. Rejoue les mêmes conditions en inversant les camps.",
      pitfall: "Un résultat isolé peut venir de la couleur, de l’ouverture ou d’une variance de partie; il ne prouve pas une amélioration du moteur.",
      hints: ["Ne change qu’un seul paramètre.", "Répète les parties et échange les couleurs."],
      fen: START, color: "w", sequence: SHARED_SEQUENCE
    },
    {
      id: "engine-derived-selfplay-02-record-evidence",
      level: "Débutant",
      title: "Garder une trace exploitable",
      category: "SupaEngine · méthode expérimentale",
      author: "SupaChess Académie",
      program: PROGRAM,
      question: "Quelles informations permettent de refaire et vérifier un match d’auto-jeu ?",
      choices: [
        { text: "Version et réglages du moteur, temps par coup, position ou ouverture, couleurs, résultat et PGN", correct: true },
        { text: "Seulement le vainqueur", correct: false },
        { text: "Une estimation d’Elo sans les parties ni les conditions", correct: false }
      ],
      principle: "Un résultat sans conditions ni parties ne peut pas être reproduit ni audité. Le PGN permet de revoir les décisions et les positions.",
      transfer: "Après une partie, conserve son PGN et annote les moments où les candidats ou l’évaluation changent entre les temps de recherche.",
      pitfall: "Ne transforme pas un score de quelques parties en Elo certifié ou en preuve de progrès.",
      hints: ["Pense à ce qu’un autre joueur devrait connaître pour refaire exactement le test.", "Le PGN et les paramètres sont nécessaires."],
      fen: START, color: "w", sequence: SHARED_SEQUENCE
    },
    {
      id: "engine-derived-selfplay-03-time-is-not-learning",
      level: "Intermédiaire",
      title: "Distinguer recherche plus longue et apprentissage",
      category: "SupaEngine · moteur et apprentissage",
      author: "SupaChess Académie",
      program: PROGRAM,
      question: "Si le même Stockfish joue une partie avec 3 s au lieu de 0,8 s, qu’est-ce qui a changé dans le test actuel ?",
      choices: [
        { text: "Le temps disponible pour chercher; les poids du réseau ne sont pas réentraînés par la partie", correct: true },
        { text: "Le moteur a automatiquement appris une nouvelle stratégie permanente", correct: false },
        { text: "La partie a certifié une hausse de son Elo FIDE", correct: false }
      ],
      principle: "Davantage de temps peut permettre une recherche plus profonde, mais n’équivaut pas à modifier le modèle. Une vraie progression du moteur exige un entraînement puis une évaluation séparée.",
      transfer: "Compare les coups proposés à plusieurs temps sur la même position. Note ceux qui restent stables et ceux qui changent, puis vérifie la variante au lieu de conclure qu’un nouveau savoir a été acquis.",
      pitfall: "Ne confonds pas meilleure décision ponctuelle grâce à plus de calcul et apprentissage durable des poids.",
      hints: ["Le sélecteur modifie le temps de réflexion.", "Demande-toi si un nouveau réseau est créé et chargé après la partie."],
      fen: START, color: "w", sequence: SHARED_SEQUENCE
    },
    {
      id: "engine-derived-selfplay-04-compare-lines",
      level: "Intermédiaire",
      title: "Comparer les variantes, pas seulement le premier coup",
      category: "SupaEngine · analyse des variantes",
      author: "SupaChess Académie",
      program: PROGRAM,
      question: "Entre deux analyses, le premier coup candidat change. Quelle est la meilleure vérification ?",
      choices: [
        { text: "Comparer les variantes complètes, la meilleure réponse adverse et l’évaluation avec le même point de vue", correct: true },
        { text: "Choisir automatiquement la dernière suggestion affichée", correct: false },
        { text: "Ne regarder que le nom du coup sans examiner la réponse adverse", correct: false }
      ],
      principle: "Un coup candidat n’a de sens qu’avec les réponses adverses et la position obtenue. Il faut aussi garder le même point de vue pour comparer des évaluations.",
      transfer: "Pour chaque candidat, écris : mon coup → meilleure réponse adverse → ma suite. Vérifie les échecs, prises, menaces, pièces non défendues et plans des deux camps.",
      pitfall: "Des évaluations affichées du côté au trait peuvent sembler inversées d’un demi-coup à l’autre. Vérifie le point de vue avant de comparer.",
      hints: ["Une ligne ne s’arrête pas au premier coup.", "Cherche la meilleure réponse adverse, pas celle que tu espères."],
      fen: START, color: "w", sequence: SHARED_SEQUENCE
    },
    {
      id: "engine-derived-selfplay-05-validate-candidate",
      level: "Avancé",
      title: "Valider une nouvelle version contre une référence",
      category: "SupaEngine · validation de moteur",
      author: "SupaChess Académie",
      program: PROGRAM,
      question: "Après un véritable réentraînement, comment décider si une version candidate est meilleure ?",
      choices: [
        { text: "La faire jouer sur un ensemble varié contre une version de référence, avec couleurs alternées et conditions identiques, puis examiner les résultats et les régressions", correct: true },
        { text: "La garder si elle gagne une partie contre elle-même", correct: false },
        { text: "La déclarer meilleure parce que son réseau a été entraîné, sans tournoi de contrôle", correct: false }
      ],
      principle: "Une version candidate doit être comparée à une référence stable sur des positions variées. Les résultats doivent être répétés et les régressions examinées avant tout remplacement.",
      transfer: "Sépare les positions de validation de celles utilisées pour l’entraînement. Publie le nombre de parties, les couleurs, les cadences et les résultats avec leurs limites.",
      pitfall: "Tester seulement sur les positions d’entraînement peut masquer le surapprentissage. Une victoire isolée ne suffit pas.",
      hints: ["Il faut une référence inchangée.", "Inverse les couleurs et utilise des positions que le moteur n’a pas vues pendant l’entraînement."],
      fen: START, color: "w", sequence: SHARED_SEQUENCE
    }

    {
      id: "engine-derived-selfplay-06-identify-the-threat",
      level: "Débutant",
      title: "Identifier précisément ce qui est attaqué",
      category: "Signaux · menaces et défense",
      author: "SupaChess Académie",
      program: "Signaux · défendre ou contre-attaquer",
      fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
      color: "w",
      question: "Après 1. e4 e5 2. Cf3 Cc6 3. Fb5 a6, quelle pièce est directement attaquée et par quoi ?",
      choices: [
        { text: "Le fou blanc en b5 est attaqué par le pion noir a6", correct: true },
        { text: "La dame blanche est attaquée par le cavalier c6", correct: false },
        { text: "Le roi blanc est en échec", correct: false }
      ],
      principle: "Nomme la pièce visée, l’attaquant et la menace concrète. Ici le pion a6 attaque le fou b5; il n’y a pas échec.",
      transfer: "Avant de défendre, vérifie aussi si la pièce peut capturer l’attaquant, se déplacer, être échangée ou créer une menace plus urgente.",
      pitfall: "Ne confonds pas une pièce attaquée avec une pièce déjà perdue : compte les réponses légales et les suites après chaque échange.",
      hints: ["Regarde les cases d’attaque du pion noir a6.", "Un pion attaque en diagonale."],
      sequence: [
        { side: "user", uci: "b5a4", explanation: "Ba4 met le fou hors de l’attaque du pion a6. Il faudra quand même examiner la suite noire." },
        { side: "book", uci: "b7b5", explanation: "…b5 attaque à nouveau le fou : une défense ne termine pas le calcul." },
        { side: "user", uci: "a4b3", explanation: "Bb3 met le fou à l’abri de cette nouvelle poussée. La séquence montre pourquoi il faut recalculer après chaque coup adverse." }
      ]
    },
    {
      id: "engine-derived-selfplay-07-recalculate-after-defense",
      level: "Intermédiaire",
      title: "Après la défense, recalculer la suite",
      category: "Signaux · menaces et défense",
      author: "SupaChess Académie",
      program: "Signaux · défendre ou contre-attaquer",
      fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
      color: "w",
      question: "Tu réponds à l’attaque du fou par Ba4 et les Noirs jouent …b5. Que fais-tu maintenant ?",
      choices: [
        { text: "Recommencer le diagnostic : identifier la nouvelle attaque et calculer le meilleur coup noir après chacune de mes réponses", correct: true },
        { text: "Considérer le fou définitivement en sécurité parce qu’il a déjà bougé une fois", correct: false },
        { text: "Jouer immédiatement une contre-attaque sans vérifier si le fou peut être capturé", correct: false }
      ],
      principle: "Chaque réponse adverse crée une nouvelle position. Une pièce peut être attaquée plusieurs fois de suite; la défense doit être réévaluée à chaque demi-coup.",
      transfer: "Après tout coup de défense, demande-toi : quelle est sa meilleure réponse? Mon coup laisse-t-il une autre pièce attaquée? Puis-je sortir, échanger, interposer ou contre-attaquer?",
      pitfall: "Un plan de défense n’est pas une suite calculée. Ne t’arrête pas au premier coup de l’adversaire.",
      hints: ["Dans la ligne montrée, le pion b7 avance en b5.", "Le fou en a4 est-il encore attaqué? Trouve une case de repli légale."],
      sequence: [
        { side: "user", uci: "b5a4", explanation: "Le fou s’écarte de la première attaque." },
        { side: "book", uci: "b7b5", explanation: "Les Noirs attaquent de nouveau le fou; il faut relancer l’analyse." },
        { side: "user", uci: "a4b3", explanation: "Bb3 répond à la nouvelle menace. Après ce coup, cherche encore la meilleure suite noire." }
      ]
    },
    {
      id: "engine-derived-selfplay-08-defend-or-counterattack",
      level: "Avancé",
      title: "Défendre, échanger ou contre-attaquer ?",
      category: "Signaux · menaces et défense",
      author: "SupaChess Académie",
      program: "Signaux · défendre ou contre-attaquer",
      fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
      color: "w",
      question: "Le fou b5 est attaqué par a6. Quel critère permet de choisir entre le repli Ba4, l’échange Bxc6 et une contre-attaque ?",
      choices: [
        { text: "Calculer la meilleure réponse adverse après chaque candidat, puis comparer sécurité, échanges et menaces créées", correct: true },
        { text: "Toujours capturer l’attaquant pour supprimer la menace", correct: false },
        { text: "Toujours contre-attaquer, même si l’adversaire peut prendre le fou avec tempo", correct: false }
      ],
      principle: "Il n’existe pas de réponse automatique. Le repli, l’échange ou la contre-attaque sont des candidats à calculer selon les conséquences concrètes.",
      transfer: "Pour un échange de prises, note chaque prise légale dans l’ordre, les pièces restantes, leur valeur et les menaces qui subsistent. Des défenseurs plus chers ne peuvent pas toujours reprendre sans coût.",
      pitfall: "Compter seulement trois attaquants contre deux défenseurs ne suffit pas : l’ordre des prises, les clouages, les échecs et la valeur des pièces changent le bilan.",
      hints: ["Compare au moins Ba4 et Bxc6.", "Après Bxc6, demande-toi si …dxc6 est légal et quel matériel disparaît."],
      sequence: [
        { side: "user", uci: "b5c6", explanation: "Bxc6 est un candidat, mais il faut vérifier la reprise noire avant de conclure." },
        { side: "book", uci: "d7c6", explanation: "…dxc6 reprend le fou. L’échange se juge sur la valeur des deux pièces et les conséquences positionnelles, pas sur le seul fait d’avoir supprimé l’attaquant." }
      ]
    },
  ];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    const list = Array.isArray(saved) ? saved : [];
    const ids = new Set(list.map((lesson) => lesson && lesson.id).filter(Boolean));
    let changed = false;
    for (const lesson of lessons) {
      if (!ids.has(lesson.id)) {
        list.push(lesson);
        ids.add(lesson.id);
        changed = true;
      }
    }
    if (changed) localStorage.setItem(KEY, JSON.stringify(list));
  } catch (_) {
    // Si le stockage local est indisponible, on ne prétend pas que le parcours est ajouté.
  }
})();
