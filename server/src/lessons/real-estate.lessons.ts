import type { CreateLessonInput } from './lesson-content.schema';

export const REAL_ESTATE_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 1 – Louer ou acheter ? (BEGINNER)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-001',
    title: 'Louer ou acheter : le grand débat',
    domain: 'REAL_ESTATE',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Louer ou acheter ?',
          content:
            "C'est l'une des plus grandes décisions financières de ta vie. Voici les 2 camps :\n\n🏠 Acheter : tu bâtis un patrimoine, tu rembourses « pour toi »… mais il faut un apport, payer des frais de notaire (~7-8 % dans l'ancien), et s'engager sur le long terme.\n\n🚪 Louer : flexibilité maximale, aucun frais d'entretien lourd — mais l'argent versé ne te « revient » pas.\n\nIl n'y a pas de bonne réponse universelle : tout dépend de ta durée sur place, du marché local et de ta situation.",
          mindyMessage: 'La pierre, ça rassure — mais ça se réfléchit. 🏠',
        },
        {
          type: 'swipe_sequence',
          title: 'Louer ou acheter ?',
          instruction: 'Swipe à droite si c\'est un avantage de l\'achat, à gauche si c\'est un avantage de la location.',
          leftLabel: 'Location ✅',
          rightLabel: 'Achat ✅',
          cards: [
            {
              id: 'c1',
              content: 'Flexibilité : déménager en 1 mois sans pénalité',
              correctDirection: 'left',
              explanation: 'Avantage de la location : pas d\'engagement long terme.',
            },
            {
              id: 'c2',
              content: 'Constitution d\'un patrimoine immobilier',
              correctDirection: 'right',
              explanation: 'Chaque mensualité remboursée augmente ton capital.',
            },
            {
              id: 'c3',
              content: 'Aucuns travaux de gros entretien à charge',
              correctDirection: 'left',
              explanation: 'Le propriétaire supporte les grosses réparations (toiture, chaudière…).',
            },
            {
              id: 'c4',
              content: 'Possibilité de personnaliser son logement librement',
              correctDirection: 'right',
              explanation: 'Propriétaire = maître chez soi pour les travaux et la déco.',
            },
          ],
          mindyMessage: 'Bien vu ! Chaque option a ses atouts selon ta situation. 🎯',
        },
        {
          type: 'quiz',
          question: 'Sur quelle durée minimale l\'achat devient-il généralement plus rentable que la location en France ?',
          options: ['6 mois', '2 ans', '5 à 7 ans', '20 ans'],
          correctIndex: 2,
          mindyHint: 'Il faut amortir les frais de notaire et d\'agence — cela prend quelques années.',
        },
        {
          type: 'swipe',
          statement: 'Acheter est toujours plus rentable que louer, quelles que soient les circonstances.',
          isCorrect: false,
          explanation: 'Faux. Sur une courte durée, les frais d\'achat (notaire ~7-8 %, agence) ne sont pas amortis. Louer peut être plus malin si tu bouges souvent.',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 2 – Les frais de notaire (BEGINNER)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-002',
    title: 'Frais de notaire : ancien vs neuf',
    domain: 'REAL_ESTATE',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 2,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Comprendre les frais de notaire',
          content:
            'Les « frais de notaire » ne vont PAS tous au notaire ! Ils se décomposent ainsi :\n\n• Droits de mutation (taxes) → ~5,8 % dans l\'ancien, ~0,7 % dans le neuf\n• Honoraires du notaire → ~1 %\n• Débours (frais divers) → ~0,5 %\n\n📌 Dans l\'ancien : total ≈ 7-8 % du prix d\'achat\n📌 Dans le neuf (TVA 20 % incluse) : total ≈ 2-3 % seulement\n\nExemple : pour un appartement de 200 000 €, ça représente 14 000 à 16 000 € dans l\'ancien.',
          mindyMessage: 'Les frais de notaire, c\'est la première surprise des primo-accédants. Maintenant tu sais ! 🧾',
        },
        {
          type: 'match_pairs',
          pairs: [
            { term: 'Droits de mutation', definition: 'Taxes perçues par l\'État et les collectivités (~5,8 %)' },
            { term: 'Honoraires du notaire', definition: 'Rémunération réglementée du professionnel (~1 %)' },
            { term: 'Débours', definition: 'Frais avancés par le notaire (cadastre, état civil…)' },
            { term: 'Frais dans le neuf', definition: 'Réduits à ~2-3 % car droits de mutation quasi nuls' },
          ],
          mindyMessage: 'Parfait ! Tu connais maintenant la ventilation des frais. 💡',
        },
        {
          type: 'fill_blank',
          sentence: 'Dans l\'ancien, les frais de notaire représentent environ ___ du prix d\'achat.',
          answer: '7 à 8 %',
          choices: ['1 à 2 %', '3 à 4 %', '7 à 8 %', '12 à 15 %'],
          mindyMessage: 'À ne pas oublier dans ton budget d\'achat !',
        },
        {
          type: 'reorder',
          title: 'Budget d\'achat immobilier',
          instruction: 'Remets ces postes de dépenses dans l\'ordre du montant le plus élevé au plus faible.',
          words: ['Honoraires agence (~4 %)', 'Prix net vendeur', 'Débours notaire (~0,5 %)', 'Frais de notaire complets (~7-8 %)'],
          correctOrder: [1, 3, 0, 2],
          hint: 'Le prix du bien est toujours la part la plus importante.',
          mindyMessage: 'Bravo ! Bien ordonner son budget évite les mauvaises surprises. 🎉',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 3 – Apport & capacité d'emprunt (BEGINNER)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-003',
    title: 'Apport personnel & capacité d\'emprunt',
    domain: 'REAL_ESTATE',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 3,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Apport et capacité d\'emprunt',
          content:
            'Avant de décrocher un prêt immobilier, la banque regarde deux choses :\n\n1️⃣ Ton taux d\'endettement : tes mensualités de crédit ne doivent pas dépasser 35 % de tes revenus nets (règle HCSF depuis 2022).\n\n2️⃣ Ton apport personnel : en général, les banques demandent au minimum 10 % du prix du bien (pour couvrir les frais de notaire). Plus tu apportes, meilleur est ton taux.\n\n💡 Formule rapide de capacité d\'emprunt :\nMensualité max = Revenus nets × 35 %',
          mindyMessage: 'Un bon apport, c\'est le meilleur argument face à la banque ! 💪',
        },
        {
          type: 'calculator',
          question: 'Lucas gagne 2 800 € nets/mois. Quelle est sa mensualité maximale selon la règle des 35 % du HCSF ?',
          variables: ['Revenu net mensuel : 2 800 €', 'Taux d\'endettement max HCSF : 35 %'],
          answer: 980,
          tolerance: 1,
          unit: '€/mois',
          mindyMessage: 'Exactement ! 2 800 × 0,35 = 980 €. C\'est le plafond de mensualité autorisé.',
        },
        {
          type: 'quiz',
          question: 'Quel taux d\'endettement maximum est imposé par le HCSF depuis 2022 ?',
          options: ['25 %', '33 %', '35 %', '40 %'],
          correctIndex: 2,
          mindyHint: 'Le Haut Conseil de Stabilité Financière a relevé ce seuil en 2022.',
        },
        {
          type: 'swipe',
          statement: 'Un apport de 10 % du prix du bien est suffisant pour couvrir tous les frais annexes.',
          isCorrect: false,
          explanation: 'Faux. 10 % couvre généralement les frais de notaire, mais les banques préfèrent 20 % pour obtenir de meilleures conditions de prêt.',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 4 – Taux d'intérêt & mensualité (INTERMEDIATE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-004',
    title: 'Taux & mensualité : comment ça se calcule ?',
    domain: 'REAL_ESTATE',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 4,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Comprendre le coût total d\'un crédit immo',
          content:
            'La mensualité d\'un prêt dépend de 3 paramètres :\n• Le capital emprunté (C)\n• Le taux annuel (t)\n• La durée en mois (n)\n\nFormule : M = C × [t/12] / [1 − (1 + t/12)^−n]\n\nMais pour estimer rapidement, retiens cette règle empirique :\n👉 À 3,5 % sur 20 ans ≈ 5,80 €/mois par 1 000 € empruntés\n👉 À 4 % sur 20 ans ≈ 6,06 €/mois par 1 000 € empruntés\n\nN\'oublie pas l\'assurance emprunteur (~0,2-0,5 % du capital/an) qui s\'ajoute.',
          mindyMessage: 'Un petit écart de taux peut chiffrer à plusieurs milliers d\'euros sur 20 ans !',
        },
        {
          type: 'calculator',
          question: 'Sofia emprunte 180 000 € sur 20 ans à 3,5 % (taux fixe). En utilisant la règle empirique de 5,80 €/mois par 1 000 €, quelle est son estimation de mensualité (hors assurance) ?',
          variables: ['Capital : 180 000 €', 'Durée : 20 ans', 'Taux : 3,5 %', 'Règle : 5,80 €/mois par 1 000 €'],
          answer: 1044,
          tolerance: 5,
          unit: '€/mois',
          mindyMessage: '180 × 5,80 = 1 044 €/mois. Retiens cette règle, elle est très pratique ! 🎯',
        },
        {
          type: 'drag_sort',
          question: 'Classe ces durées de prêt du coût TOTAL le moins élevé au plus élevé (même capital, même taux).',
          items: [
            { id: 'd1', label: '10 ans', emoji: '⚡', value: 'Durée courte' },
            { id: 'd2', label: '15 ans', emoji: '🕐', value: 'Durée moyenne' },
            { id: 'd3', label: '20 ans', emoji: '📅', value: 'Durée standard' },
            { id: 'd4', label: '25 ans', emoji: '📆', value: 'Durée longue' },
          ],
          correctOrder: [0, 1, 2, 3],
          explanation: 'Plus la durée est courte, moins tu paies d\'intérêts au total. En revanche, la mensualité est plus élevée.',
          mindyMessage: 'Emprunter long coûte cher ! L\'idéal : la durée la plus courte que tu peux te permettre. 💡',
        },
        {
          type: 'swipe',
          statement: 'L\'assurance emprunteur est obligatoire pour obtenir un crédit immobilier.',
          isCorrect: true,
          explanation: 'Vrai. Bien que non imposée par la loi, aucune banque n\'accorde un prêt sans assurance décès-invalidité. Son coût peut représenter 10 à 30 % du coût total du crédit.',
        },
        {
          type: 'quiz',
          question: 'Quel élément augmente directement le coût total d\'un prêt immobilier ?',
          options: ['Un apport plus élevé', 'Une durée de remboursement plus longue', 'Un taux d\'assurance plus faible', 'Un remboursement anticipé partiel'],
          correctIndex: 1,
          mindyHint: 'Plus tu paies longtemps, plus tu paies d\'intérêts au total.',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 5 – DPE & diagnostics obligatoires (BEGINNER)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-005',
    title: 'DPE et diagnostics obligatoires',
    domain: 'REAL_ESTATE',
    difficulty: 'BEGINNER',
    xpReward: 50,
    orderIndex: 5,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Le DPE : pourquoi c\'est crucial',
          content:
            'Le Diagnostic de Performance Énergétique (DPE) classe un logement de A (très économe) à G (passoire thermique).\n\n🔴 Depuis la loi Climat 2021 :\n• Logements G : interdits à la location dès 2025 (consommation > 450 kWh/m²/an)\n• Logements F : interdits à la location en 2028\n• Logements E : interdits à la location en 2034\n\nD\'autres diagnostics sont aussi obligatoires lors d\'une vente : amiante, plomb (avant 1949), électricité, gaz, termites (selon zone), ERP (risques naturels).\n\n💡 Un mauvais DPE peut peser lourd sur le prix de négociation !',
          mindyMessage: 'Un DPE G, c\'est un levier de négociation — mais aussi de futurs travaux. 🌡️',
        },
        {
          type: 'timeline_builder',
          title: 'Calendrier des interdictions de location (DPE)',
          events: [
            { id: 'e1', label: 'Nouveau DPE opposable obligatoire', year: '2021', emoji: '📋' },
            { id: 'e2', label: 'Gel des loyers pour logements F et G', year: '2022', emoji: '🥶' },
            { id: 'e3', label: 'Interdiction de louer les logements G (>450 kWh)', year: '2025', emoji: '🚫' },
            { id: 'e4', label: 'Interdiction de louer les logements F', year: '2028', emoji: '🚫' },
            { id: 'e5', label: 'Interdiction de louer les logements E', year: '2034', emoji: '🚫' },
          ],
          explanation: 'La loi Climat & Résilience de 2021 impose un calendrier progressif de sortie des passoires thermiques du marché locatif.',
          mindyMessage: 'Acheter une passoire F/G sans budget travaux, c\'est risqué. Vérifie toujours le DPE ! ⚡',
        },
        {
          type: 'quiz',
          question: 'Un logement classé G ne peut plus être mis en location à partir de…',
          options: ['2022', '2024', '2025', '2030'],
          correctIndex: 2,
          mindyHint: 'Loi Climat 2021 — les premières interdictions arrivent dès 2025 pour les plus mauvaises classes.',
        },
        {
          type: 'connect_dots',
          pairs: [
            { term: 'DPE A', definition: 'Bâtiment basse consommation (< 70 kWh/m²/an)' },
            { term: 'DPE G', definition: 'Passoire thermique (> 450 kWh/m²/an), bientôt interdit à la location' },
            { term: 'Amiante', definition: 'Diagnostic obligatoire pour tout bien construit avant 1997' },
            { term: 'Plomb (CREP)', definition: 'Obligatoire pour les biens construits avant 1949' },
            { term: 'ERP', definition: 'État des Risques et Pollutions — zones inondables, sismiques…' },
          ],
          mindyMessage: 'Les diagnostics, c\'est la carte d\'identité santé du logement ! 🏥',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 6 – Investissement locatif & rendement (INTERMEDIATE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-006',
    title: 'Investissement locatif : rendement brut & net',
    domain: 'REAL_ESTATE',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 6,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Rendement locatif : brut vs net',
          content:
            'Investir dans l\'immobilier locatif, ça se mesure avec le rendement.\n\n📊 Rendement brut = (loyer annuel / prix d\'achat total) × 100\nExemple : loyer 700 €/mois, bien acheté 150 000 € → (8 400 / 150 000) × 100 = 5,6 %\n\n📊 Rendement net = rendement brut − charges (taxe foncière, charges copro, assurances, gestion locative)\nEn pratique : enlève 1 à 2 points au brut pour obtenir une estimation du net.\n\n💡 Un bon rendement brut en France : 5-8 % selon la ville. Paris tourne autour de 3-4 %.',
          mindyMessage: 'Le rendement brut ça séduit — le net, c\'est la réalité. Ne confonds pas les deux ! 📈',
        },
        {
          type: 'calculator',
          question: 'Maxime achète un studio 95 000 € (frais inclus) et le loue 520 €/mois. Quel est son rendement locatif BRUT annuel ?',
          variables: ['Prix total d\'achat : 95 000 €', 'Loyer mensuel : 520 €', 'Formule : (loyer × 12 / prix) × 100'],
          answer: 6.57,
          tolerance: 0.1,
          unit: '%',
          mindyMessage: '(520 × 12 / 95 000) × 100 = 6,57 %. Pas mal pour un studio ! 🏡',
        },
        {
          type: 'speed_round',
          title: 'Vrai ou faux : investissement locatif',
          pairs: [
            { statement: 'Le rendement net est toujours supérieur au rendement brut.', isTrue: false },
            { statement: 'La vacance locative diminue le rendement réel.', isTrue: true },
            { statement: 'Paris offre généralement les meilleurs rendements bruts de France.', isTrue: false },
            { statement: 'Les charges de copropriété réduisent le rendement net.', isTrue: true },
            { statement: 'Le LMNP est un statut fiscal favorable pour les locations meublées.', isTrue: true },
            { statement: 'Un logement vide (non meublé) est imposé en BIC.', isTrue: false },
          ],
          timeLimitSeconds: 45,
        },
        {
          type: 'flashcard',
          front: 'LMNP',
          back: 'Loueur en Meublé Non Professionnel. Statut fiscal permettant d\'amortir comptablement le bien et de réduire l\'imposition sur les loyers. Revenus imposés en BIC.',
          category: 'Fiscalité immobilière',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 7 – Charges de copropriété & taxe foncière (INTERMEDIATE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-007',
    title: 'Charges de copro & taxe foncière',
    domain: 'REAL_ESTATE',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 7,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Les charges qui s\'ajoutent à la mensualité',
          content:
            'Quand tu achètes en copropriété, les charges ne s\'arrêtent pas à la mensualité de crédit.\n\n💰 Charges de copropriété : entretien parties communes, gardien, ascenseur, eau froide des parties communes… En moyenne 30-50 €/m²/an selon l\'immeuble.\n\nEntre charges courantes (eau, nettoyage) et charges exceptionnelles (ravalement, toiture), l\'ASL ou le syndic vote les travaux en AG.\n\n🏛️ Taxe foncière : impôt local annuel payé par le propriétaire. Calculée sur la valeur locative cadastrale du bien × taux voté par la commune. Elle a fortement augmenté dans de nombreuses villes depuis 2023.',
          mindyMessage: 'Avant d\'acheter, demande toujours les 3 derniers PV d\'AG de copropriété. Les surprises s\'y cachent ! 🕵️',
        },
        {
          type: 'budget_allocator',
          totalBudget: 1500,
          categories: [
            { label: 'Mensualité crédit', icon: '🏦', targetPercent: 60, minPercent: 45, maxPercent: 75 },
            { label: 'Charges copropriété', icon: '🏢', targetPercent: 15, minPercent: 8, maxPercent: 25 },
            { label: 'Taxe foncière (mensuel.)', icon: '🏛️', targetPercent: 8, minPercent: 4, maxPercent: 15 },
            { label: 'Assurance habitation', icon: '🛡️', targetPercent: 5, minPercent: 2, maxPercent: 10 },
            { label: 'Provision travaux', icon: '🔧', targetPercent: 12, minPercent: 5, maxPercent: 20 },
          ],
          explanation: 'Le vrai coût mensuel d\'un propriétaire dépasse la seule mensualité. Pense à provisionner pour les travaux imprévus !',
        },
        {
          type: 'quiz',
          question: 'Qui paie la taxe foncière d\'un appartement loué ?',
          options: ['Le locataire', 'Le propriétaire', 'Le syndic de copropriété', 'La commune directement'],
          correctIndex: 1,
          mindyHint: 'C\'est un impôt lié à la propriété du bien, pas à son occupation.',
        },
        {
          type: 'swipe',
          statement: 'Les charges de copropriété « courantes » couvrent les travaux de ravalement de façade.',
          isCorrect: false,
          explanation: 'Faux. Le ravalement est une charge exceptionnelle, votée en Assemblée Générale. Seules les charges courantes (eau, entretien des parties communes) sont régulières.',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 8 – Plus-value immobilière & fiscalité (ADVANCED)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-008',
    title: 'Plus-value immobilière et impôts',
    domain: 'REAL_ESTATE',
    difficulty: 'ADVANCED',
    xpReward: 100,
    orderIndex: 8,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Fiscalité de la plus-value immobilière',
          content:
            'Lorsque tu revends un bien plus cher que tu ne l\'as acheté, la différence est une plus-value immobilière, soumise à impôt.\n\n📌 Taux d\'imposition : 19 % d\'IR + 17,2 % de prélèvements sociaux = 36,2 % au total.\n\n⏳ Abattements pour durée de détention :\n• IR : exonération totale après 22 ans\n• PS : exonération totale après 30 ans\n\n🏠 Exception majeure : la résidence principale est TOTALEMENT exonérée de plus-value (si c\'est ta RP au moment de la cession).\n\nNote : des surtaxes s\'appliquent pour les plus-values > 50 000 €.',
          mindyMessage: 'La résidence principale, c\'est le meilleur abri fiscal en immobilier ! 🏆',
        },
        {
          type: 'calculator',
          question: 'Inès achète un appartement (résidence secondaire) 120 000 € et le revend 5 ans plus tard 165 000 €. Quelle est la plus-value imposable (sans abattement, à 36,2 %) ?',
          variables: ['Prix d\'achat : 120 000 €', 'Prix de vente : 165 000 €', 'Taux global : 36,2 % (19 % IR + 17,2 % PS)', 'Abattement : 0 % (moins de 6 ans révolus de détention)'],
          answer: 16290,
          tolerance: 100,
          unit: '€',
          mindyMessage: '(165 000 − 120 000) × 36,2 % = 45 000 × 0,362 = 16 290 €. Ça fait réfléchir avant de revendre trop tôt ! 💸',
        },
        {
          type: 'word_scramble',
          word: 'EXONERATION',
          hint: 'La résidence principale en bénéficie totalement lors de la revente.',
          scrambled: ['E', 'X', 'O', 'N', 'E', 'R', 'A', 'T', 'I', 'O', 'N'],
          mindyMessage: 'Exactement ! L\'exonération de la résidence principale est LE grand avantage fiscal de l\'immo. 🎉',
        },
        {
          type: 'quiz',
          question: 'Après combien d\'années de détention une résidence secondaire est-elle totalement exonérée de prélèvements sociaux sur la plus-value ?',
          options: ['15 ans', '22 ans', '25 ans', '30 ans'],
          correctIndex: 3,
          mindyHint: 'L\'exonération d\'IR arrive plus tôt que celle des prélèvements sociaux.',
        },
        {
          type: 'swipe',
          statement: 'La vente de sa résidence principale est toujours exonérée d\'impôt sur la plus-value en France.',
          isCorrect: true,
          explanation: 'Vrai. La résidence principale est exonérée de plus-value immobilière, quelle que soit la durée de détention, à condition que ce soit bien ta résidence habituelle et effective au moment de la vente.',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 9 – Négocier le prix d'achat (INTERMEDIATE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-009',
    title: 'Négocier le prix : les bonnes tactiques',
    domain: 'REAL_ESTATE',
    difficulty: 'INTERMEDIATE',
    xpReward: 75,
    orderIndex: 9,
    content: {
      steps: [
        {
          type: 'info',
          title: 'L\'art de la négociation immobilière',
          content:
            'En France, le prix affiché est rarement le prix final. La marge de négociation dépend du marché :\n\n📍 Marché tendu (Paris, Lyon…) : 0-3 % de marge\n📍 Marché normal : 5-10 % de marge\n📍 Bien resté longtemps à la vente : jusqu\'à 15 %\n\n🎯 Les leviers de négociation :\n• Travaux à prévoir (DPE mauvais, toiture, électricité)\n• Prix au m² supérieur au marché local\n• Durée de mise en vente > 3 mois\n• Problèmes de copropriété (appels de fonds, procédures)\n\nToujours formuler une offre écrite avec une justification factuelle.',
          mindyMessage: 'Négocier, c\'est pas être radin — c\'est être informé. 🤝',
        },
        {
          type: 'scenario',
          situation: 'Tu visites un appartement affiché 250 000 €. Le DPE est classé E, le bien est en vente depuis 4 mois, et le prix au m² est 8 % au-dessus de la moyenne du quartier. Quelle est la meilleure stratégie ?',
          choices: [
            {
              text: 'Faire une offre à 230 000 € avec une justification écrite (DPE, durée de vente, prix/m² comparatif).',
              isGood: true,
              explanation: 'Excellent ! Une offre à -8 % est justifiée par des éléments factuels. La lettre d\'offre motivée est bien plus convaincante qu\'un simple chiffre verbal.',
            },
            {
              text: 'Proposer oralement 200 000 € sans justification pour voir leur réaction.',
              isGood: false,
              explanation: 'Une offre orale non justifiée à -20 % risque de froisser le vendeur et de te fermer la porte. Toujours écrire et argumenter.',
            },
            {
              text: 'Accepter le prix demandé pour ne pas rater le bien.',
              isGood: false,
              explanation: 'Avec ces éléments, tu laisses clairement de l\'argent sur la table. Les indicateurs sont clairement en ta faveur pour négocier.',
            },
            {
              text: 'Demander à l\'agent de transmettre une offre à 240 000 € avec un dossier de financement solide.',
              isGood: true,
              explanation: 'Bonne approche aussi ! Une offre à -4 % avec un financement béton rassure le vendeur et peut faire mouche, surtout si le bien ne part pas.',
            },
          ],
          mindyMessage: 'Negocier, c\'est préparer ses arguments à l\'avance. Les données du marché, c\'est ton meilleur outil ! 📊',
        },
        {
          type: 'connect_dots',
          pairs: [
            { term: 'DPE F ou G', definition: 'Levier de négociation : des travaux de rénovation énergétique seront nécessaires' },
            { term: 'Délai de vente > 3 mois', definition: 'Signe que le prix est trop élevé ou que le bien présente des défauts' },
            { term: 'Offre d\'achat écrite', definition: 'Document signé formalisant ta proposition de prix et ses conditions' },
            { term: 'Prix au m² comparatif', definition: 'Outil clé pour justifier objectivement une négociation à la baisse' },
          ],
          mindyMessage: 'Bien connecté ! Ces outils font de toi un acheteur redoutable. 🏆',
        },
        {
          type: 'swipe',
          statement: 'Il est impoli de négocier le prix d\'un bien immobilier en France.',
          isCorrect: false,
          explanation: 'Faux. La négociation est normale et attendue. En moyenne, les acheteurs négocient 3 à 7 % dans les marchés normaux. Seuls les marchés très tendus laissent peu de marge.',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Leçon 10 – Repérer les arnaques immobilières (ADVANCED)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-real-estate-010',
    title: 'Repérer les arnaques immo : restez vigilant',
    domain: 'REAL_ESTATE',
    difficulty: 'ADVANCED',
    xpReward: 125,
    orderIndex: 10,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Les arnaques immobilières les plus courantes',
          content:
            'L\'immobilier est l\'un des secteurs les plus ciblés par les fraudeurs. Voici les arnaques fréquentes :\n\n🚩 Fausse annonce : bien qui n\'existe pas ou appartient à quelqu\'un d\'autre. Prix anormalement bas, photos volées.\n\n🚩 Demande d\'acompte avant visite : aucun professionnel sérieux ne demande de l\'argent avant une visite.\n\n🚩 Propriétaire « à l\'étranger » qui envoie des clés par courrier après paiement : arnaque classique.\n\n🚩 Faux agent immobilier : vérifie la carte professionnelle (carte T) sur le registre FNAIM/CCI.\n\n🚩 Faux notaire : l\'identité du notaire doit être vérifiée sur le site officiel notaires.fr.',
          mindyMessage: 'Si c\'est trop beau pour être vrai, c\'est probablement une arnaque ! 🔎',
        },
        {
          type: 'spot_the_scam',
          question: 'L\'une de ces 3 annonces est une arnaque. Laquelle ?',
          cards: [
            {
              id: 'card1',
              type: 'email',
              content: 'Bonjour, je suis propriétaire d\'un T3 à Lyon 6e (75m²), loyer 950 €/cc. Je suis actuellement en mission humanitaire en Côte d\'Ivoire. Envoyez 500 € de garantie via Western Union pour recevoir les clés et signer le bail à distance. Je vous fais confiance.',
              sender: 'jean.dupont.proprio@gmail.com',
              isScam: true,
              redFlags: [
                'Demande d\'argent (Western Union) AVANT la visite',
                'Propriétaire prétendument à l\'étranger',
                'Signature de bail "à distance" sans visite',
                'Adresse email générique, pas professionnelle',
                'Prix légèrement sous le marché pour attirer',
              ],
            },
            {
              id: 'card2',
              type: 'site',
              content: 'Annonce SeLoger — Appartement T2 45m², Paris 11e. Loyer : 1 150 €/mois CC. Visite sur rendez-vous, contacter l\'agence Leclercq Immobilier (carte T n°CPI 75012XXXXX). Dépôt de garantie 2 mois demandé à la signature du bail.',
              sender: 'agence-leclercq.fr',
              isScam: false,
            },
            {
              id: 'card3',
              type: 'email',
              content: 'Bonjour, suite à votre demande de visite pour le studio au 12 rue des Lilas, Bordeaux. Rendez-vous confirmé samedi 14h. Munissez-vous d\'une pièce d\'identité et de vos 3 derniers bulletins de salaire pour constituer le dossier. Cordialement, Cabinet Moreau Immobilier.',
              sender: 'contact@cabinet-moreau-immo.fr',
              isScam: false,
            },
          ],
          explanation: 'L\'email 1 cumule tous les signaux d\'alarme d\'une arnaque locative : propriétaire à l\'étranger, paiement Western Union avant visite, signature à distance. Aucun bailleur légitime ne procède ainsi.',
          mindyMessage: 'Règle d\'or : JAMAIS d\'argent avant une visite physique avec vérification des titres de propriété ! 🛡️',
        },
        {
          type: 'speed_round',
          title: 'Arnaque ou légal ? Réponds vite !',
          pairs: [
            { statement: 'Un propriétaire demande 2 mois de dépôt de garantie pour un logement vide.', isTrue: false },
            { statement: 'Un agent demande des honoraires au locataire supérieurs à 1 mois de loyer HC.', isTrue: false },
            { statement: 'Un bailleur exige un paiement Western Union avant toute visite.', isTrue: false },
            { statement: 'Vérifier la carte T d\'un agent sur le site de la CCI est une bonne pratique.', isTrue: true },
            { statement: 'Un loyer 40 % sous le prix du marché est un signal d\'arnaque potentiel.', isTrue: true },
            { statement: 'Le dépôt de garantie doit être versé au notaire lors de la signature du bail.', isTrue: false },
          ],
          timeLimitSeconds: 50,
        },
        {
          type: 'scenario',
          situation: 'Tu trouves une annonce parfaite : grand T3 en plein centre-ville, loyer 20 % sous le marché. Le propriétaire répond rapidement par email, dit être en déplacement professionnel à Dubai, et propose d\'envoyer les clés après réception de 600 € de "caution de dossier" par virement. Que fais-tu ?',
          choices: [
            {
              text: 'Tu envoies les 600 € rapidement pour ne pas perdre ce bien exceptionnel.',
              isGood: false,
              explanation: 'C\'est tomber dans le piège ! Les signaux d\'alerte sont tous là : prix trop bas, propriétaire "à l\'étranger", demande d\'argent avant visite. Tu perdrais ton argent.',
            },
            {
              text: 'Tu refuses de payer et signales l\'annonce sur la plateforme, puis sur Signal-Arnaques.com.',
              isGood: true,
              explanation: 'Parfait ! Ne jamais payer avant une visite physique. Le signalement protège les autres victimes potentielles.',
            },
            {
              text: 'Tu demandes une vidéo du bien pour t\'assurer qu\'il existe.',
              isGood: false,
              explanation: 'Insuffisant : les escrocs utilisent souvent de vraies photos/vidéos de biens existants qui ne leur appartiennent pas. Il faut une visite physique, point final.',
            },
          ],
          mindyMessage: 'Bien joué ! Un bien trop beau à un prix trop bas + paiement avant visite = arnaque certaine. 🚨',
        },
      ],
    },
  },
];
