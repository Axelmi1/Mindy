/**
 * Seed script — Domain Master Quizzes
 * CRYPTO Master Test / FINANCE Master Test / TRADING Master Test
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/seed-master-quizzes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MASTER_QUIZZES = [
  // ─────────────────────────────────────────────────────────────────────────
  // CRYPTO MASTER TEST
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: '🏆 CRYPTO Master Test',
    domain: 'CRYPTO' as const,
    difficulty: 'ADVANCED' as const,
    xpReward: 200,
    orderIndex: 900,
    isMasterQuiz: true,
    content: {
      steps: [
        {
          type: 'info',
          title: 'CRYPTO Master Test',
          content: 'Ce test évalue ta maîtrise complète des cryptomonnaies. 10 questions avancées. 200 XP à gagner. Bonne chance ! 🚀',
        },
        {
          type: 'quiz',
          question: 'Quel mécanisme de consensus Bitcoin utilise-t-il ?',
          options: ['Proof of Stake', 'Proof of Work', 'Delegated PoS', 'Proof of Authority'],
          correctIndex: 1,
          explanation: 'Bitcoin utilise le Proof of Work (PoW) — les mineurs résolvent des problèmes mathématiques complexes pour valider les blocs.',
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le \"halving\" Bitcoin ?",
          options: [
            "Division du prix par 2",
            "Réduction de 50% de la récompense des mineurs toutes les 210 000 blocs",
            "Augmentation de la vitesse de transaction",
            "Fusion de deux blockchains",
          ],
          correctIndex: 1,
          explanation: "Le halving réduit la récompense des mineurs de 50% environ tous les 4 ans. Il réduit l'inflation de Bitcoin et crée historiquement des bull runs.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'une 'gas fee' sur Ethereum ?",
          options: [
            "Frais d'échange entre ETH et BTC",
            "Coût de validation d'une transaction sur le réseau Ethereum",
            "Commission prélevée par les exchanges",
            "Frais de conversion en monnaie fiat",
          ],
          correctIndex: 1,
          explanation: "Les gas fees sont les frais payés aux validateurs Ethereum pour exécuter des transactions ou des smart contracts. Elles varient selon la congestion du réseau.",
        },
        {
          type: 'quiz',
          question: "Quelle est la supply maximale de Bitcoin ?",
          options: ["18 millions", "21 millions", "100 millions", "Illimitée"],
          correctIndex: 1,
          explanation: "Bitcoin a une supply maximale de 21 millions de BTC, inscrite dans son code. Cette rareté programmée est l'un de ses atouts fondamentaux.",
        },
        {
          type: 'fill_blank',
          sentence: "Un smart contract est un programme qui s'exécute _____ sur la blockchain.",
          correctAnswer: "automatiquement",
          hint: "Sans intermédiaire humain",
          explanation: "Les smart contracts s'exécutent automatiquement quand les conditions prédéfinies sont remplies, sans nécessiter d'intermédiaire.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le 'staking' ?",
          options: [
            "Acheter des cryptos à effet de levier",
            "Immobiliser des cryptos pour sécuriser un réseau PoS et recevoir des récompenses",
            "Miner des cryptos avec du matériel spécialisé",
            "Échanger des NFTs contre des tokens",
          ],
          correctIndex: 1,
          explanation: "Le staking consiste à verrouiller ses cryptos comme collatéral pour valider des transactions sur un réseau Proof of Stake. En échange, on reçoit des récompenses en crypto.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'un 'rug pull' dans le contexte DeFi ?",
          options: [
            "Une chute brutale du prix due à la panique",
            "Les développeurs abandonnent le projet et vident la liquidité",
            "Un hard fork non planifié",
            "Une attaque de 51% sur la blockchain",
          ],
          correctIndex: 1,
          explanation: "Un rug pull est une arnaque où les développeurs drainent la liquidité du projet et disparaissent avec les fonds des investisseurs.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que la DeFi (Finance Décentralisée) ?",
          options: [
            "Des banques numériques régulées",
            "Un écosystème financier sans intermédiaires basé sur des smart contracts",
            "Des cryptos émises par des gouvernements",
            "Un réseau de DAOs réglementées",
          ],
          correctIndex: 1,
          explanation: "La DeFi regroupe tous les services financiers (prêts, échanges, épargne) construits sur des blockchains via smart contracts, sans banques ni intermédiaires centralisés.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'un NFT (Non-Fungible Token) ?",
          options: [
            "Un Bitcoin non mineable",
            "Un token unique et non interchangeable représentant un actif numérique",
            "Une stablecoin indexée sur l'or",
            "Un token de gouvernance DeFi",
          ],
          correctIndex: 1,
          explanation: "Un NFT est un token unique sur la blockchain qui prouve la propriété d'un actif numérique (art, musique, gaming items). Contrairement aux cryptos classiques, chaque NFT est unique.",
        },
        {
          type: 'scenario',
          title: 'Décision d\'investisseur',
          scenario: "Tu détiens 1 ETH acheté à 2000$. Le prix monte à 3500$. Un analyste prédit un crash à 1000$ dans 3 mois. Tu as besoin des fonds dans 6 mois.",
          question: "Quelle est la stratégie la plus prudente ?",
          options: [
            "Vendre tout immédiatement pour sécuriser le gain",
            "Vendre 50% pour sécuriser une partie du gain, garder 50%",
            "Garder tout — les cryptos montent toujours à long terme",
            "Acheter plus à levier pour maximiser le gain potentiel",
          ],
          correctIndex: 1,
          explanation: "La vente partielle (50%) est une stratégie prudente : tu sécurises une partie du gain tout en restant exposé à la hausse potentielle. Avec un besoin de liquidités à 6 mois, prendre du levier serait imprudent.",
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCE MASTER TEST
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: '🏆 FINANCE Master Test',
    domain: 'FINANCE' as const,
    difficulty: 'ADVANCED' as const,
    xpReward: 200,
    orderIndex: 901,
    isMasterQuiz: true,
    content: {
      steps: [
        {
          type: 'info',
          title: 'FINANCE Master Test',
          content: 'Prouve que tu maîtrises la finance personnelle et d\'entreprise. 10 questions avancées. 200 XP à gagner. En avant ! 💰',
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le ratio P/E (Price-to-Earnings) ?",
          options: [
            "Le prix d'une action divisé par ses dividendes",
            "Le prix d'une action divisé par son bénéfice par action",
            "Le bénéfice net divisé par le chiffre d'affaires",
            "La capitalisation boursière divisée par les actifs totaux",
          ],
          correctIndex: 1,
          explanation: "Le ratio P/E = Prix de l'action / BPA (Bénéfice Par Action). Il indique combien les investisseurs paient pour 1€ de bénéfice. Un P/E élevé peut indiquer une surévaluation ou des attentes de forte croissance.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que l'effet de levier en finance ?",
          options: [
            "Diversifier son portefeuille sur plusieurs classes d'actifs",
            "Utiliser de la dette pour amplifier les rendements (et les pertes) d'un investissement",
            "Réinvestir les dividendes automatiquement",
            "Acheter des obligations d'État pour réduire le risque",
          ],
          correctIndex: 1,
          explanation: "L'effet de levier utilise l'emprunt pour investir plus que son capital initial. Il amplifie les gains si l'investissement monte, mais aussi les pertes si ça baisse — risque majeur à maîtriser.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que la diversification de portefeuille ?",
          options: [
            "Concentrer ses investissements sur la classe d'actifs la plus performante",
            "Répartir les investissements sur plusieurs actifs non corrélés pour réduire le risque global",
            "Investir uniquement dans des obligations sécurisées",
            "Changer fréquemment ses investissements selon les tendances",
          ],
          correctIndex: 1,
          explanation: "La diversification réduit le risque en répartissant les investissements sur des actifs non corrélés. Si un actif chute, les autres peuvent compenser. 'Don't put all your eggs in one basket.'",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que l'inflation ?",
          options: [
            "Une hausse des taux d'intérêt des banques centrales",
            "L'augmentation générale des prix, qui diminue le pouvoir d'achat de la monnaie",
            "Une hausse de la valeur d'une action en bourse",
            "La croissance du PIB d'un pays",
          ],
          correctIndex: 1,
          explanation: "L'inflation est la perte de pouvoir d'achat de la monnaie. Si l'inflation est à 5%, 1000€ aujourd'hui n'auront que 952€ de pouvoir d'achat l'an prochain.",
        },
        {
          type: 'calculator',
          title: 'Intérêts composés',
          question: "Tu investis 5 000€ à 8% par an pendant 10 ans avec intérêts composés. Quel est ton capital final ? (Utilise la formule : C × (1 + r)^n)",
          initialValue: 5000,
          targetValue: 10794,
          tolerance: 200,
          unit: '€',
          hint: "5000 × (1.08)^10 ≈ ?",
          explanation: "5000 × (1.08)^10 ≈ 10 795€. Les intérêts composés font boule de neige : tu gagnes des intérêts sur tes intérêts. C'est le secret de la richesse à long terme.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'une obligation (bond) ?",
          options: [
            "Une action donnant droit à des dividendes",
            "Un titre de créance par lequel un emprunteur s'engage à rembourser avec intérêts",
            "Un produit dérivé basé sur un indice boursier",
            "Un contrat d'assurance-vie",
          ],
          correctIndex: 1,
          explanation: "Une obligation est un prêt que l'investisseur fait à un émetteur (État, entreprise). L'émetteur rembourse le principal + des intérêts (coupons) à échéance. Moins risqué que les actions mais rendement plus faible.",
        },
        {
          type: 'quiz',
          question: "Que signifie 'Buy Low, Sell High' en pratique ?",
          options: [
            "Acheter des actions bon marché et vendre les plus chères",
            "Acheter quand les prix sont bas (sous-évalués) et vendre quand ils sont hauts (surévalués)",
            "Acheter en période de récession et vendre en période de croissance",
            "Acheter des actifs avec un faible P/E et vendre avec un P/E élevé",
          ],
          correctIndex: 1,
          explanation: "Le principe fondamental de l'investissement : acheter des actifs sous-évalués et les vendre quand ils ont atteint leur valeur réelle ou sont surévalués. Facile en théorie, difficile en pratique (émotions, timing).",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le CAPM (Capital Asset Pricing Model) ?",
          options: [
            "Un modèle pour calculer la valeur d'une entreprise",
            "Un modèle qui décrit la relation entre risque systématique et rendement attendu",
            "Une méthode pour calculer les intérêts composés",
            "Un indicateur de liquidité bancaire",
          ],
          correctIndex: 1,
          explanation: "Le CAPM établit que E(R) = Rf + β × (Rm - Rf). Il relie le rendement attendu d'un actif à son bêta (sensibilité au marché). Plus le risque, plus le rendement exigé.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que la liquidité d'un actif ?",
          options: [
            "La volatilité du prix d'un actif sur le marché",
            "La facilité et la rapidité avec lesquelles un actif peut être converti en cash sans perte de valeur",
            "Le rendement annualisé d'un investissement",
            "La capacité d'un actif à générer des flux de trésorerie",
          ],
          correctIndex: 1,
          explanation: "La liquidité mesure la facilité de vendre un actif rapidement au prix du marché. Les actions des grandes entreprises sont très liquides ; l'immobilier ou les œuvres d'art le sont peu.",
        },
        {
          type: 'scenario',
          title: 'Décision de portefeuille',
          scenario: "Tu as 10 000€ à investir, 30 ans devant toi, et une tolérance au risque modérée. Ton objectif : maximiser la croissance long terme.",
          question: "Quelle allocation de portefeuille est la plus adaptée ?",
          options: [
            "100% en livret A (taux garanti, sans risque)",
            "70% actions mondiales diversifiées / 20% obligations / 10% alternatives",
            "100% en actions d'une seule entreprise tech prometteuse",
            "50% or / 50% immobilier",
          ],
          correctIndex: 1,
          explanation: "Sur 30 ans, une allocation 70/20/10 (actions/obligations/alternatives) est classique pour un profil modéré. Elle capte la croissance long terme des marchés actions tout en amortissant la volatilité.",
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRADING MASTER TEST
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: '🏆 TRADING Master Test',
    domain: 'TRADING' as const,
    difficulty: 'ADVANCED' as const,
    xpReward: 200,
    orderIndex: 902,
    isMasterQuiz: true,
    content: {
      steps: [
        {
          type: 'info',
          title: 'TRADING Master Test',
          content: 'Le test ultime du trader. Analyse technique, gestion du risque, psychologie. 10 questions avancées. 200 XP. Prouve ce que tu vaux ! 📈',
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'un support en analyse technique ?",
          options: [
            "Un niveau de prix où la résistance à la hausse est forte",
            "Un niveau de prix où la demande est suffisamment forte pour empêcher le prix de baisser davantage",
            "La moyenne mobile à 200 jours d'un actif",
            "Le prix plancher fixé par un régulateur",
          ],
          correctIndex: 1,
          explanation: "Un support est un niveau de prix où les acheteurs entrent massivement, stoppant la baisse. À l'inverse, une résistance est un niveau où les vendeurs dominent et bloquent la hausse.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le RSI (Relative Strength Index) ?",
          options: [
            "Un indicateur de volume d'échanges",
            "Un oscillateur qui mesure la vitesse et l'amplitude des mouvements de prix (0-100)",
            "Un indicateur de volatilité basé sur les bandes de Bollinger",
            "Un ratio comparant la performance relative de deux actifs",
          ],
          correctIndex: 1,
          explanation: "Le RSI oscille entre 0 et 100. Au-dessus de 70 → surachat (possible retournement baissier). En-dessous de 30 → survente (possible rebond haussier). C'est un signal de momentum.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'un ordre stop-loss ?",
          options: [
            "Un ordre d'achat automatique quand le prix atteint un seuil cible",
            "Un ordre de vente automatique à un prix prédéfini pour limiter les pertes",
            "Un ordre pour bloquer les bénéfices à un niveau donné",
            "Un ordre conditionnel basé sur des nouvelles fondamentales",
          ],
          correctIndex: 1,
          explanation: "Le stop-loss est un outil de gestion du risque : il vend automatiquement une position si le prix atteint un niveau prédéfini, limitant les pertes. Essentiel pour tout trader sérieux.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le ratio Risk/Reward (R:R) ?",
          options: [
            "Le ratio entre la taille de la position et le capital total",
            "Le rapport entre la perte maximale potentielle et le gain cible d'un trade",
            "Le ratio entre le volume d'échanges et la capitalisation boursière",
            "La corrélation entre deux actifs dans un portefeuille",
          ],
          correctIndex: 1,
          explanation: "Le R:R compare ce que tu risques à ce que tu vises. Un R:R de 1:3 signifie que tu risques 100€ pour gagner 300€. Un bon trader cherche des setups avec un R:R ≥ 1:2.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'une bougie (candlestick) haussière englobante ?",
          options: [
            "Une bougie verte dont le corps est plus petit que la précédente",
            "Une bougie haussière dont le corps englobe entièrement le corps de la bougie baissière précédente",
            "Deux bougies consécutives avec des hauts croissants",
            "Une bougie avec une mèche supérieure très longue",
          ],
          correctIndex: 1,
          explanation: "L'engulfing bullish est un pattern de retournement : une grande bougie verte englobe la bougie rouge précédente. Elle signale que les acheteurs ont repris le contrôle.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le MACD ?",
          options: [
            "Un indicateur de volume basé sur la moyenne mobile",
            "Un indicateur de momentum qui montre la relation entre deux moyennes mobiles exponentielles",
            "Un oscillateur mesurant la volatilité implicite",
            "Un ratio de divergence entre prix spot et prix futures",
          ],
          correctIndex: 1,
          explanation: "Le MACD (Moving Average Convergence Divergence) utilise deux EMA (12 et 26 jours). Le croisement de la ligne MACD et de sa ligne de signal génère des signaux d'achat/vente.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le biais de confirmation en trading ?",
          options: [
            "La tendance à suivre les signaux de confirmation d'un indicateur",
            "La tendance à chercher des informations qui confirment ses croyances existantes, ignorant les signaux contraires",
            "L'attente d'une confirmation de breakout avant d'entrer en position",
            "La validation d'un signal par plusieurs indicateurs simultanément",
          ],
          correctIndex: 1,
          explanation: "Le biais de confirmation pousse les traders à n'écouter que ce qui confirme leurs thèses. C'est dangereux : ils ignorent les signaux d'alerte. La discipline et l'objectivité sont des armes anti-biais.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce qu'un breakout en trading ?",
          options: [
            "La rupture d'un trader qui perd sa discipline émotionnelle",
            "Le franchissement d'un niveau de support ou de résistance clé avec un fort volume",
            "Une correction brutale après un mouvement directionnel fort",
            "L'ouverture d'une position en dehors des heures de marché normales",
          ],
          correctIndex: 1,
          explanation: "Un breakout se produit quand le prix franchit un niveau clé (support, résistance, range). Accompagné d'un fort volume, c'est un signal potentiellement puissant de continuation de tendance.",
        },
        {
          type: 'quiz',
          question: "Qu'est-ce que le 'scalping' ?",
          options: [
            "Une stratégie d'investissement long terme sur des actions de croissance",
            "Une stratégie de trading ultra-court terme : nombreux petits trades pour accumuler des gains rapides",
            "L'analyse des carnets d'ordres pour anticiper les mouvements de prix",
            "Une technique de couverture pour protéger un portefeuille",
          ],
          correctIndex: 1,
          explanation: "Le scalping vise à accumuler de nombreux petits gains sur des timeframes très courts (secondes à quelques minutes). Requiert une discipline de fer, des spreads faibles et des plateformes rapides.",
        },
        {
          type: 'scenario',
          title: 'Setup de trade',
          scenario: "Tu identifies un breakout haussier sur BTC/USD à 42 000$. Le niveau de résistance cassé était à 41 500$. Ta stratégie de gestion du risque : risquer max 2% de ton capital de 10 000€.",
          question: "Où places-tu ton stop-loss et quel est le montant max que tu risques ?",
          options: [
            "Stop à 41 000$ — risque 200€ (2% de 10 000€)",
            "Stop à 40 000$ — risque 500€ (5% de 10 000€)",
            "Pas de stop-loss — les cryptos montent toujours",
            "Stop à 42 000$ — risque 0€ (breakeven stop)",
          ],
          correctIndex: 0,
          explanation: "Le stop-loss optimal est sous le niveau cassé (41 500$) à 41 000$, et tu risques max 2% = 200€. La règle des 2% est fondamentale : elle garantit ta survie même avec 10 pertes consécutives.",
        },
      ],
    },
  },
];

async function main() {
  console.log('🌱 Seeding Domain Master Quizzes...');

  for (const quiz of MASTER_QUIZZES) {
    // Upsert by title to avoid duplicates
    const existing = await prisma.lesson.findFirst({
      where: { title: quiz.title },
    });

    if (existing) {
      await prisma.lesson.update({
        where: { id: existing.id },
        data: {
          content: quiz.content,
          xpReward: quiz.xpReward,
          orderIndex: quiz.orderIndex,
          isMasterQuiz: quiz.isMasterQuiz,
        },
      });
      console.log(`  ✅ Updated: ${quiz.title}`);
    } else {
      await prisma.lesson.create({ data: quiz });
      console.log(`  ✅ Created: ${quiz.title}`);
    }
  }

  console.log('\n✨ Master Quizzes seeded successfully!');
  console.log('  • CRYPTO Master Test  — 200 XP');
  console.log('  • FINANCE Master Test — 200 XP');
  console.log('  • TRADING Master Test — 200 XP');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
