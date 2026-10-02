/* =====================================================================
   CONTENU v2 — "Chef de projet formation : dans le vif du sujet"
   Simulateur calé sur le processus IFAP :
   sollicitation → étude du besoin → engagement → réalisation
   → évaluation → capitalisation, avec portes de décision GO / NO-GO.
   ---------------------------------------------------------------------
   Texte : chaîne, objet {A,B,C,_} (selon modalité ; _ = avant choix)
   ou fonction (state) => chaîne.
   Effets : { budget (=Ressources), delai, qualite (=Pertinence), confiance }
   ===================================================================== */
(function () {
  var NB = function (s) { return s.flags.scope === 'all' ? 40 : 12; };
  var PUB = function (s) { return s.flags.scope === 'all' ? 'les 40 agents' : 'les 12 gestionnaires'; };

window.SIM = {

  meta: {
    title: "Chef de projet formation : dans le vif du sujet",
    subtitle: "Simulateur de pilotage de projet de formation",
    duration: "45 à 50 min",
    project: { _: "Sollicitation « Formation outils RH » — DRH Province Sud", A: "Atelier présentiel « SIRH : saisir les cas complexes »", B: "Formation digitale « SIRH : saisir les cas complexes »", C: "Dispositif hybride « SIRH : saisir les cas complexes »" }
  },

  gauges: {
    budget:    { label: "Ressources", short: "Ressources", desc: "Temps disponible de l'équipe, expertise mobilisable, crédits." },
    delai:     { label: "Délai", short: "Délai", desc: "Tenue des jalons du projet." },
    qualite:   { label: "Pertinence", short: "Pertinence", desc: "Adéquation entre le besoin, les objectifs et la réponse." },
    confiance: { label: "Confiance employeur", short: "Confiance", desc: "Perception que l'employeur a de l'IFAP." }
  },

  characters: {
    mw:     { name: "M. Wamytan", role: "DRH Province Sud · employeur commanditaire", initials: "MW", color: "#d7eafb", photo: "images/avatar-mw.jpg" },
    nico:   { name: "Nicolas", role: { _: "Formateur ou prestataire", A: "Formateur externe", B: "Prestataire e-learning", C: "Formateur et co-concepteur" }, initials: "N", color: "#fbeedd", photo: "images/avatar-nico.jpg" },
    lea:    { name: "Léa", role: "Gestionnaire RH à La Foa · apprenante", initials: "L", color: "#d3eef0", photo: "images/avatar-lea.jpg" },
    sylvie: { name: "Sylvie", role: "Pôle administratif et financier · IFAP", initials: "S", color: "#ece9f6", photo: "images/avatar-sylvie.jpg" },
    dir:    { name: "Direction de l'IFAP", role: "Arbitrages et priorités", initials: "DI", color: "#333333" }
  },
  team: ["mw", "nico", "lea", "sylvie"],

  scenarios: {
    A: { code: "A", name: "Atelier présentiel", tag: "Présentiel", accent: "#63b8e8" },
    B: { code: "B", name: "Formation digitale en autoformation", tag: "Autoformation", accent: "#2fb6bc" },
    C: { code: "C", name: "Dispositif hybride", tag: "Hybride", accent: "#7c6eaf" }
  },

  /* ------------------------------------------------------------------ */
  diagnostic: [
    { q: "M. Wamytan écrit : « Il nous faudrait une demi-journée de formation sur le nouvel outil RH. » Qu'est-ce que c'est ?",
      options: ["Le besoin réel de formation", "La commande de l'employeur", "Un objectif pédagogique", "La fiche de cadrage"], ok: 1,
      fb: "C'est une <strong>commande</strong> : une solution proposée par l'employeur. Le besoin se découvre par l'analyse de la situation de travail." },
    { q: "Des agents commettent des erreurs dans un logiciel. Quelle est la première question à se poser ?",
      options: ["Quelle modalité de formation choisir ?", "L'écart vient-il vraiment d'un manque de compétences ?", "Quel formateur est disponible ?", "Combien de temps durera la formation ?"], ok: 1,
      fb: "Une erreur peut venir d'un outil mal paramétré, d'une information absente ou d'une organisation. <strong>La formation ne traite que la part « compétences ».</strong>" },
    { q: "Dans un établissement public, que faut-il avoir vérifié avant de faire démarrer un formateur ou un prestataire ?",
      options: ["Son CV", "La disponibilité des crédits et le support juridique (bon de commande, marché)", "La date de la session", "Le nombre de participants"], ok: 1,
      fb: "Pas de dépense sans <strong>crédit disponible</strong> ni <strong>engagement juridique</strong> préalable. Un accord oral ne suffit pas." },
    { q: "Le niveau 3 du modèle de Kirkpatrick mesure…",
      options: ["La satisfaction à chaud", "Les connaissances acquises", "Le transfert en situation de travail", "Le coût de la formation"], ok: 2,
      fb: "Niveau 3 = <strong>comportement</strong> : l'agent applique-t-il ce qu'il a appris, à J+30 ou J+90 ?" },
    { q: "À quel moment définir les indicateurs de réussite avec l'employeur ?",
      options: ["Au moment du cadrage", "Pendant la réalisation", "À la fin de la formation", "Lors du bilan annuel"], ok: 0,
      fb: "<strong>Dès le cadrage.</strong> Après, il est trop tard : la situation de départ n'a pas été mesurée." }
  ],
  diagnosticMessages: {
    low:  "Soyez particulièrement attentif aux phases Étude et Engagement : tout le reste du projet en dépend.",
    mid:  "Vous avez des repères. Regardez surtout comment vos décisions de cadrage et d'engagement pèsent sur la réalisation et le bilan.",
    high: "Vous maîtrisez les principes. Le simulateur va vous confronter à des arbitrages où il n'y a pas de bonne réponse évidente."
  },

  /* ================================================================== */
  sections: [

  /* =================== 1. ÉTUDE DU BESOIN =========================== */
  { id: "s1", num: 1, pnum: 1, letter: "1", phase: "Étude", phaseLong: "Étude du besoin", title: "Étudier le besoin", weeks: [1, 2],
    beats: [
      { type: "intro", week: 1,
        hook: "Lundi, 7 h 42. Une sollicitation arrive, avec un cahier des charges déjà rédigé. La solution est écrite. Le besoin, lui, reste à trouver.",
        objective: "Transformer une sollicitation en besoin qualifié, et décider si la formation est la bonne réponse.",
        learn: ["Distinguer la commande du besoin", "Chercher les causes d'un écart avant de former", "Utiliser la grille d'éligibilité et la matrice des modalités", "Passer la porte de décision d'engagement"] },

      { type: "notif", format: "email", week: 1, time: "Lun. 07:42", sender: "mw",
        from: "m.wamytan@drh-province-sud.nc", fromName: "M. Wamytan — DRH Province Sud", to: "coordination@ifap.nc",
        subject: "Sollicitation — Formation outils RH",
        body: "Bonjour,\n\nSuite au déploiement de notre nouveau SIRH, nous avons besoin de former nos agents rapidement. Ils sont une quarantaine.\n\nVous trouverez en pièce jointe notre cahier des charges : une demi-journée en salle, contenu standard éditeur, avant la bascule du 2 juin.\n\nPouvez-vous nous faire une proposition ?\n\nM. Wamytan\nDRH Province Sud\n\nPJ : CDC_formation_SIRH.pdf",
        note: "Le cahier des charges décrit une solution. Qu'est-ce qu'on ignore encore du problème ?" },

      { type: "content", kicker: "Outil IFAP", title: "Enregistrer la demande",
        lead: "Avant toute analyse, la sollicitation est enregistrée dans la liste de suivi des demandes. À ce stade, ce n'est pas encore un projet. Cliquez sur la nouvelle ligne.",
        component: { kind: "splist", title: "Demandes de formation", cols: ["Titre", "Demandeur", "Reçue", "Filière", "Statut", "Fiche cadrage"],
          rows: [
            { c: ["Accueil du public — posture", "Ville de Nouméa", "S-6", "LIANE", "En production", "✓"] },
            { c: ["Marchés publics — initiation", "CHS Albert-Bousquet", "S-3", "À qualifier", "En cadrage", "En cours"] },
            { c: ["Formation outils RH (SIRH)", "DRH Province Sud", "S1", "À qualifier", "Nouvelle demande", "—"], fresh: true,
              detail: "La ligne existe. Elle passera au statut <strong>« En cadrage »</strong> pendant l'étude, puis <strong>« En production »</strong> seulement après la décision d'engagement. La fiche de cadrage y sera liée." }
          ] } },

      { type: "decision", id: "s1_reponse", week: 1, time: "Lun. 09:10",
        title: "Comment répondez-vous à la sollicitation ?",
        context: "M. Wamytan attend une réponse rapide. Le catalogue IFAP contient une session générique « Outils numériques RH ».",
        options: [
          { id: "a", label: "Je lui propose la session du catalogue dès cette semaine.", detail: "Il a déjà écrit son cahier des charges.", quality: "bad",
            effects: { confiance: 5, qualite: -10 }, set: { cadrage: false },
            deferred: [{ section: "s3", jauge: "qualite", delta: -20, reason: "Pas d'étude du besoin en semaine 1 : en production, on découvre que le contenu ne correspond ni au paramétrage Province Sud, ni au public réel." }],
            feedback: "Réponse rapide, employeur content… pour l'instant. Mais vous avez répondu à la commande, pas au besoin. Un cahier des charges rédigé par l'employeur reste une hypothèse de solution.",
            reaction: { who: "mw", mood: 1, text: "Parfait, c'est réactif ! On cale ça au plus vite." } },
          { id: "b", label: "Je propose un entretien de cadrage d'une heure, avec lui et une gestionnaire RH de terrain.", detail: "Avant toute proposition.", quality: "good",
            effects: { delai: -5, qualite: 15, confiance: 10 }, set: { cadrage: true },
            feedback: "Une heure investie maintenant en économise des dizaines plus tard. Vous vous posez en conseiller, pas en simple fournisseur de catalogue.",
            reaction: { who: "mw", mood: 1, text: "Bonne idée. Je viens avec Léa, elle utilise l'outil tous les jours à La Foa." } },
          { id: "c", label: "J'envoie un questionnaire de besoins aux 40 agents et j'attends les retours.", detail: "Des données avant tout.", quality: "mixed",
            effects: { delai: -15, qualite: 5, confiance: -5 }, set: { cadrage: true },
            feedback: "Recueillir l'avis du terrain est utile. Mais un questionnaire seul prend du temps, rate le contexte et laisse l'employeur sans interlocuteur. L'entretien d'abord.",
            reaction: { who: "mw", mood: -1, text: "Un questionnaire ? On n'a pas trois semaines à perdre. J'attendais une proposition." } }
        ],
        best: "b",
        conseil: "Toujours un entretien de cadrage avant toute proposition, même quand l'employeur fournit un cahier des charges." },

      { type: "content", kicker: "Enquête", title: "D'où viennent les erreurs ?",
        lead: "Avant de parler de formation, il faut comprendre l'écart et ses causes. Consultez les quatre sources.",
        component: { kind: "investigate", sources: [
          { char: "mw", icon: "MW", color: "#63b8e8", who: "Entretien avec M. Wamytan", clue: "La bascule du SIRH est fixée au 2 juin. Depuis le test à blanc, les erreurs de saisie des congés ont triplé. Ce qu'il veut : « que ça marche le jour J »." },
          { char: "lea", icon: "L", color: "#2fb6bc", who: "Échange avec Léa, à La Foa", clue: "Les gestionnaires bloquent sur les cas complexes : temps partiel, congés fractionnés, cycles de travail. La connexion est instable l'après-midi. Deux collègues travaillent à l'Île des Pins et à Thio." },
          { icon: "▤", color: "#7c6eaf", who: "Extraction des erreurs SIRH", clue: "Sur 300 erreurs du dernier mois : 70 % viennent des 12 gestionnaires, sur les cas complexes. 25 % viennent d'agents qui saisissent eux-mêmes alors qu'ils devraient seulement consulter. 5 % viennent d'un motif de congé absent du paramétrage." },
          { icon: "⚙", color: "#ed9c89", who: "Support informatique", clue: "Le motif « congé fractionné » n'a pas été paramétré : correction prévue sous trois semaines. Beaucoup de tickets « je ne trouve pas mon solde » : les agents ne savent pas où consulter." }
        ],
        synthesis: "Trois problèmes, trois réponses. Un défaut d'outil : c'est au service informatique de le corriger. Un défaut d'information pour 28 agents : une fiche réflexe suffit. Un vrai écart de compétences pour 12 gestionnaires : là, la formation est pertinente." } },

      { type: "decision", id: "s1_kpi", week: 2, time: "Lun. 10:00",
        title: "Les indicateurs de réussite",
        context: "En fin d'entretien, M. Wamytan balaie la question : « Les indicateurs, on verra après la formation. On a déjà assez de choses à gérer. »",
        options: [
          { id: "a", label: "J'insiste : on fixe ensemble 2 ou 3 indicateurs maintenant, avec leur valeur de départ.", detail: "Ex. : erreurs de saisie des congés, délai de traitement des dossiers.", quality: "good",
            effects: { delai: -5, qualite: 10, confiance: 5 }, set: { kpi_defined: true },
            feedback: "Sans point de départ mesuré, aucun effet ne sera démontrable. Vous venez de préparer votre bilan.",
            reaction: { who: "mw", mood: 1, text: "Vu comme ça… D'accord. Je vous envoie nos chiffres d'erreurs du dernier trimestre." } },
          { id: "b", label: "D'accord, on verra au moment du bilan.", detail: "Ne pas le braquer.", quality: "bad",
            effects: { confiance: 5 }, set: { kpi_defined: false },
            deferred: [{ section: "s5", jauge: "confiance", delta: -20, reason: "Indicateurs non fixés au cadrage : au bilan, impossible de démontrer les effets de la formation à l'employeur." }],
            feedback: "Vous évitez une friction aujourd'hui. Mais un indicateur qui n'a pas été défini au départ ne pourra jamais être mesuré à l'arrivée.",
            reaction: { who: "mw", mood: 1, text: "Merci, on se comprend. Chaque chose en son temps." } },
          { id: "c", label: "Je propose de reprendre le questionnaire de satisfaction IFAP habituel.", detail: "C'est déjà prêt.", quality: "mixed",
            effects: { qualite: -5 }, set: { kpi_defined: false },
            deferred: [{ section: "s5", jauge: "confiance", delta: -10, reason: "Seule la satisfaction a été prévue : l'employeur attend des résultats sur le terrain." }],
            feedback: "La satisfaction, c'est le niveau 1. Utile, mais elle ne dit rien de ce que les agents feront mieux dans le SIRH.",
            reaction: { who: "mw", mood: 0, text: "Si vous voulez. Mais ce qui m'intéresse, c'est que les dossiers soient bien saisis." } }
        ],
        best: "a",
        conseil: "Fixer 2 ou 3 indicateurs de réussite dès le cadrage, avec la situation de départ chiffrée." },

      { type: "content", kicker: "Fiche de cadrage · partie 7", title: "La grille d'éligibilité LIANE",
        lead: "Une formation en autoformation sur LIANE est-elle envisageable ici ? Évaluez chaque critère avec ce que vous savez du dossier, puis vérifiez.",
        component: { kind: "classify", choices: ["Oui", "Partiel", "Non"], items: [
          { t: "Thématique d'intérêt commun pour plusieurs employeurs publics", a: "Partiel", why: "Le statut est commun, mais le paramétrage du SIRH est propre à la Province Sud." },
          { t: "Public potentiel suffisant et demande mutualisable", a: "Non", why: "12 gestionnaires, un seul employeur." },
          { t: "Contenu suffisamment stable pour une production digitale", a: "Non", why: "Le paramétrage du SIRH évolue encore." },
          { t: "Objectifs compatibles avec une formation asynchrone", a: "Partiel", why: "Consulter : oui. Saisir les cas complexes : besoin de pratique accompagnée." },
          { t: "Expert contenu et ressources disponibles dans les délais", a: "Oui", why: "Le référent SIRH de la DRH et Léa sont mobilisables." }
        ],
        feedback: "Une réponse négative n'entraîne pas un refus automatique : elle oriente vers une autre filière ou une autre modalité." } },

      { type: "content", kicker: "Aide à la décision", title: "Quelle modalité pour quel besoin ?",
        lead: "La matrice ne choisit pas à votre place : elle sert à justifier une décision. Activez le filtre pour voir les critères qui comptent dans ce dossier.",
        component: { kind: "matrix", cols: ["Présentiel", "Autoformation", "Hybride"], rows: [
          { crit: "Entraînement sur cas complexes, avec retour immédiat", v: [3, 1, 3], here: true },
          { crit: "Public dispersé (Nouméa, brousse, Île des Pins)", v: [1, 3, 2], here: true },
          { crit: "Petit effectif, un seul employeur", v: [2, 1, 2], here: true },
          { crit: "Contenu encore évolutif", v: [2, 1, 2], here: true },
          { crit: "Échéance proche (bascule le 2 juin)", v: [2, 1, 2], here: true },
          { crit: "Connaissances stables à mémoriser", v: [1, 3, 2], here: false },
          { crit: "Échanges entre pairs, dimension collective", v: [3, 1, 3], here: false }
        ] } },

      { type: "decision", id: "s1_scope", week: 2, time: "Mer. 14:00",
        title: "Quelle réponse proposez-vous ?",
        context: "Vous avez les causes, les indicateurs et la grille. M. Wamytan attend votre proposition.",
        options: [
          { id: "a", label: "Je propose de former les 40 agents, comme le demande le cahier des charges.", quality: "bad",
            effects: { budget: -10, qualite: -10, confiance: 5 }, set: { scope: "all" },
            feedback: "28 agents n'ont pas besoin d'une formation, mais d'une information. Et aucune formation ne corrigera un motif de congé absent du paramétrage.",
            reaction: { who: "mw", mood: 1, text: "Très bien, c'est ce qu'on avait demandé." } },
          { id: "b", label: "Je propose une réponse combinée : signalement au service informatique, fiche réflexe pour les 28 agents, formation pour les 12 gestionnaires.", quality: "good",
            effects: { qualite: 15, confiance: 5 }, set: { scope: "mixed" }, cost: "≈ 1 journée pour la fiche réflexe",
            feedback: "Une réponse proportionnée : chaque cause reçoit la bonne réponse. Vous formez moins de monde, et mieux.",
            reaction: { who: "mw", mood: 1, text: "Je n'avais pas vu ça comme ça. Ça me va, et ça libère 28 agents." } },
          { id: "c", label: "Je propose de ne pas former : une fiche réflexe et le signalement au service informatique suffiront.", quality: "mixed",
            effects: { confiance: -10 }, set: { scope: "mixed" },
            deferred: [{ section: "s4", jauge: "qualite", delta: -10, reason: "Le besoin des 12 gestionnaires a été minimisé au départ : la formation démarre tard et sous pression." }],
            feedback: "Vous avez raison pour 28 agents. Mais les gestionnaires ont un vrai écart de compétences sur les cas complexes : une fiche ne suffira pas. M. Wamytan insiste, et la formation des 12 gestionnaires est finalement retenue.",
            reaction: { who: "mw", mood: -1, text: "Une fiche ? Mes gestionnaires se trompent sur un dossier sur trois. Il faut les former." } }
        ],
        best: "b",
        conseil: "Proposer une réponse proportionnée : former seulement là où l'écart relève des compétences, combiner avec d'autres réponses ailleurs." },

      { type: "decision", id: "s1_modalite", week: 2, time: "Jeu. 09:30",
        title: function (s) { return 'Quelle modalité pour ' + PUB(s) + ' ?'; },
        context: "Relisez la matrice et la grille d'éligibilité. Votre choix détermine toute la suite du projet.",
        options: [
          { id: "a", label: "Un atelier présentiel en petits groupes, à Nouméa, avec une session en classe virtuelle pour les sites éloignés.", detail: "Pratique guidée sur de vrais dossiers.", quality: "good",
            effects: { budget: -10, qualite: 5 }, setScenario: "A", cost: "Formateur externe, salle, déplacements",
            feedback: "Cohérent avec le besoin d'entraînement et l'échéance. Le point de vigilance : mobiliser les agents de brousse et de l'Île des Pins.",
            reaction: { who: "lea", mood: 1, text: "Enfin du concret sur nos vrais dossiers ! Pour l'Île des Pins, la visio c'est bien vu." } },
          { id: "b", label: "Une formation digitale en autoformation sur la plateforme de l'IFAP.", detail: "Accessible partout, à son rythme.", quality: "mixed",
            effects: { qualite: -5 }, setScenario: "B",
            deferred: [{ section: "s5", jauge: "qualite", delta: -10, reason: "Le paramétrage du SIRH a encore évolué : une partie de la formation digitale est déjà obsolète au bilan." }],
            feedback: "Défendable pour un public dispersé. Mais la grille vous alertait : un seul employeur, un contenu évolutif, un objectif d'entraînement. Ce n'est pas la filière LIANE : ce sera une formation digitale spécifique.",
            reaction: { who: "lea", mood: 0, text: "Toute seule devant l'écran pour les cas complexes… j'espère qu'il y aura des exemples." } },
          { id: "c", label: "Un dispositif hybride : une courte séquence en ligne pour les bases, puis un atelier de cas pratiques.", detail: "Salle à Nouméa, classe virtuelle pour les sites éloignés.", quality: "good",
            effects: { budget: -10, qualite: 10 }, setScenario: "C", cost: "Deux volets à articuler",
            feedback: "Le meilleur ajustement au besoin : les bases à distance, la pratique en groupe. Le prix à payer : orchestrer deux volets, avec des prérequis à vérifier.",
            reaction: { who: "lea", mood: 1, text: "Les bases chez moi, la pratique ensemble : ça me va." } }
        ],
        best: "c",
        conseil: "Choisir la modalité à partir du besoin et des contraintes du public, et pouvoir la justifier avec la matrice." },

      { type: "gate", id: "g1", week: 2, time: "Ven. 16:00",
        title: "Porte 1 — Décision d'engagement",
        context: "La fiche de cadrage est complète. Partie 8 : faut-il engager la production maintenant ?",
        conds: [
          { t: "Besoin qualifié lors d'un entretien de cadrage", ok: function (s) { return !!s.flags.cadrage; }, blocking: true },
          { t: "Causes analysées : la formation ne vise que la part « compétences »", ok: function (s) { return s.flags.scope !== 'all'; }, blocking: false },
          { t: "Indicateurs de réussite fixés avec l'employeur", ok: function (s) { return !!s.flags.kpi_defined; }, blocking: false },
          { t: "Expert contenu identifié : le référent SIRH de la DRH", ok: function () { return true; }, blocking: true },
          { t: "Modalité choisie et justifiée", ok: function (s) { return !!s.scenario; }, blocking: true }
        ],
        goLabel: "Production engagée", goDetail: "Je fais valider la décision et le dossier passe à l'engagement.",
        nogoLabel: "Je complète le cadrage avant de décider", nogoDetail: "Le dossier reste « En cadrage ».",
        okGo: { effects: { confiance: 5 }, feedback: "La décision est justifiée et traçable. La fiche est liée à la ligne de suivi, le statut passe à « En production »." },
        penaltyGo: { effects: { confiance: -10 }, feedback: "Vous engagez un projet dont le besoin n'a pas été qualifié. Les erreurs de cadrage ne disparaissent pas : elles se paient en réalisation." },
        fix: { effects: { delai: -10, qualite: 10 }, set: { cadrage: true }, cancel: ["s1_reponse"], feedback: "Vous organisez l'entretien de cadrage manqué. Une semaine perdue, mais le besoin réel apparaît avant la production : l'effet différé de votre première réponse est annulé." },
        overcautious: { effects: { delai: -5 }, feedback: "Le dossier était prêt. Retarder la décision n'apporte rien : l'excès de prudence a aussi un coût." },
        conseil: "Ne pas engager tant que le besoin n'est pas qualifié. Une porte sert aussi à rattraper une erreur de cadrage." },

      { type: "summary",
        points: ["Une sollicitation, même accompagnée d'un cahier des charges, décrit une solution. Le besoin se découvre.", "Un écart peut venir de l'outil, de l'information, de l'organisation ou des compétences. La formation ne traite que les compétences.", "La grille d'éligibilité et la matrice servent à justifier la filière et la modalité.", "Aucun engagement sans besoin qualifié : c'est le rôle de la porte de décision."],
        transition: "La décision est prise. Avant de produire quoi que ce soit, il faut encore sécuriser le projet : les crédits, le cadre juridique, les rôles.",
        cta: "J'engage le projet" }
    ] },

  /* =================== 2. ENGAGEMENT ================================ */
  { id: "s2", num: 2, pnum: 2, letter: "2", phase: "Engagement", phaseLong: "Engagement", title: "Engager et sécuriser", weeks: [3, 4],
    beats: [
      { type: "intro", week: 3,
        hook: "Semaine 3. Le projet est décidé, mais rien n'est encore engagé. Dans un établissement public, c'est ici que se jouent les crédits, les bons de commande et les responsabilités.",
        objective: "Sécuriser le projet sur les plans administratif, budgétaire et organisationnel avant toute réalisation.",
        learn: ["Vérifier les crédits et le support juridique", "Répartir les rôles : le chef de projet coordonne, il ne fait pas tout", "Cadrer le circuit de validation", "Bâtir un planning avec ses marges"] },

      { type: "content", kicker: "Méthode", title: "Engager, c'est sécuriser",
        lead: "Six vérifications avant de lancer la réalisation. Avancez pas à pas.",
        component: { kind: "process", steps: [
          { h: "Décision validée", d: "La décision d'engagement est validée par le décideur et tracée dans la fiche de cadrage." },
          { h: "Crédits disponibles", d: "La dépense est prévue sur une ligne budgétaire, et les crédits sont disponibles." },
          { h: "Support juridique", d: "Bon de commande sur un marché en cours, consultation, convention avec l'employeur : selon le cas. Il est signé avant tout démarrage." },
          { h: "Rôles répartis", d: "Qui produit, qui valide le contenu, qui engage la dépense, qui informe les agents. Un nom par rôle." },
          { h: "Circuit de validation", d: "Un valideur métier nommé, un délai de validation, un suppléant." },
          { h: "Planning et suivi", d: "Des jalons, des marges, et la ligne de suivi mise à jour : statut « En production »." }
        ] } },

      { type: "notif", format: "email", week: 3, time: "Mar. 08:40", sender: "sylvie",
        from: "sylvie@ifap.nc", fromName: "Sylvie — Pôle administratif et financier", to: "chef.projet@ifap.nc",
        subject: "Projet SIRH — avant tout engagement",
        body: { _: "Bonjour,\n\nJ'ai vu passer le projet SIRH. Avant tout démarrage, il me faut la ligne budgétaire et le support juridique.\n\nRappel : aucune prestation ne démarre sans bon de commande signé.\n\nSylvie",
          A: "Bonjour,\n\nJ'ai vu passer le projet SIRH. Avant tout démarrage du formateur, il me faut deux choses :\n— la ligne budgétaire sur laquelle on impute l'intervention ;\n— le support juridique : est-il titulaire de notre marché de formateurs ?\n\nRappel : aucune prestation ne démarre sans bon de commande signé.\n\nSylvie",
          B: "Bonjour,\n\nJ'ai vu passer le projet SIRH. Avant tout démarrage du prestataire e-learning, il me faut deux choses :\n— la ligne budgétaire sur laquelle on impute la production ;\n— le support juridique : le prestataire est-il titulaire de notre marché ?\n\nRappel : aucune prestation ne démarre sans bon de commande signé.\n\nSylvie",
          C: "Bonjour,\n\nJ'ai vu passer le projet SIRH. Le volet atelier fait intervenir un formateur externe. Avant son démarrage, il me faut :\n— la ligne budgétaire ;\n— le support juridique : est-il titulaire de notre marché ?\n\nRappel : aucune prestation ne démarre sans bon de commande signé.\n\nSylvie" } },

      { type: "decision", id: "s2_credits", week: 3, time: "Mar. 09:15",
        title: "Nicolas peut démarrer demain",
        context: { _: "Nicolas est disponible tout de suite.", A: "Nicolas, le formateur, est disponible tout de suite pour préparer l'atelier. Il attend votre feu vert.", B: "Nicolas, le prestataire, peut lancer le storyboard dès demain. Il attend votre feu vert.", C: "Nicolas, qui animera l'atelier et co-conçoit la séquence en ligne, peut démarrer demain. Il attend votre feu vert." },
        options: [
          { id: "a", label: "Avant de m'engager auprès de Nicolas, je fais vérifier avec Sylvie les crédits et le bon de commande.", detail: "Il attendra quelques jours.", quality: "good",
            effects: { delai: -5 }, set: { credits_ok: true, juridique_ok: true }, cost: "≈ 3 jours de circuit administratif",
            feedback: "Pas de dépense sans crédit disponible ni engagement juridique préalable. Quelques jours de circuit protègent l'IFAP, le prestataire et vous.",
            reaction: { who: "sylvie", mood: 1, text: "Merci. Le bon de commande part jeudi, il pourra démarrer vendredi." } },
          { id: "b", label: "Je donne mon accord à Nicolas pour démarrer : la régularisation administrative suivra.", detail: "On gagne une semaine.", quality: "bad",
            effects: {}, set: { credits_ok: false, juridique_ok: false },
            deferred: [{ section: "s3", jauge: "budget", delta: -20, reason: "Prestation démarrée sans bon de commande : facture bloquée, régularisation à monter, temps perdu par le pôle administratif et par vous." }],
            feedback: "Un accord oral engage l'IFAP sans base juridique ni crédit vérifié. La facture ne pourra pas être payée normalement.",
            reaction: { who: "nico", mood: 1, text: "Super, je commence demain !" } },
          { id: "c", label: "J'inscris l'action au budget de l'an prochain pour être certain d'avoir les crédits.", detail: "Aucun risque budgétaire.", quality: "mixed",
            effects: { delai: -20, confiance: -10 }, set: { credits_ok: true, juridique_ok: true },
            feedback: "Prudent, mais la bascule du 2 juin n'attendra pas. Vérifier les crédits disponibles cette année aurait suffi.",
            reaction: { who: "mw", mood: -1, text: "L'an prochain ? La bascule, c'est dans dix semaines." } }
        ],
        best: "a",
        conseil: "Vérifier la disponibilité des crédits et signer le support juridique avant tout démarrage de prestation." },

      { type: "content", kicker: "Activité", title: "Qui est responsable de quoi ?",
        lead: "Le chef de projet coordonne. Il ne porte pas tout. Pour chaque tâche, désignez le responsable, puis vérifiez.",
        component: { kind: "classify", choices: ["CDP IFAP", "Expert DRH", "Prestataire", "Admin IFAP", "Employeur"], items: [
          { t: "Coordonner le projet et tenir le planning", a: "CDP IFAP" },
          { t: "Valider l'exactitude du contenu métier", a: "Expert DRH" },
          { t: "Produire les supports ou animer", a: "Prestataire" },
          { t: "Engager la dépense : bon de commande", a: "Admin IFAP" },
          { t: "Informer les agents et les libérer pour la formation", a: "Employeur" }
        ],
        feedback: "Quand tout converge vers le chef de projet, il devient le goulet d'étranglement du projet." } },

      { type: "decision", id: "s2_validation", week: 4, time: "Lun. 10:30",
        title: "Qui valide le contenu, et quand ?",
        context: "Le circuit de validation n'est pas encore écrit. Les retards de validation sont la première cause de dérive des projets.",
        options: [
          { id: "a", label: "J'inscris dans la fiche : le référent SIRH de la DRH valide, sous 5 jours ouvrés, avec un suppléant.", quality: "good",
            effects: { delai: -3, confiance: 5 }, set: { validation_ok: true },
            feedback: "Un nom, un délai, un suppléant. Chacun sait ce qu'on attend de lui, et quand.",
            reaction: { who: "mw", mood: 1, text: "C'est carré. Je préviens le référent SIRH." } },
          { id: "b", label: "M. Wamytan validera quand il aura le temps.", quality: "bad",
            effects: {}, set: { validation_ok: false },
            deferred: [{ section: "s3", jauge: "delai", delta: -20, reason: "Circuit de validation non cadré en semaine 4 : le contenu attend trois semaines une validation." }],
            feedback: "« Quand il aura le temps » n'est pas un délai. C'est une promesse de retard.",
            reaction: { who: "mw", mood: 0, text: "Oui, envoyez-moi ça, je regarderai." } },
          { id: "c", label: "Je valide moi-même le contenu métier : je connais bien le sujet maintenant.", quality: "bad",
            effects: { budget: -10 }, set: { validation_ok: false },
            deferred: [{ section: "s4", jauge: "qualite", delta: -15, reason: "Contenu métier validé sans expert : des erreurs de règles de gestion sont découvertes par les apprenants." }],
            feedback: "Vous n'êtes pas l'expert métier. En prenant ce rôle, vous ajoutez une tâche à votre charge et vous retirez une sécurité au projet.",
            reaction: { who: "lea", mood: 0, text: "Vous êtes sûr pour les règles du temps partiel ? Elles ont changé en janvier." } }
        ],
        best: "a",
        conseil: "Écrire le circuit de validation : un valideur métier nommé, un délai, un suppléant." },

      { type: "decision", id: "s2_planning", week: 4, time: "Jeu. 08:15",
        title: "Quel planning envoyez-vous ?",
        context: "La bascule est dans neuf semaines. Il faut caser la réalisation, les validations, le test et le déploiement. Les agents sont pris par la campagne d'avancement en avril.",
        options: [
          { id: "a", label: "Un planning avec jalons de validation et une semaine de marge par étape, calé avec les services RH.", detail: "Plus long sur le papier.", quality: "good",
            effects: { delai: -5, qualite: 5, confiance: 5 }, set: { planning_ok: true },
            deferred: [{ section: "s3", jauge: "delai", delta: 10, reason: "Les marges prévues dans votre planning absorbent l'aléa de production sans décaler le calendrier." }],
            feedback: "Moins ambitieux en apparence, mais crédible. Les marges absorberont les aléas — il y en aura.",
            reaction: { who: "mw", mood: 1, text: "Clair et réaliste. Ma direction appréciera qu'on ait évité avril." } },
          { id: "b", label: "Un planning serré, sans marge : on tient si tout se passe bien.", detail: "Il sera rassuré.", quality: "bad",
            effects: {}, set: { planning_ok: false },
            deferred: [{ section: "s3", jauge: "delai", delta: -20, reason: "Planning sans marge : au premier aléa de réalisation, tout le calendrier glisse." }],
            feedback: "« Si tout se passe bien » : c'est rarement le cas. Sans marge, chaque aléa devient un retard.",
            reaction: { who: "mw", mood: 1, text: "Parfait, c'est exactement ce que je voulais voir." } },
          { id: "c", label: "Je cale les dates moi-même, sans consulter les services.", detail: "Pour aller vite.", quality: "bad",
            effects: {}, set: { planning_ok: false },
            deferred: [{ section: "s4", jauge: "qualite", delta: -15, reason: "Calendrier fixé sans concertation : conflits d'agenda avec les services et absences au déploiement." }],
            feedback: "Un calendrier sans concertation, ce sont des conflits d'agenda assurés au moment du déploiement.",
            reaction: { who: "lea", mood: -1, text: "Les dates tombent pile sur nos clôtures de paie…" } }
        ],
        best: "a",
        conseil: "Construire le planning avec les services concernés, avec des jalons de validation et des marges explicites." },

      { type: "gate", id: "g2", week: 4, time: "Ven. 15:00",
        title: "Porte 2 — Lancer la réalisation ?",
        context: "Tout doit être sécurisé avant que le premier support soit produit.",
        conds: [
          { t: "Décision d'engagement validée et tracée", ok: function () { return true; }, blocking: true },
          { t: "Crédits disponibles vérifiés", ok: function (s) { return !!s.flags.credits_ok; }, blocking: true },
          { t: "Bon de commande signé avant tout démarrage", ok: function (s) { return !!s.flags.juridique_ok; }, blocking: true },
          { t: "Valideur métier nommé, délai de validation fixé", ok: function (s) { return !!s.flags.validation_ok; }, blocking: true },
          { t: "Planning avec jalons et marges, concerté", ok: function (s) { return !!s.flags.planning_ok; }, blocking: false }
        ],
        goLabel: "GO : je lance la réalisation", nogoLabel: "NO-GO : je régularise d'abord",
        okGo: { effects: { confiance: 5 }, feedback: "Le projet est sécurisé. La réalisation peut démarrer sur des bases saines." },
        penaltyGo: { effects: { confiance: -5, budget: -5 }, feedback: "Vous lancez la réalisation avec des points bloquants ouverts. Ils ressortiront en production, au pire moment." },
        fix: { effects: { delai: -10 }, set: { credits_ok: true, juridique_ok: true, validation_ok: true }, cancel: ["s2_credits", "s2_validation"], feedback: "Vous régularisez : bon de commande signé, valideur métier nommé avec un délai. Une semaine de plus, mais les effets différés de ces décisions sont annulés." },
        overcautious: { effects: { delai: -5 }, feedback: "Tout était en ordre. Un NO-GO sans point bloquant retarde le projet pour rien." },
        conseil: "Ne pas lancer la réalisation tant que les crédits, le support juridique et le circuit de validation ne sont pas sécurisés." },

      { type: "summary",
        points: ["Dans un établissement public, pas de démarrage sans crédits vérifiés ni support juridique signé.", "Le chef de projet coordonne : chaque rôle a un responsable, et ce n'est pas toujours lui.", "Le circuit de validation s'écrit : un nom, un délai, un suppléant.", "Un planning crédible a des jalons, des marges, et a été concerté."],
        transition: "Le projet est sécurisé. Place à la réalisation : c'est là que les aléas arrivent en rafale.",
        cta: "Je lance la réalisation" }
    ] },

  /* ============ 3a. RÉALISATION — PRODUIRE ET SÉCURISER ============= */
  { id: "s3", num: 3, pnum: 3, letter: "3a", phase: "Réalisation", phaseLong: "Réalisation · produire et sécuriser", title: "Produire et sécuriser", weeks: [5, 8],
    beats: [
      { type: "intro", week: 5,
        hook: "Semaine 5. La production démarre. Les décisions s'enchaînent, et celles des semaines précédentes reviennent vous rendre visite.",
        objective: "Piloter la production des supports et arbitrer les aléas, sans laisser passer d'anomalie bloquante.",
        learn: ["Suivre la chaîne de réalisation propre à votre modalité", "Gérer un formateur ou un prestataire", "Distinguer ce qui est arbitrable de ce qui est bloquant", "Passer la porte GO / NO-GO avant de déployer"] },

      { type: "deferred" },

      { type: "content", kicker: "Votre chaîne de réalisation", title: { A: "Réaliser un atelier présentiel", B: "Réaliser une formation digitale", C: "Réaliser un dispositif hybride" },
        lead: { A: "Chaque modalité a sa propre chaîne. Voici la vôtre.", B: "Chaque modalité a sa propre chaîne. Voici la vôtre.", C: "Chaque modalité a sa propre chaîne. En hybride, la difficulté propre, c'est l'articulation des deux volets." },
        component: { kind: "timeline", steps: {
          A: [
            { t: "1", h: "Cahier des charges formateur", d: "Objectifs, public, cas réels attendus, durée, livrables." },
            { t: "2", h: "Déroulé pédagogique", d: "Le formateur propose un déroulé minute par minute. C'est le moment de corriger." },
            { t: "3", h: "Validation métier", d: "Le référent SIRH valide les règles de gestion utilisées." },
            { t: "4", h: "Supports et cas", d: "Exercices construits sur de vrais dossiers anonymisés." },
            { t: "5", h: "Logistique", d: "Salle, postes avec accès au SIRH de formation, convocations, lien de classe virtuelle." } ],
          B: [
            { t: "1", h: "Storyboard", d: "Le prestataire propose la scénarisation, écran par écran." },
            { t: "2", h: "Validation métier", d: "Le référent SIRH valide les règles de gestion." },
            { t: "3", h: "Production du module", d: "Écrans, simulations de saisie, quiz, au format SCORM." },
            { t: "4", h: "Intégration en recette", d: "Le module est déposé sur l'environnement de recette de la plateforme." },
            { t: "5", h: "Contrôle qualité", d: "Contenu, suivi de complétion, accessibilité. Puis GO ou NO-GO de publication." } ],
          C: [
            { t: "Avant", h: "Séquence en ligne (30 min)", d: "Les bases de l'interface. Prérequis obligatoire avant l'atelier." },
            { t: "Ensemble", h: "Atelier de cas pratiques (2 h)", d: "Salle à Nouméa ou classe virtuelle. Uniquement des cas complexes." },
            { t: "Après", h: "Fiches réflexes et questions", d: "Aide-mémoire et espace de questions sur la plateforme." },
            { t: "Liant", h: "Un seul message", d: "Séquence et atelier s'appuient sur la même procédure DRH." },
            { t: "Contrôle", h: "Prérequis vérifiés", d: "Comptes créés, séquence suivie avant l'atelier, relances prévues." } ] } } },

      { type: "notif", scenario: "A", format: "sms", week: 5, time: "Mar. 08:52", sender: "nico",
        body: "Je viens de voir le programme. Les exercices sont trop théoriques pour ce public. Il faut qu'on revoie ça ensemble." },
      { type: "notif", scenario: "B", format: "alert", week: 5, time: "Lun. 14:10", title: "ALERTE PROJET",
        body: "La version livrée par le prestataire contient 12 erreurs de contenu signalées par le relecteur.\nNouvelle livraison annoncée sous 2 semaines." },
      { type: "notif", scenario: "C", format: "sms", week: 6, time: "Mer. 16:03", sender: "mw",
        body: "Nos agents pilotes n'ont pas fait la séquence en ligne avant l'atelier test. Ils arrivent demain sans les prérequis." },

      { type: "decision", id: "s3_alea1", scenario: "A", week: 5, time: "Mar. 09:30",
        title: "Des exercices trop théoriques",
        context: "Nicolas a raison : ses exercices reprennent le manuel de l'éditeur. Il propose d'en parler, mais son temps est facturé.",
        options: [
          { id: "a", label: "Je bloque une demi-journée avec Nicolas pour réécrire les exercices à partir de 3 dossiers réels fournis par la DRH.", quality: "good",
            effects: { budget: -5, delai: -5, qualite: 15 }, cost: "½ journée formateur",
            feedback: "Des exercices construits sur de vrais dossiers : c'est ce qui fera la différence en salle.",
            reaction: { who: "nico", mood: 1, text: "Avec de vrais dossiers, je peux faire quelque chose de très concret. Merci." } },
          { id: "b", label: "Je lui demande de les adapter seul, sans dossiers réels.", quality: "mixed",
            effects: { budget: -5, qualite: -5 },
            feedback: "Il fera de son mieux, mais sans matière réelle, les exercices resteront génériques.",
            reaction: { who: "nico", mood: 0, text: "Je vais essayer… mais sans vrais cas, ça restera théorique." } },
          { id: "c", label: "On garde : le programme a été validé.", quality: "bad",
            effects: { qualite: -15, confiance: -5 },
            feedback: "Le programme validé décrivait des objectifs, pas des exercices. Quand le formateur lui-même alerte, il faut l'écouter.",
            reaction: { who: "nico", mood: -1, text: "Entendu. Mais je vous aurai prévenu." } }
        ], best: "a", conseil: "Construire les exercices à partir de dossiers réels fournis par l'employeur." },

      { type: "decision", id: "s3_alea1", scenario: "B", week: 5, time: "Lun. 15:00",
        title: "Une version truffée d'erreurs",
        context: "Le marché prévoit des délais de correction et des pénalités. Le prestataire annonce deux semaines, ce qui ferait déborder la mise en ligne.",
        options: [
          { id: "a", label: "J'exige une correction sous 5 jours, selon les clauses du marché, avec une relecture croisée.", quality: "good",
            effects: { budget: 10, delai: -5, qualite: 10 },
            feedback: "Le marché est votre levier : les pénalités prévues compensent le temps de relecture interne. Et la relecture croisée évite une troisième livraison.",
            reaction: { who: "nico", mood: 0, text: "C'est serré, mais c'est le contrat. On s'y met." } },
          { id: "b", label: "J'accepte les deux semaines.", quality: "mixed",
            effects: { delai: -20 },
            feedback: "Vous gardez la qualité, mais la mise en ligne recule d'autant. Et vous n'avez pas utilisé les clauses du marché.",
            reaction: { who: "nico", mood: 1, text: "Merci pour votre compréhension, on fera ça bien." } },
          { id: "c", label: "Je corrige moi-même dans le module pour gagner du temps.", quality: "bad",
            effects: { budget: -15, qualite: -10 },
            feedback: "Vous faites le travail du prestataire sur votre temps, sans ses fichiers sources. La prochaine mise à jour écrasera vos corrections.",
            reaction: { who: "nico", mood: 0, text: "Attention, nos fichiers sources ne seront plus à jour…" } }
        ], best: "a", conseil: "Utiliser les clauses du marché (délais, pénalités, critères de recette) et organiser une relecture croisée." },

      { type: "decision", id: "s3_alea1", scenario: "C", week: 6, time: "Mer. 16:30",
        title: "L'atelier test est demain",
        context: "Sur 6 agents pilotes, 2 ont suivi la séquence en ligne. Le formateur est réservé, la salle aussi.",
        options: [
          { id: "a", label: "Je maintiens en ajoutant un sas de rattrapage de 30 minutes, et je cherche pourquoi ils ne l'ont pas suivie.", quality: "good",
            effects: { delai: -5, qualite: 10 },
            feedback: "C'est à ça que sert un test : découvrir ce qui coince. Ici, le prérequis n'avait été annoncé ni par la hiérarchie, ni prévu sur le temps de travail.",
            reaction: { who: "lea", mood: 1, text: "Le sas nous a sauvés. Personne ne nous avait dit que c'était obligatoire." } },
          { id: "b", label: "J'annule l'atelier test.", quality: "bad",
            effects: { delai: -15, confiance: -10 },
            feedback: "Vous perdez le test et deux semaines, sans rien apprendre sur la cause du problème.",
            reaction: { who: "mw", mood: -1, text: "Annulé ? J'avais libéré 6 agents pour ça…" } },
          { id: "c", label: "Je fais l'atelier comme prévu, tant pis.", quality: "bad",
            effects: { qualite: -15 },
            feedback: "Le formateur s'appuie sur des bases que 4 agents sur 6 n'ont pas. Le test ne teste plus rien.",
            reaction: { who: "lea", mood: -1, text: "J'ai décroché au bout de vingt minutes." } }
        ], best: "a", conseil: "Faire annoncer le prérequis par la hiérarchie, le prévoir sur le temps de travail, et prévoir un sas de rattrapage." },

      { type: "notif", scenario: ["A", "B"], format: "email", week: 6, time: "Jeu. 10:12", sender: "mw",
        from: "m.wamytan@drh-province-sud.nc", fromName: "M. Wamytan — DRH Province Sud", to: "chef.projet@ifap.nc",
        subject: "Petit ajout",
        body: { A: "Bonjour,\n\nOn en a parlé en comité de direction : ce serait bien d'ajouter les 15 chefs de service à l'atelier. Et un point sur le télétravail, tant qu'on y est.\n\nÇa ne change pas grand-chose pour vous ?\n\nM. Wamytan",
          B: "Bonjour,\n\nNos centres médico-sociaux ont des cycles de travail particuliers. Pourriez-vous ajouter un chapitre sur le décompte des congés en cycle ?\n\nÇa ne change pas grand-chose pour vous ?\n\nM. Wamytan" } },
      { type: "notif", scenario: "C", format: "sms", week: 6, time: "Ven. 11:48", sender: "lea",
        body: "Dans la séquence en ligne, on nous dit de valider le congé avant la saisie. Nicolas en atelier dit l'inverse. On fait comment ?" },

      { type: "decision", id: "s3_alea2", scenario: ["A", "B"], week: 6, time: "Jeu. 11:00",
        title: "Le périmètre s'élargit",
        context: { A: "15 participants de plus et un nouveau thème. Les crédits et le planning ont été engagés sur l'ancien périmètre.", B: "Un nouveau chapitre, non prévu au cadrage. Le bon de commande porte sur l'ancien périmètre." },
        options: [
          { id: "a", label: "Je chiffre l'impact (crédits, délai) et je propose une phase 2, avec un nouvel engagement.", detail: "La fiche de cadrage reste la référence.", quality: "good",
            effects: { budget: 10, delai: -5, confiance: 10 },
            feedback: "Vous ne dites pas non : vous rendez visible le coût de la demande. Un nouveau périmètre appelle un nouvel engagement, avec ses crédits.",
            reaction: { who: "mw", mood: 1, text: "Je n'avais pas mesuré. Une phase 2, c'est raisonnable." } },
          { id: "b", label: "J'accepte tout pour garder un bon relationnel.", quality: "bad",
            effects: { budget: -20, delai: -15, qualite: -10, confiance: 5 },
            feedback: "Plus de contenu, même crédit, même délai : c'est la pertinence qui paie. Et le bon de commande ne couvre plus la prestation.",
            reaction: { who: "mw", mood: 1, text: "Merci, je savais qu'on pouvait compter sur vous !" } },
          { id: "c", label: "Je refuse : ce n'est pas dans la fiche de cadrage.", quality: "mixed",
            effects: { confiance: -15 },
            feedback: "Vous avez raison sur le fond, mais un refus sec abîme la relation. Le cadrage sert à discuter, pas à fermer la porte.",
            reaction: { who: "mw", mood: -1, text: "Je vois. On se contentera du strict minimum, alors." } }
        ], best: "a", conseil: "Face à un élargissement de périmètre : chiffrer, rendre visible, proposer une option avec un nouvel engagement." },

      { type: "decision", id: "s3_alea2", scenario: "C", week: 6, time: "Ven. 14:00",
        title: "Deux messages contradictoires",
        context: "La séquence en ligne et le formateur ne disent pas la même chose sur la procédure. Les agents sont perdus.",
        options: [
          { id: "a", label: "Je réunis Nicolas et le référent SIRH une heure pour aligner les deux volets sur la procédure DRH officielle.", quality: "good",
            effects: { budget: -5, delai: -5, qualite: 15 },
            feedback: "Une source de vérité unique : la procédure DRH. Un dispositif hybride n'est cohérent que si ses deux volets parlent d'une seule voix.",
            reaction: { who: "nico", mood: 1, text: "En fait, c'est moi qui avais l'ancienne procédure. Bien vu." } },
          { id: "b", label: "Je demande au formateur de suivre la séquence en ligne.", quality: "mixed",
            effects: { qualite: -5 },
            feedback: "Et si c'était la séquence qui avait tort ? Sans vérifier la source, vous risquez d'aligner tout le monde sur l'erreur.",
            reaction: { who: "nico", mood: 0, text: "D'accord… mais je ne suis pas sûr que la séquence soit à jour." } },
          { id: "c", label: "Je laisse : les agents feront la part des choses.", quality: "bad",
            effects: { qualite: -20, confiance: -10 },
            feedback: "Des agents qui apprennent deux procédures contradictoires appliqueront la mauvaise une fois sur deux.",
            reaction: { who: "lea", mood: -1, text: "Du coup, j'ai saisi trois congés de travers." } }
        ], best: "a", conseil: "Désigner une source de vérité unique et aligner tous les volets du dispositif dessus." },

      { type: "notif", when: function (s) { return !s.flags.validation_ok; }, format: "alert", week: 7, time: "Lun. 09:00", title: "ALERTE PROJET",
        body: "Contenu en attente de validation métier depuis 3 semaines.\nSans validation, la réalisation ne peut pas être finalisée." },
      { type: "decision", id: "s3_validation", when: function (s) { return !s.flags.validation_ok; }, week: 7, time: "Lun. 09:20",
        title: "Une validation qui n'arrive pas",
        context: "Trois relances par mail, aucune réponse. Chaque semaine d'attente décale le déploiement.",
        options: [
          { id: "a", label: "J'appelle M. Wamytan : on nomme le référent SIRH valideur, avec 45 minutes de validation en visio cette semaine.", quality: "good",
            effects: { delai: 10, confiance: 5 }, set: { validation_ok: true },
            feedback: "Un mail de plus ne débloque rien. Un rendez-vous court, avec le bon valideur, oui.",
            reaction: { who: "mw", mood: 1, text: "Désolé, votre mail était noyé. Le référent SIRH s'en charge." } },
          { id: "b", label: "Je relance par mail chaque semaine.", quality: "mixed",
            effects: { delai: -15 },
            feedback: "Relancer, c'est bien. Changer de canal quand ça ne marche pas, c'est mieux.",
            reaction: { who: "nico", mood: -1, text: "On est à l'arrêt de notre côté…" } },
          { id: "c", label: "Sans réponse, je considère que c'est validé.", quality: "bad",
            effects: {},
            feedback: "Le silence n'est pas une validation. Et à la porte de déploiement, un contenu non validé est bloquant.",
            reaction: { who: "nico", mood: 1, text: "OK, on finalise." } }
        ], best: "a", conseil: "Cadrer le circuit de validation dès l'engagement, et changer de canal quand il bloque." },

      { type: "content", kicker: "Contrôle qualité", title: "Arbitrable ou bloquant ?",
        lead: "Tout ne se négocie pas. Certaines anomalies interdisent le déploiement, quelle que soit la pression du calendrier. Classez chaque point, puis vérifiez.",
        component: { kind: "classify", choices: ["Arbitrable", "Bloquant"], items: [
          { t: "Une règle de décompte des congés est fausse", a: "Bloquant" },
          { t: "Le contenu n'a pas été validé par l'expert métier", a: "Bloquant" },
          { t: "Le suivi de la complétion ne remonte pas dans la plateforme", a: "Bloquant" },
          { t: "La navigation est impossible au clavier", a: "Bloquant" },
          { t: "Quatre exercices au lieu des six prévus", a: "Arbitrable" },
          { t: "La vidéo d'introduction n'est pas prête", a: "Arbitrable" }
        ],
        feedback: "Arbitrable : le budget, le délai, le périmètre, le niveau de finition. Bloquant : l'exactitude, la validation, l'accès, le suivi et l'accessibilité." } },

      { type: "decision", id: "s3_pilote", week: 8, time: "Lun. 08:00",
        title: "Tout est prêt. Faites-vous un test ?",
        context: { A: "Le déroulé et les supports sont finalisés. Vous pourriez réunir 4 agents pour un test d'une heure.", B: "Le module est en recette. Vous pourriez le faire tester par 4 agents, dont 2 en brousse.", C: "Les deux volets sont finalisés. Vous pourriez faire tester l'enchaînement complet par 4 agents." },
        options: [
          { id: "a", label: "Oui : test avec 4 agents, dont un site éloigné, et relecture du fond par le référent SIRH.", quality: "good",
            effects: { budget: -5, qualite: 10 }, set: { pilot: true },
            deferred: [{ section: "s4", jauge: "delai", delta: 10, reason: "Le test de la semaine 8 a évité des reprises en plein déploiement." }],
            feedback: "Le test révèle trois points ambigus et un exercice trop long. Corrigés en deux jours, au lieu de trois semaines en plein déploiement.",
            reaction: { who: "lea", mood: 1, text: "J'ai trouvé deux pièges dans l'exercice sur les congés. Contente qu'on les ait vus avant !" } },
          { id: "b", label: "Non, on déploie directement : on a déjà assez de retard.", quality: "bad",
            effects: { delai: 5 }, set: { pilot: false },
            deferred: [{ section: "s4", jauge: "qualite", delta: -15, reason: "Pas de test en semaine 8 : les erreurs sont découvertes par les apprenants en plein déploiement." }],
            feedback: "Vous gagnez quelques jours. Mais ce sont les apprenants qui feront le test, en conditions réelles.",
            reaction: { who: "nico", mood: 0, text: "OK pour moi, on croise les doigts." } }
        ], best: "a", conseil: "Toujours un test avec quelques apprenants réels avant le déploiement." },

      { type: "notif", format: "alert", week: 8, time: "Jeu. 11:30", title: "CONTRÔLE AVANT DÉPLOIEMENT", set: { anomaly_open: true },
        body: { A: "Liste des convoqués incomplète : les agents de Thio et de l'Île des Pins n'ont reçu ni convocation, ni lien de classe virtuelle.",
          B: "Recette : le suivi de complétion ne remonte pas.\nLe statut reste bloqué à « incomplet » même après la dernière page.",
          C: "Les 2 agents de Thio et de l'Île des Pins n'ont pas de compte sur la plateforme.\nLe prérequis en ligne leur est inaccessible." } },

      { type: "gate", id: "g3", week: 8, time: "Ven. 09:00",
        title: "Porte 3 — GO déploiement ?",
        context: "M. Wamytan veut une date ferme. Avant de déployer, passez la liste de contrôle.",
        conds: [
          { t: "Contenu validé par le valideur métier", ok: function (s) { return !!s.flags.validation_ok; }, blocking: true },
          { t: { A: "Convocations et liens transmis à tous les agents", B: "Suivi de complétion opérationnel", C: "Comptes créés et prérequis accessibles à tous" }, ok: function (s) { return !s.flags.anomaly_open; }, blocking: true },
          { t: "Test réalisé avec des apprenants réels", ok: function (s) { return !!s.flags.pilot; }, blocking: false },
          { t: "Communication aux agents prête, relayée par l'employeur", ok: function () { return true; }, blocking: false }
        ],
        goLabel: "GO : je déploie", nogoLabel: "NO-GO : je corrige d'abord",
        okGo: { effects: { confiance: 5 }, feedback: "Tous les points bloquants sont levés. Le déploiement part sur des bases sûres." },
        penaltyGo: { effects: { confiance: -10 },
          deferred: [{ section: "s4", jauge: "qualite", delta: -20, reason: "Déploiement lancé avec une anomalie bloquante : des agents ne peuvent pas suivre la formation, ou leur suivi est perdu." }],
          feedback: "Vous déployez avec une anomalie bloquante. Ce n'est pas un arbitrage : c'est un défaut que les apprenants vont subir." },
        fix: { effects: { delai: -5 }, set: { anomaly_open: false, validation_ok: true }, feedback: "Vous corrigez avant de déployer : convocations, suivi ou comptes, et validation métier obtenue. Quelques jours de plus, aucun agent laissé de côté." },
        overcautious: { effects: { delai: -5 }, feedback: "Rien n'était bloquant. Le NO-GO a retardé le déploiement sans raison." },
        conseil: "Ne jamais déployer avec une anomalie bloquante : contenu non validé, accès impossible, suivi défaillant." },

      { type: "summary",
        points: ["Chaque modalité a sa chaîne de réalisation. En hybride, l'articulation des volets est un travail à part entière.", "Un élargissement de périmètre appelle un nouvel engagement, avec ses crédits.", "Arbitrable : budget, délai, périmètre, finition. Bloquant : exactitude, validation, accès, suivi, accessibilité.", "La porte GO / NO-GO protège les apprenants des défauts que le calendrier pousse à ignorer."],
        transition: "Le feu est vert. Maintenant, il faut que les agents viennent, suivent jusqu'au bout et appliquent.",
        cta: "Je déploie" }
    ] },

  /* ============ 3b. RÉALISATION — DÉPLOYER ET SUIVRE ================ */
  { id: "s4", num: 4, pnum: 3, letter: "3b", phase: "Réalisation", phaseLong: "Réalisation · déployer et suivre", title: "Déployer et suivre", weeks: [9, 11],
    beats: [
      { type: "intro", week: 9,
        hook: "Semaine 9. Tout ce qui a été préparé se confronte au réel : agendas, connexions, imprévus.",
        objective: "Organiser le déploiement, suivre la participation et réagir aux aléas du terrain.",
        learn: ["Fixer les modalités d'accès, d'obligation et de suivi", "Suivre la participation en temps réel", "Activer un plan B", "Exploiter les premiers retours"] },

      { type: "deferred" },

      { type: "content", kicker: "Fiche de cadrage · partie 5", title: "Diffusion et suivi : ce qui doit être décidé",
        lead: "Ces choix ont été posés au cadrage. Au déploiement, ils deviennent des actions. Parcourez les onglets.",
        component: { kind: "tabs", tabs: [
          { key: "acc", t: "Accès", d: "Qui inscrit ? L'agent lui-même, l'IFAP ou l'employeur. Ici : <strong>inscription par l'employeur</strong>, pour un public identifié." },
          { key: "obl", t: "Obligation", d: "La formation est-elle obligatoire ? Ici : <strong>oui, pour les agents désignés, avant la bascule du 2 juin</strong>. L'annonce vient de la hiérarchie, pas seulement de l'IFAP." },
          { key: "sui", t: "Suivi", d: "Quel niveau de suivi ? Ici : <strong>suivi nominatif de la progression</strong>, consulté chaque semaine, avec relance ciblée des inactifs." },
          { key: "emp", t: "Information employeur", d: "L'employeur reçoit-il des informations ? Ici : <strong>oui, régulièrement pendant le dispositif</strong>, puis un bilan à l'issue." },
          { key: "pb", t: "Plan B", d: "Formateur suppléant, date de repli, version classe virtuelle. Le plan B se prépare quand tout va bien." }
        ] } },

      { type: "notif", scenario: "A", format: "sms", week: 9, time: "Lun. 08:52", sender: "nico",
        body: "Désolé, je suis bloqué en province Nord. Pas de vol avant jeudi. L'atelier de demain, c'est compromis." },
      { type: "notif", scenario: "B", format: "alert", week: 11, time: "Lun. 07:30", title: "ALERTE PLATEFORME",
        body: "Taux de complétion après 3 semaines : 11 %.\n→ 89 % des inscrits n'ont pas terminé la formation." },
      { type: "notif", scenario: "C", format: "email", week: 9, time: "Lun. 10:40", sender: "mw",
        from: "m.wamytan@drh-province-sud.nc", fromName: "M. Wamytan — DRH Province Sud", to: "chef.projet@ifap.nc",
        subject: "Basculer en distanciel ?",
        body: "Bonjour,\n\nLe service de Thio et Yaté ne peut pas libérer ses agents pour venir à Nouméa. Peut-on basculer l'atelier en 100 % distanciel pour eux ?\n\nL'atelier est dans 10 jours.\n\nM. Wamytan" },

      { type: "decision", id: "s4_alea1", scenario: "A", week: 9, time: "Lun. 09:05",
        title: "Formateur bloqué, atelier demain",
        context: function (s) { return NB(s) + " agents convoqués, salle réservée. Nicolas ne pourra pas être là."; },
        options: [
          { id: "a", label: "J'appelle le formateur suppléant prévu au plan B et je lui transmets le déroulé détaillé.", quality: "good",
            effects: { budget: -5, confiance: 5 },
            feedback: "C'est tout l'intérêt d'un déroulé écrit et d'un suppléant repéré : l'atelier ne dépend plus d'une seule personne.",
            reaction: { who: "mw", mood: 1, text: "Mes agents n'ont rien vu. Bravo pour la réactivité." } },
          { id: "b", label: "Je reporte l'atelier de deux semaines.", quality: "mixed",
            effects: { delai: -20, confiance: -5 },
            feedback: "Le report protège la qualité, mais les agents ont bloqué leur agenda et la bascule approche.",
            reaction: { who: "mw", mood: -1, text: "Encore un report… Mes agents commencent à se démobiliser." } },
          { id: "c", label: "J'anime moi-même : je connais un peu le sujet.", quality: "bad",
            effects: { qualite: -15, budget: -5 },
            feedback: "Vous sauvez la date, pas l'atelier. Sans maîtrise fine du SIRH, les questions pointues restent sans réponse.",
            reaction: { who: "lea", mood: -1, text: "Personne n'a su répondre sur les congés fractionnés." } }
        ], best: "a", conseil: "Identifier un formateur suppléant dès l'engagement et disposer d'un déroulé écrit transmissible." },

      { type: "decision", id: "s4_alea1", scenario: "B", week: 11, time: "Lun. 08:00",
        title: "11 % de complétion",
        context: "La formation est en ligne depuis 3 semaines. La bascule est dans 3 semaines.",
        options: [
          { id: "a", label: "Je relance de façon ciblée : message des chefs de service et créneaux accompagnés sur le temps de travail.", quality: "good",
            effects: { budget: -5, qualite: 10, delai: 10 },
            feedback: "En autoformation, le suivi fait la complétion. Une relance par la hiérarchie et un temps dédié changent tout.",
            reaction: { who: "lea", mood: 1, text: "Le créneau du jeudi, on l'a fait à quatre. Bien plus motivant !" } },
          { id: "b", label: "J'envoie une relance automatique à tous les inscrits.", quality: "mixed",
            effects: { qualite: -5 },
            feedback: "La relance générique fait gagner quelques points. Elle ne traite pas la cause : pas de temps dédié, pas de message de la hiérarchie.",
            reaction: { who: "lea", mood: 0, text: "J'ai reçu le rappel. Mais je n'ai toujours pas de temps pour le faire." } },
          { id: "c", label: "J'attends : c'est de l'autoformation, ils ont jusqu'à la bascule.", quality: "bad",
            effects: { confiance: -5 },
            deferred: [{ section: "s5", jauge: "qualite", delta: -20, reason: "Aucun suivi des apprenants en semaine 11 : taux de complétion décevant au bilan." }],
            feedback: "Laisser les apprenants seuls, c'est la première cause d'abandon en autoformation.",
            reaction: { who: "mw", mood: -1, text: "11 % ? Je pensais que la plateforme s'occupait de ça." } }
        ], best: "a", conseil: "En autoformation, prévoir dès le cadrage un suivi actif : tableau de bord, relances ciblées, temps dédié." },

      { type: "decision", id: "s4_alea1", scenario: "C", week: 9, time: "Lun. 11:15",
        title: "Tout basculer en distanciel ?",
        context: "Le dispositif prévoit un atelier en salle. Une partie des agents ne pourra pas venir.",
        options: [
          { id: "a", label: "J'accepte pour ce service : l'atelier devient 2 classes virtuelles d'1 h 30, avec test de connexion préalable.", quality: "good",
            effects: { budget: -10, delai: -5, qualite: 5, confiance: 10 },
            feedback: "Vous adaptez la modalité, pas les objectifs. Et le test de connexion évite la mauvaise surprise de la brousse.",
            reaction: { who: "mw", mood: 1, text: "Parfait. Thio et Yaté vont enfin pouvoir suivre." } },
          { id: "b", label: "Je refuse : le dispositif a été validé ainsi.", quality: "mixed",
            effects: { confiance: -15 },
            feedback: "Le dispositif validé n'est pas figé. Refuser, c'est laisser des agents sans formation avant la bascule.",
            reaction: { who: "mw", mood: -1, text: "Donc ces agents ne seront pas formés. Je note." } },
          { id: "c", label: "J'accepte en diffusant simplement l'atelier en visio.", quality: "bad",
            effects: { qualite: -15 },
            feedback: "Un atelier conçu pour la salle ne se filme pas. Deux heures de visio passive, connexion instable : décrochage garanti.",
            reaction: { who: "lea", mood: -1, text: "On n'entendait rien et personne ne nous voyait lever la main." } }
        ], best: "a", conseil: "Adapter la modalité en conservant les objectifs : une classe virtuelle se conçoit, elle ne se filme pas." },

      { type: "notif", scenario: "A", format: "alert", week: 10, time: "Mar. 08:15", title: "ALERTE — Émargement",
        body: function (s) { return s.flags.scope === 'all' ? "Atelier SIRH — 8 h 15.\n16 agents présents sur 40 convoqués (40 %).\nLe formateur attend votre décision." : "Atelier SIRH — 8 h 15.\n5 gestionnaires présents sur 12 convoqués.\nLe formateur attend votre décision."; } },
      { type: "decision", id: "s4_presence", scenario: "A", week: 10, time: "Mar. 08:20",
        title: "Moins de la moitié des agents",
        context: "Le formateur est là, la salle est prête. Plus de la moitié des convoqués manquent.",
        options: [
          { id: "a", label: "Je maintiens pour les présents et j'enquête sur les absences pour caler une deuxième session avec les chefs de service.", quality: "good",
            effects: { budget: -5, qualite: 5, confiance: 5 },
            feedback: "Les présents ne sont pas pénalisés, et l'enquête révèle la cause : une réunion de service tombée le même jour.",
            reaction: { who: "mw", mood: 1, text: "Désolé pour la réunion de service, mon erreur. On cale la deuxième session ensemble." } },
          { id: "b", label: "J'annule et je reporte pour tout le monde.", quality: "mixed",
            effects: { budget: -10, delai: -15, confiance: -5 },
            feedback: "Le formateur est payé, les présents repartent frustrés, et rien ne garantit une meilleure présence la prochaine fois.",
            reaction: { who: "lea", mood: -1, text: "J'ai fait 1 h 30 de route depuis La Foa pour rien." } },
          { id: "c", label: "Je maintiens sans rien dire à l'employeur.", quality: "bad",
            effects: { confiance: -10 },
            deferred: [{ section: "s5", jauge: "qualite", delta: -10, reason: "Absences non traitées en semaine 10 : une partie des agents arrive à la bascule sans formation." }],
            feedback: "L'atelier a lieu, mais une partie du public n'est pas formée et personne n'en est informé.",
            reaction: { who: "mw", mood: -1, text: "J'apprends par hasard que la moitié de mes agents n'étaient pas là ?" } }
        ], best: "a", conseil: "Maintenir pour les présents, analyser les absences, et prévoir le rattrapage avec la hiérarchie." },

      { type: "decision", id: "s4_suivi", scenario: ["A", "C"], week: 10, time: "Jeu. 14:00",
        title: "Et après l'atelier ?",
        context: { A: "L'atelier est passé. La bascule est dans trois semaines. Les agents vont devoir appliquer seuls.", C: "La séquence et l'atelier sont passés. Certains agents n'ont pas fini la séquence en ligne. La bascule est dans trois semaines." },
        options: [
          { id: "a", label: "Je mets en place un suivi : point hebdomadaire, relance des inactifs, permanence questions en ligne.", quality: "good",
            effects: { budget: -5, qualite: 10 },
            feedback: "Le transfert se joue après la formation. Un suivi léger mais régulier fait la différence au moment de la bascule.",
            reaction: { who: "lea", mood: 1, text: "La permanence du mardi m'a débloquée sur deux dossiers." } },
          { id: "b", label: "Rien de plus : la formation est terminée.", quality: "bad",
            effects: {},
            deferred: [{ section: "s5", jauge: "qualite", delta: -20, reason: "Aucun suivi des apprenants après la formation : décrochage et erreurs à la bascule." }],
            feedback: "La formation est terminée, pas l'apprentissage. Sans suivi, les erreurs reviennent dès la bascule.",
            reaction: { who: "lea", mood: -1, text: "Le jour de la bascule, je ne savais plus rien faire." } }
        ], best: "a", conseil: "Prévoir un suivi des apprenants entre la formation et la mise en pratique." },

      { type: "notif", format: "alert", week: 11, time: "Ven. 17:20", title: "RETOUR TERRAIN",
        adaptive: true,
        bodyLow: "Plusieurs agents signalent que la formation ne correspond pas à leurs situations de travail réelles.\nSatisfaction à chaud : 2,1/5.",
        bodyHigh: "Satisfaction à chaud : 4,2/5.\nMais 3 agents des sites éloignés signalent des difficultés persistantes sur les cas complexes." },

      { type: "decision", id: "s4_retour", week: 11, time: "Ven. 17:45",
        title: "Que faites-vous de ce retour ?",
        context: "Les résultats à chaud sont arrivés. M. Wamytan ne les a pas encore vus.",
        options: [
          { id: "a", label: "J'analyse avec 3 agents et le formateur, j'ajuste, et j'informe M. Wamytan des actions prévues.", quality: "good",
            effects: { delai: -5, qualite: 10, confiance: 5 },
            feedback: "Un retour, même mauvais, est une information. Le partager avec un plan d'action renforce la confiance.",
            reaction: { who: "mw", mood: 1, text: "Merci de m'avoir prévenu avec des solutions. C'est rare." } },
          { id: "b", label: "Je relativise : les questionnaires à chaud sont toujours sévères.", quality: "bad",
            effects: { qualite: -10, confiance: -10 },
            feedback: "Un questionnaire à chaud n'est pas parfait, mais il dit quelque chose. L'ignorer, c'est reconduire les mêmes défauts.",
            reaction: { who: "lea", mood: -1, text: "On a répondu au questionnaire… pour rien, apparemment." } },
          { id: "c", label: "J'attends le bilan final pour en parler.", quality: "mixed",
            effects: {},
            deferred: [{ section: "s5", jauge: "confiance", delta: -10, reason: "Retours terrain non partagés en semaine 11 : l'employeur les découvre au bilan." }],
            feedback: "L'employeur découvrira ces résultats plus tard, et se demandera pourquoi il ne l'a pas su avant.",
            reaction: { who: "nico", mood: 0, text: "On en reparlera au bilan, alors." } }
        ], best: "a", conseil: "Exploiter les retours à chaud tout de suite et informer l'employeur avec un plan d'action." },

      { type: "content", kicker: "Lire les signaux", title: "Le tableau de bord du déploiement",
        lead: "Quatre indicateurs, ceux que l'IFAP suit déjà sur sa plateforme. Cliquez sur chacun pour savoir quoi en faire.",
        component: { kind: "dashboard", tiles: [
          { v: "74 %", l: "Conversion", d: "Part des inscrits qui ont démarré. Ceux qui n'ont pas démarré après une semaine ne démarreront pas seuls : relance ciblée, idéalement par le chef de service." },
          { v: "41 %", l: "Complétion", d: "Un écart entre démarrés et terminés révèle un point de décrochage. Regardez à quelle activité ils s'arrêtent." },
          { v: "18 %", l: "Inactifs > 30 j", d: "Des inscrits sans connexion depuis un mois. Au-delà, le taux de retour chute fortement : c'est le moment de relancer." },
          { v: "3,9/5", l: "Satisfaction", d: "Lisez les commentaires, pas seulement la moyenne. Trois remarques identiques valent une alerte." }
        ] } },

      { type: "summary",
        points: ["Accès, obligation, suivi, information de l'employeur : décidés au cadrage, appliqués au déploiement.", "Une présence faible ou une complétion basse se traite tout de suite, en cherchant la cause.", "Le suivi entre la formation et la mise en pratique conditionne le transfert.", "Un retour négatif partagé avec un plan d'action renforce la confiance."],
        transition: "La formation a eu lieu. Reste la question que tout employeur finit par poser : et alors, ça a servi à quoi ?",
        cta: "J'évalue" }
    ] },

  /* =================== 4. ÉVALUATION ================================ */
  { id: "s5", num: 5, pnum: 4, letter: "4", phase: "Évaluation", phaseLong: "Évaluation", title: "Évaluer les effets", weeks: [12, 12],
    beats: [
      { type: "intro", week: 12,
        hook: "Semaine 12. C'est maintenant que se voit — ou ne se voit pas — tout ce qui a été posé au cadrage.",
        objective: "Mesurer la participation, l'apprentissage, l'usage et l'impact, et en rendre compte à l'employeur.",
        learn: ["Les 4 questions de l'évaluation", "Relier chaque niveau à une donnée disponible", "Construire un bilan utile à l'employeur"] },

      { type: "deferred" },

      { type: "notif", format: "email", week: 12, time: "Lun. 08:03", sender: "mw",
        from: "m.wamytan@drh-province-sud.nc", fromName: "M. Wamytan — DRH Province Sud", to: "chef.projet@ifap.nc",
        subject: "Bilan formation SIRH",
        body: "Bonjour,\n\nLa formation a eu lieu, mais on ne voit pas encore de changement dans les pratiques. Comment on mesure l'impact ?\n\nMa direction me demande un retour pour la fin du mois.\n\nM. Wamytan" },

      { type: "content", kicker: "Repère clé", title: "Quatre questions, quatre mesures",
        lead: "Chaque niveau du modèle de Kirkpatrick répond à une question. Plus on monte, plus la mesure est exigeante — et plus elle intéresse l'employeur. Gravissez les marches.",
        component: { kind: "stairs", levels: [
          { n: 1, h: "Réaction", q: "Ont-ils participé et apprécié ?", tool: "Conversion, complétion, émargement, satisfaction à chaud", when: "Pendant et fin de formation", ex: "Complétion 82 %, satisfaction 4,2/5." },
          { n: 2, h: "Apprentissage", q: "Ont-ils appris ?", tool: "Quiz avant / après, mise en situation", when: "Début et fin", ex: "Cas complexes : 45 % → 85 % de bonnes réponses." },
          { n: 3, h: "Comportement", q: "Utilisent-ils ce qu'ils ont appris ?", tool: "Observation, données d'usage du SIRH, entretien avec le manager", when: "J+30 à J+90", ex: "9 gestionnaires sur 12 saisissent sans aide à J+45." },
          { n: 4, h: "Résultats", q: "Cela produit-il le changement recherché ?", tool: "Les indicateurs fixés au cadrage", when: "3 à 6 mois", ex: "Erreurs de saisie des congés : −60 % sur le trimestre." }
        ] } },

      { type: "content", kicker: "Activité", title: "À quel niveau ?",
        lead: "Associez chaque mesure au bon niveau. Sélectionnez un niveau pour chaque ligne, puis vérifiez.",
        component: { kind: "classify", choices: ["N1", "N2", "N3", "N4"], items: [
          { t: "Taux de complétion de la séquence en ligne : 82 %", a: "N1" },
          { t: "Quiz final : 85 % de bonnes réponses, contre 45 % au départ", a: "N2" },
          { t: "À J+45, le chef de service observe que 9 gestionnaires sur 12 saisissent sans aide", a: "N3" },
          { t: "Délai moyen de traitement d'un dossier de congé : de 6 à 2 jours", a: "N4" },
          { t: "Tickets au support SIRH : −40 % sur le trimestre", a: "N4" }
        ] } },

      { type: "decision", id: "s5_bilan", week: 12, time: "Lun. 10:00",
        title: "Que répondez-vous à M. Wamytan ?",
        context: function (s) { return s.flags.kpi_defined
          ? "Bonne nouvelle : les indicateurs fixés au cadrage vous donnent une situation de départ chiffrée."
          : "Problème : aucun indicateur n'a été fixé au cadrage. Vous n'avez pas de situation de départ chiffrée."; },
        options: [
          { id: "a", label: "Je présente un bilan aux 4 niveaux, avec résultats, limites et préconisations, et je propose une mesure à J+60.", quality: "good",
            effects: { delai: -5, qualite: 10, confiance: 15 },
            bonusIf: { flag: "kpi_defined", effects: { confiance: 5 }, text: "Les indicateurs fixés au cadrage rendent la démonstration solide : chiffres avant / après." },
            feedback: "Vous répondez à la vraie question de l'employeur : qu'est-ce qui a changé ? Et vous dites honnêtement ce qui reste à mesurer.",
            reaction: { who: "mw", mood: 1, text: "Voilà exactement ce que je peux présenter à ma direction. Merci." } },
          { id: "b", label: "J'envoie le rapport de satisfaction et les feuilles d'émargement.", quality: "bad",
            effects: { confiance: -15 },
            feedback: "Présence et satisfaction prouvent que la formation a eu lieu. Pas qu'elle a servi.",
            reaction: { who: "mw", mood: -1, text: "Je sais qu'ils sont venus. Ce que je veux savoir, c'est si ça a changé quelque chose." } },
          { id: "c", label: "Je lui explique que l'impact d'une formation ne se mesure pas vraiment.", quality: "bad",
            effects: { confiance: -20 },
            feedback: "L'impact se mesure — à condition de l'avoir prévu. Cette réponse fragilise la crédibilité de l'IFAP.",
            reaction: { who: "mw", mood: -1, text: "Alors pourquoi ma direction financerait-elle la prochaine ?" } }
        ], best: "a", conseil: "Construire le bilan sur les 4 niveaux, avec les indicateurs fixés au cadrage, et proposer une mesure à froid." },

      { type: "fiche", fiche: "kirk", text: "Une grille pour construire l'évaluation dès le cadrage." },

      { type: "summary",
        points: ["Participation, apprentissage, usage, impact : quatre questions, quatre mesures.", "Chaque niveau s'appuie sur une donnée disponible ou à prévoir.", "Les niveaux 3 et 4 ne se démontrent que si la situation de départ a été mesurée au cadrage.", "Un bon bilan montre ce qui a changé, dit ce qui reste à mesurer et propose des suites."],
        transition: "Le bilan est rendu. Dernière étape : en tirer les leçons, et décider de l'avenir de la formation.",
        cta: "Je capitalise" }
    ] },

  /* =================== 5. CAPITALISATION ============================ */
  { id: "s6", num: 6, pnum: 5, letter: "5", phase: "Capitalisation", phaseLong: "Capitalisation", title: "Capitaliser et décider de la suite", weeks: [12, 12],
    beats: [
      { type: "intro", week: 12,
        hook: "Le projet touche à sa fin. Un projet clos sans retour d'expérience, c'est un projet dont on refera les erreurs.",
        objective: "Tirer les enseignements du projet et décider du cycle de vie de la formation.",
        learn: ["Conduire un RETEX utile", "Mettre à jour les outils partagés", "Décider : maintenir, surveiller, actualiser ou retirer"] },

      { type: "content", kicker: "Méthode", title: "Le RETEX en 4 questions",
        lead: "Le retour d'expérience transforme un projet en savoir-faire collectif. Il se fait à chaud, en une heure, avec tous les acteurs.",
        component: { kind: "accordion", items: [
          { t: "Qu'est-ce qui était prévu ?", d: "On repart de la fiche de cadrage : objectifs, calendrier, crédits, indicateurs." },
          { t: "Qu'est-ce qui s'est réellement passé ?", d: "Les faits, sans jugement : retards, aléas, décisions, résultats." },
          { t: "Pourquoi ces écarts ?", d: "Les causes, pas les coupables. <em>« La validation a pris 3 semaines parce qu'aucun délai n'avait été fixé. »</em>" },
          { t: "Que change-t-on la prochaine fois ?", d: "Deux ou trois actions concrètes, avec un responsable. Et une mise à jour des trames et procédures de l'IFAP." }
        ] } },

      { type: "decision", id: "s6_retex", week: 12, time: "Ven. 09:00",
        title: "Le bilan est rendu. Et maintenant ?",
        context: "L'équipe passe déjà au dossier suivant.",
        options: [
          { id: "a", label: "J'organise un RETEX d'une heure avec l'équipe IFAP, Nicolas, Sylvie et M. Wamytan, et je mets à jour nos trames.", quality: "good",
            effects: { budget: -5, qualite: 5, confiance: 5 },
            feedback: "Le prochain projet partira de ce que vous avez appris. Et l'employeur voit un partenaire qui progresse.",
            reaction: { who: "mw", mood: 1, text: "Première fois qu'on m'invite à un RETEX. On repart ensemble l'an prochain." } },
          { id: "b", label: "Je classe le dossier : on est déjà sur le suivant.", quality: "bad",
            effects: { qualite: -10 },
            feedback: "Sans RETEX, les mêmes erreurs reviendront au prochain projet. Et personne ne saura pourquoi.",
            reaction: { who: "nico", mood: 0, text: "Dommage, j'avais plein d'idées pour la prochaine fois." } },
          { id: "c", label: "Je rédige seul une note de RETEX pour l'archive.", quality: "mixed",
            effects: {},
            feedback: "Mieux que rien. Mais un RETEX solitaire ne voit que votre point de vue, et une note archivée se lit rarement.",
            reaction: { who: "sylvie", mood: 0, text: "Vous me l'enverrez ? J'aurais eu des choses à dire sur le circuit de commande." } }
        ], best: "a", conseil: "Organiser un RETEX collectif et mettre à jour les trames et outils partagés." },

      { type: "content", kicker: "Cycle de vie", title: "Une formation n'est jamais « terminée »",
        lead: "Après sa mise en service, une formation vit, vieillit, et doit être revue. Parcourez les étapes.",
        component: { kind: "timeline", steps: [
          { t: "1", h: "En conception", d: "Cadrage, engagement et réalisation en cours." },
          { t: "2", h: "Active", d: "Ouverte aux agents, suivie avec ses indicateurs." },
          { t: "3", h: "Sous surveillance", d: "Un changement est annoncé : réglementation, outil, procédure. Une date de revue est fixée." },
          { t: "4", h: "À actualiser", d: "Le contenu n'est plus exact. Mise à jour par l'expert référent." },
          { t: "5", h: "En refonte", d: "Le besoin a changé : retour au cadrage." },
          { t: "6", h: "Retirée", d: "Plus de besoin, ou une autre réponse a pris le relais. Archivée." }
        ] } },

      { type: "decision", id: "s6_cycle", week: 12, time: "Ven. 11:00",
        title: "Le SIRH évolue en janvier",
        context: "Le service informatique annonce une nouvelle version du SIRH en janvier : les écrans de saisie des congés vont changer.",
        options: [
          { id: "a", label: "Je passe la formation au statut « sous surveillance », avec une date de revue en décembre et le référent SIRH comme expert référent.", quality: "good",
            effects: { qualite: 5, confiance: 5 },
            feedback: "La formation a un propriétaire, un expert et une date de revue. Elle ne deviendra pas fausse sans que personne ne s'en aperçoive.",
            reaction: { who: "mw", mood: 1, text: "Parfait, je préviens le référent SIRH pour décembre." } },
          { id: "b", label: "Je la laisse « active » : on verra quand les agents signaleront des erreurs.", quality: "bad",
            effects: { confiance: -10 },
            feedback: "Ce sont les apprenants qui découvriront que la formation est fausse. Et l'image de l'IFAP en pâtira.",
            reaction: { who: "lea", mood: -1, text: "En janvier, on aura une formation qui ne correspond plus aux écrans…" } },
          { id: "c", label: "Je la retire tout de suite : elle sera fausse dans trois mois.", quality: "mixed",
            effects: { qualite: -5 },
            feedback: "Trop tôt : elle reste utile jusqu'en janvier, notamment pour les nouveaux arrivants. Surveiller vaut mieux que retirer.",
            reaction: { who: "mw", mood: -1, text: "Et les deux gestionnaires qui arrivent en novembre ?" } }
        ], best: "a", conseil: "Donner à chaque formation un expert référent, une date de revue et un statut de cycle de vie." },

      { type: "fiche", fiche: "cdc", text: "Le mémo des questions à poser, aligné sur les 8 parties de la fiche de cadrage IFAP." },

      { type: "summary",
        points: ["Le RETEX collectif transforme un projet en savoir-faire pour toute l'équipe.", "Les trames et procédures se mettent à jour à partir de ce qui a été appris.", "Chaque formation a un propriétaire, un expert référent et une date de revue.", "Maintenir, surveiller, actualiser, refondre ou retirer : c'est une décision, pas un oubli."],
        transition: "Le projet est bouclé. Voyons ce que vos décisions ont produit — y compris ce que vous n'avez pas vu.",
        cta: "Je découvre mon rapport de mission" }
    ] }
  ],

  /* ===================== CRISES (seuil < 25) ======================== */
  crises: {
    budget: { format: "email", sender: "dir", from: "direction@ifap.nc", fromName: "Direction de l'IFAP", subject: "Arbitrage — projet SIRH",
      body: "Votre projet mobilise beaucoup plus de temps que prévu, et l'équipe porte d'autres dossiers. Je dois arbitrer. Que proposez-vous ?",
      title: "Crise de ressources", context: "La direction doit arbitrer entre les projets de l'équipe.",
      options: [
        { id: "a", label: "Je réduis le périmètre pour revenir dans la charge prévue.", effects: { qualite: -20 }, quality: "mixed",
          feedback: "La charge est tenue, mais une partie des objectifs saute." },
        { id: "b", label: "Je présente un point d'étape chiffré et je demande un renfort temporaire.", effects: { delai: -15, budget: 15 }, quality: "good",
          feedback: "La transparence paie : la direction accorde un renfort. Mais le point d'étape et la passation coûtent du temps." } ] },
    delai: { format: "alert", alertTitle: "ALERTE — Calendrier", body: "Le calendrier ne tient plus. L'atelier ou la mise en ligne doit être repoussé.",
      title: "Crise de calendrier", context: "Le jalon final n'est plus tenable en l'état.",
      options: [
        { id: "a", label: "Je livre en mode dégradé, à la date prévue.", effects: { qualite: -25 }, quality: "bad",
          feedback: "La date est tenue. Le contenu, lui, est incomplet." },
        { id: "b", label: "Je renégocie le calendrier avec l'employeur.", effects: { budget: -15, delai: 20 }, quality: "good",
          feedback: "Un nouveau calendrier réaliste, négocié. Il a un coût, mais il est tenable." } ] },
    qualite: { format: "sms", sender: "nico", body: "Le contenu n'est pas adapté. Les participants décrochent.",
      title: "Crise de pertinence", context: "Le formateur ou le prestataire tire la sonnette d'alarme.",
      options: [
        { id: "a", label: "Je fais retravailler les contenus en urgence.", effects: { budget: -20 }, quality: "good",
          feedback: "Coûteux, mais les contenus redeviennent pertinents." },
        { id: "b", label: "Je maintiens les contenus tels quels.", effects: { confiance: -20 }, quality: "bad",
          feedback: "Les agents décrochent, et l'employeur s'en rend compte." } ] }
  },

  /* ===================== INCIDENTS (jauge à 0) ===================== */
  incidents: {
    budget:  { title: "Arbitrage en urgence", text: "La direction de l'IFAP a demandé un point d'étape en urgence. Elle vous affecte un renfort — mais la passation coûte du temps.", cost: { delai: -20 }, restore: 30 },
    delai:   { title: "Report de six semaines", text: "L'employeur a demandé à décaler la formation de 6 semaines. Ses agents seront formés après la bascule du SIRH.", cost: { qualite: -20 }, restore: 30 },
    qualite: { title: "Insatisfaction remontée", text: "Les apprenants ont fait remonter leur insatisfaction à leur hiérarchie. L'employeur parle d'arrêter. Un plan de remédiation est engagé.", cost: { confiance: -25 }, restore: 30 }
  },

  /* Contaminations racontées (effets domino) */
  domino: {
    budget: "Ressources sous 40 : l'équipe est saturée, les jalons glissent.",
    delai: "Délai sous 30 : on raccourcit relectures et tests pour tenir les dates.",
    qualite: "Pertinence sous 20 : il faut refaire, recorriger, recommuniquer.",
    confiance: "Signal faible : l'employeur ralentit ses validations et libère moins ses agents."
  },

  /* ===================== RAPPORT ==================================== */
  report: {
    tiers: [
      { min: 80, name: "Pilote aguerri", text: "Vous avez tenu les trois contraintes sans perdre de vue l'employeur. Vos décisions d'étude et d'engagement ont porté leurs fruits jusqu'au bilan." },
      { min: 65, name: "Chef de projet solide", text: "Le projet est livré et la relation tient. Quelques décisions ont coûté plus cher que prévu : le journal ci-dessous vous dit lesquelles." },
      { min: 50, name: "En construction", text: "Le projet a abouti, mais au prix d'arbitrages difficiles. L'étude du besoin et l'engagement sont à consolider." },
      { min: 0,  name: "Projet en turbulence", text: "Le projet a traversé plusieurs crises. Chacune est une leçon. Le journal ci-dessous vous montre où tout s'est joué." }
    ],
    confianceTitle: "Confiance de l'employeur",
    confianceMessage: "La confiance de l'employeur se construit (ou se détruit) tout au long du projet, pas seulement à la livraison. On l'oublie souvent parce qu'on ne la mesure pas.",
    moodle: "Rendez-vous maintenant dans Moodle pour compléter votre évaluation finale."
  },

  fiches: {
    cdc:  { title: "Mémo de l'entretien de cadrage", short: "Mémo cadrage", desc: "Les questions à poser, partie par partie, en suivant la fiche de cadrage IFAP." },
    kirk: { title: "Grille d'évaluation en 4 niveaux", short: "Grille d'évaluation", desc: "Les 4 niveaux, avec indicateur, source de données, moment et responsable." }
  },

  sources: [
    "IFAP — Fiche de cadrage d'une formation digitale (processus Axe 2, phase 1), document interne",
    "Ardouin T. — <em>Ingénierie de formation : analyser, concevoir, réaliser, évaluer</em>, Dunod",
    "Kirkpatrick D. L. & Kirkpatrick J. D. — <em>Evaluating Training Programs: The Four Levels</em>, Berrett-Koehler",
    "Kirkpatrick Partners — <a href=\"https://www.kirkpatrickpartners.com/the-kirkpatrick-model/\" target=\"_blank\" rel=\"noopener\">The Kirkpatrick Model</a>",
    "Le Boterf G. — <em>Construire les compétences individuelles et collectives</em>, Eyrolles",
    "Parmentier C. — <em>L'ingénierie de formation : outils, méthodes, exemples</em>, Eyrolles"
  ]
};
})();
