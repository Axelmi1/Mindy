import type { CreateLessonInput } from './lesson-content.schema';

/**
 * Master Quiz des 3 nouveaux domaines (Immobilier / Impôts / Entrepreneuriat).
 * Même pattern que les Master Tests CRYPTO/FINANCE/TRADING :
 * ADVANCED, 200 XP, orderIndex 900, isMasterQuiz — débloqués en fin de parcours.
 * Ids fixes → upsert idempotent par `prisma/add-domain-lessons.ts`.
 */
export const DOMAIN_MASTER_QUIZZES: Array<{ id: string } & CreateLessonInput> = [
  // ──────────────────────────────────────────────────────────────────────────
  // 🏆 IMMOBILIER Master Test
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-master',
    title: '🏆 IMMOBILIER Master Test',
    domain: 'REAL_ESTATE',
    difficulty: 'ADVANCED',
    xpReward: 200,
    orderIndex: 900,
    isMasterQuiz: true,
    content: {
      steps: [
        {
          type: 'info',
          title: 'IMMOBILIER Master Test',
          content:
            "Ce test évalue ta maîtrise complète de l'immobilier : achat, crédit, location, fiscalité du bien. 200 XP à la clé. Bonne chance ! 🏠",
          mindyMessage: 'Montre-moi que la pierre n\'a plus de secrets pour toi. 💪',
        },
        {
          type: 'quiz',
          question: "Dans l'ancien, les frais de notaire représentent environ :",
          options: ['1 % du prix', '7 à 8 % du prix', '15 % du prix', '20 % du prix'],
          correctIndex: 1,
          mindyHint: 'C\'est bien plus que dans le neuf (2-3 %).',
        },
        {
          type: 'quiz',
          question: 'Quel est le taux d\'endettement maximal recommandé par le HCSF pour un crédit immobilier ?',
          options: ['25 %', '35 %', '50 %', '60 %'],
          correctIndex: 1,
          mindyHint: 'Assurance emprunteur incluse.',
        },
        {
          type: 'fill_blank',
          sentence: 'Le PTZ est un prêt à taux ___ réservé aux primo-accédants, sous conditions de ressources.',
          answer: 'zéro',
          choices: ['zéro', 'fixe', 'variable'],
          mindyMessage: 'PTZ = Prêt à Taux Zéro. Un coup de pouce de l\'État. 🎯',
        },
        {
          type: 'quiz',
          question: 'Comment calcule-t-on le rendement locatif brut ?',
          options: [
            'Prix du bien ÷ loyer mensuel',
            '(Loyers annuels ÷ prix d\'achat total) × 100',
            '(Loyer mensuel − charges) × 12',
            'Prix au m² ÷ loyer au m²',
          ],
          correctIndex: 1,
          mindyHint: 'C\'est un pourcentage annuel rapporté au prix d\'achat.',
        },
        {
          type: 'swipe',
          statement: 'La taxe foncière est payée par le locataire du logement.',
          isCorrect: false,
          explanation: 'Faux. La taxe foncière est due par le propriétaire au 1er janvier. Le locataire paie éventuellement sa part de charges, pas la taxe foncière.',
        },
        {
          type: 'quiz',
          question: 'Depuis 2025, quels logements sont progressivement interdits à la location (loi Climat) ?',
          options: [
            'Les logements meublés',
            'Les passoires thermiques classées G au DPE',
            'Les logements de moins de 20 m²',
            'Les logements construits avant 1950',
          ],
          correctIndex: 1,
          mindyHint: 'Le DPE va de A (excellent) à G (passoire).',
        },
        {
          type: 'scenario',
          situation:
            "Tu veux faire ton premier investissement locatif avec 20 000 € d'apport. Deux options : un studio bien placé près d'une fac (rendement 5 %, forte demande), ou un T3 20 % moins cher dans une petite ville qui perd des habitants (rendement affiché 9 %).",
          choices: [
            {
              text: 'Le studio près de la fac : demande locative solide',
              isGood: true,
              explanation: 'Bien vu. Un rendement affiché ne vaut rien sans locataire : la vacance locative détruit la rentabilité. L\'emplacement reste le critère n°1.',
            },
            {
              text: 'Le T3 à 9 % : le rendement avant tout',
              isGood: false,
              explanation: 'Attention : dans une ville qui se vide, la vacance locative et la revente difficile peuvent transformer ce 9 % théorique en gouffre.',
            },
            {
              text: 'Attendre d\'avoir 100 000 € d\'apport',
              isGood: false,
              explanation: 'L\'immobilier se finance justement à crédit : l\'effet de levier permet d\'investir sans attendre des années.',
            },
          ],
          mindyMessage: 'Emplacement, emplacement, emplacement ! 📍',
        },
        {
          type: 'speed_round',
          title: 'Vrai ou faux — sprint immobilier',
          pairs: [
            { statement: 'La plus-value sur la résidence principale est exonérée d\'impôt.', isTrue: true },
            { statement: 'Un compromis de vente n\'engage que l\'acheteur.', isTrue: false },
            { statement: 'L\'assurance emprunteur peut être changée à tout moment (loi Lemoine).', isTrue: true },
            { statement: 'Plus la durée du prêt est longue, moins on paie d\'intérêts au total.', isTrue: false },
            { statement: 'L\'apport personnel demandé par les banques est souvent d\'environ 10 %.', isTrue: true },
          ],
          timeLimitSeconds: 45,
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que « l'effet de levier » en immobilier ?",
          options: [
            'Négocier le prix à la baisse',
            'Utiliser le crédit pour investir plus que son capital et amplifier le rendement de son apport',
            'Faire des travaux pour revendre plus cher',
            'Acheter à plusieurs pour diviser les frais',
          ],
          correctIndex: 1,
          mindyHint: 'C\'est la banque qui finance, le locataire qui rembourse.',
        },
        {
          type: 'info',
          title: 'Master Test terminé ! 🏆',
          content:
            "Bravo, tu as bouclé le Master Test Immobilier : achat vs location, crédit, rendement, fiscalité et pièges du locatif n'ont plus de secrets pour toi.",
          mindyMessage: 'Légende de l\'immobilier, rien que ça. 🏠⚡',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 🏆 IMPÔTS Master Test
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-taxes-master',
    title: '🏆 IMPÔTS Master Test',
    domain: 'TAXES',
    difficulty: 'ADVANCED',
    xpReward: 200,
    orderIndex: 900,
    isMasterQuiz: true,
    content: {
      steps: [
        {
          type: 'info',
          title: 'IMPÔTS Master Test',
          content:
            'Ce test évalue ta maîtrise de la fiscalité : impôt sur le revenu, TVA, niches fiscales et déclaration. 200 XP à gagner. À toi de jouer ! 🧾',
          mindyMessage: 'Le fisc ne te fait plus peur ? Prouve-le. 😎',
        },
        {
          type: 'quiz',
          question: "Depuis 2019, comment l'impôt sur le revenu est-il collecté en France ?",
          options: [
            'Par tiers provisionnel uniquement',
            'Par prélèvement à la source',
            'En une fois en septembre',
            'Uniquement par chèque',
          ],
          correctIndex: 1,
          mindyHint: 'Il est prélevé directement sur ton salaire chaque mois.',
        },
        {
          type: 'quiz',
          question: 'Ton taux marginal d\'imposition est de 30 %. Cela signifie que :',
          options: [
            'Tout ton revenu est taxé à 30 %',
            'Seule la partie de ton revenu située dans cette tranche est taxée à 30 %',
            'Tu paies 30 % de TVA',
            'Ton salaire net baisse de 30 %',
          ],
          correctIndex: 1,
          mindyHint: 'Le barème est progressif : chaque tranche a son taux.',
        },
        {
          type: 'fill_blank',
          sentence: 'Le quotient ___ divise le revenu imposable du foyer par un nombre de parts.',
          answer: 'familial',
          choices: ['familial', 'social', 'foncier'],
          mindyMessage: 'Plus de parts = un impôt calculé sur une base plus petite. 👨‍👩‍👧',
        },
        {
          type: 'swipe',
          statement: 'La TVA est un impôt direct payé uniquement par les entreprises.',
          isCorrect: false,
          explanation: 'Faux. La TVA est un impôt indirect : les entreprises la collectent, mais c\'est le consommateur final qui la paie dans chaque prix TTC.',
        },
        {
          type: 'quiz',
          question: 'Quel est le taux normal de TVA en France ?',
          options: ['5,5 %', '10 %', '20 %', '25 %'],
          correctIndex: 2,
          mindyHint: 'Les taux réduits (10 %, 5,5 %, 2,1 %) sont des exceptions.',
        },
        {
          type: 'quiz',
          question: 'La « flat tax » (PFU) sur les revenus du capital, c\'est :',
          options: [
            '12,8 % tout compris',
            '30 % (12,8 % d\'impôt + 17,2 % de prélèvements sociaux)',
            '45 % pour tous',
            'Un impôt sur le patrimoine immobilier',
          ],
          correctIndex: 1,
          mindyHint: 'PFU = Prélèvement Forfaitaire Unique, sur dividendes, intérêts, plus-values.',
        },
        {
          type: 'quiz',
          question: 'Quelle est la différence entre une réduction et un crédit d\'impôt ?',
          options: [
            'Aucune, ce sont des synonymes',
            'Le crédit d\'impôt est remboursé même si tu ne paies pas d\'impôt, la réduction non',
            'La réduction est réservée aux entreprises',
            'Le crédit d\'impôt ne concerne que l\'immobilier',
          ],
          correctIndex: 1,
          mindyHint: 'L\'un peut te faire recevoir un virement du fisc, l\'autre jamais.',
        },
        {
          type: 'scenario',
          situation:
            "En vérifiant ta déclaration en ligne déjà validée, tu réalises que tu as oublié de déclarer 800 € de revenus d'une mission freelance.",
          choices: [
            {
              text: 'Corriger ma déclaration en ligne dès que possible',
              isGood: true,
              explanation: 'Exact. Le service de correction en ligne permet de rectifier après validation. Une correction spontanée évite pénalités et intérêts majorés.',
            },
            {
              text: 'Ne rien faire, 800 € c\'est trop petit pour être détecté',
              isGood: false,
              explanation: 'Mauvaise idée : les plateformes transmettent les revenus au fisc. Une omission détectée = redressement avec majorations.',
            },
            {
              text: 'Attendre l\'année prochaine pour les déclarer',
              isGood: false,
              explanation: 'Les revenus se déclarent sur l\'année où ils sont perçus. Les décaler est aussi une erreur.',
            },
          ],
          mindyMessage: 'La transparence coûte toujours moins cher que le redressement. ✅',
        },
        {
          type: 'speed_round',
          title: 'Vrai ou faux — sprint fiscal',
          pairs: [
            { statement: 'Les intérêts du Livret A sont exonérés d\'impôt.', isTrue: true },
            { statement: 'La taxe foncière est un impôt local.', isTrue: true },
            { statement: 'Tout le monde paie l\'impôt sur le revenu en France.', isTrue: false },
            { statement: 'La CSG finance la protection sociale.', isTrue: true },
            { statement: 'Déclarer ses impôts est facultatif si on est non imposable.', isTrue: false },
          ],
          timeLimitSeconds: 45,
        },
        {
          type: 'info',
          title: 'Master Test terminé ! 🏆',
          content:
            'Bravo ! Barème progressif, TVA, PFU, quotient familial, déclaration : tu sais désormais comment fonctionne la fiscalité — et comment l\'optimiser légalement.',
          mindyMessage: 'Légende des impôts. Le fisc n\'a qu\'à bien se tenir. 🧾⚡',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 🏆 ENTREPRENEURIAT Master Test
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-entrepreneurship-master',
    title: '🏆 ENTREPRENEURIAT Master Test',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'ADVANCED',
    xpReward: 200,
    orderIndex: 900,
    isMasterQuiz: true,
    content: {
      steps: [
        {
          type: 'info',
          title: 'ENTREPRENEURIAT Master Test',
          content:
            "Ce test évalue ta maîtrise de l'entrepreneuriat : statuts, business model, financement et métriques. 200 XP à gagner. Let's go ! 🚀",
          mindyMessage: 'Montre-moi ton esprit de fondateur. 💡',
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'un MVP (Minimum Viable Product) ?",
          options: [
            'La version la plus complète possible du produit',
            'La version la plus simple qui permet de tester l\'idée auprès de vrais utilisateurs',
            'Un prototype réservé aux investisseurs',
            'Le plan marketing de lancement',
          ],
          correctIndex: 1,
          mindyHint: 'L\'objectif : apprendre vite en dépensant peu.',
        },
        {
          type: 'swipe',
          statement: 'Une SASU permet de séparer le patrimoine personnel du fondateur de celui de l\'entreprise.',
          isCorrect: true,
          explanation: 'Vrai. En SASU (société par actions), la responsabilité est limitée aux apports : tes biens personnels sont protégés en cas de faillite (hors faute de gestion).',
        },
        {
          type: 'quiz',
          question: 'Le principal avantage du statut de micro-entrepreneur, c\'est :',
          options: [
            'Aucun plafond de chiffre d\'affaires',
            'Des démarches et une comptabilité ultra-simplifiées',
            'La possibilité de lever des fonds',
            'L\'absence totale de cotisations sociales',
          ],
          correctIndex: 1,
          mindyHint: 'Idéal pour tester une activité, mais avec des plafonds de CA.',
        },
        {
          type: 'fill_blank',
          sentence: 'Le seuil de ___ est le niveau de ventes à partir duquel l\'entreprise couvre toutes ses charges.',
          answer: 'rentabilité',
          choices: ['rentabilité', 'croissance', 'trésorerie'],
          mindyMessage: 'Aussi appelé point mort ou break-even. En dessous, tu perds de l\'argent. 📉',
        },
        {
          type: 'quiz',
          question: 'Ta startup lève 500 000 € contre 20 % du capital. Quelle est sa valorisation post-money ?',
          options: ['500 000 €', '1 million €', '2,5 millions €', '5 millions €'],
          correctIndex: 2,
          mindyHint: 'Si 20 % valent 500 000 €, combien valent 100 % ?',
        },
        {
          type: 'quiz',
          question: 'Que signifie la « dilution » lors d\'une levée de fonds ?',
          options: [
            'La baisse du chiffre d\'affaires',
            'La réduction du pourcentage de capital détenu par les fondateurs',
            'La perte de clients au profit des concurrents',
            'La division du prix de l\'action par deux',
          ],
          correctIndex: 1,
          mindyHint: 'De nouvelles actions sont créées pour les investisseurs.',
        },
        {
          type: 'scenario',
          situation:
            "Ton premier gros prospect te demande une remise de 50 % « pour te faire une référence ». Ce contrat représenterait 40 % de ton chiffre d'affaires annuel.",
          choices: [
            {
              text: 'Négocier une contrepartie : étude de cas, témoignage, engagement sur la durée',
              isGood: true,
              explanation: 'Exact : une remise doit toujours s\'échanger contre de la valeur (référence publique, volume, durée). Sinon tu formes ton marché à ne jamais payer le prix.',
            },
            {
              text: 'Accepter : un gros client, ça ne se refuse pas',
              isGood: false,
              explanation: 'Danger : 40 % de ton CA à moitié prix et un client dominant = marges détruites et dépendance. Le prix de départ devient la référence.',
            },
            {
              text: 'Refuser sèchement toute discussion',
              isGood: false,
              explanation: 'Trop brutal : le but n\'est pas de refuser la négociation, mais de la structurer avec des contreparties.',
            },
          ],
          mindyMessage: 'Ton prix raconte la valeur de ton produit. Défends-le. 💪',
        },
        {
          type: 'quiz',
          question: 'Pourquoi compare-t-on la LTV (valeur vie client) au CAC (coût d\'acquisition client) ?',
          options: [
            'Pour calculer les impôts de l\'entreprise',
            'Pour vérifier qu\'un client rapporte plus qu\'il ne coûte à acquérir',
            'Pour fixer le salaire des fondateurs',
            'Pour mesurer la notoriété de la marque',
          ],
          correctIndex: 1,
          mindyHint: 'Un ratio LTV/CAC d\'au moins 3 est souvent considéré comme sain.',
        },
        {
          type: 'speed_round',
          title: 'Vrai ou faux — sprint startup',
          pairs: [
            { statement: 'Le BFR (besoin en fonds de roulement) mesure le décalage de trésorerie lié à l\'activité.', isTrue: true },
            { statement: 'Une entreprise rentable ne peut jamais faire faillite.', isTrue: false },
            { statement: 'Le chiffre d\'affaires est le total des ventes, pas le bénéfice.', isTrue: true },
            { statement: 'Un pitch efficace commence par le problème que tu résous.', isTrue: true },
            { statement: 'Lever des fonds est obligatoire pour créer une entreprise.', isTrue: false },
          ],
          timeLimitSeconds: 45,
        },
        {
          type: 'info',
          title: 'Master Test terminé ! 🏆',
          content:
            'Bravo ! Statuts, MVP, levée de fonds, unit economics : tu as les fondations pour passer de l\'idée au projet qui tient la route.',
          mindyMessage: 'Légende startup. Prochaine étape : le monde réel. 🚀⚡',
        },
      ],
    },
  },
];
