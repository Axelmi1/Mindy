import type { CreateLessonInput } from './lesson-content.schema';

/**
 * 🎬 Leçon vitrine du domaine DEMO — LA leçon de la soutenance.
 * Une seule leçon, niveau facile, qui enchaîne les 20 mécaniques
 * d'exercice de Mindy (info, quiz, swipe, mini-jeux…).
 * L'image du visual_pick est un data URI → zéro dépendance réseau en démo.
 */

const CHART_DATA_URI = 'data:image/png;base64,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';

export const DEMO_SHOWCASE_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  {
    id: 'demo-showcase-001',
    title: '🎬 Le tour de Mindy en 20 exercices',
    domain: 'DEMO',
    difficulty: 'BEGINNER',
    xpReward: 100,
    orderIndex: 1,
    content: {
      steps: [
        // 1. info
        {
          type: 'info',
          title: 'Bienvenue dans la démo ! 👋',
          content:
            "Cette leçon spéciale te fait tester TOUTES les mécaniques d'apprentissage de Mindy : quiz, swipe, mini-jeux, graphiques… Chaque écran est une façon différente d'apprendre la crypto et les finances. C'est parti !",
          mindyMessage: 'Attache ta ceinture, on fait le tour du propriétaire. 🚀',
        },
        // 2. quiz
        {
          type: 'quiz',
          question: 'Le QUIZ classique : combien font 50 € épargnés par mois pendant 1 an ?',
          options: ['300 €', '500 €', '600 €', '1 200 €'],
          correctIndex: 2,
          mindyHint: '50 × 12 mois…',
        },
        // 3. swipe
        {
          type: 'swipe',
          statement: 'Le SWIPE : « Bitcoin est une cryptomonnaie. » Vrai ou faux ?',
          isCorrect: true,
          explanation: 'Vrai, évidemment ! Bitcoin est la toute première cryptomonnaie, créée en 2009. Swipe à droite si c\'est vrai, à gauche si c\'est faux.',
        },
        // 4. fill_blank
        {
          type: 'fill_blank',
          sentence: 'Le TEXTE À TROUS : mettre de l\'argent de côté chaque mois, c\'est ___.',
          answer: 'épargner',
          choices: ['épargner', 'dépenser', 'emprunter'],
          mindyMessage: 'Épargner, la base de toute santé financière. 💪',
        },
        // 5. match_pairs
        {
          type: 'match_pairs',
          pairs: [
            { term: '₿ Bitcoin', definition: 'Cryptomonnaie' },
            { term: '€ Euro', definition: 'Monnaie classique' },
            { term: '🏦 Livret A', definition: 'Épargne sécurisée' },
          ],
          mindyMessage: 'LES PAIRES : associe chaque terme à sa définition. Facile, non ? 🎯',
        },
        // 6. reorder
        {
          type: 'reorder',
          title: 'La REMISE EN ORDRE',
          instruction: 'Remets les étapes d\'un bon budget dans l\'ordre :',
          words: [
            'Je reçois mon salaire',
            'Je paie mes charges fixes',
            'Je mets de côté mon épargne',
            'Je dépense le reste sans culpabiliser',
          ],
          correctOrder: [0, 1, 2, 3],
          hint: 'L\'épargne AVANT les dépenses plaisir — c\'est le secret.',
          mindyMessage: 'Se payer en premier : la règle d\'or du budget. 🥇',
        },
        // 7. swipe_sequence
        {
          type: 'swipe_sequence',
          title: 'La SÉRIE DE SWIPES',
          instruction: 'Swipe à droite si c\'est une bonne habitude, à gauche si c\'est un piège.',
          leftLabel: 'Piège ❌',
          rightLabel: 'Bonne habitude ✅',
          cards: [
            { id: 'c1', content: 'Épargner 10 % de son salaire chaque mois', correctDirection: 'right', explanation: 'La régularité bat les gros efforts ponctuels.' },
            { id: 'c2', content: 'Investir tout son argent sur un conseil TikTok', correctDirection: 'left', explanation: 'Jamais sans faire ses propres recherches !' },
            { id: 'c3', content: 'Comparer les prix avant un gros achat', correctDirection: 'right', explanation: 'Quelques minutes qui rapportent gros.' },
          ],
          mindyMessage: 'Tu as le réflexe. Continue ! ⚡',
        },
        // 8. scenario
        {
          type: 'scenario',
          situation:
            "Le SCÉNARIO : ton ami te dit « j'ai un plan crypto qui fait ×10 garanti en une semaine ». Que fais-tu ?",
          choices: [
            { text: 'Je fonce, il a l\'air sûr de lui', isGood: false, explanation: 'Un rendement « garanti » élevé, ça n\'existe pas. C\'est le signe n°1 de l\'arnaque.' },
            { text: 'Je me méfie : rendement garanti = arnaque probable', isGood: true, explanation: 'Exact ! Personne ne peut garantir un ×10. Les promesses de gains sûrs sont le drapeau rouge classique.' },
            { text: 'Je mets juste la moitié de mes économies', isGood: false, explanation: 'Perdre « seulement » la moitié de tes économies reste une catastrophe.' },
          ],
          mindyMessage: 'Si c\'est trop beau pour être vrai… c\'est que ça l\'est. 🚩',
        },
        // 9. calculator
        {
          type: 'calculator',
          question: 'La CALCULATRICE : tu épargnes 100 € par mois pendant 2 ans. Combien as-tu mis de côté ?',
          variables: ['Épargne mensuelle : 100 €', 'Durée : 24 mois'],
          answer: 2400,
          tolerance: 0,
          unit: '€',
          mindyMessage: '100 × 24 = 2 400 €. Et avec les intérêts, ce serait encore plus ! 📈',
        },
        // 10. price_prediction
        {
          type: 'price_prediction',
          question: 'La PRÉDICTION : vu la tendance de ces bougies, le prix va plutôt…',
          candles: [
            { open: 100, high: 108, low: 98, close: 106 },
            { open: 106, high: 115, low: 104, close: 113 },
            { open: 113, high: 122, low: 111, close: 120 },
            { open: 120, high: 128, low: 118, close: 126 },
          ],
          correctAnswer: 'up',
          explanation: 'Quatre bougies vertes qui montent : la tendance est clairement haussière. En trading, « the trend is your friend ».',
          mindyMessage: 'Tu viens de lire ton premier graphique en bougies ! 🕯️',
        },
        // 11. speed_round
        {
          type: 'speed_round',
          title: 'Le SPEED ROUND — vrai ou faux, vite !',
          pairs: [
            { statement: 'Une carte de crédit est de l\'argent gratuit.', isTrue: false },
            { statement: 'Diversifier réduit le risque.', isTrue: true },
            { statement: 'Le Livret A est garanti par l\'État.', isTrue: true },
            { statement: 'Les cryptos ne perdent jamais de valeur.', isTrue: false },
          ],
          timeLimitSeconds: 30,
        },
        // 12. budget_allocator
        {
          type: 'budget_allocator',
          totalBudget: 1000,
          categories: [
            { label: 'Loyer & charges', icon: '🏠', targetPercent: 50, minPercent: 35, maxPercent: 65 },
            { label: 'Vie quotidienne', icon: '🛒', targetPercent: 30, minPercent: 15, maxPercent: 45 },
            { label: 'Épargne', icon: '🏦', targetPercent: 10, minPercent: 5, maxPercent: 30 },
            { label: 'Plaisirs', icon: '🎉', targetPercent: 10, minPercent: 0, maxPercent: 25 },
          ],
          explanation: 'Le BUDGET : la règle 50/30/20 (besoins/envies/épargne) est un excellent point de départ. L\'important : l\'épargne a sa place dès le début, pas « ce qui reste ».',
        },
        // 13. news_impact
        {
          type: 'news_impact',
          headline: 'La banque centrale baisse ses taux d\'intérêt',
          source: 'L\'ACTU — quel impact sur les marchés ?',
          date: 'Aujourd\'hui',
          correctImpact: 'bullish',
          explanation: 'Des taux plus bas = emprunter coûte moins cher = plus d\'argent circule vers les investissements. C\'est généralement haussier (bullish) pour les marchés.',
          mindyMessage: 'Savoir lire une news comme un investisseur, ça change tout. 📰',
        },
        // 14. flashcard
        {
          type: 'flashcard',
          front: 'HODL',
          back: 'La FLASHCARD : « Hold On for Dear Life » — garder ses cryptos sur le long terme sans paniquer pendant les baisses. Né d\'une faute de frappe de « hold » en 2013 !',
          category: 'Culture crypto',
        },
        // 15. word_scramble
        {
          type: 'word_scramble',
          word: 'BUDGET',
          hint: 'Le MOT MÊLÉ : plan qui répartit tes revenus entre dépenses et épargne',
          scrambled: ['G', 'U', 'B', 'T', 'E', 'D'],
          mindyMessage: 'B-U-D-G-E-T : ton meilleur allié pour ne plus finir le mois à découvert. 📊',
        },
        // 16. drag_sort
        {
          type: 'drag_sort',
          question: 'Le CLASSEMENT : range ces placements du moins risqué au plus risqué :',
          items: [
            { id: 'livret', label: 'Livret A', emoji: '🏦', value: 'Garanti' },
            { id: 'actions', label: 'Actions en bourse', emoji: '📈', value: 'Volatil' },
            { id: 'crypto', label: 'Cryptomonnaies', emoji: '₿', value: 'Très volatil' },
          ],
          correctOrder: [0, 1, 2],
          explanation: 'Livret A (capital garanti) < actions (ça monte et ça descend) < crypto (montagnes russes). Plus de risque = plus de gain potentiel… et de perte potentielle.',
          mindyMessage: 'Risque et rendement marchent toujours main dans la main. ⚖️',
        },
        // 17. spot_the_scam
        {
          type: 'spot_the_scam',
          question: 'CHASSE À L\'ARNAQUE : un de ces deux messages est frauduleux. Lequel ?',
          cards: [
            {
              id: 'msg-1',
              type: 'email',
              content: 'Votre relevé mensuel est disponible dans votre espace client. Connectez-vous depuis notre application officielle pour le consulter.',
              sender: 'noreply@mabanque.fr',
              isScam: false,
              redFlags: [],
            },
            {
              id: 'msg-2',
              type: 'tweet',
              content: '🎁 GIVEAWAY ! Envoie 0,1 BTC à cette adresse et reçois 1 BTC en retour ! Offre limitée aux 100 premiers ! 🚀',
              sender: '@EIonMusk_officiel',
              isScam: true,
              redFlags: [
                'Personne ne double ton argent gratuitement, jamais',
                'Compte qui imite une célébrité (EIon avec un i majuscule)',
                'Urgence artificielle : « les 100 premiers »',
              ],
            },
          ],
          explanation: 'Le « giveaway » crypto est l\'arnaque la plus répandue sur les réseaux : on te demande d\'envoyer d\'abord, tu ne revois jamais ton argent.',
          mindyMessage: 'Ton argent envoyé en crypto est irrécupérable. Vérifie 2 fois, envoie 0 fois. 🛡️',
        },
        // 18. connect_dots
        {
          type: 'connect_dots',
          pairs: [
            { term: 'XP', definition: 'Points gagnés en apprenant' },
            { term: 'Série 🔥', definition: 'Jours d\'affilée sur Mindy' },
            { term: 'Ligue', definition: 'Ton rang hebdomadaire' },
          ],
          mindyMessage: 'RELIE LES POINTS : tu connais maintenant le vocabulaire de Mindy ! 🎮',
        },
        // 19. timeline_builder
        {
          type: 'timeline_builder',
          title: 'La FRISE : remets l\'histoire de l\'argent dans l\'ordre',
          events: [
            { id: 'troc', label: 'Le troc : on échange des biens', year: 'Antiquité', emoji: '🐄' },
            { id: 'pieces', label: 'Premières pièces de monnaie', year: '-600', emoji: '🪙' },
            { id: 'billets', label: 'Billets de banque en Europe', year: '1661', emoji: '💵' },
            { id: 'cartes', label: 'Cartes bancaires', year: '1950', emoji: '💳' },
            { id: 'bitcoin', label: 'Bitcoin, monnaie numérique', year: '2009', emoji: '₿' },
          ],
          explanation: 'Du troc au Bitcoin : l\'argent n\'a jamais cessé d\'évoluer. La crypto n\'est que la dernière étape d\'une très longue histoire.',
          mindyMessage: '2 600 ans d\'histoire monétaire dans une frise. Pas mal, non ? 🏛️',
        },
        // 20. visual_pick
        {
          type: 'visual_pick',
          title: 'L\'ANALYSE VISUELLE',
          instruction: 'Touche le graphique qui représente une tendance HAUSSIÈRE :',
          imageUrl: CHART_DATA_URI,
          hotspots: [
            { id: 'up', label: 'Graphique de gauche', x: 25, y: 50, radius: 14 },
            { id: 'down', label: 'Graphique de droite', x: 75, y: 50, radius: 14 },
          ],
          correctHotspotId: 'up',
          explanation: 'La courbe verte monte de gauche à droite : tendance haussière (bullish). La rouge descend : baissière (bearish).',
          mindyMessage: 'Lire un graphique en un coup d\'œil, c\'est déjà penser comme un trader. 👁️',
        },
        // 21. info (conclusion)
        {
          type: 'info',
          title: 'Le tour est complet ! 🎉',
          content:
            "Tu viens de tester les 20 mécaniques de Mindy : quiz, swipes, scénarios, calculs, graphiques, chasse aux arnaques… C'est cette variété qui rend l'apprentissage addictif. Chaque leçon des 6 domaines mélange ces exercices pour que tu ne t'ennuies jamais.",
          mindyMessage: 'Et maintenant, la vraie aventure commence. À toi de jouer ! 🚀',
        },
      ],
    },
  },
];
