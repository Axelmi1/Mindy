import type { CreateLessonInput } from './lesson-content.schema';

export const ENTREPRENEURSHIP_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 1 — De l'idée au besoin validé (MVP)   BEGINNER  50 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-001',
    title: 'De l\'idée au besoin validé',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Valider avant de construire',
          content: `La plus grande erreur des entrepreneurs débutants : passer 6 mois à construire un produit sans avoir parlé à un seul client.\n\nLe MVP (Minimum Viable Product) est la version la plus simple de ton produit qui permet de tester si des gens en ont vraiment besoin — et surtout s'ils sont prêts à payer.\n\n🔑 Règle d'or : valide le besoin avant de dépenser de l'argent ou du temps à construire quoi que ce soit.`,
          mindyMessage: 'Parle à 10 personnes avant d\'écrire une seule ligne de code. 🚀',
        },
        {
          type: 'quiz',
          question: 'À quoi sert le MVP (Minimum Viable Product) ?',
          options: [
            'Avoir un produit parfait dès le lancement',
            'Tester si un vrai besoin existe avec le moins de ressources possible',
            'Lever des fonds auprès d\'investisseurs',
            'Recruter une équipe complète',
          ],
          correctIndex: 1,
          mindyHint: 'Minimum = le strict nécessaire. Viable = ça marche vraiment. Product = tu le testes sur de vrais clients.',
        },
        {
          type: 'swipe',
          statement: 'Il faut une idée 100 % originale pour créer un business qui réussit.',
          isCorrect: false,
          explanation: 'Faux. La plupart des grandes boîtes reprennent des idées existantes en les exécutant mieux (Uber = taxi + appli, Airbnb = location déjà existante). L\'exécution prime sur l\'originalité.',
        },
        {
          type: 'swipe',
          statement: 'Parler à des clients potentiels avant de coder est une étape clé de la validation.',
          isCorrect: true,
          explanation: 'Vrai. Des interviews clients permettent de comprendre le problème réel avant d\'investir du temps et de l\'argent. C\'est la base de la méthode Lean Startup.',
        },
        {
          type: 'fill_blank',
          sentence: 'La version la plus simple d\'un produit permettant de tester une hypothèse s\'appelle un ___.',
          answer: 'MVP',
          choices: ['MVP', 'IPO', 'ROI', 'KPI'],
          mindyMessage: 'MVP = Minimum Viable Product. Le B.A.-BA de l\'entrepreneuriat moderne ! 💡',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 2 — Le Business Model Canvas   BEGINNER  50 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-002',
    title: 'Le Business Model Canvas',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 2,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Cartographier ton business en 1 page',
          content: `Le Business Model Canvas (BMC) est un outil visuel qui résume ton modèle d\'affaires en 9 blocs sur une seule page.\n\nLes 9 blocs :\n• Segments clients — qui sont tes clients ?\n• Proposition de valeur — pourquoi ils te choisissent toi ?\n• Canaux — comment tu les atteins ?\n• Relations clients — comment tu les fidélises ?\n• Sources de revenus — comment tu gagnes de l\'argent ?\n• Ressources clés — ce dont tu as besoin\n• Activités clés — ce que tu fais concrètement\n• Partenaires clés — qui t\'aide ?\n• Structure de coûts — tes principales dépenses\n\n💡 Le bloc central et le plus important : la proposition de valeur.`,
          mindyMessage: 'Un bon BMC tient sur une serviette de café. Si tu as besoin de 20 pages, relis-le ! ☕',
        },
        {
          type: 'match_pairs',
          pairs: [
            { term: 'Proposition de valeur', definition: 'Pourquoi le client te choisit toi plutôt qu\'un concurrent' },
            { term: 'Segment client', definition: 'Groupe précis de personnes ou d\'entreprises que tu cibles' },
            { term: 'Sources de revenus', definition: 'Comment et combien les clients paient' },
            { term: 'Structure de coûts', definition: 'Principales dépenses pour faire tourner le business' },
          ],
          mindyMessage: 'Ces 4 blocs sont le cœur financier du BMC. Maîtrise-les en priorité ! 🎯',
        },
        {
          type: 'quiz',
          question: 'Quel est le bloc CENTRAL et le plus important du Business Model Canvas ?',
          options: [
            'Structure de coûts',
            'Proposition de valeur',
            'Partenaires clés',
            'Canaux de distribution',
          ],
          correctIndex: 1,
          mindyHint: 'C\'est la réponse à : « Pourquoi un client paierait-il pour TON produit plutôt que celui du voisin ? »',
        },
        {
          type: 'swipe',
          statement: 'Le Business Model Canvas est un document de 50 pages décrivant en détail chaque aspect du business.',
          isCorrect: false,
          explanation: 'Faux. Le BMC tient sur une seule page (ou post-it). Sa force est sa simplicité : avoir une vision globale et synthétique en un coup d\'œil.',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 3 — Choisir son statut juridique   BEGINNER  75 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-003',
    title: 'Choisir son statut juridique',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 3,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Micro-entreprise, SASU, EURL… laquelle choisir ?',
          content: `En France, plusieurs statuts s\'offrent à toi :\n\n🟢 Micro-entreprise : ultra-simple, plafond de CA (77 700 € services / 188 700 € ventes), charges sociales calculées sur le CA. Idéal pour tester.\n\n🔵 EURL (Entreprise Unipersonnelle à Responsabilité Limitée) : société à associé unique, responsabilité limitée aux apports, régime TNS (Travailleur Non-Salarié).\n\n🟣 SASU (Société par Actions Simplifiée Unipersonnelle) : assimilé-salarié (protection sociale proche du salarié, hors assurance chômage), flexibilité des statuts, mais charges sociales plus élevées.\n\n⚠️ Responsabilité limitée = en cas de faillite, tes biens personnels sont protégés (sauf faute de gestion).`,
          mindyMessage: 'Pour débuter, la micro-entreprise est souvent le meilleur choix. Simple, rapide, réversible. 📋',
        },
        {
          type: 'connect_dots',
          pairs: [
            { term: 'Micro-entreprise', definition: 'Plafond de CA, charges sur chiffre d\'affaires, ultra-simple' },
            { term: 'SASU', definition: 'Assimilé-salarié, statuts flexibles, charges sociales élevées' },
            { term: 'EURL', definition: 'Associé unique, régime TNS, responsabilité limitée' },
            { term: 'Responsabilité limitée', definition: 'Biens personnels protégés en cas de faillite' },
          ],
          mindyMessage: 'Retiens surtout : micro-entreprise pour démarrer, SASU/EURL quand tu grandis. 🚀',
        },
        {
          type: 'quiz',
          question: 'Quel statut offre une protection sociale proche du salarié (maladie, retraite, prévoyance) ?',
          options: ['Micro-entreprise', 'EURL', 'SASU', 'Entrepreneur individuel classique'],
          correctIndex: 2,
          mindyHint: 'Ce statut paie plus de charges sociales, mais offre une protection sociale proche du salarié.',
        },
        {
          type: 'swipe',
          statement: 'En micro-entreprise, tu es personnellement responsable de toutes les dettes de l\'entreprise.',
          isCorrect: false,
          explanation: 'Faux depuis la loi du 14 février 2022 : tout entrepreneur individuel (micro-entreprise incluse) bénéficie de la séparation automatique entre patrimoine professionnel et personnel. Les créanciers professionnels ne peuvent pas saisir tes biens personnels. L\'EURL/SASU ajoutent une couche de protection, mais la micro protège déjà ton patrimoine perso.',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 4 — Revenus, charges et marge   INTERMEDIATE  75 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-004',
    title: 'Revenus, charges et marge brute',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 4,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Les 3 chiffres que tout entrepreneur doit maîtriser',
          content: `Pour savoir si ton business est viable, tu as besoin de 3 chiffres :\n\n💰 Chiffre d\'affaires (CA) = ce que tu factures à tes clients\n📦 Coût des ventes (COGS) = ce que ça te coûte pour produire/livrer\n📈 Marge brute = CA − Coût des ventes\n\nExemple concret :\n• Tu vends des formations à 200 € l\'unité\n• La plateforme te coûte 30 € par vente\n• Marge brute = 200 − 30 = 170 € par vente\n\n⚠️ Attention : marge brute ≠ bénéfice. Il faut encore déduire les charges fixes (loyer, salaires, logiciels…).`,
          mindyMessage: 'Un business ne survit que si ses revenus dépassent ses charges. C\'est tout. 📊',
        },
        {
          type: 'calculator',
          question: 'Tu vends des t-shirts personnalisés 35 € pièce. Chaque t-shirt te coûte 12 € (achat) + 3 € (impression). Quelle est ta marge brute par t-shirt ?',
          variables: ['Prix de vente : 35 €', 'Coût d\'achat du t-shirt : 12 €', 'Coût d\'impression : 3 €'],
          answer: 20,
          tolerance: 0,
          unit: '€',
          mindyMessage: 'Marge brute = Prix de vente − Coût total de production. Ici : 35 − 12 − 3 = 20 €. 💪',
        },
        {
          type: 'quiz',
          question: 'Un freelance facture 5 000 € / mois. Ses charges (logiciels, cotisations, bureau) s\'élèvent à 1 800 €. Quel est son bénéfice net mensuel ?',
          options: ['5 000 €', '3 200 €', '1 800 €', '6 800 €'],
          correctIndex: 1,
          mindyHint: 'Bénéfice net = CA − Total charges. 5 000 − 1 800 = ?',
        },
        {
          type: 'swipe',
          statement: 'Un chiffre d\'affaires élevé garantit que le business est rentable.',
          isCorrect: false,
          explanation: 'Faux. Un CA élevé avec des charges encore plus élevées = pertes. La rentabilité = CA > charges totales. Beaucoup de start-ups ont coulé avec un CA en croissance mais des coûts incontrôlés.',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 5 — Fixer ses prix (pricing)   INTERMEDIATE  75 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-005',
    title: 'Fixer ses prix : l\'art du pricing',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 5,
    content: {
      steps: [
        {
          type: 'info',
          title: '3 méthodes pour fixer ton prix',
          content: `Fixer son prix est l\'une des décisions les plus stratégiques. Trois approches principales :\n\n1️⃣ Cost-plus : Prix = Coût de revient + Marge souhaitée\n   Simple mais ignore la concurrence et la valeur perçue.\n\n2️⃣ Concurrentiel : tu t\'alignes sur les prix du marché\n   Risque : se retrouver dans une guerre des prix.\n\n3️⃣ Value-based : prix basé sur la valeur perçue par le client\n   Exemple : un avocat facture 500 €/h non pas à cause de ses coûts, mais parce que ça vaut 10 000 € pour son client d\'éviter un procès.\n\n💡 Règle : ton prix doit couvrir tes coûts ET refléter la valeur créée. Ne te sous-estime pas !`,
          mindyMessage: 'Un prix trop bas nuit à ta crédibilité ET à ta survie. Ose valoriser ton travail. 💎',
        },
        {
          type: 'reorder',
          title: 'Les étapes du pricing value-based',
          instruction: 'Remets dans l\'ordre les étapes pour fixer un prix basé sur la valeur',
          words: [
            'Comprendre le problème du client',
            'Quantifier la valeur de la solution (gains, économies)',
            'Fixer un prix cohérent avec cette valeur',
            'Tester le prix auprès de vrais clients',
            'Ajuster selon les retours',
          ],
          correctOrder: [0, 1, 2, 3, 4],
          hint: 'On part du client, pas de ses coûts.',
          mindyMessage: 'Le pricing value-based part du client et remonte vers le produit, pas l\'inverse. 🎯',
        },
        {
          type: 'scenario',
          situation: 'Tu lances une appli de gestion pour freelances. Ton coût de revient est de 5 €/mois par utilisateur. La concurrence propose des outils similaires à 20 €/mois. Des interviews montrent que les freelances économisent 3h de travail par semaine grâce à toi (valeur ~120 €/semaine). Quel prix fixes-tu ?',
          choices: [
            {
              text: '7 € / mois (juste au-dessus du coût)',
              isGood: false,
              explanation: 'Trop bas. Tu dévalorise ton produit et réduise ta marge. La valeur créée est bien supérieure à ce prix.',
            },
            {
              text: '19 € / mois (légèrement en dessous de la concurrence)',
              isGood: false,
              explanation: 'Stratégie de guerre des prix : tu attires des clients sensibles au prix, pas fidèles. Risque de marge faible.',
            },
            {
              text: '29 € / mois avec essai gratuit 14 jours',
              isGood: true,
              explanation: 'Excellent choix. Tu te positionnes premium, reflétes la valeur réelle (l\'utilisateur économise ~480 €/mois), et l\'essai gratuit réduit le risque perçu.',
            },
          ],
          mindyMessage: 'La valeur créée pour le client est bien plus haute que ton coût : ose le prix juste ! 💪',
        },
        {
          type: 'calculator',
          question: 'Tu vends des coaching en ligne. Ton coût de revient par session est de 15 € (plateforme + temps). Tu veux une marge de 70 %. Quel doit être ton prix de vente minimum ?',
          variables: ['Coût de revient : 15 €', 'Marge souhaitée : 70 %'],
          answer: 50,
          tolerance: 0.5,
          unit: '€',
          mindyMessage: 'Prix = Coût ÷ (1 − Marge). Ici : 15 ÷ 0,30 = 50 €. La marge de 70 % est sur le prix de vente. 🧮',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 6 — Trouver ses premiers clients   INTERMEDIATE  75 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-006',
    title: 'Trouver ses premiers clients',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 6,
    content: {
      steps: [
        {
          type: 'info',
          title: 'L\'acquisition client : les canaux qui marchent vraiment',
          content: `Trouver ses premiers clients est souvent plus dur que de créer le produit. Quelques canaux éprouvés :\n\n🤝 Réseau personnel : tes premiers 10 clients viennent souvent de personnes qui te connaissent ou qu'on te recommande.\n\n📱 Réseaux sociaux (LinkedIn, Instagram, TikTok) : contenus de valeur qui attirent ton cible.\n\n🔍 SEO / Blog : visibilité long terme sur Google. Prend 6-12 mois mais gratuit.\n\n💌 Cold email/DM : contacter directement des prospects qualifiés. Taux de réponse ~5-10 %.\n\n🤑 Publicité payante (Meta Ads, Google Ads) : rapide mais coûteux. À utiliser une fois que tu valides la conversion.\n\n⚡ Règle : en B2B, le réseau et le cold email. En B2C, les réseaux sociaux et le SEO.`,
          mindyMessage: 'Tes 10 premiers clients viennent souvent de ton entourage. Ne sous-estime pas ton réseau ! 🤝',
        },
        {
          type: 'swipe_sequence',
          title: 'Canal ou pas encore ?',
          instruction: 'Swipe DROITE si c\'est une bonne stratégie pour un TOUT PREMIER client (budget 0), GAUCHE si c\'est prématuré',
          leftLabel: 'Prématuré ❌',
          rightLabel: 'Pertinent ✅',
          cards: [
            {
              id: 'acq-1',
              content: 'Contacter 20 personnes de ton réseau pour leur présenter ton service',
              correctDirection: 'right',
              explanation: 'Excellent premier canal. Gratuit, rapide, et le taux de conversion est plus élevé quand il y a confiance.',
            },
            {
              id: 'acq-2',
              content: 'Lancer une campagne Google Ads avec 500 € de budget',
              correctDirection: 'left',
              explanation: 'Trop tôt. Sans valider ton tunnel de conversion, tu brûleras ton budget sans comprendre pourquoi ça ne convertit pas.',
            },
            {
              id: 'acq-3',
              content: 'Publier du contenu de valeur sur LinkedIn pendant 30 jours',
              correctDirection: 'right',
              explanation: 'Stratégie organique efficace, surtout en B2B. Elle prend du temps mais coûte 0 €.',
            },
            {
              id: 'acq-4',
              content: 'Créer une chaîne YouTube avec des tutoriels sur ton expertise',
              correctDirection: 'left',
              explanation: 'Pertinent à long terme, mais trop chronophage pour obtenir des clients cette semaine. Commence par du direct.',
            },
          ],
          timeLimit: 60,
          mindyMessage: 'Pour tes premiers clients : rapide, gratuit, direct. La pub vient après. ⚡',
        },
        {
          type: 'quiz',
          question: 'En B2B (vente à des entreprises), quel canal donne généralement les meilleurs résultats pour les premiers clients ?',
          options: [
            'TikTok et Instagram Reels',
            'Réseau personnel et cold email qualifié',
            'Publicité TV',
            'Distribution de flyers',
          ],
          correctIndex: 1,
          mindyHint: 'En B2B, la relation et la confiance priment. Le contact direct et personnalisé l\'emporte.',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 7 — Trésorerie & cashflow   INTERMEDIATE  100 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-007',
    title: 'Trésorerie : pourquoi les rentables coulent',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'INTERMEDIATE',
    xpReward: 100,
    orderIndex: 7,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Trésorerie ≠ Rentabilité',
          content: `C\'est le piège le plus dangereux en entrepreneuriat : un business peut être rentable SUR LE PAPIER et couler faute de cash.\n\nComment ? Le décalage de trésorerie :\n• Tu livres en janvier → client paie en mars (délai de paiement 60 jours)\n• Mais tu dois payer tes fournisseurs en février\n→ Tu es rentable mais tu manques de cash pour payer.\n\n📊 Cashflow = argent qui rentre − argent qui sort (sur une période donnée)\n\n🔴 Cashflow négatif = danger immédiat, même si tu es rentable\n🟢 Cashflow positif = tu peux payer tes charges et investir\n\n💡 Conseil : surveille ton solde bancaire chaque semaine, pas seulement en fin de mois.`,
          mindyMessage: 'Cash is king. Un business sans liquidités, c\'est comme une voiture sans essence : elle ne roule plus. ⛽',
        },
        {
          type: 'calculator',
          question: 'En janvier, ton entreprise génère 8 000 € de CA (payables à 60 jours). Tu dois payer 3 500 € de loyer + salaires ce mois-ci. Tu as 4 000 € en banque. Quel sera ton solde bancaire fin janvier ?',
          variables: [
            'Solde initial en banque : 4 000 €',
            'CA janvier (encaissé en mars, pas maintenant) : 8 000 €',
            'Charges à payer ce mois : 3 500 €',
          ],
          answer: 500,
          tolerance: 0,
          unit: '€',
          mindyMessage: 'Solde fin janvier = 4 000 − 3 500 = 500 €. Le CA de 8 000 € ne rentre qu\'en mars ! ⚠️',
        },
        {
          type: 'speed_round',
          title: 'Trésorerie : vrai ou faux ?',
          pairs: [
            { statement: 'Un business rentable peut faire faillite par manque de trésorerie', isTrue: true },
            { statement: 'Cashflow positif signifie que l\'entreprise est rentable', isTrue: false },
            { statement: 'Les délais de paiement clients peuvent créer un manque de trésorerie', isTrue: true },
            { statement: 'Surveiller son solde bancaire chaque jour est paranoïaque et inutile', isTrue: false },
            { statement: 'Négocier des délais de paiement avec ses fournisseurs améliore la trésorerie', isTrue: true },
            { statement: 'Une forte croissance du CA garantit une bonne trésorerie', isTrue: false },
          ],
          timeLimitSeconds: 45,
        },
        {
          type: 'scenario',
          situation: 'Tu as décroché un contrat de 50 000 € avec une grande entreprise. Super ! Sauf que le paiement est à 90 jours, et tu dois avancer 30 000 € pour démarrer (salaires, matériaux). Tu as 15 000 € en banque.',
          choices: [
            {
              text: 'Refuser le contrat, trop risqué',
              isGood: false,
              explanation: 'Dommage. Une solution existe : l\'affacturage ou un prêt court terme. Refuser un bon contrat par manque de connaissance coûte cher.',
            },
            {
              text: 'Accepter sans rien prévoir et espérer que ça passe',
              isGood: false,
              explanation: 'Très dangereux. Tu vas manquer de trésorerie au bout de quelques semaines. Beaucoup de PME coulent ainsi.',
            },
            {
              text: 'Négocier un acompte de 30 % à la signature + explorer l\'affacturage',
              isGood: true,
              explanation: 'Parfait ! Un acompte réduit le besoin en fonds de roulement. L\'affacturage permet de céder ta créance à un organisme qui t\'avance le cash immédiatement.',
            },
          ],
          mindyMessage: 'La solution : acompte + affacturage. Les entrepreneurs qui savent gérer leur tréso gagnent les gros contrats. 🏆',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 8 — Le pitch & lever des fonds   ADVANCED  100 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-008',
    title: 'Pitcher et lever des fonds',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'ADVANCED',
    xpReward: 100,
    orderIndex: 8,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Les étapes du financement d\'une startup',
          content: `Lever des fonds suit des étapes bien définies :\n\n🌱 Amorçage (Seed) : 50 k€ – 500 k€ → Business Angels, Love Money, aides publiques (BPI France). Pour valider le produit.\n\n🚀 Série A : 1 M€ – 5 M€ → Fonds de Venture Capital. Pour accélérer la croissance une fois le product-market fit trouvé.\n\n📈 Série B / C : > 5 M€ → Pour scaler nationalement / internationalement.\n\n💡 Règle : lève de l\'argent UNIQUEMENT si tu sais précisément à quoi le dépenser et si ça accélère une croissance déjà prouvée. Lever trop tôt = diluer pour rien.\n\n⚠️ Dilution : à chaque levée, tu cèdes un pourcentage de ta société. Si tu cèdes 20 % à chaque tour, après 3 tours tu ne possèdes plus que 51 %. Attention !`,
          mindyMessage: 'Lever des fonds, c\'est vendre une partie de ton futur. Assure-toi que ça accélère vraiment. 💼',
        },
        {
          type: 'timeline_builder',
          title: 'Les étapes de financement d\'une startup',
          events: [
            { id: 'ev-1', label: 'Love Money & Bootstrap', year: 'Étape 1', emoji: '❤️' },
            { id: 'ev-2', label: 'Subventions & concours (BPI, French Tech)', year: 'Étape 2', emoji: '🏆' },
            { id: 'ev-3', label: 'Business Angels (Amorçage / Seed)', year: 'Étape 3', emoji: '😇' },
            { id: 'ev-4', label: 'Venture Capital Série A', year: 'Étape 4', emoji: '🚀' },
            { id: 'ev-5', label: 'Série B / C (scale international)', year: 'Étape 5', emoji: '🌍' },
          ],
          explanation: 'Le financement suit une progression logique : d\'abord valider avec son propre argent, puis des aides, puis des investisseurs professionnels. Chaque étape correspond à un niveau de risque décroissant pour l\'investisseur.',
          mindyMessage: 'On ne lève pas une Série A avant d\'avoir prouvé que ça marche. L\'ordre compte ! 📈',
        },
        {
          type: 'drag_sort',
          question: 'Dans un pitch de 5 minutes pour des investisseurs, dans quel ordre présentes-tu ces éléments ?',
          items: [
            { id: 'p1', label: 'Le problème', emoji: '❓', value: 'Pourquoi ça compte' },
            { id: 'p2', label: 'La solution', emoji: '💡', value: 'Ton produit' },
            { id: 'p3', label: 'Le marché', emoji: '📊', value: 'Taille et opportunité' },
            { id: 'p4', label: 'Traction & métriques', emoji: '📈', value: 'Preuves concrètes' },
            { id: 'p5', label: 'L\'équipe', emoji: '👥', value: 'Pourquoi vous ?' },
            { id: 'p6', label: 'Le besoin de financement', emoji: '💰', value: 'Combien et pour quoi' },
          ],
          correctOrder: [0, 1, 2, 3, 4, 5],
          explanation: 'Un bon pitch suit la logique : créer l\'empathie (problème) → montrer la solution → prouver l\'opportunité marché → rassurer avec les preuves → inspirer confiance (équipe) → demander les fonds.',
          mindyMessage: 'Les investisseurs entendent 1 000 pitchs par an. L\'ordre et la clarté font la différence. 🎤',
        },
        {
          type: 'quiz',
          question: 'Tu as 40 % de ta startup. Tu fais une levée Série A et cèdes 25 %. Quel est ton nouveau pourcentage du capital ?',
          options: ['15 %', '30 %', '40 %', '25 %'],
          correctIndex: 1,
          mindyHint: 'Tu gardes 75 % de tes 40 %. Calcul : 40 % × 0,75 = ?',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 9 — Product-Market Fit & pivoter   ADVANCED  125 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-009',
    title: 'Product-Market Fit : trouver ou pivoter',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'ADVANCED',
    xpReward: 125,
    orderIndex: 9,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Qu\'est-ce que le Product-Market Fit ?',
          content: `Le Product-Market Fit (PMF), c'est le moment où ton produit répond si bien à un besoin réel que les clients reviennent, recommandent, et seraient vraiment déçus s\'il disparaissait.\n\n📏 Comment le mesurer ? Le test de Sean Ellis : « Vous seriez très déçu si le produit disparaissait ? ». Si > 40 % répondent « Très déçu », tu as le PMF.\n\n🔄 Pivoter = changer de direction stratégique tout en réutilisant ce que tu as appris et construit. Ce n\'est PAS un échec : Slack était au départ un jeu vidéo, Instagram une appli de check-in.\n\n❗ Signe d\'absence de PMF : taux de rétention faible, clients partent rapidement, acquisition coûteuse, bouche-à-oreille inexistant.\n\n💡 Persévérer vs pivoter : si le problème est réel et que tu n\'as pas la bonne solution → pivote. Si la solution est bonne mais mal connue → itère.`,
          mindyMessage: 'Le PMF n\'est pas une théorie : c\'est quand les clients vendent ton produit à ta place. 🔥',
        },
        {
          type: 'scenario',
          situation: 'Tu as lancé une appli de méditation pour étudiants. Après 3 mois : 500 téléchargements, mais seulement 30 utilisateurs actifs par semaine. Le taux de rétention à 30 jours est de 8 %. Les 10 interviews que tu fais révèlent que les étudiants veulent surtout gérer leur anxiété aux examens, pas méditer au quotidien. Que fais-tu ?',
          choices: [
            {
              text: 'Continuer exactement comme maintenant et dépenser plus en pub',
              isGood: false,
              explanation: 'Sans PMF, plus de pub = jeter de l\'argent. Tu accélères sur un mauvais axe. La pub ne répare pas un problème de produit.',
            },
            {
              text: 'Pivoter vers une appli de gestion du stress aux examens, avec exercices express de 2 minutes',
              isGood: true,
              explanation: 'Excellent pivot ! Tu gardes ta technologie et ton expertise, mais tu réponds au vrai besoin identifié dans les interviews. C\'est du PMF-driven development.',
            },
            {
              text: 'Abandonner complètement et changer de secteur',
              isGood: false,
              explanation: 'Trop radical. Tu as un marché réel (l\'anxiété des étudiants), une base technique, et des apprentissages précieux. Un pivot ciblé est plus intelligent qu\'un abandon total.',
            },
          ],
          mindyMessage: 'Les interviews t\'ont dit quoi faire. Le pivot n\'est pas un échec, c\'est de l\'intelligence. 🧠',
        },
        {
          type: 'word_scramble',
          word: 'RETENTION',
          hint: 'Indicateur clé du PMF : pourcentage d\'utilisateurs qui reviennent après leur première utilisation',
          scrambled: ['R', 'E', 'T', 'E', 'N', 'T', 'I', 'O', 'N'],
          mindyMessage: 'La rétention est LE signal du PMF. Si les gens reviennent, tu tiens quelque chose. 📊',
        },
        {
          type: 'quiz',
          question: 'Selon le test de Sean Ellis, à partir de quel pourcentage de « Très déçus » considère-t\'on avoir le Product-Market Fit ?',
          options: ['10 %', '25 %', '40 %', '60 %'],
          correctIndex: 2,
          mindyHint: 'Ce seuil a été établi empiriquement par Sean Ellis après avoir analysé des dizaines de startups.',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leçon 10 — Arnaques aux entrepreneurs   ADVANCED  125 XP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-010',
    title: 'Arnaques aux entrepreneurs : repère-les !',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'ADVANCED',
    xpReward: 125,
    orderIndex: 10,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Les arnaques qui ciblent les entrepreneurs',
          content: `Les entrepreneurs débutants sont des cibles privilégiées pour les escrocs. Voici les arnaques les plus courantes :\n\n❌ Fausses subventions : « Vous avez été sélectionné pour 5 000 € d\'aide » → Il faut payer des frais de dossier. JAMAIS de frais pour recevoir une vraie subvention.\n\n❌ Faux investisseurs : quelqu\'un intéressé par ton projet demande un business plan payant ou des frais de due diligence.\n\n❌ Prestataires fantômes : agences de référencement, de création web qui prennent l\'acompte et disparaissent.\n\n❌ Formations escroqueries : formations en ligne à 2 000 € prometant de « devenir riche rapidement ».\n\n✅ Règles de protection : vérifie toujours l\'identité, ne paie jamais des frais pour recevoir de l\'argent, consulte le registre SIRET/Infogreffe.`,
          mindyMessage: 'Si quelqu\'un te demande de PAYER pour RECEVOIR de l\'argent : c\'est une arnaque à 100 %. 🚨',
        },
        {
          type: 'spot_the_scam',
          question: 'Un de ces 3 messages est une arnaque. Laquelle ?',
          cards: [
            {
              id: 'sc-1',
              type: 'email',
              content: 'Bonjour, suite à votre inscription sur notre plateforme, votre dossier a été pré-sélectionné pour une subvention de 8 500 € dans le cadre du dispositif ACRE. Pour débloquer les fonds, merci de régler les frais administratifs de 89 € par virement. Votre virement sera remboursé à réception.',
              sender: 'subventions-entrepreneurs-france@aide-pme.net',
              isScam: true,
              redFlags: [
                'Frais demandés pour recevoir une aide (jamais légal)',
                'Domaine email non officiel (@aide-pme.net au lieu de .gouv.fr)',
                'Promesse de remboursement des frais (technique classique d\'arnaque)',
                'Montant précis et attractif pour créer l\'urgence',
              ],
            },
            {
              id: 'sc-2',
              type: 'email',
              content: 'Bonjour, je suis chef de projet chez BPI France. Nous organisons un atelier gratuit « Financer son projet innovant » le 15 mars à Paris. Inscription via bpifrance.fr/evenements. Cordialement.',
              sender: 'evenements@bpifrance.fr',
              isScam: false,
            },
            {
              id: 'sc-3',
              type: 'site',
              content: 'Rejoignez notre réseau de 50 000 entrepreneurs. Formation « Lancer son business en 30 jours » — témoignages vérifiés, certification reconnue. Tarif : 149 €. Satisfait ou remboursé 30 jours.',
              sender: 'formation-entrepreneurs.com',
              isScam: false,
            },
          ],
          explanation: 'Le premier email est l\'arnaque : il demande des frais (89 €) pour débloquer une subvention. En France, aucune aide publique (ACRE, BPI, Région) ne demande de paiement préalable. Le domaine @aide-pme.net n\'est pas gouvernemental. Les vrais organismes utilisent .gouv.fr ou .bpifrance.fr.',
          mindyMessage: 'Règle universelle : une vraie subvention ne demande JAMAIS de frais. Signale sur cybermalveillance.gouv.fr. 🛡️',
        },
        {
          type: 'budget_allocator',
          totalBudget: 10000,
          categories: [
            { label: 'Développement produit', icon: '💻', targetPercent: 40, minPercent: 25, maxPercent: 60 },
            { label: 'Marketing & acquisition', icon: '📣', targetPercent: 25, minPercent: 10, maxPercent: 40 },
            { label: 'Juridique & administratif', icon: '⚖️', targetPercent: 15, minPercent: 5, maxPercent: 25 },
            { label: 'Trésorerie de sécurité', icon: '🏦', targetPercent: 20, minPercent: 10, maxPercent: 30 },
          ],
          explanation: 'Pour un premier budget de 10 000 €, la répartition idéale met l\'accent sur le produit (40 %), puis le marketing pour valider l\'acquisition (25 %), une réserve de trésorerie (20 %) pour absorber les imprévus, et le juridique/admin (15 %) pour être en règle.',
        },
        {
          type: 'quiz',
          question: 'Un « investisseur » t\'écrit : ton projet l\'intéresse, mais il demande 200 € de « frais de due diligence » avant de te présenter à son fonds. C\'est…',
          options: [
            'Une pratique normale dans le monde du VC',
            'Une arnaque : aucun investisseur sérieux ne fait payer pour étudier un dossier',
            'Acceptable si le montant est inférieur à 500 €',
            'Obligatoire pour les levées supérieures à 1 M€',
          ],
          correctIndex: 1,
          mindyHint: 'Un vrai investisseur gagne de l\'argent quand il investit et que la startup réussit — pas en faisant payer des frais.',
        },
      ],
    },
  },
];
