import type { CreateLessonInput } from './lesson-content.schema';

/** 3 leçons démo (1 par nouveau domaine). Ids fixes → upsert idempotent. */
export const DEMO_DOMAIN_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  {
    id: 'demo-real-estate-001',
    title: 'Immobilier : acheter ou louer ?',
    domain: 'REAL_ESTATE',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Acheter ou louer ?',
          content: `Louer ou acheter ton logement, c'est l'une des plus grosses décisions financières de ta vie.\n\nLouer : flexibilité, pas d'apport, mais tu ne te constitues pas de patrimoine.\nAcheter : tu construis un capital, mais il y a des frais importants (frais de notaire ~7-8 % dans l'ancien) et un engagement long.\n\nLa bonne réponse dépend de ta situation : durée, marché local, apport, stabilité.`,
          mindyMessage: "La pierre, ça rassure — mais ça s'étudie. 🏠",
        },
        {
          type: 'quiz',
          question: "Dans l'ancien, les « frais de notaire » représentent environ…",
          options: ['1-2 % du prix', '7-8 % du prix', '15 % du prix', "0 %, c'est gratuit"],
          correctIndex: 1,
          mindyHint: "Ils sont bien plus élevés dans l'ancien que dans le neuf.",
        },
        {
          type: 'swipe',
          statement: 'Acheter est toujours plus rentable que louer.',
          isCorrect: false,
          explanation: "Faux. Sur une courte durée, les frais d'achat (notaire, agence) ne sont pas amortis : louer peut être plus malin. Tout dépend de la durée de détention et du marché.",
        },
      ],
    },
  },
  {
    id: 'demo-entrepreneurship-001',
    title: 'Lancer son business : les bases',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Lancer son business : les bases',
          content: `Avant de te lancer, une règle d'or : valide le besoin avant de tout construire.\n\nLe MVP (Minimum Viable Product) = la plus petite version de ton produit qui permet de tester si des gens en veulent (et sont prêts à payer).\n\nEt ne l'oublie jamais : un business survit quand ses revenus dépassent ses charges.`,
          mindyMessage: "Pas besoin d'être parfait. Besoin d'être utile. 🚀",
        },
        {
          type: 'quiz',
          question: 'À quoi sert un MVP ?',
          options: ['À avoir un produit parfait dès le départ', "À valider qu'un vrai besoin existe", 'À lever des millions', 'À recruter une grosse équipe'],
          correctIndex: 1,
          mindyHint: 'Minimum… Viable… on teste avant de tout miser.',
        },
        {
          type: 'swipe',
          statement: 'Il faut une idée 100 % originale pour réussir.',
          isCorrect: false,
          explanation: "Faux. La plupart des succès reprennent des idées existantes mieux exécutées. L'exécution et le client comptent plus que l'originalité.",
        },
      ],
    },
  },
  {
    id: 'demo-taxes-001',
    title: 'Comprendre tes impôts',
    domain: 'TAXES',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Comprendre tes impôts',
          content: `En France, l'impôt sur le revenu est progressif : il est calculé par tranches.\n\nChaque tranche a son taux, et seule la partie de ton revenu qui tombe dans une tranche est taxée à ce taux-là.\n\nÀ retenir aussi : le brut (avant cotisations/impôt) n'est pas le net (ce que tu touches vraiment), et l'impôt est désormais prélevé à la source.`,
          mindyMessage: "Les impôts, c'est moins effrayant quand on comprend les tranches. 🧾",
        },
        {
          type: 'quiz',
          question: "Le barème de l'impôt sur le revenu est…",
          options: ['Un taux unique pour tous', 'Progressif, par tranches', 'Toujours 0 %', "Calculé sur le chiffre d'affaires"],
          correctIndex: 1,
          mindyHint: 'Plus tu gagnes, plus la part supplémentaire est taxée — par paliers.',
        },
        {
          type: 'swipe',
          statement: 'Passer dans la tranche supérieure fait baisser ton revenu net global.',
          isCorrect: false,
          explanation: "Faux. Seule la part au-dessus du seuil est taxée au taux plus élevé : gagner plus ne fait jamais baisser ton net total.",
        },
      ],
    },
  },
];
