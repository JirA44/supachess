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
    {"id":"calculate-before-capture","title":"Calculer avant de capturer","category":"Calcul · Sécurité tactique","level":"Expert","author":"SupaChess Académie","book":"Parcours original SupaChess","reference":"Leçon originale · Expert","setup":["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Nxd5"],"color":"w","question":"Après …Cxd5, que faut-il vérifier avant de prendre f7 ?","choices":[{"text":"Les réponses forcées du roi et les menaces sur les pièces lourdes","correct":true},{"text":"Uniquement la valeur du pion","correct":false},{"text":"Le nombre de pièces déjà développées","correct":false}],"principle":"Nxf7 crée une fourchette, mais …Kxf7 reprend le cavalier. La valeur du motif dépend des suites calculées, pas du seul coup spectaculaire.","transfer":"Avant toute combinaison, calcule les réponses forcées jusqu’à une position que tu peux évaluer; ne t’arrête pas à la première menace.","hints":["Le cavalier g5 peut prendre f7.","Calcule la reprise du roi puis cherche un échec utile."],"sequence":[{"side":"user","uci":"g5f7","explanation":"Le cavalier attaque la dame et la tour, mais il peut être repris."},{"side":"book","uci":"e8f7","explanation":"Le roi prend le cavalier: cette réponse doit être prévue."},{"side":"user","uci":"d1f3","explanation":"La dame donne échec au roi f7; évalue alors la suite et le matériel."}]}
  ];

  const LEVEL_ORDER = { "Débutant": 0, "Intermédiaire": 1, "Avancé": 2, "Expert": 3 };
  LESSONS.sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));

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
    catalog.textContent = "";
    LESSONS.forEach((lesson, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-catalog-button";
      button.setAttribute("aria-current", index === lessonIndex ? "true" : "false");
      const title = document.createElement("span");
      title.className = "lesson-catalog-title";
      title.textContent = (index + 1) + ". " + lesson.title;
      const meta = document.createElement("span");
      meta.className = "lesson-catalog-meta";
      meta.textContent = lesson.level + " · " + lesson.category + " · " + lesson.author;
      const state = document.createElement("span");
      state.className = "lesson-catalog-state";
      state.textContent = progress[lesson.id] && progress[lesson.id].completed ? "Terminée · à revoir quand tu veux" : "À découvrir";
      button.append(title, meta, state);
      button.addEventListener("click", () => loadLesson(index));
      catalog.appendChild(button);
    });
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

  function loadLesson(index) {
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
    $("lesson-title").textContent = lesson.title;
    $("lesson-goal").textContent = "Observe la position. Choisis d’abord le principe qui s’applique, puis joue les coups sur l’échiquier.";
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
    if (game.turn() !== lesson.color) return;
    const piece = game.get(square);
    if (!selectedSquare) {
      if (piece && piece.color === lesson.color) {
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
      if (piece && piece.color === lesson.color) {
        selectedSquare = square;
        boardUI.selected = square;
        boardUI.legalTargets = game.moves({ square, verbose: true }).map((candidate) => candidate.to);
      } else clearSelection();
      renderBoard();
      return;
    }
    const expected = lesson.sequence[sequenceIndex];
    const uci = move.from + move.to + (move.promotion || "");
    if (expected.side !== "user" || uci !== expected.uci) {
      game.undo();
      attempts++;
      clearSelection();
      renderBoard();
      $("lesson-feedback").textContent = "Ce coup légal ne suit pas la ligne pédagogique. Compare-le aux autres options avec Stockfish, puis vérifie les indices sur l’échiquier.";
      updateProgressLabel();
      runEngineComparison(true);
      return;
    }
    sequenceIndex++;
    clearSelection();
    boardUI.lastMove = { from: move.from, to: move.to, san: move.san };
    appendMove(move.san, "Toi");
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

    $("lesson-status").textContent = "Leçon terminée : " + lesson.title + ".";
    const explanation = $("lesson-explanation");
    explanation.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Ce que tu viens d’apprendre";
    const principle = document.createElement("p");
    principle.textContent = lesson.principle;
    explanation.append(heading, principle);

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
