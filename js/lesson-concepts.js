(() => {
  "use strict";

  const BANDS = [
    { key: "foundation", label: "Fondations", elo: "≈ 600–999", level: "Débutant" },
    { key: "developing", label: "Bases solides", elo: "≈ 1000–1399", level: "Intermédiaire" },
    { key: "intermediate", label: "Intermédiaire", elo: "≈ 1400–1799", level: "Intermédiaire" },
    { key: "advanced", label: "Avancé", elo: "≈ 1800–2199", level: "Avancé" },
    { key: "expert", label: "Expert", elo: "≈ 2200+", level: "Expert" }
  ];
  const FAMILIES = [
    { id: "rules", label: "Règles et fondamentaux", items: [
      ["legal-moves","Coups légaux",0,"Un coup légal respecte le déplacement de la pièce et ne laisse pas son roi en échec.","Avant de jouer, vérifie le roi, les pièces clouées et les cases d’arrivée.","Jouer un coup possible pour la pièce sans vérifier la sécurité du roi.","Repars de la règle du roi : il ne peut jamais rester en échec.","règle"],
      ["check-response","Répondre à un échec",0,"Un échec impose une réponse légale immédiate : bouger le roi, capturer l’attaquant ou interposer une pièce.","Liste les cases de fuite, les captures de l’attaquant et les interpositions légales.","Répondre à une autre menace pendant que son roi reste en échec.","Commence par identifier la pièce qui donne échec et ses lignes d’attaque.","échec"],
      ["checkmate","Échec et mat",0,"Le mat est un échec auquel aucune réponse légale ne met fin.","Cherche toutes les sorties du roi, prises et interpositions.","Confondre un roi très menacé avec un mat déjà forcé.","Un mat exige un échec et l’absence de toute défense légale.","mat"],
      ["stalemate","Pat",1,"Le pat survient quand le joueur au trait n’est pas en échec mais n’a aucun coup légal; la partie est nulle.","Vérifie le trait, l’échec et tous les coups légaux avant de conclure.","Chercher un mat sans contrôler si l’adversaire garde un coup légal.","La différence décisive est la présence ou l’absence d’échec.","pat"],
      ["castling-rules","Conditions du roque",0,"Le roque est légal si le roi et la tour concernés n’ont pas bougé, si le chemin est libre et si le roi ne traverse aucune case attaquée.","Contrôle les cases traversées et la destination du roi, pas seulement la case de départ.","Roquer à travers une case contrôlée ou après le déplacement antérieur du roi.","Vérifie séparément les droits, le chemin et les cases attaquées.","roque"],
      ["en-passant","Prise en passant",1,"La prise en passant n’est possible qu’immédiatement après l’avance de deux cases d’un pion adverse qui passe à côté du tien.","Repère le pion qui vient d’avancer de deux cases et joue la capture au coup suivant.","Attendre un tour ou croire que le pion capturé est sur la case d’arrivée.","Le droit disparaît dès que tu joues un autre coup.","prise en passant"],
      ["promotion","Promotion du pion",0,"Un pion arrivé sur la dernière rangée est promu en dame, tour, fou ou cavalier.","Compare promotion en dame et promotions mineures qui donnent échec ou évitent le pat.","Promouvoir automatiquement en dame sans vérifier le mat, le pat ou une fourchette.","Calcule la position obtenue après la promotion et la réponse adverse.","promotion"],
      ["draw-rules","Nulle et conditions de partie",1,"Une nulle peut venir du pat, d’un accord, d’une répétition, de la règle des coups sans prise ni avance de pion, ou d’un matériel insuffisant.","Vérifie les répétitions, les possibilités de mat et les droits selon la cadence.","Continuer un plan gagnant sans reconnaître une nulle forcée ou réclamer sans condition remplie.","Identifie la règle exacte et le nombre de coups ou répétitions pertinents.","partie nulle"]
    ]},
    { id: "opening", label: "Ouverture", items: [
      ["develop-pieces","Développer les pièces",0,"Le développement amène rapidement les pièces mineures sur des cases actives et utiles.","Compte les pièces sorties et observe leurs cases contrôlées.","Faire plusieurs coups avec une même pièce sans nécessité.","Développe une pièce en gagnant du contrôle ou en créant une menace sûre.","Développement"],
      ["center-control","Contrôler le centre",0,"Le centre permet aux pièces de changer d’aile et soutient des ruptures de pions.","Compare le contrôle des cases e4, d4, e5 et d5 par les deux camps.","Pousser un pion central sans calculer les prises et les cases affaiblies.","Évalue le contrôle réel par les pièces et les pions, pas seulement l’occupation.","centre"],
      ["king-safety","Mettre le roi en sécurité",0,"Le roque met souvent le roi à l’abri et active une tour, mais le bon moment dépend de la position.","Observe les lignes ouvertes, les menaces d’échec et les pions du roque.","Lancer les pions devant le roi sans calculer l’ouverture de lignes.","Vérifie si le roi peut roquer et si l’adversaire menace une tactique avant.","Sécurité du roi"],
      ["opening-tempi","Gagner des tempos utiles",1,"Un tempo est particulièrement utile quand il développe une pièce, attaque une cible ou force une réponse.","Repère les coups qui réalisent deux fonctions sans créer de faiblesse.","Poursuivre une pièce adverse sans développer ni améliorer sa position.","Cherche une menace qui sert aussi le développement.","Gain de temps"],
      ["queen-development","Sortir la dame au bon moment",1,"La dame est puissante mais peut perdre des tempos si elle sort avant que les pièces adverses puissent la chasser.","Vérifie les cases de fuite de la dame et les coups de développement qui la menacent.","Sortir la dame pour gagner un pion sans calculer les attaques de tempo.","Demande-toi si la dame a une cible durable et une retraite sûre.","dame"],
      ["connect-rooks","Relier les tours",1,"Le roque et le développement des pièces mineures libèrent souvent la première rangée pour coordonner les tours.","Vérifie si les pièces entre les tours ont bougé et si une colonne est exploitable.","Placer une tour sur une colonne sans plan d’entrée ni cible.","Cherche une colonne ouverte ou une défense à renforcer avant d’activer les tours.","tour"],
      ["pawn-center","Choisir une structure centrale",2,"La structure de pions décide des cases, des ruptures et des diagonales disponibles aux pièces.","Compare les pions centraux, leur soutien et les échanges qui peuvent les transformer.","Avancer tous les pions centraux sans protéger les cases qu’ils abandonnent.","Choisis une structure qui laisse tes pièces coordonnées et ton roi sûr.","structure"],
      ["opening-threats","Répondre au plan adverse en ouverture",1,"Les principes d’ouverture s’adaptent aux menaces concrètes; la sécurité passe avant une règle abstraite.","Après chaque coup adverse, demande ce qu’il attaque et ce qu’il prépare.","Appliquer mécaniquement un principe en laissant une pièce ou le roi en danger.","Regarde les échecs, captures et menaces adverses avant ton développement calme.","Anticiper"]
    ]},
    { id: "tactics-a", label: "Motifs tactiques · attaques doubles", items: [
      ["hanging-piece","Pièce en prise",0,"Une pièce non protégée ou attaquée peut être capturée si la séquence est favorable.","Compte attaquants et défenseurs, puis calcule l’ordre des prises.","Supposer qu’une pièce est perdue uniquement parce qu’elle est attaquée une fois.","Vérifie les reprises et les pièces qui peuvent intervenir entre les captures.","pièces en prise"],
      ["fork","Fourchette",0,"Une fourchette attaque simultanément plusieurs cibles; un échec-forchette limite souvent les réponses.","Cherche une case d’où le cavalier, pion, dame ou roi menace deux cibles.","Annoncer un gain avant d’avoir calculé les réponses et les reprises.","Identifie les cibles attaquées et la meilleure réponse adverse.","Fourchette"],
      ["absolute-pin","Clouage absolu",2,"Une pièce est absolument clouée si son déplacement exposerait son roi à un échec.","Repère la ligne entre attaquant, pièce intermédiaire et roi.","Traiter la pièce clouée comme immobile sans vérifier les règles et la tactique.","Vérifie quel roi se trouve derrière la pièce visée.","Clouage"],
      ["relative-pin","Clouage relatif",2,"Un clouage relatif vise une pièce de valeur derrière la pièce attaquée; celle-ci peut parfois bouger au prix d’un coût.","Repère la pièce importante derrière le défenseur et les conséquences d’un déplacement.","Confondre une pression sur la dame avec une interdiction légale de bouger.","Calcule la prise de la cible située derrière au lieu de supposer le résultat.","clouage"],
      ["skewer","Enfilade",2,"Une enfilade attaque une cible de grande valeur qui, en se déplaçant, découvre une cible derrière elle.","Cherche deux pièces alignées avec la plus précieuse devant.","Manquer le gain derrière une pièce forcée à se déplacer.","Calcule l’échec ou l’attaque qui force la première pièce à quitter la ligne.","Enfilade"],
      ["discovered-attack","Attaque à la découverte",2,"Une pièce qui s’écarte révèle l’attaque d’une pièce alignée derrière elle.","Cherche quelle ligne de fou, tour ou dame s’ouvre après le déplacement.","Ne considérer que la pièce déplacée et oublier l’attaque révélée.","Évalue séparément la menace de la pièce qui bouge et celle qui se découvre.","attaque découverte"],
      ["double-check","Échec double",3,"L’échec double provient de deux pièces qui donnent échec simultanément; le roi doit généralement bouger.","Vérifie que la pièce déplacée et la ligne découverte attaquent toutes deux le roi.","Chercher une interposition qui ne pare qu’un seul des deux échecs.","Repère les deux attaquants avant d’examiner les cases de fuite.","échec double"],
      ["back-rank","Faiblesse de dernière rangée",1,"Un roi enfermé par ses propres pions peut être maté sur la dernière rangée si ses défenseurs sont détournés.","Observe les cases de fuite du roi et les pièces qui peuvent donner échec sur la rangée.","Ignorer le besoin d’une case de fuite ou d’une pièce défensive supplémentaire.","Avant un échange, vérifie si le roi pourra répondre à un échec sur sa rangée.","dernière rangée"]
    ]},
    { id: "tactics-b", label: "Motifs tactiques · déviation et mats", items: [
      ["remove-defender","Éliminer le défenseur",2,"Capturer ou éloigner le défenseur d’une cible peut rendre possible une tactique qui échouait auparavant.","Compte les défenseurs de la cible avant et après l’échange envisagé.","Prendre la pièce défensive sans vérifier la reprise ou une défense de remplacement.","Identifie d’abord la cible, puis le défenseur qui la protège.","défenseur"],
      ["deflection","Déviation",3,"Une déviation force une pièce à quitter une tâche défensive ou une case essentielle.","Repère une pièce qui protège plusieurs points critiques et une menace qui la détourne.","Confondre une attaque sur une pièce avec une déviation réellement forcée.","La tactique doit gagner quelque chose après le déplacement forcé du défenseur.","déviation"],
      ["decoy","Attraction",3,"Une attraction attire une pièce adverse sur une case où elle devient vulnérable ou bloque son propre roi.","Cherche une offre qui force la pièce adverse vers une case défavorable.","Sacrifier du matériel sans suite forcée ni compensation vérifiable.","Calcule la position après l’acceptation et après le refus du sacrifice.","sacrifice"],
      ["overloaded-defender","Défenseur surchargé",3,"Un défenseur surchargé protège plusieurs cibles et ne peut répondre à toutes les menaces.","Liste toutes les missions d’une même pièce défensive.","Croire qu’une défense est suffisante sans vérifier les menaces simultanées.","Crée une deuxième menace sur une autre cible du même défenseur.","surcharge"],
      ["interference","Interférence",4,"Une interférence coupe la coordination entre deux pièces adverses qui se défendent ou se soutiennent.","Repère une ligne de défense et une case où une pièce peut la bloquer.","Jouer un blocage sans cible concrète ni conséquence sur la coordination.","Nomme les deux pièces dont la liaison est interrompue.","interférence"],
      ["clearance","Dégagement de ligne ou de case",3,"Un dégagement libère une ligne, une case ou une diagonale au profit d’une autre pièce.","Observe les lignes actuellement bloquées par tes propres pièces.","Déplacer une pièce sans identifier l’attaque qui sera ouverte derrière elle.","Avant de jouer, imagine la ligne après le départ de la pièce bloqueuse.","dégagement"],
      ["zwischenzug","Coup intermédiaire",3,"Un coup intermédiaire change l’ordre attendu des échanges par une menace plus urgente, souvent un échec.","Dans une suite de prises, cherche un échec ou une attaque avant la reprise automatique.","Reprendre immédiatement sans examiner les coups forcing disponibles.","Demande si l’adversaire doit répondre à une menace plus urgente.","Coup intermédiaire"],
      ["mating-net","Réseau de mat et mat étouffé",4,"Un réseau de mat contrôle les cases de fuite avant le coup final; le mat étouffé utilise l’enfermement du roi par ses propres pièces.","Cartographie les sorties du roi et les pièces qui les contrôlent.","Chercher seulement l’échec final sans préparer les cases de fuite.","Pour chaque case de fuite, identifie la pièce qui l’empêche ou peut la contrôler.","mat étouffé"]
    ]},
    { id: "calculation", label: "Calcul et réflexion", items: [
      ["cct","Échecs, captures, menaces",1,"Examiner les échecs, captures et menaces donne une première liste de coups forcing.","Après le coup adverse, énumère les coups légaux qui obligent une réponse.","Chercher uniquement ton plan sans vérifier les coups forcing adverses.","Commence par les échecs, puis les prises, puis les menaces.","coups candidats"],
      ["candidate-moves","Coups candidats",1,"Des candidats comparables évitent de s’arrêter au premier coup plausible.","Note deux ou trois coups et leurs réponses adverses principales.","Choisir le premier coup venu sans le comparer à une défense meilleure.","Un candidat vaut par la position obtenue contre la réponse la plus forte.","coups candidats"],
      ["best-reply","Meilleure réponse adverse",1,"Un calcul fiable suppose que l’adversaire choisira sa défense la plus gênante, pas celle qui arrange ton plan.","Pour chaque candidat, demande quelle réponse change le plus l’évaluation.","Calculer une variante en espérant une réponse passive.","Réfute ton idée avant de la jouer en cherchant une ressource adverse.","réponse adverse"],
      ["forcing-lines","Calcul des variantes forcées",2,"Les échecs, prises et menaces directes réduisent les choix et rendent les variantes plus calculables.","Repère à quel moment les coups deviennent libres et où l’évaluation doit être refaite.","Continuer une longue variante après que la position est devenue calme sans la réévaluer.","Calcule jusqu’à une position stable, puis juge roi, matériel et activité.","Calcul"],
      ["exchange-count","Compter les échanges",1,"Compter les prises dans leur ordre révèle les pièces qui restent et les tactiques intermédiaires.","Écris ou visualise chaque reprise et le matériel après la séquence.","S’arrêter après la première capture en supposant que l’échange est fini.","Compte les attaquants, défenseurs et coups intermédiaires jusqu’à la dernière reprise.","calcul"],
      ["visualization","Visualiser sans bouger les pièces",2,"La visualisation conserve les cases, pièces et lignes après plusieurs demi-coups imaginés.","Suis une ligne courte et vérifie la position finale pièce par pièce.","Mélanger la position actuelle et une variante candidate.","Annonce les coups, puis reconstruis les changements de matériel et de cases.","Calcul profond"],
      ["blunder-check","Vérification anti-gaffe",1,"Avant de jouer, vérifier échecs, prises, menaces et pièces non défendues réduit les erreurs directes.","Après avoir choisi le coup, regarde la réponse adverse la plus forcing.","Jouer immédiatement quand une pièce ou le roi reste exposé.","Fais une dernière vérification de sécurité avant de toucher la pièce.","Vérifier les pièces en prise"],
      ["evaluate-end-position","Évaluer la position finale calculée",2,"Une variante se juge par le matériel, le roi, l’activité, les pions et les menaces qui restent.","À la fin de la ligne, compare les éléments concrets des deux camps.","Conclure qu’une combinaison est bonne parce qu’elle semble active.","Évalue les deux camps après la dernière réponse, pas au milieu de la combinaison.","évaluer"]
    ]},
    { id: "strategy", label: "Stratégie et position", items: [
      ["activity-vs-material","Matériel contre activité",2,"Un déficit matériel peut être compensé temporairement par l’activité, l’initiative ou des menaces concrètes.","Compare les pièces actives, le roi, les cibles et la durée de l’initiative.","Sacrifier sans ligne forcing ni avantage durable vérifiable.","Nomme la compensation et le plan qui la maintient.","activité"],
      ["space","Espace",2,"L’espace limite les cases adverses et donne à tes pièces plus de possibilités, mais peut aussi créer des cibles.","Compare les cases disponibles et les pièces comprimées.","Avancer des pions pour gagner de l’espace sans protéger les cases laissées derrière.","Regarde si tes pièces peuvent soutenir l’espace et si l’adversaire peut le miner.","espace"],
      ["weak-square","Cases faibles et avant-postes",2,"Une case faible ne peut pas être contestée efficacement par les pions; une pièce peut s’y installer durablement.","Repère les cases qui ne peuvent plus être contrôlées par un pion adverse.","Placer un cavalier sur une case avancée sans cible ni soutien.","Vérifie le soutien par les pions et les moyens adverses de chasser la pièce.","case forte"],
      ["open-file","Colonnes ouvertes",2,"Une colonne ouverte permet aux tours d’entrer dans la position si elles peuvent l’occuper et viser une cible.","Repère les colonnes sans pions et les cases d’infiltration disponibles.","Placer une tour sur une colonne simplement parce qu’elle est ouverte.","Trouve une cible ou une case d’entrée avant de doubler les tours.","colonne"],
      ["good-bad-bishop","Fou bon ou mauvais",3,"La qualité d’un fou dépend notamment de la couleur de ses pions et des cases qu’il peut atteindre.","Observe si tes pions bloquent les diagonales du fou ou si celui-ci attaque des faiblesses.","Échanger automatiquement le fou sans comparer les pièces et la structure.","Évalue les pions, diagonales et cibles avant l’échange.","fou"],
      ["bishop-pair","Paire de fous",3,"Deux fous peuvent contrôler les deux couleurs et devenir particulièrement forts dans une position ouverte.","Évalue si le centre peut s’ouvrir et si les cavaliers adverses ont des cases fortes.","Conserver la paire sans tenir compte des pions bloqués et des faiblesses.","La paire gagne en valeur quand les lignes s’ouvrent et que les cibles existent.","paire de fous"],
      ["worst-piece","Améliorer la pièce la moins active",2,"Améliorer une pièce inactive renforce la position sans créer nécessairement une menace immédiate.","Compare l’activité et le rôle de chaque pièce, puis choisis celle qui contribue le moins.","Lancer une attaque alors qu’une pièce reste hors jeu.","Cherche une route d’amélioration sûre pour ta pièce la moins utile.","Améliorer la pièce"],
      ["prophylaxis","Prophylaxie et restriction",3,"La prophylaxie anticipe le plan adverse et limite ses options avant qu’il ne devienne concret.","Demande ce que l’adversaire veut faire et quelle case ou rupture soutient son plan.","Jouer seulement pour son idée sans remarquer le plan adverse.","Prévenir une idée utile peut être meilleur qu’une menace immédiate.","anticiper l’adversaire"]
    ]},
    { id: "pawn-play", label: "Pions et structures", items: [
      ["isolated-pawn","Pion isolé",2,"Un pion isolé n’a pas de pion voisin sur les colonnes adjacentes pour le soutenir.","Repère la case devant le pion, les pièces qui le bloquent et les colonnes ouvertes.","Défendre passivement le pion sans chercher activité ou échange favorable.","Utilise ses cases d’activité et surveille la case de blocage.","pion isolé"],
      ["doubled-pawns","Pions doublés",2,"Des pions doublés partagent une colonne et peuvent perdre de la mobilité, mais ouvrir une ligne ou contrôler des cases.","Évalue leur mobilité, les colonnes ouvertes et les cases faibles qu’ils créent.","Considérer automatiquement les pions doublés comme perdus.","Mesure leurs faiblesses et leurs avantages concrets dans la position.","pions doublés"],
      ["backward-pawn","Pion arriéré",3,"Un pion arriéré ne peut pas avancer sans être perdu ou créer une faiblesse, et sa case devant peut devenir une cible.","Cherche si le pion peut avancer et si une pièce adverse peut occuper la case devant lui.","Attaquer le pion sans pouvoir l’atteindre ou sans empêcher son avance.","La case de blocage peut compter autant que le pion lui-même.","pion arriéré"],
      ["passed-pawn","Pion passé",2,"Un pion passé n’a plus de pion adverse devant lui ni sur les colonnes adjacentes pouvant l’arrêter.","Vérifie le chemin vers la promotion et les cases de blocage du roi adverse.","Pousser le pion sans calculer le roi et les pièces qui peuvent l’arrêter.","Calcule la course et l’aide de ton roi avant chaque poussée.","pion passé"],
      ["outside-passer","Pion passé éloigné",3,"Un pion passé éloigné peut détourner le roi adverse loin d’une autre aile.","Compare la distance des rois et les objectifs ailleurs sur l’échiquier.","Pousser le pion sans vérifier si l’adversaire peut le capturer à temps.","Évalue le rôle de diversion autant que la promotion directe.","pion passé"],
      ["pawn-chain","Chaîne de pions",2,"Une chaîne de pions contrôle des cases dans une direction et a souvent une base vulnérable.","Repère la pointe, la base et les cases non contrôlées par la chaîne.","Attaquer la pointe sans regarder si la base est la faiblesse réelle.","Cherche le point d’appui ou la base que l’adversaire ne peut pas défendre facilement.","chaîne de pions"],
      ["pawn-majority","Majorité et minorité de pions",3,"Une majorité peut créer un pion passé; une minorité peut servir à provoquer une faiblesse ou une structure cible.","Compte les pions sur chaque aile et calcule les échanges qui peuvent en créer un passé.","Avancer une majorité sans soutien ni calcul des échanges.","Détermine quel pion peut devenir passé après les échanges.","majorité"],
      ["pawn-break","Rupture de pions",2,"Une rupture échange la structure pour ouvrir des lignes ou créer des cases à tes pièces.","Calcule les prises après la poussée et observe quelles lignes s’ouvrent.","Ouvrir le centre quand tes pièces sont moins actives ou ton roi moins sûr.","La rupture sert les pièces mieux placées; calcule chaque reprise.","Rupture centrale"]
    ]},
    { id: "attack-defense", label: "Attaque et défense", items: [
      ["king-attack","Attaque contre le roi",2,"Une attaque réussit plus souvent quand plusieurs pièces peuvent rejoindre le roi et que les lignes sont ouvertes.","Compte les pièces participantes, les cases de fuite et les défenseurs proches du roi.","Attaquer avec une seule pièce ou ouvrir des lignes contre son propre roi.","Amène assez de pièces et vérifie la réponse défensive la plus forte.","attaque du roi"],
      ["attacker-defender","Attaquants et défenseurs",1,"Le nombre, la valeur et l’ordre des attaquants et défenseurs déterminent si une cible peut être prise.","Compte chaque attaquant et défenseur, puis vérifie les clouages et intermédiaires.","Conclure qu’une cible est gagnée par simple comptage sans calculer la séquence.","Vérifie qui capture en premier et quelle pièce reprend ensuite.","défense"],
      ["sacrifice","Sacrifice justifié",3,"Un sacrifice doit fournir une compensation calculable : mat, attaque durable, promotion ou gain matériel ultérieur.","Cherche la suite forcée et évalue la position après l’acceptation et le refus.","Sacrifier parce qu’un coup paraît brillant sans vérifier la meilleure défense.","Calcule plusieurs réponses adverses, pas seulement la prise attendue.","sacrifice"],
      ["defensive-resource","Ressources défensives",2,"Une défense active peut parer une menace en créant à son tour une menace ou en échangeant l’attaquant clé.","Cherche les échecs, contre-menaces, échanges et pièces défensives disponibles.","Défendre passivement une cible en laissant l’adversaire améliorer son attaque.","Cherche une défense qui réduit les menaces et améliore ta position.","défense"],
      ["counterattack","Contre-attaque",3,"Une contre-attaque répond à une menace par une menace qui oblige l’adversaire à changer de priorité.","Repère une cible ou un roi adverse exposé pendant qu’il attaque.","Laisser une menace de mat sans défense en espérant une contre-menace insuffisante.","Compare l’urgence de la menace adverse et la tienne.","contre-attaque"],
      ["exchange-attackers","Échanger l’attaquant dangereux",3,"Échanger une pièce adverse très active peut réduire une attaque ou neutraliser une case forte.","Identifie la pièce adverse qui crée le plus de menaces et les échanges possibles.","Échanger automatiquement la meilleure pièce adverse sans calculer les conséquences.","Évalue ce que l’échange laisse comme structure et comme pièces actives.","échange"],
      ["opposite-castling","Attaques avec roques opposés",3,"Quand les rois sont sur des ailes opposées, les poussées de pions peuvent ouvrir des lignes contre le roi adverse mais aussi contre le tien.","Compare le rythme, les lignes ouvertes et les ressources défensives des deux camps.","Pousser automatiquement les pions sans calculer les ouvertures de lignes et les échecs.","Estime qui arrive le premier et quelle aile peut rester protégée.","roques opposés"],
      ["perpetual-fortress","Échec perpétuel et forteresse",4,"Une défense peut sauver la nulle par des échecs répétés ou une forteresse que l’adversaire ne peut pénétrer.","Cherche les checks répétables et les cases d’entrée qui restent contrôlées.","Abandonner une défense de nulle ou poursuivre un gain qui n’existe plus.","Vérifie si le roi peut se cacher et si la forteresse peut être brisée.","forteresse"]
    ]},
    { id: "endgames", label: "Finales", items: [
      ["opposition","Opposition des rois",1,"En finale roi et pion, l’opposition donne souvent le trait au roi adverse pour lui céder le passage.","Place les rois sur la même ligne avec un nombre impair de cases entre eux.","Avancer le roi sans calculer qui devra céder l’opposition.","Compte les cases et considère le trait avant d’approcher le pion.","opposition"],
      ["key-squares","Cases clés",2,"Les cases clés indiquent où le roi doit parvenir pour soutenir la promotion d’un pion.","Repère les cases devant le pion qui garantissent la progression selon sa rangée.","Pousser le pion avant d’avoir obtenu l’accès du roi à une case clé.","Fais avancer le roi vers les cases nécessaires, pas seulement vers le pion.","case clé"],
      ["square-rule","Règle du carré",1,"La règle du carré estime si le roi peut rattraper un pion passé sans aide supplémentaire.","Construis mentalement le carré du pion jusqu’à la dernière rangée et compare la position du roi.","Oublier le trait, le premier pas de deux cases ou une pièce qui bloque.","Trace le carré depuis la case du pion et vérifie le trait.","règle du carré"],
      ["zugzwang","Zugzwang",3,"Le zugzwang est une position où toute obligation de jouer détériore la position.","Repère une position où les coups utiles sont épuisés et les cases doivent être cédées.","Jouer trop tôt et donner à l’adversaire le trait dans une position favorable.","Cherche une attente ou triangulation pour transférer le trait.","zugzwang"],
      ["triangulation","Triangulation",4,"La triangulation utilise un détour du roi pour revenir à une position avec le trait transféré à l’adversaire.","Compare les routes du roi et le nombre de coups nécessaires pour revenir à une case.","Marcher directement et laisser le bon trait à l’adversaire.","Calcule les cases intermédiaires qui changent l’opposition.","triangulation"],
      ["king-activity-endgame","Roi actif en finale",1,"En finale, le roi devient une pièce active qui peut soutenir les pions et couper le roi adverse.","Compare le chemin du roi vers le centre et les pions passés.","Garder le roi passif derrière ses pions par réflexe d’ouverture.","Active le roi sans abandonner une tactique immédiate.","finale"],
      ["rook-behind-passer","Tour derrière le pion passé",2,"Une tour est souvent efficace derrière un pion passé, qu’il soit ami ou adverse, car elle soutient ou attaque sa progression.","Compare les cases derrière le pion et les lignes d’échec de la tour.","Placer la tour devant le pion sans tenir compte de l’activité et des échecs latéraux.","Cherche la position de tour qui garde le pion sous contrôle tout en restant active.","tour et pion"],
      ["lucena-philidor","Positions de Lucena et Philidor",4,"Ces positions de tour illustrent des méthodes fondamentales pour gagner ou tenir certaines finales de tour et pion.","Identifie la position du roi, du pion, de la tour et la rangée de défense.","Appliquer une technique connue à une position qui ne remplit pas ses conditions.","Compare la structure exacte aux conditions de la méthode avant de la jouer.","finales de tours"]
    ]},
    { id: "conversion-training", label: "Évaluation, conversion et entraînement", items: [
      ["initiative-material","Initiative contre matériel",2,"L’initiative peut compenser temporairement un pion ou une pièce si les menaces sont concrètes et continuent.","Évalue les menaces forcées, la sécurité du roi et la durée de l’activité.","Croire qu’une attaque vaut automatiquement le matériel sacrifié.","Calcule ce qui reste quand l’adversaire pare la première menace.","initiative"],
      ["convert-extra-material","Convertir un avantage matériel",2,"Convertir consiste à réduire le contre-jeu et améliorer ses pièces sans rendre le matériel inutilement.","Cherche les échanges favorables, les faiblesses et les menaces de contre-attaque.","Forcer un mat immédiat alors qu’un gain simple et sûr existe.","Stabilise la position, puis augmente progressivement l’avantage.","conversion"],
      ["simplify-winning","Simplifier au bon moment",2,"Les échanges aident si la finale restante est gagnante et que les menaces adverses disparaissent.","Évalue la finale après l’échange et les pions qui restent.","Échanger les pièces sans calculer si la finale peut être nulle.","Compare la position finale plutôt que le nombre de pièces échangées.","simplifier"],
      ["avoid-counterplay","Réduire le contre-jeu",2,"Un avantage devient plus facile à convertir si l’adversaire n’obtient pas de menace active ou de pion passé dangereux.","Repère la meilleure ressource pratique adverse avant de poursuivre ton plan.","Gagner un pion en autorisant une attaque ou une course de pion décisive.","Demande-toi quel contre-jeu l’adversaire cherche à créer.","contre-jeu"],
      ["evaluate-imbalances","Évaluer les déséquilibres",3,"L’évaluation compare matériel, rois, activité, espace, structure et sécurité plutôt qu’un seul facteur.","Nomme les avantages et faiblesses durables de chaque camp.","Dire qu’une position est gagnante en comptant seulement les pions.","Évalue les éléments des deux camps et les changements prévus par la suite.","évaluation"],
      ["plan-selection","Choisir un plan cohérent",2,"Un plan relie une faiblesse ou un objectif à une séquence de coups qui améliore les pièces.","Nomme la cible, la pièce à améliorer et le changement de structure recherché.","Jouer un plan appris sans vérifier s’il correspond à la position actuelle.","Fonde le plan sur une faiblesse réelle et les meilleures réponses adverses.","Plan"],
      ["time-management","Gérer le temps de réflexion",2,"Le temps doit être investi dans les décisions critiques, les positions tactiques et les moments où le plan change.","Repère les coups forcés et les positions où plusieurs candidats doivent être comparés.","Dépenser le même temps sur chaque coup ou jouer trop vite dans une position critique.","Ralentis quand le roi, le matériel ou la structure peut changer tactiquement.","Précision"],
      ["error-review","Apprendre de ses erreurs",1,"L’analyse utile identifie la décision, la meilleure réponse manquée et le repère qui évitera de répéter l’erreur.","Rejoue la position avant le coup, formule les candidats puis compare la réponse adverse.","Se contenter de mémoriser le meilleur coup sans comprendre pourquoi l’idée échouait.","Transforme chaque erreur en question de vérification à réutiliser.","Auto-réfutation"]
    ]}
  ];

  const STORAGE_KEY = "supachess-concept-review-v1";
  const byId = new Map();
  for (const family of FAMILIES) for (const row of family.items) {
    const [id,title,band,idea,look,avoid,hint,query] = row;
    byId.set(id, { id,title,band,idea,look,avoid,hint,query,family:family.label,familyId:family.id });
  }
  const CONCEPTS = [...byId.values()];
  const BAND_LIST = BANDS.map((band,index) => ({...band,index}));

  const glossary = document.getElementById("lesson-concept-glossary");
  if (!glossary) return;
  const list = document.getElementById("lesson-concept-card-list");
  const search = document.getElementById("lesson-concept-search");
  const familyFilter = document.getElementById("lesson-concept-family-filter");
  const eloFilter = document.getElementById("lesson-concept-elo-filter");
  const conceptFilter = document.getElementById("lesson-concept-filter");
  const lessonSearch = document.getElementById("lesson-search");
  const lessonLevelFilter = document.getElementById("lesson-level-filter");
  const status = document.getElementById("lesson-concept-status");
  const count = document.getElementById("lesson-concept-count");
  let activeConceptQuery = "";
  let activeConceptLevel = "";
  let applyingConceptFilter = false;
  let progress = loadProgress();

  function loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (_) { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) {}
  }
  function bandFor(value) { return BANDS[Math.max(0, Math.min(BANDS.length - 1, Number(value) || 0))]; }
  function option(text,value,extra) {
    const node = document.createElement("option");
    node.textContent = text;
    node.value = value;
    if (extra) for (const [key,val] of Object.entries(extra)) node.dataset[key] = val;
    return node;
  }
  function populateFilters() {
    if (conceptFilter) {
      conceptFilter.replaceChildren(option("Tous les concepts", ""));
      for (const family of FAMILIES) {
        const group = document.createElement("optgroup");
        group.label = family.label;
        for (const row of family.items) {
          const item = byId.get(row[0]);
          group.appendChild(option(item.title, item.id, { query: item.query, level: bandFor(item.band).level, band: bandFor(item.band).key }));
        }
        conceptFilter.appendChild(group);
      }
    }
    if (familyFilter) {
      familyFilter.replaceChildren(option("Toutes les familles", ""));
      for (const family of FAMILIES) familyFilter.appendChild(option(family.label, family.id));
    }
    if (eloFilter) {
      eloFilter.replaceChildren(option("Tous les paliers Elo", ""));
      for (const band of BAND_LIST) eloFilter.appendChild(option(band.label + " · " + band.elo, band.key));
    }
  }
  function createText(tag,className,value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  }
  function shuffle(values) {
    const result = values.slice();
    for (let i=result.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }
  function conceptProgressText() {
    const passed = CONCEPTS.filter((item) => progress[item.id]?.passed).length;
    return passed + "/" + CONCEPTS.length + " concepts réussis au moins une fois · réussite à réviser pour confirmer la maîtrise.";
  }
  function renderQuiz(concept, host) {
    const area = createText("section","lesson-concept-quiz","");
    const start = document.createElement("button");
    start.type = "button";
    start.className = "btn mini lesson-concept-quiz-start";
    start.textContent = progress[concept.id]?.passed ? "Réviser le test" : "Tester ce concept";
    const content = document.createElement("div");
    content.className = "lesson-concept-quiz-content";
    content.hidden = true;
    area.append(start,content);
    host.appendChild(area);
    let wrongCount = 0;
    function startRound() {
      wrongCount = 0;
      content.replaceChildren();
      content.hidden = false;
      content.appendChild(createText("p","lesson-concept-question","Que vérifies-tu pour appliquer « " + concept.title + " » ?"));
      const answers = [
        { text: concept.look, correct: true },
        { text: concept.avoid, correct: false },
        { text: "Jouer sans examiner la position ni la meilleure réponse adverse.", correct: false }
      ];
      for (const answer of shuffle(answers)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "lesson-concept-choice";
        button.textContent = answer.text;
        button.dataset.correct = String(answer.correct);
        button.addEventListener("click", () => {
          if (answer.correct) {
            for (const choice of content.querySelectorAll(".lesson-concept-choice")) choice.disabled = true;
            const previous = progress[concept.id] || { attempts: 0, passed: false };
            progress[concept.id] = { attempts: (Number(previous.attempts)||0)+1, passed: true, lastSuccess: Date.now() };
            saveProgress();
            if (status) status.textContent = conceptProgressText();
            start.textContent = "Réviser le test";
            content.appendChild(createText("p","lesson-concept-result is-correct","Réussi. " + concept.idea + " — Reviens-y plus tard pour confirmer que le concept est durablement acquis."));
          } else {
            wrongCount++;
            const hint = wrongCount === 1
              ? "Indice 1 : " + concept.hint
              : wrongCount === 2
                ? "Indice 2 : compare les conséquences de ce choix à la réponse adverse la plus forte."
                : "Indice " + wrongCount + " : relis la notion, puis évalue la position après les réponses forcées.";
            content.appendChild(createText("p","lesson-concept-result is-incorrect",hint));
            button.disabled = true;
          }
        });
        content.appendChild(button);
      }
    }
    start.addEventListener("click",startRound);
  }
  function createCard(concept) {
    const card = document.createElement("article");
    card.className = "lesson-concept-card";
    card.dataset.conceptId = concept.id;
    card.dataset.family = concept.familyId;
    card.dataset.band = bandFor(concept.band).key;
    card.appendChild(createText("span","lesson-concept-meta",concept.family + " · " + bandFor(concept.band).label + " · " + bandFor(concept.band).elo));
    card.appendChild(createText("h3","",concept.title));
    card.appendChild(createText("p","lesson-concept-summary",concept.idea));
    const lesson = document.createElement("details");
    lesson.className = "lesson-concept-teaching";
    lesson.appendChild(createText("summary","","Leçon : repère et erreur à éviter"));
    lesson.appendChild(createText("p","","À repérer : " + concept.look));
    lesson.appendChild(createText("p","","À éviter : " + concept.avoid));
    lesson.appendChild(createText("p","lesson-concept-hint","Piste : " + concept.hint));
    card.appendChild(lesson);
    renderQuiz(concept,card);
    const related = document.createElement("button");
    related.type = "button";
    related.className = "btn mini lesson-concept-related";
    related.textContent = "Leçons et exercices au palier " + bandFor(concept.band).level;
    related.dataset.lessonConceptSearch = concept.query;
    related.addEventListener("click", () => selectConcept(concept));
    card.appendChild(related);
    return card;
  }
  function renderCards() {
    if (!list) return;
    const query = (search?.value || "").trim().toLocaleLowerCase("fr");
    const family = familyFilter?.value || "";
    const band = eloFilter?.value || "";
    let visible = 0;
    for (const concept of CONCEPTS) {
      const card = list.querySelector('[data-concept-id="' + concept.id + '"]');
      if (!card) continue;
      const matches = (!query || card.textContent.toLocaleLowerCase("fr").includes(query)) &&
        (!family || concept.familyId === family) && (!band || bandFor(concept.band).key === band);
      card.hidden = !matches;
      if (matches) visible++;
    }
    if (count) count.textContent = visible + " concept(s) affiché(s) sur " + CONCEPTS.length + " · " + FAMILIES.length + " familles.";
    if (status) status.textContent = conceptProgressText();
  }
  function applySelectedConcept() {
    if (!conceptFilter || !lessonSearch) return;
    const selected = conceptFilter.selectedOptions[0];
    const nextQuery = selected?.dataset.query || "";
    const nextLevel = selected?.dataset.level || "";
    if (activeConceptQuery && lessonSearch.value === activeConceptQuery) lessonSearch.value = "";
    if (activeConceptLevel && lessonLevelFilter?.value === activeConceptLevel) lessonLevelFilter.value = "";
    activeConceptQuery = nextQuery;
    activeConceptLevel = nextLevel;
    if (nextQuery) lessonSearch.value = nextQuery;
    if (nextLevel && lessonLevelFilter) lessonLevelFilter.value = nextLevel;
    applyingConceptFilter = true;
    lessonSearch.dispatchEvent(new Event("input", { bubbles: true }));
    lessonLevelFilter?.dispatchEvent(new Event("change", { bubbles: true }));
    applyingConceptFilter = false;
  }
  function selectConcept(concept) {
    if (!conceptFilter) return;
    conceptFilter.value = concept.id;
    applySelectedConcept();
    document.getElementById("lesson-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  populateFilters();
  if (list) {
    list.replaceChildren();
    for (const concept of CONCEPTS) list.appendChild(createCard(concept));
  }
  familyFilter?.addEventListener("change",renderCards);
  eloFilter?.addEventListener("change",renderCards);
  search?.addEventListener("input",renderCards);
  conceptFilter?.addEventListener("change",applySelectedConcept);
  lessonSearch?.addEventListener("input",() => {
    if (applyingConceptFilter || lessonSearch.value === activeConceptQuery) return;
    activeConceptQuery = "";
    if (conceptFilter) conceptFilter.value = "";
  });
  lessonLevelFilter?.addEventListener("change",() => {
    if (applyingConceptFilter || lessonLevelFilter.value === activeConceptLevel) return;
    activeConceptLevel = "";
    if (conceptFilter) conceptFilter.value = "";
  });
  renderCards();
})();
