import type { CreateLessonInput } from './lesson-content.schema';

export const TAXES_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  // ─── LEÇON 1 : Le barème progressif & les tranches (BEGINNER) ───────────────
  {
    id: 'demo-taxes-001',
    title: 'Le barème : seul le dépassement est taxé',
    domain: 'TAXES',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Le barème progressif, kesako ?',
          content: `L'impôt sur le revenu en France est PROGRESSIF : ton revenu est découpé en tranches, chacune taxée à un taux différent.\n\n📊 Tranches 2024 (barème annuel) :\n• Jusqu'à 11 294 € → 0 %\n• De 11 295 € à 28 797 € → 11 %\n• De 28 798 € à 82 341 € → 30 %\n• De 82 342 € à 177 106 € → 41 %\n• Au-delà de 177 106 € → 45 %\n\n⚠️ Idée clé : si tu gagnes 30 000 €, tu ne paies PAS 30 % sur tout ton revenu. Seuls les 1 203 € qui dépassent la tranche à 11 % sont taxés à 30 %.`,
          mindyMessage: 'Passer dans la tranche à 30 % ne veut pas dire perdre de l\'argent — seul le surplus est taxé plus fort ! 💡',
        },
        {
          type: 'quiz',
          question: 'Lucas gagne 30 000 € par an. Quelle part de son revenu est taxée à 30 % ?',
          options: [
            '30 000 € (tout son revenu)',
            '17 502 € (la part imposée à 11 %)',
            '1 203 € (la part entre 28 798 et 30 000 €)',
            'Rien, il est exonéré',
          ],
          correctIndex: 2,
          mindyHint: 'Seul ce qui dépasse le seuil de 28 797 € entre dans la tranche à 30 %.',
        },
        {
          type: 'swipe',
          statement: 'Passer dans la tranche à 41 % réduit ton revenu net total.',
          isCorrect: false,
          explanation: 'FAUX. Seuls les euros au-dessus du seuil (82 342 €) sont taxés à 41 %. Gagner un euro de plus ne fait jamais baisser ton net — c\'est le principe du barème progressif.',
        },
        {
          type: 'match_pairs',
          pairs: [
            { term: '0 %', definition: 'Part du revenu jusqu\'à 11 294 €' },
            { term: '11 %', definition: 'Part entre 11 295 € et 28 797 €' },
            { term: '30 %', definition: 'Part entre 28 798 € et 82 341 €' },
            { term: '45 %', definition: 'Part au-delà de 177 106 €' },
          ],
          mindyMessage: 'Retiens ces seuils — ils reviennent chaque année dans la déclaration ! 🗂️',
        },
      ],
    },
  },

  // ─── LEÇON 2 : Brut, net, net imposable (BEGINNER) ──────────────────────────
  {
    id: 'demo-taxes-002',
    title: 'Brut, net, net imposable : les 3 chiffres clés',
    domain: 'TAXES',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 2,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Décryptage de ta fiche de paie',
          content: `Trois montants à connaître absolument :\n\n1️⃣ **Salaire brut** : ce que ton employeur te verse avant toutes les cotisations sociales.\n\n2️⃣ **Salaire net** : ce qui est versé sur ton compte (brut − cotisations salariales ≈ brut × 78 %).\n\n3️⃣ **Revenu net imposable** : base sur laquelle l'impôt est calculé (net + cotisations CSG/CRDS non déductibles − abattement 10 % pour frais professionnels, plafonné à 14 171 €).\n\nExemple : Brut 3 000 € → Net ~2 340 € → Net imposable ~2 550 €.`,
          mindyMessage: 'Le net imposable peut être SUPÉRIEUR au net perçu — les cotisations CSG/CRDS partiellement non déductibles s\'y ajoutent. Surprenant, non ? 🤔',
        },
        {
          type: 'fill_blank',
          sentence: 'L\'impôt sur le revenu est calculé sur le revenu net ___, pas sur le salaire brut.',
          answer: 'imposable',
          choices: ['imposable', 'brut', 'perçu', 'fictif'],
          mindyMessage: 'Net imposable ≠ net perçu. Nuance importante pour la déclaration !',
        },
        {
          type: 'drag_sort',
          question: 'Classe ces montants du plus grand au plus petit (sur une même paie) :',
          items: [
            { id: 'brut', label: 'Salaire brut', emoji: '💼', value: '3 000 €' },
            { id: 'net-imposable', label: 'Net imposable', emoji: '🧾', value: '~2 550 €' },
            { id: 'net', label: 'Salaire net perçu', emoji: '💳', value: '~2 340 €' },
          ],
          correctOrder: [0, 1, 2],
          explanation: 'Le brut est le plus élevé. Le net imposable est légèrement supérieur au net perçu (CSG/CRDS non déductible). Le net est ce que tu touches vraiment.',
          mindyMessage: 'Brut > Net imposable > Net perçu. Grave cette formule dans ta mémoire ! 🧠',
        },
      ],
    },
  },

  // ─── LEÇON 3 : Le prélèvement à la source (BEGINNER) ────────────────────────
  {
    id: 'demo-taxes-003',
    title: 'Le prélèvement à la source expliqué',
    domain: 'TAXES',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 3,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Payer l\'impôt en temps réel',
          content: `Depuis janvier 2019, l'impôt est prélevé directement sur ta paie chaque mois : c'est le **prélèvement à la source (PAS)**.\n\nComment ça marche ?\n• L'administration fiscale calcule un taux en septembre N-1 à partir de ta déclaration.\n• Ce taux est transmis à ton employeur, qui déduit l'impôt directement.\n• En mai-juin de l'année suivante, tu fais quand même une déclaration pour ajuster (trop-perçu ou complément).\n\nTu peux choisir entre :\n- Taux **personnalisé** (foyer)\n- Taux **individualisé** (chaque conjoint son taux)\n- Taux **neutre** (barème seul, sans infos personnelles)`,
          mindyMessage: 'Plus de mauvaise surprise en septembre : tu paies au fur et à mesure. Un vrai soulagement pour la tréso ! 📅',
        },
        {
          type: 'swipe_sequence',
          title: 'Prélèvement à la source : vrai ou faux ?',
          instruction: 'Swipe à droite si l\'affirmation est VRAIE, à gauche si elle est FAUSSE.',
          leftLabel: 'FAUX ❌',
          rightLabel: 'VRAI ✅',
          cards: [
            {
              id: 'pas-1',
              content: 'Avec le PAS, la déclaration de revenus annuelle est supprimée.',
              correctDirection: 'left',
              explanation: 'FAUX. La déclaration existe toujours — elle sert à l\'ajustement final (remboursement ou complément).',
            },
            {
              id: 'pas-2',
              content: 'Le taux neutre protège la confidentialité de ta situation fiscale vis-à-vis de ton employeur.',
              correctDirection: 'right',
              explanation: 'VRAI. Le taux neutre ne révèle pas tes revenus annexes ni ta situation de famille à l\'employeur.',
            },
            {
              id: 'pas-3',
              content: 'Le PAS a été mis en place en janvier 2019 en France.',
              correctDirection: 'right',
              explanation: 'VRAI. Après plusieurs reports, le prélèvement à la source est entré en vigueur le 1er janvier 2019.',
            },
            {
              id: 'pas-4',
              content: 'Le taux individualisé permet à chaque conjoint d\'avoir son propre taux selon ses revenus.',
              correctDirection: 'right',
              explanation: 'VRAI. C\'est l\'option pour les couples avec des revenus très différents — chacun paie selon son propre taux.',
            },
          ],
          timeLimit: 60,
          mindyMessage: 'Le PAS : tu paies moins d\'un coup, mais tu paies quand même ! Anticiper reste la clé. 🎯',
        },
      ],
    },
  },

  // ─── LEÇON 4 : Quotient familial & parts fiscales (BEGINNER) ────────────────
  {
    id: 'demo-taxes-004',
    title: 'Quotient familial : l\'impôt s\'adapte à ta famille',
    domain: 'TAXES',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 4,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Comment les parts fiscales réduisent l\'impôt',
          content: `Le **quotient familial** divise ton revenu imposable par un nombre de parts qui dépend de ta situation :\n\n• Célibataire sans enfant → 1 part\n• Couple marié/pacsé sans enfant → 2 parts\n• + 1 enfant → +0,5 part (soit 2,5)\n• + 2 enfants → +1 part (soit 3)\n• + 3 enfants → +2 parts (soit 4)\n\nLe revenu est divisé par le nombre de parts, puis l'impôt est calculé sur ce quotient, puis multiplié par les parts.\n\n🎯 Résultat : plus tu as de parts, moins tu paies d'impôt — à revenu égal.`,
          mindyMessage: 'Les enfants coûtent cher, mais ils rapportent des parts ! 😄 (Jusqu\'à un plafond de 1 759 € d\'avantage par demi-part supplémentaire.)',
        },
        {
          type: 'quiz',
          question: 'Un couple marié avec 2 enfants dispose de combien de parts fiscales ?',
          options: ['2 parts', '2,5 parts', '3 parts', '4 parts'],
          correctIndex: 2,
          mindyHint: '2 parts (couple) + 0,5 (1er enfant) + 0,5 (2e enfant) = ?',
        },
        {
          type: 'connect_dots',
          pairs: [
            { term: 'Célibataire sans enfant', definition: '1 part' },
            { term: 'Couple sans enfant', definition: '2 parts' },
            { term: 'Couple + 1 enfant', definition: '2,5 parts' },
            { term: 'Couple + 3 enfants', definition: '4 parts' },
            { term: 'Parent isolé + 1 enfant', definition: '2 parts (majoration)' },
          ],
          mindyMessage: 'Chaque demi-part supplémentaire plafonne son avantage à 1 759 € d\'impôt en moins. 🧮',
        },
      ],
    },
  },

  // ─── LEÇON 5 : Crédits & réductions d'impôt (INTERMEDIATE) ─────────────────
  {
    id: 'demo-taxes-005',
    title: 'Crédits et réductions : comment payer moins (légalement)',
    domain: 'TAXES',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 5,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Réduction vs crédit d\'impôt : la différence clé',
          content: `Deux mécanismes permettent de diminuer ton impôt :\n\n🔴 **Réduction d\'impôt** : déduit directement de l\'impôt dû. Si ton impôt est nul, tu ne perçois rien (elle s\'annule).\n\n🟢 **Crédit d\'impôt** : déduit de l\'impôt dû ET remboursé si tu ne dois pas suffisamment d\'impôt. Tu peux donc recevoir un chèque du fisc !\n\nExemples courants :\n• Don à une association (66 % du don, réduction, plafonné à 20 % du revenu)\n• Garde d\'enfant < 6 ans (50 % des dépenses, crédit, plafonné à 1 150 € par enfant)\n• Emploi à domicile (50 % des salaires, crédit/réduction selon situation)\n• Travaux d\'économie d\'énergie MaPrimeRénov' (crédit)`,
          mindyMessage: 'Crédit > Réduction si tu paies peu d\'impôt — le crédit te revient en cash ! 💸',
        },
        {
          type: 'quiz',
          question: 'Sofia paie 0 € d\'impôt. Elle a un crédit d\'impôt garde d\'enfant de 500 €. Que se passe-t-il ?',
          options: [
            'Elle ne reçoit rien (impôt nul = pas de bénéfice)',
            'Elle reçoit 500 € remboursés par l\'État',
            'Elle reçoit 250 € (crédit divisé par 2)',
            'Elle reporte le crédit à l\'année suivante',
          ],
          correctIndex: 1,
          mindyHint: 'Le crédit d\'impôt est remboursable, même si tu ne dois pas d\'impôt.',
        },
        {
          type: 'budget_allocator',
          totalBudget: 1000,
          categories: [
            { label: 'Dons (réduction 66 %)', icon: '🤝', targetPercent: 30, minPercent: 10, maxPercent: 50 },
            { label: 'Garde d\'enfant (crédit 50 %)', icon: '👶', targetPercent: 40, minPercent: 10, maxPercent: 60 },
            { label: 'Emploi domicile (crédit 50 %)', icon: '🏠', targetPercent: 20, minPercent: 5, maxPercent: 40 },
            { label: 'Autres dépenses', icon: '📋', targetPercent: 10, minPercent: 0, maxPercent: 30 },
          ],
          explanation: 'Les dépenses éligibles aux crédits/réductions réduisent directement ton impôt. La garde d\'enfant et l\'emploi à domicile offrent les meilleurs retours (50 %). Les dons sont aussi très avantageux (66 % déductibles).',
        },
        {
          type: 'speed_round',
          title: 'Crédit ou réduction ? Testez vos réflexes !',
          pairs: [
            { statement: 'Le crédit garde d\'enfant peut être remboursé si tu ne paies pas d\'impôt.', isTrue: true },
            { statement: 'La réduction pour don est remboursée même si ton impôt est nul.', isTrue: false },
            { statement: 'L\'emploi à domicile ouvre droit à 50 % de crédit ou réduction.', isTrue: true },
            { statement: 'Un crédit d\'impôt peut se transformer en remboursement.', isTrue: true },
            { statement: 'Les dons aux associations donnent droit à 50 % de réduction.', isTrue: false },
          ],
          timeLimitSeconds: 45,
        },
      ],
    },
  },

  // ─── LEÇON 6 : La TVA (INTERMEDIATE) ────────────────────────────────────────
  {
    id: 'demo-taxes-006',
    title: 'TVA : qui paie vraiment cette taxe ?',
    domain: 'TAXES',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 6,
    content: {
      steps: [
        {
          type: 'info',
          title: 'La TVA, une taxe invisible ?',
          content: `La **Taxe sur la Valeur Ajoutée (TVA)** est incluse dans chaque prix que tu paies. En France, il existe 3 taux principaux :\n\n• **20 %** : taux normal (électronique, vêtements, restaurants, voitures…)\n• **10 %** : taux intermédiaire (transport, travaux, restauration à emporter…)\n• **5,5 %** : taux réduit (alimentaire de base, livres, équipements pour handicapés, abonnements gaz/élec…)\n• **2,1 %** : taux particulier (médicaments remboursés, certaines presses)\n\n🎯 Principe : c'est le **consommateur final** qui supporte économiquement la TVA. L'entreprise ne fait que la collecter et la reverser à l'État.`,
          mindyMessage: 'La TVA est la première recette fiscale de l\'État français (environ 200 Mds €/an). Tu y contribues à chaque achat ! 🛒',
        },
        {
          type: 'match_pairs',
          pairs: [
            { term: 'Baguette de pain', definition: 'TVA 5,5 %' },
            { term: 'Smartphone neuf', definition: 'TVA 20 %' },
            { term: 'Billet de train', definition: 'TVA 10 %' },
            { term: 'Livre scolaire', definition: 'TVA 5,5 %' },
            { term: 'Restaurant sur place', definition: 'TVA 10 %' },
          ],
          mindyMessage: 'Astuce mémo : alimentaire de base + livres = 5,5 % ; transport + restauration = 10 % ; le reste = 20 %.',
        },
        {
          type: 'calculator',
          question: 'Un artisan facture 800 € HT (hors taxe) pour des travaux de rénovation (TVA 10 %). Quel est le montant total TTC (toutes taxes comprises) à payer ?',
          variables: ['Prix HT : 800 €', 'Taux TVA travaux : 10 %'],
          answer: 880,
          tolerance: 0,
          unit: '€',
          mindyMessage: 'TTC = HT × (1 + taux TVA). Ici : 800 × 1,10 = 880 €. Simple ! 🔨',
        },
      ],
    },
  },

  // ─── LEÇON 7 : Taxe foncière & ex-taxe d'habitation (INTERMEDIATE) ──────────
  {
    id: 'demo-taxes-007',
    title: 'Taxe foncière : impôt des propriétaires',
    domain: 'TAXES',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 7,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Taxe foncière & taxe d\'habitation : qui paie quoi ?',
          content: `**Taxe foncière** : impôt dû par les **propriétaires** d'un bien immobilier (résidence principale, secondaire, local commercial…). Elle est calculée sur la valeur locative cadastrale du bien × les taux votés par les collectivités locales.\n\n**Taxe d\'habitation** : historiquement payée par l'occupant (propriétaire ou locataire). Depuis 2023, elle est **totalement supprimée pour la résidence principale** pour tous les ménages. Elle existe encore pour les résidences secondaires.\n\n💡 Calcul simplifié taxe foncière :\nValeur locative cadastrale × abattement 50 % × taux communal + taux départemental\n\nLes collectivités votent leurs propres taux → forte disparité selon les communes.`,
          mindyMessage: 'Propriétaire ? N\'oublie pas la taxe foncière dans ton budget annuel — elle arrive en octobre ! 🍂',
        },
        {
          type: 'swipe',
          statement: 'La taxe d\'habitation a été totalement supprimée pour toutes les résidences en France depuis 2023.',
          isCorrect: false,
          explanation: 'FAUX. La taxe d\'habitation est supprimée uniquement pour la résidence PRINCIPALE depuis 2023. Elle s\'applique toujours aux résidences secondaires.',
        },
        {
          type: 'quiz',
          question: 'Qui est redevable de la taxe foncière ?',
          options: [
            'Le locataire qui occupe le logement',
            'Le propriétaire du bien, qu\'il l\'occupe ou non',
            'La commune où se situe le bien',
            'L\'acquéreur uniquement la première année',
          ],
          correctIndex: 1,
          mindyHint: 'Foncière = foncier = terrain/propriété. C\'est l\'impôt du proprio, pas du locataire.',
        },
        {
          type: 'reorder',
          title: 'Comment est calculée la taxe foncière ?',
          instruction: 'Remets les étapes du calcul dans le bon ordre :',
          words: [
            'Valeur locative cadastrale du bien',
            'Application de l\'abattement de 50 %',
            'Multiplication par les taux communaux et départementaux',
            'Montant final de la taxe foncière',
          ],
          correctOrder: [0, 1, 2, 3],
          hint: 'On part de la valeur brute, on la réduit, puis on applique les taux.',
          mindyMessage: 'Base × abattement × taux = taxe. Un calcul en 3 étapes à retenir ! 🏡',
        },
      ],
    },
  },

  // ─── LEÇON 8 : La déclaration — dates & étapes (INTERMEDIATE) ───────────────
  {
    id: 'demo-taxes-008',
    title: 'Déclaration de revenus : les étapes clés',
    domain: 'TAXES',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 8,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Le calendrier fiscal annuel',
          content: `La déclaration de revenus est un rendez-vous annuel incontournable. Même avec le prélèvement à la source, tu dois déclarer chaque printemps.\n\n📅 Grandes étapes :\n1. **Janvier** : reçois tes attestations fiscales (intérêts, dividendes, dons…)\n2. **Avril** : ouverture du service de déclaration en ligne sur impots.gouv.fr\n3. **Mai-juin** : dates limites selon ton département (3 zones)\n4. **Été** : calcul de l\'impôt final et ajustement du taux PAS\n5. **Septembre/Octobre** : solde à payer ou remboursement\n\n🌐 Déclaration en ligne obligatoire si tu as accès à internet (depuis 2019).`,
          mindyMessage: 'Les dates limites varient selon ton département — vérifie toujours la bonne zone sur impots.gouv.fr ! 📆',
        },
        {
          type: 'timeline_builder',
          title: 'Remets le calendrier fiscal dans l\'ordre',
          events: [
            { id: 'attestations', label: 'Réception des attestations fiscales (intérêts, dons…)', year: 'Janvier', emoji: '📄' },
            { id: 'ouverture', label: 'Ouverture du service de déclaration en ligne', year: 'Avril', emoji: '💻' },
            { id: 'deadline', label: 'Date limite de déclaration (selon département)', year: 'Mai-Juin', emoji: '⏰' },
            { id: 'calcul', label: 'Calcul impôt final + ajustement taux PAS', year: 'Été', emoji: '🧮' },
            { id: 'solde', label: 'Solde à payer ou remboursement reçu', year: 'Septembre-Octobre', emoji: '💰' },
          ],
          explanation: 'La déclaration annuelle permet d\'ajuster l\'impôt payé via le PAS. Si tu as trop payé → remboursement. Si pas assez → complément prélevé en septembre.',
          mindyMessage: 'Janvier → Avril → Mai-Juin → Été → Automne. Ce cycle se répète chaque année. Mets-le dans ton agenda ! 🗓️',
        },
        {
          type: 'fill_blank',
          sentence: 'Depuis 2019, la déclaration de revenus en ligne est ___ pour les foyers ayant accès à internet.',
          answer: 'obligatoire',
          choices: ['obligatoire', 'facultative', 'interdite', 'optionnelle'],
          mindyMessage: 'En ligne obligatoire depuis 2019. Le papier reste possible en cas d\'impossibilité d\'accès à internet.',
        },
      ],
    },
  },

  // ─── LEÇON 9 : Optimisation légale vs fraude (ADVANCED) ─────────────────────
  {
    id: 'demo-taxes-009',
    title: 'Optimisation vs fraude : où est la limite ?',
    domain: 'TAXES',
    difficulty: 'ADVANCED',
    xpReward: 100,
    orderIndex: 9,
    content: {
      steps: [
        {
          type: 'info',
          title: 'La frontière entre optimisation et fraude',
          content: `En matière fiscale, il existe trois niveaux :\n\n✅ **Optimisation fiscale (légale)** : utiliser les dispositifs prévus par la loi pour réduire son impôt. Ex : PEA, assurance-vie, déficit foncier, Plan d\'Épargne Retraite (PER), investissement Pinel (en cours d\'extinction).\n\n⚠️ **Abus de droit (zone grise)** : montage artificiel sans substance économique réelle, uniquement pour l\'avantage fiscal. Sanctionné par l\'administration.\n\n❌ **Fraude fiscale (illégale)** : minorer ses revenus déclarés, faux documents, travail non déclaré. Peine : jusqu\'à 7 ans de prison + 3 M€ d\'amende.\n\n🎯 La règle d\'or : si tu dois cacher quelque chose au fisc, c\'est probablement illégal.`,
          mindyMessage: 'L\'optimisation, c\'est jouer selon les règles. La fraude, c\'est tricher. Et le fisc a des algorithmes très performants pour repérer les anomalies. 🤖',
        },
        {
          type: 'scenario',
          situation: 'Thomas a 50 000 € à placer. Son conseiller lui propose plusieurs stratégies pour réduire son impôt. Laquelle est totalement légale et recommandable ?',
          choices: [
            {
              text: 'Verser 10 000 € sur un PER (Plan d\'Épargne Retraite) — déductibles du revenu imposable.',
              isGood: true,
              explanation: 'Parfaitement légal ! Les versements sur un PER sont déductibles du revenu imposable dans la limite d\'un plafond (~10 % des revenus). C\'est l\'un des meilleurs outils d\'optimisation légale.',
            },
            {
              text: 'Déclarer ses revenus locatifs en espèces comme « cadeaux familiaux » non imposables.',
              isGood: false,
              explanation: 'C\'est de la fraude fiscale. Les revenus locatifs sont imposables, qu\'ils soient en espèces ou non. Cette pratique peut entraîner un redressement + pénalités de 40 %.',
            },
            {
              text: 'Créer une holding à l\'étranger sans activité réelle pour y loger ses revenus.',
              isGood: false,
              explanation: 'Montage artificiel constitutif d\'abus de droit voire de fraude. L\'administration fiscale peut requalifier et appliquer des pénalités de 80 % + intérêts de retard.',
            },
            {
              text: 'Investir 15 000 € dans un PEA pour profiter de l\'exonération d\'IR sur les plus-values après 5 ans.',
              isGood: true,
              explanation: 'Totalement légal ! Le PEA permet une exonération d\'impôt sur les plus-values (hors prélèvements sociaux) après 5 ans de détention. C\'est un outil d\'épargne très efficace.',
            },
          ],
          mindyMessage: 'PER + PEA : deux dispositifs légaux puissants pour investir et payer moins d\'impôt. Les connaître, c\'est les utiliser ! 📈',
        },
        {
          type: 'speed_round',
          title: 'Légal ou illégal ? Testez vos réflexes !',
          pairs: [
            { statement: 'Investir dans un PEA pour exonérer ses plus-values après 5 ans est légal.', isTrue: true },
            { statement: 'Déclarer ses revenus en dessous de leur valeur réelle est une optimisation légale.', isTrue: false },
            { statement: 'Le don à une association avec réduction de 66 % est une optimisation fiscale légale.', isTrue: true },
            { statement: 'Créer une société fictive à l\'étranger pour éviter l\'impôt est légal si c\'est hors UE.', isTrue: false },
            { statement: 'La fraude fiscale peut entraîner jusqu\'à 7 ans de prison en France.', isTrue: true },
          ],
          timeLimitSeconds: 40,
        },
      ],
    },
  },

  // ─── LEÇON 10 : Arnaques fiscales (ADVANCED) ─────────────────────────────────
  {
    id: 'demo-taxes-010',
    title: 'Faux remboursements impôts : repère l\'arnaque',
    domain: 'TAXES',
    difficulty: 'ADVANCED',
    xpReward: 100,
    orderIndex: 10,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Les arnaques fiscales en pleine explosion',
          content: `Chaque année, des milliers de Français reçoivent de faux mails ou SMS prétendant venir des impôts pour les inciter à cliquer sur un lien et saisir leurs coordonnées bancaires.\n\n🚨 Règles d\'or pour reconnaître un vrai message des impôts :\n\n✅ L\'adresse de l\'expéditeur officiel se termine TOUJOURS par **@dgfip.finances.gouv.fr**\n✅ Le vrai site des impôts : **impots.gouv.fr** (pas impots-gouv.fr, ni impots.gov.fr)\n✅ L\'administration fiscale NE DEMANDE JAMAIS tes coordonnées bancaires par email\n✅ Un remboursement réel est versé automatiquement — jamais via un formulaire externe\n\n⚠️ En cas de doute : va directement sur impots.gouv.fr (tape l\'URL à la main) et vérifie dans ton espace personnel.`,
          mindyMessage: 'L\'État ne te demande jamais de cliquer pour recevoir un remboursement. Si tu reçois un mail "remboursement d\'impôts", c\'est une arnaque ! 🚫',
        },
        {
          type: 'spot_the_scam',
          question: 'Un de ces messages est frauduleux. Lequel est l\'arnaque ?',
          cards: [
            {
              id: 'msg-1',
              type: 'email',
              content: 'Votre déclaration de revenus 2024 est disponible. Connectez-vous à votre espace particulier sur impots.gouv.fr pour la consulter et la valider avant le 31 mai.',
              sender: 'noreply@dgfip.finances.gouv.fr',
              isScam: false,
              redFlags: [],
            },
            {
              id: 'msg-2',
              type: 'email',
              content: 'Vous avez droit à un remboursement de 347,50 € suite à un trop-perçu. Cliquez sur le lien ci-dessous et saisissez votre RIB pour recevoir votre virement sous 24h : http://impots-remboursement.net/rib',
              sender: 'service-remboursement@impots-gouv.fr',
              isScam: true,
              redFlags: [
                'Domaine expéditeur incorrect : @impots-gouv.fr au lieu de @dgfip.finances.gouv.fr',
                'L\'administration ne demande JAMAIS le RIB par email',
                'URL suspecte : impots-remboursement.net (pas impots.gouv.fr)',
                'Urgence artificielle (24h)',
                'Montant précis pour crédibiliser',
              ],
            },
            {
              id: 'msg-3',
              type: 'email',
              content: 'Votre taux de prélèvement à la source a été mis à jour suite à votre déclaration. Votre nouveau taux est de 8,2 % à compter du 1er septembre. Aucune action n\'est requise de votre part.',
              sender: 'noreply@dgfip.finances.gouv.fr',
              isScam: false,
              redFlags: [],
            },
          ],
          explanation: 'L\'arnaque est le message 2 : l\'adresse @impots-gouv.fr est fausse (le vrai domaine est @dgfip.finances.gouv.fr), le lien pointe vers un site frauduleux, et les impôts ne demandent jamais un RIB par email pour envoyer un remboursement.',
          mindyMessage: 'Vérifie TOUJOURS : 1) l\'expéditeur exact, 2) l\'URL du lien, 3) la demande d\'infos bancaires. En cas de doute, va directement sur impots.gouv.fr ! 🔍',
        },
        {
          type: 'word_scramble',
          word: 'PHISHING',
          hint: 'Technique d\'arnaque consistant à usurper l\'identité d\'une organisation pour voler des données personnelles',
          scrambled: ['P', 'H', 'I', 'S', 'H', 'I', 'N', 'G'],
          mindyMessage: 'Le phishing fiscal explose en période de déclaration (avril-juin). Sois en alerte maximale ! 🎣',
        },
      ],
    },
  },
];
