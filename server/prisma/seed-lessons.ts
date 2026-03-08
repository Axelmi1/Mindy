import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle quiz options and update correctIndex
function shuffleQuiz(step: any): any {
  if (step.type !== 'quiz') return step;

  const correctAnswer = step.options[step.correctIndex];
  const shuffledOptions = shuffleArray(step.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

  return {
    ...step,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
  };
}

// Shuffle swipe_sequence cards
function shuffleSwipeSequence(step: any): any {
  if (step.type !== 'swipe_sequence') return step;

  return {
    ...step,
    cards: shuffleArray(step.cards),
  };
}

// Process all steps in a lesson
function processLesson(lesson: any): any {
  return {
    ...lesson,
    content: {
      steps: lesson.content.steps.map((step: any) => {
        let processed = step;
        processed = shuffleQuiz(processed);
        processed = shuffleSwipeSequence(processed);
        return processed;
      }),
    },
  };
}

const lessons = [
  {
    title: "Bitcoin Basics",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 85,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: "info",
          title: "L'Or Numérique",
          content: "Bitcoin est la première cryptomonnaie décentralisée. Créé en 2009 par Satoshi Nakamoto, il permet d'échanger de la valeur sans intermédiaire comme une banque.",
          mindyMessage: "Enfin tu t'intéresses à autre chose qu'aux photos de chats. 🐱"
        },
        {
          type: "fill_blank",
          sentence: "Bitcoin a été créé en ___ par Satoshi Nakamoto.",
          answer: "2009",
          choices: ["2007", "2009", "2011", "2013"],
          mindyMessage: "La date de naissance de la révolution financière. Retiens-la."
        },
        {
          type: "quiz",
          question: "Quelle est la limite maximale de Bitcoins qui existeront ?",
          options: ["100 millions", "21 millions", "Illimité", "50 milliards"],
          correctIndex: 1,
          mindyHint: "C'est la rareté qui fait sa valeur, contrairement à tes billets de Monopoly."
        },
        {
          type: "reorder",
          title: "Cycle d'une transaction",
          instruction: "Remets les étapes dans l'ordre.",
          words: ["Envoi", "Validation (Mineurs)", "Bloc ajouté", "Réception"],
          correctOrder: [0, 1, 2, 3],
          mindyMessage: "Même ma grand-mère va plus vite que toi."
        },
        {
          type: "price_prediction",
          question: "Bitcoin consolide après une hausse. Analyse les chandeliers et prédit le prochain mouvement.",
          candles: [
            { open: 41800, high: 43500, low: 41200, close: 43200 },
            { open: 43200, high: 44800, low: 42900, close: 44500 },
            { open: 44500, high: 45200, low: 43800, close: 44100 },
            { open: 44100, high: 44600, low: 43400, close: 44400 },
            { open: 44400, high: 45800, low: 44100, close: 45600 },
            { open: 45600, high: 46200, low: 45000, close: 45200 },
            { open: 45200, high: 45600, low: 44600, close: 45500 },
            { open: 45500, high: 46800, low: 45300, close: 46500 },
          ],
          correctAnswer: "up",
          explanation: "Tendance haussière claire : higher highs et higher lows consécutifs. Les chandelier verts dominent avec de longues mèches basses (acheteurs actifs sur les replis). Le momentum est bullish.",
          mindyMessage: "Même un débutant peut voir la tendance. La vraie difficulté ? Ne pas vendre trop tôt. 📈"
        },
        {
          type: "flashcard",
          front: "Halving",
          back: "Événement qui divise par 2 la récompense des mineurs Bitcoin, environ tous les 4 ans. Réduit l'inflation de BTC et historiquement précède des hausses de prix.",
          category: "Bitcoin"
        },
        {
          type: "info",
          title: "À retenir",
          content: "Bitcoin est rare, sécurisé et appartient à ses utilisateurs. C'est la base de tout l'écosystème crypto.",
          mindyMessage: "Pas mal pour un débutant. Ne prends pas trop la confiance. 😎"
        },
        {
          type: "news_impact",
          headline: "BlackRock's iShares Bitcoin Trust (IBIT) dépasse 10 milliards $ d'actifs en 2 mois",
          source: "Bloomberg",
          date: "2024-03-01",
          correctImpact: "bullish",
          explanation: "L'afflux massif de capitaux institutionnels via les ETF spot Bitcoin valide l'actif comme classe d'investissement mainstream. 10 milliards en 2 mois = record historique pour un ETF.",
          mindyMessage: "Quand BlackRock arrive, le marché écoute. L'institutionnel change tout. 🏦"
        },
        {
          type: "speed_round",
          title: "Speed Round : Faits Bitcoin",
          pairs: [
            { statement: "Le créateur de Bitcoin est connu sous le nom de Satoshi Nakamoto.", isTrue: true },
            { statement: "Il existe un maximum de 21 millions de Bitcoins.", isTrue: true },
            { statement: "Bitcoin utilise le Proof of Stake pour valider les transactions.", isTrue: false },
            { statement: "Le premier achat en Bitcoin était deux pizzas pour 10 000 BTC.", isTrue: true },
            { statement: "Le halving de Bitcoin a lieu tous les 2 ans.", isTrue: false },
            { statement: "Bitcoin est la première cryptomonnaie jamais créée.", isTrue: true },
            { statement: "Les transactions Bitcoin sont totalement anonymes.", isTrue: false },
            { statement: "Le genesis block de Bitcoin date de janvier 2009.", isTrue: true }
          ],
          timeLimitSeconds: 40
        }
      ]
    }
  },
  {
    title: "Ethereum & Smart Contracts",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 90,
    orderIndex: 2,
    content: {
      steps: [
        {
          type: "info",
          title: "L'ordinateur mondial",
          content: "Si Bitcoin est l'or, Ethereum est le pétrole. C'est une plateforme qui permet de faire tourner des programmes appelés Smart Contracts.",
          mindyMessage: "C'est un peu plus complexe que de scroller TikTok."
        },
        {
          type: "swipe",
          statement: "L'Ether (ETH) est le carburant pour payer les frais sur Ethereum.",
          isCorrect: true,
          explanation: "On appelle ces frais le 'Gas'. Plus le réseau est congestionné, plus c'est cher."
        },
        {
          type: "match_pairs",
          pairs: [
            { term: "ETH", definition: "Le token natif d'Ethereum (le carburant)" },
            { term: "Gas", definition: "Les frais de transaction sur le réseau" },
            { term: "Smart Contract", definition: "Programme auto-exécutable sur la blockchain" },
            { term: "Vitalik Buterin", definition: "Co-fondateur d'Ethereum (2013)" }
          ],
          mindyMessage: "Relie chaque concept à sa définition. Si tu rates, honte à toi. 😤"
        },
        {
          type: "scenario",
          situation: "Tu veux envoyer 100 ETH en urgence. Le réseau est congestionné : les frais Gas sont à 50$ par transaction. Que fais-tu ?",
          choices: [
            { text: "J'augmente le Gas pour passer plus vite", isGood: true, explanation: "Correct — en période de congestion, payer plus de Gas accélère la validation. Si c'est urgent, ça vaut le coût." },
            { text: "J'attends que les frais baissent (nuit, week-end)", isGood: true, explanation: "Bonne stratégie si tu n'es pas pressé. Les frais Gas varient selon le trafic réseau." },
            { text: "J'annule la transaction après envoi", isGood: false, explanation: "Impossible sur Ethereum — une transaction envoyée ne peut pas être annulée. Assure-toi avant d'envoyer." }
          ],
          mindyMessage: "Le Gas, c'est l'autoroute. Plus tu paies, moins t'es bloqué dans les embouteillages. 🛣️"
        },
        {
          type: "speed_round",
          title: "Speed Round : Ethereum",
          pairs: [
            { statement: "Ethereum utilise des smart contracts.", isTrue: true },
            { statement: "Le gas fee est payé en Bitcoin sur Ethereum.", isTrue: false },
            { statement: "Solidity est le langage principal des smart contracts Ethereum.", isTrue: true },
            { statement: "Ethereum a un supply maximum de 21 millions.", isTrue: false },
            { statement: "Les dApps fonctionnent sur la blockchain Ethereum.", isTrue: true },
            { statement: "Vitalik Buterin a créé Ethereum.", isTrue: true },
            { statement: "Ethereum est passé en Proof of Stake avec The Merge.", isTrue: true },
            { statement: "Les NFTs ne peuvent pas exister sur Ethereum.", isTrue: false }
          ],
          timeLimitSeconds: 45
        },
        {
          type: "flashcard",
          front: "Smart Contract",
          back: "Programme autonome déployé sur la blockchain qui s'exécute automatiquement quand ses conditions sont remplies. Pas besoin d'intermédiaire.",
          category: "Ethereum"
        },
        {
          type: "info",
          title: "Conclusion",
          content: "Ethereum a ouvert la porte aux NFTs et à la finance décentralisée grâce à sa programmabilité.",
          mindyMessage: "Un petit pas pour l'homme, un grand pas pour ton wallet. 🚀"
        }
      ]
    }
  },
  {
    title: "Les Wallets Crypto",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 80,
    orderIndex: 3,
    content: {
      steps: [
        {
          type: "info",
          title: "Garder ses billes",
          content: "Un wallet ne stocke pas vos cryptos, il stocke les clés qui vous donnent accès à vos fonds sur la blockchain.",
          mindyMessage: "Perds tes clés, perds ton argent. Simple, non ?"
        },
        {
          type: "swipe_sequence",
          title: "Hot vs Cold Wallet",
          instruction: "Classe ces types de stockage.",
          leftLabel: "HOT (Connecté)",
          rightLabel: "COLD (Hors-ligne)",
          cards: [
            { id: "1", content: "App mobile MetaMask", correctDirection: "left" },
            { id: "2", content: "Clé USB Ledger", correctDirection: "right" },
            { id: "3", content: "Extension navigateur", correctDirection: "left" },
            { id: "4", content: "Paper wallet imprimé", correctDirection: "right" }
          ],
          timeLimit: 30,
          mindyMessage: "On se dépêche, les hackers n'attendent pas."
        },
        {
          type: "quiz",
          question: "Quel type de wallet est le plus sécurisé pour du long terme ?",
          options: ["Hot wallet", "Cold wallet", "Exchange", "Navigateur"],
          correctIndex: 1,
          mindyHint: "Hors ligne = hors de portée des hackers."
        },
        {
          type: "info",
          title: "Sécurité maximum",
          content: "Le Cold Wallet est le plus sûr car il n'est jamais relié à internet, sauf pour signer une transaction.",
          mindyMessage: "Bravo, tu es désormais moins vulnérable. 🛡️"
        },
        {
          type: "scenario",
          situation: "Tu reçois un email de 'MetaMask Support' te demandant de cliquer sur un lien pour 'vérifier ton wallet' suite à une 'faille de sécurité'. Le lien mène à metamask-security-update.com. Que fais-tu ?",
          choices: [
            { text: "Je clique et entre ma seed phrase pour sécuriser mon wallet", isGood: false, explanation: "JAMAIS. Aucun service légitime ne te demandera ta seed phrase. C'est du phishing classique." },
            { text: "J'ignore l'email — MetaMask ne contacte jamais par email pour demander des infos sensibles", isGood: true, explanation: "Correct. MetaMask n'a pas ton email. Tout contact 'officiel' demandant ta seed phrase = arnaque à 100%." },
            { text: "Je vérifie en allant sur le site officiel metamask.io avant de cliquer", isGood: false, explanation: "Bonne réflexion de vérifier, mais le simple fait de cliquer sur un lien de phishing peut être dangereux. Ignore et supprime." }
          ],
          mindyMessage: "Règle d'or : PERSONNE ne doit JAMAIS voir ta seed phrase. Ni MetaMask, ni Binance, ni même Mindy. 🔐"
        },
        {
          type: "flashcard",
          front: "Hot Wallet vs Cold Wallet",
          back: "Hot Wallet : connecté à Internet (MetaMask, Trust Wallet). Pratique mais vulnérable aux hacks.\n\nCold Wallet : hors-ligne (Ledger, Trezor). Sécurité maximale, idéal pour le stockage long terme.\n\nRègle : Hot wallet = dépenses quotidiennes. Cold wallet = épargne crypto.",
          category: "Sécurité Crypto"
        }
      ]
    }
  },
  {
    title: "Les Exchanges (CEX)",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 75,
    orderIndex: 4,
    content: {
      steps: [
        {
          type: "info",
          title: "La porte d'entrée",
          content: "Les plateformes comme Binance ou Coinbase sont des CEX (Centralized Exchanges). Elles permettent d'acheter de la crypto avec des Euros.",
          mindyMessage: "Le supermarché de la crypto. N'y laisse pas ton caddie."
        },
        {
          type: "swipe",
          statement: "Sur un CEX, c'est la plateforme qui possède techniquement vos clés privées.",
          isCorrect: true,
          explanation: "Si la plateforme ferme, vous risquez de tout perdre. Not your keys, not your coins."
        },
        {
          type: "quiz",
          question: "Que signifie 'KYC' sur un exchange ?",
          options: ["Keep Your Crypto", "Know Your Customer", "Key Yield Calculation", "Krypto Yearly Charge"],
          correctIndex: 1,
          mindyHint: "C'est la vérification d'identité obligatoire."
        },
        {
          type: "info",
          title: "Résumé",
          content: "Les CEX sont pratiques pour débuter, mais risqués pour le stockage long terme. Transférez vos cryptos vers votre propre wallet.",
          mindyMessage: "Tu apprends vite, petit scarabée. 🐛"
        }
      ]
    }
  },
  {
    title: "Les Clés Privées",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 100,
    orderIndex: 5,
    content: {
      steps: [
        {
          type: "info",
          title: "Le Graal",
          content: "Votre phrase de récupération (Seed Phrase) de 12 ou 24 mots est la clé ultime de votre coffre-fort crypto.",
          mindyMessage: "C'est plus important que ton code de CB."
        },
        {
          type: "scenario",
          situation: "Tu reçois un email du 'support Ledger'. Il t'explique qu'un problème de sécurité nécessite de vérifier ta seed phrase de 24 mots sur leur site.",
          choices: [
            { text: "Je clique sur le lien et saisis ma seed pour sécuriser mon wallet", isGood: false, explanation: "ARNAQUE. Tu viens de donner toutes tes cryptos au pirate. Personne ne te demande JAMAIS ta seed en ligne." },
            { text: "Je signale l'email comme phishing et je l'ignore", isGood: true, explanation: "Réflexe parfait. Ledger, MetaMask ou tout wallet ne demandera JAMAIS ta seed. C'est une règle absolue." },
            { text: "Je contacte le vrai support Ledger pour vérifier si l'email est authentique", isGood: true, explanation: "Bonne initiative. Même si tu es sûr que c'est un scam, reporter aide à protéger d'autres users." }
          ],
          mindyMessage: "Ta seed = tes fonds. Personne ne la demande. Point. 🔒"
        },
        {
          type: "fill_blank",
          sentence: "Celui qui possède ta ___ possède tes cryptos.",
          answer: "seed phrase",
          choices: ["adresse publique", "seed phrase", "mot de passe", "email"],
          mindyMessage: "Seed = clé maître. Adresse publique = ok à partager. Ne confonds jamais les deux."
        },
        {
          type: "info",
          title: "Règle d'or",
          content: "Ne donnez JAMAIS votre phrase à personne, pas même au support client. Celui qui a la seed a les fonds.",
          mindyMessage: "Même moi je ne te la demanderai pas. Promis. 😇"
        }
      ]
    }
  },
  {
    title: "Introduction à la DeFi",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 115,
    orderIndex: 6,
    content: {
      steps: [
        {
          type: "info",
          title: "La banque sans banquier",
          content: "La Finance Décentralisée (DeFi) utilise des smart contracts pour proposer des prêts, des échanges et des intérêts sans intermédiaire.",
          mindyMessage: "Adieu le conseiller bancaire et ses cravates moches."
        },
        {
          type: "swipe",
          statement: "On peut prêter ses cryptos pour gagner des intérêts en DeFi.",
          isCorrect: true,
          explanation: "Cela s'appelle le 'Lending'. Les taux varient selon l'offre et la demande."
        },
        {
          type: "reorder",
          title: "Utiliser un DEX",
          instruction: "Comment échanger un token sur un échangeur décentralisé ?",
          words: ["Connecter son wallet", "Choisir la paire", "Approuver le contrat", "Confirmer le swap"],
          correctOrder: [0, 1, 2, 3],
          mindyMessage: "Vitesse de lumière activée. ⚡"
        },
        {
          type: "quiz",
          question: "Qu'est-ce qu'un 'Liquidity Pool' ?",
          options: ["Une piscine de Bitcoin", "Un réservoir de tokens pour les échanges", "Un type de wallet", "Une arnaque"],
          correctIndex: 1,
          mindyHint: "C'est ce qui permet aux DEX de fonctionner sans carnet d'ordres."
        },
        {
          type: "info",
          title: "Conclusion DeFi",
          content: "La DeFi est puissante, mais attention aux bugs dans le code des contrats et aux 'rug pulls'.",
          mindyMessage: "Garde la tête froide, les rendements de 1000% sont souvent des pièges. 🪤"
        },
        {
          type: "scenario",
          situation: "Un nouveau protocole DeFi 'MoonYield' promet 500% APY sur ton stablecoin. Le projet a 2 semaines d'existence, pas d'audit, et le code n'est pas vérifié sur Etherscan. Que fais-tu ?",
          choices: [
            { text: "J'investis 50% de mon portefeuille — 500% APY c'est trop bien", isGood: false, explanation: "Red flags partout : pas d'audit, code non vérifié, APY irréaliste. C'est le profil type d'un rug pull." },
            { text: "Je passe mon chemin — trop de red flags (pas d'audit, APY irréaliste, projet trop récent)", isGood: true, explanation: "Correct. Un rendement de 500% APY sans historique ni audit = quasi-certainement un rug pull ou un Ponzi." },
            { text: "J'investis un petit montant pour tester", isGood: false, explanation: "Même un 'petit montant' dans un rug pull = perte totale. Les smart contracts malveillants peuvent aussi drainer ton wallet." }
          ],
          mindyMessage: "Si c'est trop beau pour être vrai en DeFi, c'est un rug pull. 100% du temps. 🚩"
        },
        {
          type: "flashcard",
          front: "TVL (Total Value Locked)",
          back: "TVL = valeur totale des actifs déposés dans un protocole DeFi. C'est l'indicateur #1 de confiance.\n\nExemples (2024) :\n• Lido : ~35 milliards $\n• Aave : ~12 milliards $\n• Un rug pull random : 500k$ max\n\nPlus le TVL est élevé et stable, plus le protocole est fiable.",
          category: "DeFi"
        }
      ]
    }
  },
  {
    title: "Comprendre les NFTs",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 110,
    orderIndex: 7,
    content: {
      steps: [
        {
          type: "info",
          title: "Non-Fungible Tokens",
          content: "Un NFT est un titre de propriété numérique unique. Contrairement à un Bitcoin, un NFT ne peut pas être échangé contre un autre identique.",
          mindyMessage: "Ce n'est pas juste des images de singes, je te jure. 🐵"
        },
        {
          type: "quiz",
          question: "Que signifie 'Fongible' ?",
          options: ["Unique au monde", "Interchangeable", "Périssable", "Illégal"],
          correctIndex: 1,
          mindyHint: "Un billet de 10€ est fongible : n'importe lequel a la même valeur."
        },
        {
          type: "swipe",
          statement: "Acheter un NFT vous donne automatiquement les droits d'auteur de l'œuvre.",
          isCorrect: false,
          explanation: "Faux ! Vous possédez le token, pas nécessairement les droits. Lisez toujours les conditions."
        },
        {
          type: "swipe_sequence",
          title: "NFT ou pas ?",
          instruction: "Ces éléments peuvent-ils être des NFTs ?",
          leftLabel: "NON",
          rightLabel: "OUI",
          cards: [
            { id: "1", content: "Une œuvre d'art numérique", correctDirection: "right" },
            { id: "2", content: "Un Bitcoin", correctDirection: "left" },
            { id: "3", content: "Un ticket de concert unique", correctDirection: "right" },
            { id: "4", content: "Un skin de jeu vidéo", correctDirection: "right" }
          ],
          timeLimit: 30,
          mindyMessage: "Les NFTs sont partout, ouvre les yeux !"
        },
        {
          type: "info",
          title: "L'avenir des NFTs",
          content: "Les NFTs peuvent représenter de l'art, de l'immobilier, des diplômes ou même des objets dans un jeu vidéo.",
          mindyMessage: "Bientôt ta maison sera sur la blockchain. En attendant, range ta chambre. 🏠"
        }
      ]
    }
  },
  {
    title: "Staking & Yield",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 120,
    orderIndex: 8,
    content: {
      steps: [
        {
          type: "info",
          title: "Faire travailler ses cryptos",
          content: "Le staking consiste à bloquer ses jetons pour sécuriser un réseau (Proof of Stake) en échange de récompenses.",
          mindyMessage: "Pendant que tu dors, ton wallet travaille. Intelligent. 😴"
        },
        {
          type: "quiz",
          question: "Quelle est la différence entre Proof of Work et Proof of Stake ?",
          options: ["Aucune", "PoW utilise du calcul, PoS utilise des jetons bloqués", "PoS est plus ancien", "PoW est plus écologique"],
          correctIndex: 1,
          mindyHint: "Bitcoin mine, Ethereum stake."
        },
        {
          type: "swipe",
          statement: "Le staking comporte un risque de 'Slashing' si le validateur triche.",
          isCorrect: true,
          explanation: "Le slashing est une pénalité qui détruit une partie des tokens stakés en cas de mauvais comportement."
        },
        {
          type: "info",
          title: "Bilan",
          content: "Le staking est une alternative écologique au minage et permet de générer des revenus passifs.",
          mindyMessage: "Fais pousser tes tokens comme des tomates. 🍅"
        },
        {
          type: "calculator",
          question: "Tu stakes 5 ETH à 4.5% APY pendant 1 an. Combien d'ETH gagnes-tu en récompenses ? (Formule: montant × taux)",
          variables: ["Montant staké: 5 ETH", "APY: 4.5%", "Durée: 1 an", "Récompense = 5 × 0.045"],
          answer: 0.225,
          tolerance: 0.01,
          unit: "ETH",
          mindyMessage: "0.225 ETH gratuits pour avoir sécurisé le réseau. Pas mal pour du revenu passif. 💰"
        },
        {
          type: "news_impact",
          headline: "Lido Finance détient désormais 33% de tout l'ETH staké — seuil critique de centralisation",
          source: "CoinDesk",
          date: "2024-02-20",
          correctImpact: "bearish",
          explanation: "Un seul protocole contrôlant 33%+ du staking Ethereum menace la décentralisation du réseau. C'est le seuil à partir duquel des attaques théoriques deviennent possibles. Signal négatif pour la gouvernance Ethereum.",
          mindyMessage: "La décentralisation, c'est le pilier d'Ethereum. Quand Lido devient trop gros, c'est un problème systémique. ⚠️"
        }
      ]
    }
  },
  {
    title: "Sécurité Avancée",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 125,
    orderIndex: 9,
    content: {
      steps: [
        {
          type: "info",
          title: "Le Phishing",
          content: "Les hackers créent de faux sites pour voler vos clés. Vérifiez TOUJOURS l'URL et ne cliquez jamais sur des liens suspects.",
          mindyMessage: "Ne sois pas un poisson. 🐟"
        },
        {
          type: "swipe_sequence",
          title: "Sécurité : Bon ou Mauvais ?",
          instruction: "Glisse pour valider les bonnes pratiques.",
          leftLabel: "DANGEREUX",
          rightLabel: "SÛR",
          cards: [
            { id: "1", content: "Partager son écran avec un inconnu", correctDirection: "left" },
            { id: "2", content: "Utiliser la Double Authentification (2FA)", correctDirection: "right" },
            { id: "3", content: "Cliquer sur un lien reçu par DM Twitter", correctDirection: "left" },
            { id: "4", content: "Vérifier l'URL avant de connecter son wallet", correctDirection: "right" },
            { id: "5", content: "Utiliser le même mot de passe partout", correctDirection: "left" }
          ],
          timeLimit: 40,
          mindyMessage: "Tu progresses, je vais peut-être t'épargner."
        },
        {
          type: "quiz",
          question: "Qu'est-ce qu'une 'approval' en DeFi ?",
          options: ["Un like sur Twitter", "Une autorisation donnée à un smart contract", "Une validation KYC", "Un type de NFT"],
          correctIndex: 1,
          mindyHint: "C'est ce qui permet à un contrat d'accéder à vos tokens."
        },
        {
          type: "info",
          title: "Récapitulatif",
          content: "La paranoïa est votre meilleure amie dans le monde crypto. Vérifiez tout, faites confiance à personne.",
          mindyMessage: "Trust no one. Surtout pas ce DM qui te promet des Bitcoins gratuits. 🤡"
        }
      ]
    }
  },
  {
    title: "Tokenomics",
    domain: "CRYPTO",
    difficulty: "ADVANCED",
    xpReward: 140,
    orderIndex: 10,
    content: {
      steps: [
        {
          type: "info",
          title: "L'économie des jetons",
          content: "La Tokenomics étudie l'offre et la demande d'un jeton : inflation, brûlage (burn), distribution initiale et mécanismes de valeur.",
          mindyMessage: "C'est là qu'on voit si un projet va tenir ou s'écraser. 📊"
        },
        {
          type: "quiz",
          question: "Que se passe-t-il lors d'un 'Token Burn' ?",
          options: ["Le prix baisse automatiquement", "Des jetons sont détruits définitivement", "On crée plus de jetons", "Le réseau s'arrête"],
          correctIndex: 1,
          mindyHint: "Moins d'offre + même demande = ? 🔥"
        },
        {
          type: "swipe",
          statement: "Un 'Vesting' empêche les créateurs de vendre tous leurs jetons d'un coup.",
          isCorrect: true,
          explanation: "Le vesting libère les tokens progressivement, protégeant les investisseurs contre un dump massif."
        },
        {
          type: "reorder",
          title: "Analyser un projet",
          instruction: "Dans quel ordre analyser la tokenomics ?",
          words: ["Supply totale", "Distribution", "Mécanisme de burn", "Utilité du token"],
          correctOrder: [0, 1, 2, 3],
          mindyMessage: "DYOR level: Expert. 🧠"
        },
        {
          type: "info",
          title: "Analyse Finale",
          content: "Regardez toujours la Market Cap plutôt que le prix unitaire. Un token à 0.001€ peut être plus cher qu'un token à 1000€.",
          mindyMessage: "Tu parles comme un pro. Attention à l'ego maintenant."
        }
      ]
    }
  },
  {
    title: "Le Budgeting",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 80,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: "info",
          title: "La règle du 50/30/20",
          content: "Une méthode simple pour gérer son argent :\n• 50% pour les Besoins (loyer, courses)\n• 30% pour les Envies (sorties, shopping)\n• 20% pour l'Épargne et investissements",
          mindyMessage: "Dépenser moins que ce qu'on gagne. C'est révolutionnaire, non ? 🙄"
        },
        {
          type: "swipe_sequence",
          title: "Besoin vs Envie",
          instruction: "Classe ces dépenses.",
          leftLabel: "BESOIN",
          rightLabel: "ENVIE",
          cards: [
            { id: "1", content: "Loyer", correctDirection: "left" },
            { id: "2", content: "Netflix", correctDirection: "right" },
            { id: "3", content: "Électricité", correctDirection: "left" },
            { id: "4", content: "Restaurant", correctDirection: "right" },
            { id: "5", content: "Assurance santé", correctDirection: "left" }
          ],
          timeLimit: 30,
          mindyMessage: "Ton abonnement Gym où tu ne vas jamais ? Envie. 🏋️"
        },
        {
          type: "fill_blank",
          sentence: "Selon la règle 50/30/20, les Besoins = ___%, les Envies = 30%, l'Épargne = 20%.",
          answer: "50",
          choices: ["30", "40", "50", "60"],
          mindyMessage: "50-30-20. Simple à retenir, révolutionnaire à appliquer."
        },
        {
          type: "budget_allocator",
          totalBudget: 3000,
          categories: [
            { label: "Besoins", icon: "🏠", targetPercent: 50, minPercent: 30, maxPercent: 70 },
            { label: "Envies", icon: "🎉", targetPercent: 30, minPercent: 10, maxPercent: 50 },
            { label: "Épargne", icon: "💰", targetPercent: 20, minPercent: 5, maxPercent: 40 }
          ],
          explanation: "La règle 50/30/20 est un cadre simple : 50% besoins, 30% envies, 20% épargne. Adapte-la à ta situation mais garde l'épargne en priorité."
        },
        {
          type: "info",
          title: "L'automatisation",
          content: "Le secret est de se payer en premier : programmez un virement automatique vers votre épargne dès que le salaire arrive.",
          mindyMessage: "Devenir riche en étant fainéant, c'est ça le but. 🏦"
        },
        {
          type: "speed_round",
          title: "Speed Round : Budget",
          pairs: [
            { statement: "La règle 50/30/20 est adaptée à tous les niveaux de revenus.", isTrue: true },
            { statement: "Un budget doit être rigide et ne jamais être ajusté.", isTrue: false },
            { statement: "Se payer en premier signifie épargner AVANT de dépenser.", isTrue: true },
            { statement: "Les abonnements oubliés ne coûtent pas grand-chose.", isTrue: false },
            { statement: "Un budget aide à réduire le stress financier.", isTrue: true },
            { statement: "Avoir un budget signifie ne plus jamais se faire plaisir.", isTrue: false },
            { statement: "Les dépenses variables sont plus faciles à réduire que les fixes.", isTrue: true },
            { statement: "Un fond d'urgence fait partie de la catégorie Épargne.", isTrue: true }
          ],
          timeLimitSeconds: 40
        },
        {
          type: "scenario",
          situation: "Tu es au centre commercial et tu vois des sneakers en promo à -50% (150€ au lieu de 300€). Tu n'en avais pas besoin et tu as déjà dépensé 80% de ton budget 'Envies' ce mois-ci. Que fais-tu ?",
          choices: [
            { text: "J'achète — c'est une affaire à -50%, je ne peux pas rater ça", isGood: false, explanation: "L'urgence créée par la promo est artificielle. Tu dépasses ton budget et 150€ pour des sneakers non prévues = pas une économie." },
            { text: "Je note le modèle et j'attends le mois prochain si j'en ai toujours envie", isGood: true, explanation: "La règle des 48h/30 jours : si tu en as encore envie plus tard, c'est un vrai désir. Sinon, tu as évité une dépense impulsive." },
            { text: "Je pioche dans mon épargne pour cette fois", isGood: false, explanation: "L'épargne n'est pas une tirelire pour les promos. Chaque euro pioché dans l'épargne pour une envie = un euro qui ne travaille pas pour toi." }
          ],
          mindyMessage: "Une promo que tu n'avais pas prévue n'est pas une économie. C'est une dépense. 💸"
        }
      ]
    }
  },
  {
    title: "L'Épargne de Précaution",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 85,
    orderIndex: 2,
    content: {
      steps: [
        {
          type: "info",
          title: "Le matelas de sécurité",
          content: "L'Emergency Fund est une réserve d'argent liquide pour les imprévus : panne de voiture, perte d'emploi, frais médicaux.",
          mindyMessage: "C'est pour quand la vie décide de te mettre une baffe. 👋"
        },
        {
          type: "calculator",
          question: "Tes dépenses mensuelles sont de 1 800€. Quel est le montant minimum de ton fonds d'urgence (3 mois) ?",
          variables: ["Dépenses mensuelles: 1 800€", "Mois recommandés: minimum 3"],
          answer: 5400,
          unit: "€",
          mindyMessage: "5 400€ minimum pour dormir tranquille. Commence par là avant toute bourse."
        },
        {
          type: "scenario",
          situation: "Tu as finalement 5 000€ d'épargne de précaution. Ton ami te propose de les investir en ETF pour 'les faire bosser'. Que fais-tu ?",
          choices: [
            { text: "J'investis tout en ETF, l'épargne de précaution c'est dépassé", isGood: false, explanation: "Danger. Les ETF peuvent baisser de 30-50% en crise. Si tu as une urgence, tu revends au pire moment." },
            { text: "Je garde les 5 000€ sur Livret A et j'investis le surplus au-delà de ce montant", isGood: true, explanation: "La bonne approche. L'épargne de précaution reste LIQUIDE et SANS RISQUE. On investit seulement ce dont on n'a pas besoin." },
            { text: "Je mets 50% en ETF et 50% sur Livret A pour équilibrer", isGood: false, explanation: "Mauvaise idée si 5 000€ = tes seules économies. L'EP doit être 100% disponible et sécurisée." }
          ],
          mindyMessage: "L'EP n'est PAS un investissement. C'est un bouclier. 🛡️"
        },
        {
          type: "info",
          title: "Où le placer ?",
          content: "Cet argent doit rester accessible immédiatement sur un Livret A ou LDDS. Pas sous le matelas !",
          mindyMessage: "Sous le matelas, les mites ne sont pas de bons conseillers financiers. 🦗"
        },
        {
          type: "budget_allocator",
          totalBudget: 2000,
          categories: [
            { label: "Livret A", icon: "🏦", targetPercent: 60, minPercent: 40, maxPercent: 80 },
            { label: "LDDS", icon: "🌱", targetPercent: 25, minPercent: 10, maxPercent: 40 },
            { label: "Compte courant", icon: "💳", targetPercent: 15, minPercent: 5, maxPercent: 30 }
          ],
          explanation: "L'épargne de précaution doit être répartie entre supports liquides et sécurisés. Le Livret A est prioritaire (taux garanti, disponibilité immédiate). Le LDDS complète. Garder un minimum sur le compte courant pour les urgences immédiates."
        },
        {
          type: "scenario",
          situation: "Ta machine à laver tombe en panne. La réparation coûte 400€. Tu as 6 000€ d'épargne de précaution sur ton Livret A et tes dépenses mensuelles sont de 1 500€. Que fais-tu ?",
          choices: [
            { text: "Je paie avec ma carte de crédit en 4 fois pour ne pas toucher à mon épargne", isGood: false, explanation: "Payer en 4 fois = frais potentiels + dette inutile. C'est EXACTEMENT pour ça que l'EP existe." },
            { text: "Je pioche dans mon épargne de précaution et je la reconstitue le mois suivant", isGood: true, explanation: "C'est le but de l'EP. 400€ sur 6 000€ = tu restes au-dessus de 3 mois de dépenses. Reconstitue dès le prochain salaire." },
            { text: "J'achète une machine neuve à crédit à 800€ plutôt que de réparer", isGood: false, explanation: "Réparer coûte 2x moins cher. Un crédit pour ça = dette évitable. Utilise ton EP intelligemment." }
          ],
          mindyMessage: "L'EP qui n'est jamais utilisée, c'est comme un extincteur qui n'a jamais servi. C'est bien — mais il faut savoir l'utiliser quand ça brûle. 🧯"
        }
      ]
    }
  },
  {
    title: "Compte Courant & Livrets",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 75,
    orderIndex: 3,
    content: {
      steps: [
        {
          type: "info",
          title: "Les bases bancaires",
          content: "Le compte courant sert aux dépenses quotidiennes. Les livrets (Livret A, LDDS) servent à épargner sans risque avec un petit taux d'intérêt.",
          mindyMessage: "Le B-A-BA. On ne peut pas tous être des traders de Wall Street. 📈"
        },
        {
          type: "swipe",
          statement: "Un découvert bancaire est une forme de crédit gratuit.",
          isCorrect: false,
          explanation: "C'est un crédit TRÈS coûteux avec des agios qui peuvent dépasser 15% par an !"
        },
        {
          type: "quiz",
          question: "Quel est le plafond du Livret A en 2024 ?",
          options: ["10 000€", "22 950€", "50 000€", "Illimité"],
          correctIndex: 1,
          mindyHint: "C'est un nombre bizarre, mais c'est le bon."
        },
        {
          type: "info",
          title: "Résumé",
          content: "Évitez le découvert comme la peste. Utilisez les livrets pour votre épargne de sécurité avant d'investir.",
          mindyMessage: "Le banquier t'aime quand tu es à découvert. Ne lui fais pas ce plaisir. 😉"
        }
      ]
    }
  },
  {
    title: "L'Inflation",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 90,
    orderIndex: 4,
    content: {
      steps: [
        {
          type: "info",
          title: "Le voleur silencieux",
          content: "L'inflation est l'augmentation générale des prix. Ton argent qui dort perd de la valeur chaque année.",
          mindyMessage: "Tes 100€ d'aujourd'hui achèteront moins de pizzas demain. Triste vie. 🍕"
        },
        {
          type: "quiz",
          question: "Quel est l'objectif d'inflation annuel de la BCE ?",
          options: ["0%", "2%", "10%", "5%"],
          correctIndex: 1,
          mindyHint: "Un petit chiffre qui grignote tout doucement."
        },
        {
          type: "swipe",
          statement: "Laisser son argent sur un compte courant protège de l'inflation.",
          isCorrect: false,
          explanation: "Au contraire ! Un compte courant ne rapporte rien, donc vous perdez du pouvoir d'achat chaque année."
        },
        {
          type: "speed_round",
          title: "Speed Round : Inflation",
          pairs: [
            { statement: "L'inflation réduit le pouvoir d'achat de la monnaie.", isTrue: true },
            { statement: "Un taux d'inflation de 0% est idéal pour l'économie.", isTrue: false },
            { statement: "L'immobilier est généralement une protection contre l'inflation.", isTrue: true },
            { statement: "La BCE cible un taux d'inflation de 2%.", isTrue: true },
            { statement: "L'or perd de la valeur pendant les périodes d'inflation.", isTrue: false },
            { statement: "L'hyperinflation signifie un taux d'inflation supérieur à 50% par mois.", isTrue: true },
            { statement: "Un Livret A à 3% bat toujours l'inflation.", isTrue: false },
            { statement: "L'inflation profite aux emprunteurs à taux fixe.", isTrue: true }
          ],
          timeLimitSeconds: 40
        },
        {
          type: "budget_allocator",
          totalBudget: 10000,
          categories: [
            { label: "Actions/ETF", icon: "📊", targetPercent: 40, minPercent: 10, maxPercent: 70 },
            { label: "Immobilier (SCPI)", icon: "🏠", targetPercent: 25, minPercent: 0, maxPercent: 50 },
            { label: "Or/Matières", icon: "🥇", targetPercent: 15, minPercent: 0, maxPercent: 30 },
            { label: "Livrets", icon: "🏦", targetPercent: 20, minPercent: 10, maxPercent: 40 }
          ],
          explanation: "Pour battre l'inflation, diversifie entre actifs réels (actions, immobilier, or) et épargne sécurisée. Les actions offrent ~7%/an historiquement, bien au-dessus de l'inflation."
        },
        {
          type: "info",
          title: "Conclusion",
          content: "Pour battre l'inflation, il faut investir dans des actifs qui rapportent plus de 2% par an.",
          mindyMessage: "Félicitations, tu viens de comprendre pourquoi l'investissement est obligatoire. 🎓"
        },
        {
          type: "calculator",
          question: "Avec une inflation de 3% par an, combien vaudront 10 000€ en pouvoir d'achat réel dans 10 ans ? (Formule: 10000 × (1 - 0.03)^10, approximation)",
          variables: ["Capital: 10 000€", "Inflation: 3%/an", "Durée: 10 ans", "Pouvoir d'achat = 10 000 × 0.97^10"],
          answer: 7374,
          tolerance: 50,
          unit: "€",
          mindyMessage: "10 000€ qui dorment = 7 374€ de pouvoir d'achat réel dans 10 ans. L'inflation mange 26% de ta valeur. 😱"
        },
        {
          type: "speed_round",
          title: "Speed Round : Pouvoir d'achat",
          pairs: [
            { statement: "Les actions battent historiquement l'inflation sur le long terme.", isTrue: true },
            { statement: "Un Livret A à 3% garantit de battre l'inflation.", isTrue: false },
            { statement: "L'immobilier est considéré comme un actif anti-inflation.", isTrue: true },
            { statement: "Garder du cash est la meilleure stratégie en période d'inflation.", isTrue: false },
            { statement: "Les obligations à taux fixe perdent de la valeur quand l'inflation monte.", isTrue: true },
            { statement: "L'inflation peut être bénéfique pour les emprunteurs.", isTrue: true }
          ],
          timeLimitSeconds: 30
        }
      ]
    }
  },
  {
    title: "Les Intérêts Composés",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 110,
    orderIndex: 5,
    content: {
      steps: [
        {
          type: "info",
          title: "La 8ème merveille du monde",
          content: "Les intérêts composés, c'est gagner des intérêts sur vos intérêts. Albert Einstein les aurait qualifiés de 'force la plus puissante de l'univers'.",
          mindyMessage: "C'est une boule de neige. Plus ça roule, plus ça grossit. ☃️"
        },
        {
          type: "calculator",
          question: "Tu investis 10 000€ à 7% par an pendant 10 ans. Combien as-tu au bout de 10 ans ? (formule: capital × (1.07)^10, arrondi à l'euro)",
          variables: ["Capital initial: 10 000€", "Taux annuel: 7%", "Durée: 10 ans", "Formule: 10 000 × (1.07)^10"],
          answer: 19672,
          tolerance: 50,
          unit: "€",
          mindyMessage: "Ton argent a presque doublé en 10 ans sans rien faire. C'est ça la magie des intérêts composés. 🚀"
        },
        {
          type: "reorder",
          title: "Facteurs de richesse",
          instruction: "Classe ces facteurs par importance pour les intérêts composés.",
          words: ["Montant initial", "Taux de rendement", "Durée (temps)", "Régularité des versements"],
          correctOrder: [2, 1, 3, 0],
          mindyMessage: "Le temps est ton meilleur allié, même si tu vieillis."
        },
        {
          type: "info",
          title: "Action",
          content: "Commencer tôt avec peu (100€/mois à 25 ans) est souvent plus efficace que commencer tard avec beaucoup (500€/mois à 45 ans).",
          mindyMessage: "Le meilleur moment pour investir, c'était hier. Le deuxième meilleur, c'est maintenant. 💎"
        },
        {
          type: "calculator",
          question: "Avec la Règle des 72 : en combien d'années ton capital double à un taux de 8% par an ? (Formule: 72 / taux)",
          variables: ["Taux annuel: 8%", "Formule: 72 / 8"],
          answer: 9,
          tolerance: 0,
          unit: "ans",
          mindyMessage: "9 ans pour doubler. 18 ans pour quadrupler. 27 ans pour x8. La patience paie. 📈"
        },
        {
          type: "price_prediction",
          question: "Ce graphique montre la croissance d'un portefeuille ETF sur 8 trimestres. Les intérêts composés accélèrent. Quelle est la tendance ?",
          candles: [
            { open: 10000, high: 10400, low: 9900, close: 10300 },
            { open: 10300, high: 10800, low: 10200, close: 10700 },
            { open: 10700, high: 11300, low: 10600, close: 11200 },
            { open: 11200, high: 11900, low: 11100, close: 11800 },
            { open: 11800, high: 12600, low: 11700, close: 12500 },
            { open: 12500, high: 13400, low: 12400, close: 13300 },
            { open: 13300, high: 14300, low: 13200, close: 14200 },
            { open: 14200, high: 15400, low: 14100, close: 15300 }
          ],
          correctAnswer: "up",
          explanation: "Croissance exponentielle typique des intérêts composés : chaque période, les gains sont plus importants que la précédente. La courbe s'accélère avec le temps.",
          mindyMessage: "La courbe des intérêts composés est lente au début, explosive ensuite. C'est pourquoi commencer tôt est crucial. 🚀"
        }
      ]
    }
  },
  {
    title: "Introduction aux ETFs",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 120,
    orderIndex: 6,
    content: {
      steps: [
        {
          type: "info",
          title: "Le panier d'actions",
          content: "Un ETF (Exchange Traded Fund) est un fonds qui suit un indice comme le CAC 40 ou le S&P 500. En achetant un ETF, vous achetez un bout de centaines d'entreprises.",
          mindyMessage: "Pourquoi choisir une aiguille quand on peut acheter toute la botte de foin ? 🌾"
        },
        {
          type: "match_pairs",
          pairs: [
            { term: "ETF World", definition: "Investit dans les marchés du monde entier (~1600 entreprises)" },
            { term: "ETF S&P 500", definition: "Suit les 500 plus grandes entreprises américaines" },
            { term: "Frais ETF", definition: "0.1–0.3% par an (gestion passive, très bas)" },
            { term: "Fonds actif", definition: "Géré par des humains, frais 1–2% par an" }
          ],
          mindyMessage: "Connais tes outils avant d'investir. Relie ça."
        },
        {
          type: "swipe",
          statement: "Les frais des ETFs sont généralement plus bas que ceux des fonds actifs de banque.",
          isCorrect: true,
          explanation: "Les ETFs ont une gestion passive (ils copient un indice), donc des frais de 0.1-0.3% contre 1-2% pour les fonds actifs."
        },
        {
          type: "swipe",
          statement: "Un ETF 'World' investit uniquement dans des entreprises américaines.",
          isCorrect: false,
          explanation: "Un ETF World investit dans le monde entier, même si les USA représentent ~60% de l'indice MSCI World."
        },
        {
          type: "info",
          title: "Résumé",
          content: "Les ETFs sont l'outil idéal pour l'investisseur passif long terme. Un simple ETF World peut suffire pour démarrer.",
          mindyMessage: "Tu deviens presque supportable avec toutes ces connaissances. 📈"
        },
        {
          type: "news_impact",
          headline: "Le Nikkei 225 chute de 12% en une journée — les ETF Japon enregistrent des sorties record",
          source: "Reuters",
          date: "2024-08-05",
          correctImpact: "bearish",
          explanation: "Un krach de 12% sur un indice majeur crée une panique contagieuse. Les ETF liés au Japon subissent des rachats massifs, et l'effet de contagion peut toucher les marchés mondiaux via les ETF globaux.",
          mindyMessage: "Un krach ETF rappelle que même les fonds diversifiés ne sont pas immunisés contre les paniques de marché. 🌊"
        },
        {
          type: "match_pairs",
          pairs: [
            { term: "ETF indiciel", definition: "Réplique un indice boursier (CAC 40, S&P 500)" },
            { term: "ETF sectoriel", definition: "Concentré sur un secteur (tech, santé, énergie)" },
            { term: "ETF obligataire", definition: "Investit dans des obligations d'État ou corporate" },
            { term: "ETF à effet de levier", definition: "Multiplie les mouvements de l'indice (x2, x3) — très risqué" }
          ],
          mindyMessage: "Chaque type d'ETF a son usage. L'indiciel est ton meilleur ami pour démarrer. 🎯"
        }
      ]
    }
  },
  {
    title: "Gestion de la Dette",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 115,
    orderIndex: 7,
    content: {
      steps: [
        {
          type: "info",
          title: "Bonne vs Mauvaise Dette",
          content: "La bonne dette finance un actif qui prend de la valeur (immobilier, études). La mauvaise dette finance de la consommation qui perd de la valeur (TV, vacances).",
          mindyMessage: "Si ça perd de la valeur, ne l'achète pas à crédit. 💸"
        },
        {
          type: "swipe_sequence",
          title: "Quelle dette ?",
          instruction: "Identifie le type de dette.",
          leftLabel: "MAUVAISE",
          rightLabel: "BONNE",
          cards: [
            { id: "1", content: "Crédit pour une voiture neuve", correctDirection: "left" },
            { id: "2", content: "Prêt étudiant", correctDirection: "right" },
            { id: "3", content: "Dette de carte de crédit", correctDirection: "left" },
            { id: "4", content: "Crédit immobilier locatif", correctDirection: "right" },
            { id: "5", content: "Crédit conso pour un iPhone", correctDirection: "left" }
          ],
          timeLimit: 45,
          mindyMessage: "Tu piges enfin la différence."
        },
        {
          type: "quiz",
          question: "Quelle stratégie pour rembourser plusieurs dettes ?",
          options: ["Payer le minimum partout", "Rembourser d'abord la dette au plus haut taux", "Ignorer les dettes", "Emprunter plus pour rembourser"],
          correctIndex: 1,
          mindyHint: "Attaquez la dette qui vous coûte le plus cher en premier."
        },
        {
          type: "info",
          title: "Conclusion",
          content: "Utilisez l'effet de levier de la dette pour vous enrichir (immobilier), pas pour paraître riche (consommation).",
          mindyMessage: "Fini de frimer avec l'argent que tu n'as pas."
        }
      ]
    }
  },
  {
    title: "Optimisation Fiscale (France)",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 145,
    orderIndex: 8,
    content: {
      steps: [
        {
          type: "info",
          title: "Les enveloppes fiscales",
          content: "En France, le PEA et l'Assurance-Vie permettent de réduire l'impôt sur vos gains. Le PER permet de déduire vos versements de votre revenu imposable.",
          mindyMessage: "L'État veut ta part du gâteau. Apprends à protéger tes miettes. 🍰"
        },
        {
          type: "quiz",
          question: "Après combien d'années le PEA devient-il fiscalement optimal ?",
          options: ["2 ans", "5 ans", "8 ans", "Jamais"],
          correctIndex: 1,
          mindyHint: "C'est un marathon, pas un sprint."
        },
        {
          type: "swipe",
          statement: "L'Assurance-Vie n'est utile que pour la succession.",
          isCorrect: false,
          explanation: "L'AV est aussi un excellent outil d'investissement avec une fiscalité avantageuse après 8 ans."
        },
        {
          type: "reorder",
          title: "Ordre de remplissage",
          instruction: "Dans quel ordre optimiser ses enveloppes ?",
          words: ["Épargne de précaution", "PEA (actions)", "Assurance-Vie", "Compte-titres"],
          correctOrder: [0, 1, 2, 3],
          mindyMessage: "Chaque chose en son temps."
        },
        {
          type: "info",
          title: "Stratégie",
          content: "Maximisez d'abord le PEA (plafond 150 000€), puis l'Assurance-Vie, puis le compte-titres ordinaire.",
          mindyMessage: "Tu es officiellement un adulte ennuyeux. Bravo. 🎩"
        }
      ]
    }
  },
  {
    title: "L'Immobilier Locatif",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 150,
    orderIndex: 9,
    content: {
      steps: [
        {
          type: "info",
          title: "Le Cashflow",
          content: "L'investissement locatif consiste à acheter un bien pour le louer. L'objectif : que le loyer couvre le crédit et les charges, voire génère un surplus.",
          mindyMessage: "Devenir propriétaire avec l'argent des autres (locataires + banque). Magique. ✨"
        },
        {
          type: "quiz",
          question: "Qu'est-ce qu'un cashflow positif ?",
          options: ["Le loyer égale le crédit", "Le loyer est supérieur à toutes les charges", "On a vendu le bien", "Le locataire ne paie pas"],
          correctIndex: 1,
          mindyHint: "C'est l'argent qui finit dans ta poche à la fin du mois."
        },
        {
          type: "swipe",
          statement: "Le régime LMNP (Loueur Meublé Non Professionnel) permet d'amortir le bien et réduire l'impôt.",
          isCorrect: true,
          explanation: "Le LMNP est fiscalement très avantageux grâce à l'amortissement comptable du bien."
        },
        {
          type: "swipe_sequence",
          title: "Vérifications avant achat",
          instruction: "Ces éléments sont-ils importants ?",
          leftLabel: "SECONDAIRE",
          rightLabel: "CRUCIAL",
          cards: [
            { id: "1", content: "Rendement locatif brut", correctDirection: "right" },
            { id: "2", content: "Couleur des murs", correctDirection: "left" },
            { id: "3", content: "Demande locative de la zone", correctDirection: "right" },
            { id: "4", content: "Marque de l'ascenseur", correctDirection: "left" },
            { id: "5", content: "Charges de copropriété", correctDirection: "right" }
          ],
          timeLimit: 40,
          mindyMessage: "L'émotion est l'ennemie de l'investisseur."
        },
        {
          type: "info",
          title: "Conclusion finale",
          content: "L'immobilier est puissant grâce à l'effet de levier bancaire, mais demande du temps et de la gestion.",
          mindyMessage: "Tu as fini le parcours. Ne va pas tout dépenser au casino maintenant. 🎰"
        }
      ]
    }
  },
  // =====================================================================
  // NEW LESSONS — Batch 2
  // =====================================================================
  // =====================================================================
  // BATCH 3 — Leçons avancées
  // =====================================================================
  {
    title: "DeFi : Protocoles Avancés",
    domain: "CRYPTO",
    difficulty: "ADVANCED",
    xpReward: 120,
    orderIndex: 14,
    content: {
      steps: [
        {
          type: "info",
          title: "Au-delà des DEX Basiques",
          content: "La DeFi avancée comprend :\n• Lending protocols (Aave, Compound) : emprunter/prêter sans banque\n• Yield aggregators (Yearn Finance) : optimiser automatiquement le rendement\n• Liquid staking (Lido) : staker ETH tout en gardant de la liquidité\n• CDP (Collateralized Debt Positions) : générer des stablecoins depuis des collatéraux",
          mindyMessage: "La banque sans banquier, c'est bien. La banque qui optimise seule, c'est mieux. 🤖"
        },
        {
          type: "quiz",
          question: "Sur Aave, que peux-tu faire avec tes cryptos déposées ?",
          options: ["Seulement les stocker", "Les prêter pour gagner des intérêts", "Les convertir en NFT", "Les miner directement"],
          correctIndex: 1,
          mindyHint: "Aave = prêter et emprunter. Décentralisé. Sans banco."
        },
        {
          type: "swipe",
          statement: "Dans les protocoles de lending, le collatéral peut être liquidé si sa valeur chute trop.",
          isCorrect: true,
          explanation: "Si le ratio LTV (Loan-to-Value) dépasse le seuil, des liquidateurs automatiques saisissent le collatéral. Tu peux perdre tes fonds."
        },
        {
          type: "swipe",
          statement: "Le liquid staking permet de récupérer ses ETH stakés immédiatement.",
          isCorrect: true,
          explanation: "Lido te donne des stETH en échange de tes ETH. Tu gardes la liquidité et reçois les rewards du staking. Genius."
        },
        {
          type: "swipe",
          statement: "Les flash loans nécessitent une garantie initiale en capital.",
          isCorrect: false,
          explanation: "Les flash loans n'ont AUCUNE garantie — ils doivent être remboursés dans la même transaction. Utilisés pour l'arbitrage instantané."
        },
        {
          type: "swipe_sequence",
          title: "Protocole DeFi ou CeFi ?",
          instruction: "Swipe DROITE pour DeFi (décentralisé), GAUCHE pour CeFi (centralisé).",
          leftLabel: "CeFi",
          rightLabel: "DeFi",
          cards: [
            { id: "aave", content: "Aave", correctDirection: "right", explanation: "Protocole de lending décentralisé, smart contracts" },
            { id: "uniswap", content: "Uniswap", correctDirection: "right", explanation: "DEX décentralisé, AMM" },
            { id: "binance", content: "Binance Earn", correctDirection: "left", explanation: "Produit d'une société centralisée (Binance)" },
            { id: "coinbase", content: "Coinbase Staking", correctDirection: "left", explanation: "Service d'une entreprise centralisée" },
            { id: "lido", content: "Lido", correctDirection: "right", explanation: "Liquid staking décentralisé (DAO)" },
            { id: "yearn", content: "Yearn Finance", correctDirection: "right", explanation: "Yield aggregator décentralisé" }
          ],
          timeLimit: 45,
          mindyMessage: "Binance = société = CeFi. Uniswap = smart contract = DeFi. Retiens la nuance."
        },
        {
          type: "info",
          title: "Les Risques de la DeFi Avancée",
          content: "• Smart contract risk : un bug dans le code = fonds perdus (Ronin Bridge : 600M$)\n• Liquidation risk : collatéral insuffisant → liquidation automatique\n• Impermanent Loss : fournisseur de liquidité qui perd vs simplement hold\n• Oracle manipulation : prix manipulés = exploits\n\n→ DYOR. Audits de code ≠ garantie de sécurité.",
          mindyMessage: "600 millions de dollars. Un bug. En une nuit. La DeFi c'est puissant et cruel. 💀"
        }
      ]
    }
  },
  {
    title: "Comprendre les NFTs en 2025",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 85,
    orderIndex: 15,
    content: {
      steps: [
        {
          type: "info",
          title: "NFT = Preuve de Propriété On-Chain",
          content: "Un NFT (Non-Fungible Token) est un token unique sur une blockchain prouvant la propriété d'un actif. En 2021-2022 : spéculation pure. En 2025 : les cas d'usage réels émergent — ticketing, gaming, identité digitale, certificats d'authenticité.",
          mindyMessage: "Les JPEGs à 1M$, c'est fini. La vraie utilité commence maintenant. 📱"
        },
        {
          type: "quiz",
          question: "Quelle propriété rend un NFT 'non-fungible' ?",
          options: ["Il est gratuit", "Chaque token est unique et non interchangeable", "Il peut être copié librement", "Il est stocké hors blockchain"],
          correctIndex: 1,
          mindyHint: "Fungible = interchangeable (1€ = 1€). Non-fungible = unique (Mona Lisa ≠ copie)."
        },
        {
          type: "swipe",
          statement: "Acheter un NFT te donne le copyright de l'image associée.",
          isCorrect: false,
          explanation: "Faux dans la plupart des cas. Tu possèdes le token, pas les droits sur l'œuvre. Les contrats varient selon les projets."
        },
        {
          type: "swipe",
          statement: "Les NFTs peuvent représenter des billets de concert, des diplômes ou des actifs physiques.",
          isCorrect: true,
          explanation: "C'est là l'utilité réelle : Ticketmaster explore les NFT tickets, les universités testent les diplômes on-chain, des marques tokenisent des produits physiques."
        },
        {
          type: "swipe_sequence",
          title: "Cas d'usage réel ou hype pure ?",
          instruction: "Swipe DROITE pour un usage réel, GAUCHE pour de la spéculation pure.",
          leftLabel: "Spéculation",
          rightLabel: "Usage réel",
          cards: [
            { id: "ticket", content: "NFT billet de concert non-revendable", correctDirection: "right", explanation: "Lutte contre la revente scalping" },
            { id: "jpg", content: "JPEG d'un singe à 500k$", correctDirection: "left", explanation: "Spéculation pure, valeur = sentiment de communauté" },
            { id: "diplome", content: "Diplôme universitaire on-chain", correctDirection: "right", explanation: "Vérifiable, infalsifiable, universel" },
            { id: "land", content: "Terrain dans un metaverse fantôme", correctDirection: "left", explanation: "Spéculatif — dépend de l'adoption du metaverse" },
            { id: "identity", content: "Identité digitale décentralisée (DID)", correctDirection: "right", explanation: "Cas d'usage concret : contrôle de ses données personnelles" }
          ],
          timeLimit: 40,
          mindyMessage: "Le singe à 500k$ c'était de la folie. Le diplôme on-chain c'est l'avenir."
        },
        {
          type: "info",
          title: "Les NFTs en 2025",
          content: "Ce qui reste pertinent :\n✅ Gaming : ownership réelle des assets en jeu\n✅ Ticketing : anti-scalping, vérification d'identité\n✅ RWA (Real World Assets) : tokenisation d'actifs réels\n✅ Identité décentralisée\n\nCe qui est mort :\n❌ Profile pictures à 6 chiffres sans utilité\n❌ Metaverses fantômes",
          mindyMessage: "Retiens : NFT = outil. Ce qui change c'est ce qu'on met dedans. 🛠️"
        }
      ]
    }
  },
  {
    title: "Le MEV & Dark Forest",
    domain: "CRYPTO",
    difficulty: "ADVANCED",
    xpReward: 130,
    orderIndex: 16,
    content: {
      steps: [
        {
          type: "info",
          title: "Maximal Extractable Value",
          content: "Le MEV (Maximal Extractable Value) est le profit que les mineurs/validateurs peuvent extraire en réorganisant, incluant ou excluant des transactions dans un bloc. En 2024 : plus de 1 milliard de dollars de MEV extrait sur Ethereum.\n\n3 types principaux :\n• Arbitrage : capturer la différence de prix entre DEX\n• Sandwich attack : front-run + back-run une transaction utilisateur\n• Liquidation : liquider des positions sous-collatéralisées avant les autres",
          mindyMessage: "La blockchain est un Dark Forest. Les robots te voient avant toi. 🤖🌑"
        },
        {
          type: "quiz",
          question: "Dans une 'sandwich attack', que se passe-t-il ?",
          options: ["Deux transactions encadrent la tienne pour te voler du slippage", "Ton wallet est piraté", "Ta transaction est bloquée définitivement", "Tu reçois un bonus inattendu"],
          correctIndex: 0,
          mindyHint: "Sandwich = deux tranches. Ta transaction est au milieu. Pas pour ton bénéfice."
        },
        {
          type: "swipe",
          statement: "Le MEV est légal et fait partie du design d'Ethereum.",
          isCorrect: true,
          explanation: "Légal oui — c'est inhérent au mécanisme des blocs. C'est pour ça qu'EIP-1559 et Flashbots ont été créés pour le mitiger."
        },
        {
          type: "swipe",
          statement: "Flashbots est un protocole qui élimine complètement le MEV.",
          isCorrect: false,
          explanation: "Flashbots ne l'élimine pas — il le 'démocratise' et le rend plus transparent via un marché ordonné de blocs (MEV-Boost)."
        },
        {
          type: "quiz",
          question: "Comment se protéger des sandwich attacks ?",
          options: ["Utiliser un max slippage de 100%", "Utiliser un RPC privé (Flashbots Protect, MEV Blocker)", "Faire ses swaps la nuit", "Utiliser uniquement des CEX"],
          correctIndex: 1,
          mindyHint: "Un RPC privé cache ta transaction du mempool public. Les bots ne peuvent pas te voir."
        },
        {
          type: "info",
          title: "Se Protéger dans le Dark Forest",
          content: "Actions concrètes :\n• Utiliser MEV Blocker (rpc.mevblocker.io) comme RPC dans MetaMask\n• Limiter le slippage à 0.5-1% sur les gros trades\n• Utiliser des agregateurs (1inch, Paraswap) qui routent intelligemment\n• Sur Uniswap : activer 'protect from MEV'\n\n→ Le Dark Forest est réel. Équipe-toi.",
          mindyMessage: "Tu as survécu au Dark Forest avec tes nouvelles armes. Bien joué, soldier. ⚔️"
        }
      ]
    }
  },
  {
    title: "Bitcoin vs Altcoins : Stratégie",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 90,
    orderIndex: 17,
    content: {
      steps: [
        {
          type: "info",
          title: "La Trinité : BTC, ETH, Altcoins",
          content: "• Bitcoin (BTC) : digital gold, store of value, le plus décentralisé, 21M supply fixe\n• Ethereum (ETH) : plateforme smart contracts, DeFi, NFT, L2 écosystème\n• Altcoins : tout le reste — potentiel plus élevé, risque maximal\n\nRègle des risques : BTC < ETH < Large caps < Small caps",
          mindyMessage: "BTC = or numérique. ETH = pétrole numérique. Alts = casino VIP. 🎰"
        },
        {
          type: "swipe",
          statement: "Le Bitcoin Dominance (BTC.D) mesure la part de marché de Bitcoin sur le total crypto.",
          isCorrect: true,
          explanation: "BTC.D élevé = marché risk-off (fuite vers la sécurité). BTC.D bas = altseason possible. C'est un indicateur macro important."
        },
        {
          type: "quiz",
          question: "Qu'est-ce que le Bitcoin Halving ?",
          options: ["Bitcoin est divisé en deux", "La récompense de minage est divisée par 2 tous les 4 ans", "Le prix de BTC est plafonné à la moitié", "Un vote de la communauté pour réduire la supply"],
          correctIndex: 1,
          mindyHint: "Halving = récompense ÷ 2. Moins de BTC produits = raréfaction = historiquement bullish."
        },
        {
          type: "swipe",
          statement: "Pendant une altseason, les altcoins surperforment Bitcoin.",
          isCorrect: true,
          explanation: "Oui — l'altseason survient généralement après un rally BTC. Les gains se 'rotent' vers les alts. Des x5 à x100 sont possibles... comme des -90%."
        },
        {
          type: "swipe",
          statement: "Investir 100% en altcoins est la stratégie la plus efficace long terme.",
          isCorrect: false,
          explanation: "La plupart des altcoins font 0 sur 5 ans. La majorité meurent. Bitcoin a toujours récupéré ses ATH. La diversification intelligente prime."
        },
        {
          type: "reorder",
          title: "Stratégie de portefeuille crypto (par risque croissant)",
          instruction: "Du plus sûr au plus risqué.",
          words: ["Altcoins small caps", "Bitcoin (BTC)", "Stablecoins", "Ethereum (ETH)", "Altcoins large caps (SOL, BNB...)"],
          correctOrder: [2, 1, 3, 4, 0],
          mindyMessage: "Stablecoins → BTC → ETH → Large alts → Small alts. Construis ta pyramid."
        },
        {
          type: "info",
          title: "Allocation Recommandée",
          content: "Pour un débutant :\n• 50% BTC\n• 25% ETH\n• 15% 2-3 large caps (SOL, BNB, ADA...)\n• 10% max en speculation/small caps\n\nRègle d'or : n'investis que ce que tu peux te permettre de perdre à 100%.",
          mindyMessage: "Les gens qui ont mis tout dans DOGE en 2021 ne dorment plus. Sois pas ces gens. 🐶"
        }
      ]
    }
  },
  {
    title: "Options & Produits Dérivés",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 130,
    orderIndex: 23,
    content: {
      steps: [
        {
          type: "info",
          title: "Les Dérivés : Levier Sans Posséder l'Actif",
          content: "Un dérivé est un contrat dont la valeur dépend d'un actif sous-jacent (action, indice, crypto...).\n\n• Call option : droit d'ACHETER à un prix fixé (strike)\n• Put option : droit de VENDRE à un prix fixé\n• Future/Forward : obligation d'acheter/vendre à une date future\n• CFD : contrat pour différence — pas de livraison, juste P&L",
          mindyMessage: "Dérivés = jouer sur la direction d'un actif sans le posséder. Arme à double tranchant. ⚔️"
        },
        {
          type: "quiz",
          question: "Tu achètes un Call option sur Apple à strike 200$. Que souhaites-tu ?",
          options: ["Que le prix baisse sous 200$", "Que le prix monte au-dessus de 200$", "Que le prix reste exactement à 200$", "Que Apple disparaisse"],
          correctIndex: 1,
          mindyHint: "Call = tu appelles le prix à monter. Strike = ton prix d'exercice."
        },
        {
          type: "swipe",
          statement: "Acheter une option engendre une perte maximale limitée à la prime payée.",
          isCorrect: true,
          explanation: "L'acheteur d'une option ne peut perdre que la prime. Le vendeur, lui, a une perte potentiellement illimitée."
        },
        {
          type: "swipe",
          statement: "Vendre des options nues (naked) est une stratégie sans risque.",
          isCorrect: false,
          explanation: "FAUX. Vendre une naked call = risque de perte illimitée si l'action monte. GameStop short squeeze en 2021 : certains vendeurs ont perdu des milliards."
        },
        {
          type: "quiz",
          question: "Qu'est-ce que le 'Theta decay' dans les options ?",
          options: ["La hausse de valeur avec le temps", "La perte de valeur d'une option avec l'écoulement du temps", "Un type de stratégie DeFi", "L'impact du volume sur le prix"],
          correctIndex: 1,
          mindyHint: "Theta = temps. Les options perdent de la valeur chaque jour qui passe (toutes choses égales)."
        },
        {
          type: "info",
          title: "Les Grecs — Maîtriser les Sensibilités",
          content: "Les 'Greeks' mesurent la sensibilité d'une option :\n\n• Delta (Δ) : variation du prix option / variation du sous-jacent\n• Theta (Θ) : perte de valeur par jour (time decay)\n• Vega (V) : sensibilité à la volatilité implicite\n• Gamma (Γ) : taux de variation du Delta\n\n→ Les pros gèrent des portefeuilles delta-neutres pour isoler d'autres expositions.",
          mindyMessage: "Bienvenue dans le monde des quants. Si tu comprends les Greeks, tu es dans le top 1%. 🧮"
        }
      ]
    }
  },
  {
    title: "SCPI & Immobilier Papier",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 24,
    content: {
      steps: [
        {
          type: "info",
          title: "Investir dans l'Immobilier sans les Galères",
          content: "Une SCPI (Société Civile de Placement Immobilier) permet d'investir dans un parc immobilier diversifié avec quelques centaines d'euros, sans gestion locative, notaire, ou locataire qui ne paie pas.\n\nTu achètes des parts → la SCPI gère tout → tu reçois des loyers proportionnels.",
          mindyMessage: "Tous les avantages de l'immo, aucune des galères. Aucun coup de fil à 23h pour une fuite. 🔧"
        },
        {
          type: "quiz",
          question: "Quel est le rendement moyen annuel d'une SCPI de rendement en France ?",
          options: ["1-2%", "4-6%", "10-15%", "25%+"],
          correctIndex: 1,
          mindyHint: "Les SCPI de rendement visent 4-6% net/an. Stable, régulier, et supérieur au Livret A."
        },
        {
          type: "swipe",
          statement: "Les SCPI garantissent le capital investi.",
          isCorrect: false,
          explanation: "Aucune SCPI ne garantit le capital. La valeur de la part peut baisser (comme en 2023 avec la remontée des taux). C'est un investissement immobilier."
        },
        {
          type: "swipe",
          statement: "On peut acheter des parts de SCPI via une assurance vie.",
          isCorrect: true,
          explanation: "Oui ! Via l'AV, les loyers capitalisent sans fiscalité immédiate. Meilleure optimisation fiscale possible pour les SCPI."
        },
        {
          type: "swipe",
          statement: "La liquidité d'une SCPI est comparable à celle d'une action en bourse.",
          isCorrect: false,
          explanation: "Les SCPI sont illiquides — revendre prend plusieurs semaines à mois. C'est un investissement long terme (8+ ans recommandé)."
        },
        {
          type: "reorder",
          title: "Comment investir en SCPI via AV ?",
          instruction: "Remets les étapes dans l'ordre.",
          words: ["Recevoir les loyers dans l'AV", "Ouvrir une AV chez un assureur avec SCPI", "Choisir la SCPI (Immorente, Corum, PFO2...)", "Investir le capital en SCPI via l'AV", "Retrait après 8 ans avec fiscalité avantageuse"],
          correctOrder: [1, 2, 3, 0, 4],
          mindyMessage: "AV + SCPI = immobilier + avantage fiscal. Le combo des patrimoniaux sérieux. 🏠"
        },
        {
          type: "info",
          title: "SCPI vs Immobilier Direct",
          content: "SCPI :\n✅ Accessible dès 200€\n✅ Diversification géographique et sectorielle\n✅ Aucune gestion\n✅ Revenus réguliers\n❌ Frais d'entrée élevés (8-12%)\n❌ Illiquide\n\nImmo Direct :\n✅ Effet de levier bancaire\n✅ Plus-value potentielle\n❌ Capital important nécessaire\n❌ Gestion, travaux, vacance locative",
          mindyMessage: "SCPI si tu veux la facilité. Immo direct si tu veux le contrôle et le levier. Les deux peuvent coexister. 🎯"
        }
      ]
    }
  },
  {
    title: "Le Plan d'Épargne Retraite (PER)",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 25,
    content: {
      steps: [
        {
          type: "info",
          title: "Préparer sa Retraite = Déduire ses Impôts",
          content: "Le PER (Plan d'Épargne Retraite, lancé en 2019) remplace les anciens PERP/Madelin. Son avantage unique : les versements sont déductibles du revenu imposable dans l'année.\n\nTu verses 10 000€ dans ton PER → ton revenu imposable baisse de 10 000€ → économie fiscale réelle selon ta TMI.",
          mindyMessage: "Rembourser moins d'impôts maintenant pour récupérer plus tard. L'État te rembourse partiellement l'effort. 🏦"
        },
        {
          type: "quiz",
          question: "Pour quelqu'un à 30% de TMI, verser 5000€ dans un PER économise combien d'impôts ?",
          options: ["500€", "1500€", "3000€", "5000€"],
          correctIndex: 1,
          mindyHint: "TMI 30% × 5000€ versés = 1500€ d'économie fiscale. Calcul simple."
        },
        {
          type: "swipe",
          statement: "Le PER est bloqué jusqu'à la retraite sans exception.",
          isCorrect: false,
          explanation: "Il existe des cas de déblocage anticipé : achat de résidence principale, invalidité, décès du conjoint, liquidation judiciaire, fin de droits chômage."
        },
        {
          type: "swipe",
          statement: "Plus ta TMI est élevée, plus le PER est avantageux.",
          isCorrect: true,
          explanation: "Un versement dans le PER à TMI 41% économise 41% d'impôts maintenant. À la retraite (TMI souvent plus basse), la fiscalité est plus douce. Arbitrage rentable."
        },
        {
          type: "swipe",
          statement: "On peut choisir comment sont investis les fonds dans un PER.",
          isCorrect: true,
          explanation: "Oui — comme une AV, tu choisis entre fonds euro (sécurisé) et unités de compte (actions, ETF). La gestion pilotée est souvent proposée par défaut."
        },
        {
          type: "reorder",
          title: "Stratégie fiscale complète",
          instruction: "Ordre de priorité des enveloppes d'épargne/investissement.",
          words: ["CTO (investissements complémentaires)", "Livret A (épargne de précaution)", "PER (déduction fiscale immédiate)", "PEA (bourse, fiscalité long terme)", "Assurance Vie (patrimoine + transmission)"],
          correctOrder: [1, 2, 3, 4, 0],
          mindyMessage: "Livret A → PER (si TMI élevée) → PEA → AV → CTO. La stratégie des gens qui font bien les choses."
        },
        {
          type: "info",
          title: "PER ou AV : Comment Choisir ?",
          content: "Choisir le PER si :\n• TMI ≥ 30%\n• Tu n'as pas besoin de liquidités avant la retraite\n• Tu veux réduire ton IR maintenant\n\nChoisir l'AV si :\n• TMI basse\n• Tu veux de la flexibilité\n• Objectif transmission\n\n→ Idéalement : PER + AV, les deux sont complémentaires.",
          mindyMessage: "Les deux si possible. L'un complète l'autre. Commence par celui qui réduit le plus ton impôt maintenant. 💡"
        }
      ]
    }
  },
  {
    title: "Lire et Analyser un Bilan",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 120,
    orderIndex: 26,
    content: {
      steps: [
        {
          type: "info",
          title: "Le Bilan : Radiographie Financière d'une Entreprise",
          content: "Un bilan (Balance Sheet) montre, à un instant T, ce qu'une entreprise :\n• POSSÈDE (Actifs) : trésorerie, stocks, immobilisations...\n• DOIT (Passifs) : dettes, obligations...\n• VAUT pour ses actionnaires (Capitaux propres)\n\nÉquation fondamentale : Actif = Passif + Capitaux Propres",
          mindyMessage: "Le bilan c'est la carte d'identité financière. Tu veux investir ? Lis le bilan. Point. 📊"
        },
        {
          type: "quiz",
          question: "Si les actifs d'une société valent 500M€ et les passifs 300M€, combien valent les capitaux propres ?",
          options: ["800M€", "200M€", "300M€", "500M€"],
          correctIndex: 1,
          mindyHint: "Capitaux propres = Actifs - Passifs = 500 - 300 = 200M€. Équation de base."
        },
        {
          type: "swipe",
          statement: "Une dette élevée est toujours une mauvaise chose pour une entreprise.",
          isCorrect: false,
          explanation: "Non — une dette bien utilisée crée de la valeur (levier financier). Amazon a eu des années entières en perte comptable pour investir. Contexte taux compte."
        },
        {
          type: "swipe",
          statement: "Le ratio D/E (Debt-to-Equity) mesure l'endettement par rapport aux fonds propres.",
          isCorrect: true,
          explanation: "D/E = Dettes totales / Capitaux propres. Un D/E > 2 = entreprise très endettée. À comparer avec les standards du secteur."
        },
        {
          type: "quiz",
          question: "Le 'free cash flow' (FCF) représente quoi ?",
          options: ["Le cash distribué aux employés", "L'argent disponible après investissements (capex)", "Le chiffre d'affaires net de TVA", "La valeur totale de l'entreprise"],
          correctIndex: 1,
          mindyHint: "FCF = Cash from operations - Capex. C'est l'argent 'libre' que l'entreprise peut distribuer ou réinvestir."
        },
        {
          type: "swipe_sequence",
          title: "Actif ou Passif ?",
          instruction: "Swipe DROITE pour Actif, GAUCHE pour Passif.",
          leftLabel: "Passif (dette)",
          rightLabel: "Actif (possession)",
          cards: [
            { id: "cash", content: "Trésorerie (50M€)", correctDirection: "right", explanation: "Actif circulant — argent disponible" },
            { id: "debt", content: "Emprunt bancaire (100M€)", correctDirection: "left", explanation: "Passif — obligation de remboursement" },
            { id: "brevet", content: "Brevets (valeur 20M€)", correctDirection: "right", explanation: "Actif incorporel — immobilisation" },
            { id: "oblig", content: "Obligations émises (30M€)", correctDirection: "left", explanation: "Passif — dette obligataire" },
            { id: "stock", content: "Stocks de marchandises", correctDirection: "right", explanation: "Actif circulant" },
            { id: "fournisseur", content: "Dettes fournisseurs", correctDirection: "left", explanation: "Passif — dettes d'exploitation" }
          ],
          timeLimit: 45,
          mindyMessage: "Actif = ce qu'on possède. Passif = ce qu'on doit. Tatoue ça. 📚"
        },
        {
          type: "info",
          title: "Les Ratios Clés à Connaître",
          content: "• ROE (Return on Equity) : bénéfice net / capitaux propres → rentabilité pour l'actionnaire\n• ROA (Return on Assets) : bénéfice net / actif total → efficacité d'utilisation des actifs\n• Current Ratio : actifs courants / passifs courants → liquidité à court terme (>1 = sain)\n• D/E ratio : dette / capitaux propres → levier financier\n\n→ Comparer toujours avec les peers du même secteur.",
          mindyMessage: "Un ROE de 30% dans la tech = normal. Dans les utilities = exceptionnel. Contexte, toujours. 🎯"
        }
      ]
    }
  },
  {
    title: "Layer 2 & Scaling",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 11,
    content: {
      steps: [
        {
          type: "info",
          title: "Le Problème de Scalabilité",
          content: "Ethereum ne traite que ~15 transactions par seconde (TPS). Visa en traite 24 000. Pour que la crypto devienne mainstream, il faut scaler — sans sacrifier la sécurité ni la décentralisation.",
          mindyMessage: "15 TPS. C'est moins rapide que toi le matin avant un café. ☕"
        },
        {
          type: "swipe",
          statement: "Les Layer 2 fonctionnent EN DEHORS de la blockchain principale.",
          isCorrect: true,
          explanation: "Exactement : les L2 traitent les transactions off-chain puis soumettent un résumé au L1 pour la sécurité finale."
        },
        {
          type: "swipe",
          statement: "Utiliser un Layer 2 coûte plus cher en gas que le Layer 1.",
          isCorrect: false,
          explanation: "C'est l'inverse. Les L2 regroupent (batch) des centaines de transactions, ce qui divise les frais par 10 à 100x."
        },
        {
          type: "quiz",
          question: "Combien de TPS peut traiter Ethereum en Layer 1 environ ?",
          options: ["15 TPS", "1 000 TPS", "100 000 TPS", "50 000 TPS"],
          correctIndex: 0,
          mindyHint: "C'est décevant. Pense au nombre de café que tu prends en 1 seconde."
        },
        {
          type: "swipe_sequence",
          title: "Layer 2 ou pas ?",
          instruction: "Swipe DROITE si c'est un Layer 2, GAUCHE si c'est une chaîne principale.",
          leftLabel: "L1 (Principal)",
          rightLabel: "L2 (Layer 2)",
          cards: [
            { id: "arb", content: "Arbitrum", correctDirection: "right", explanation: "Rollup Ethereum — typique Layer 2" },
            { id: "poly", content: "Polygon zkEVM", correctDirection: "right", explanation: "ZK-Rollup sur Ethereum" },
            { id: "light", content: "Lightning Network", correctDirection: "right", explanation: "Layer 2 de Bitcoin" },
            { id: "eth", content: "Ethereum Mainnet", correctDirection: "left", explanation: "C'est le L1 lui-même" },
            { id: "btc", content: "Bitcoin Mainnet", correctDirection: "left", explanation: "L1, pas un L2" },
            { id: "op", content: "Optimism", correctDirection: "right", explanation: "Optimistic Rollup sur Ethereum" }
          ],
          timeLimit: 45,
          mindyMessage: "Si tu rates Bitcoin Mainnet, on a un problème."
        },
        {
          type: "reorder",
          title: "Comment fonctionne un Rollup ?",
          instruction: "Remets les étapes dans l'ordre.",
          words: ["Batching des txs", "Compression des données", "Soumission au L1", "Transactions soumises au L2", "Finalité sécurisée"],
          correctOrder: [3, 0, 1, 2, 4],
          mindyMessage: "C'est comme compresser un zip avant de l'envoyer. Mais pour de l'argent."
        },
        {
          type: "info",
          title: "Les Types de Rollups",
          content: "• Optimistic Rollups (Arbitrum, Optimism) : supposent que les txs sont valides, fraud proof si contesté.\n• ZK-Rollups (zkSync, Starknet) : preuve cryptographique de validité, plus sûr mais plus complexe.\n\nLes deux permettent des milliers de TPS à des frais minimes.",
          mindyMessage: "ZK = Zero Knowledge. Rien à voir avec ton niveau de connaissance actuel. 😏"
        },
        {
          type: "quiz",
          question: "Quelle est la principale différence entre un Optimistic Rollup et un ZK-Rollup ?",
          options: ["Les Optimistic Rollups sont plus rapides", "Les ZK-Rollups utilisent des preuves cryptographiques, les Optimistic Rollups utilisent des fraud proofs avec délai de contestation", "Les Optimistic Rollups sont plus chers", "Il n'y a aucune différence technique"],
          correctIndex: 1,
          mindyHint: "Optimistic = on fait confiance et on conteste si besoin (7 jours). ZK = on prouve mathématiquement que tout est correct."
        },
        {
          type: "flashcard",
          front: "Optimism vs Arbitrum",
          back: "Optimism :\n• Optimistic Rollup, fraud proofs\n• Token OP, governance active\n• Écosystème : Velodrome, Synthetix\n• Superchain vision (OP Stack)\n\nArbitrum :\n• Optimistic Rollup, Nitro tech\n• Token ARB\n• Plus gros TVL des L2 (~10B$)\n• Écosystème : GMX, Camelot, Radiant\n\nLes deux réduisent les frais de 10-100x vs Ethereum L1.",
          category: "Layer 2"
        }
      ]
    }
  },
  {
    title: "Les Stablecoins",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 80,
    orderIndex: 12,
    content: {
      steps: [
        {
          type: "info",
          title: "La Crypto Sans la Volatilité",
          content: "Un stablecoin est une cryptomonnaie dont la valeur est indexée sur un actif stable, généralement le dollar US. 1 USDT = 1$, toujours. C'est l'outil indispensable pour sécuriser ses gains sans quitter la blockchain.",
          mindyMessage: "C'est la ceinture de sécurité du monde crypto. Mets-la. 🪙"
        },
        {
          type: "quiz",
          question: "Sur quoi est adossé l'USDT (Tether) ?",
          options: ["L'or", "Le dollar américain", "L'euro", "Le Bitcoin"],
          correctIndex: 1,
          mindyHint: "Le T dans Tether... Dollar ? Non, attends — essaie encore."
        },
        {
          type: "swipe",
          statement: "DAI est un stablecoin décentralisé.",
          isCorrect: true,
          explanation: "DAI est émis par le protocole MakerDAO, collatéralisé en crypto. Pas de société centrale derrière."
        },
        {
          type: "swipe",
          statement: "Les stablecoins ne peuvent jamais perdre leur ancrage (depeg).",
          isCorrect: false,
          explanation: "LUNA/UST en mai 2022 : un stablecoin algorithmique qui a perdu son ancrage et s'est effondré à 0. 40 milliards de dollars évaporés."
        },
        {
          type: "swipe_sequence",
          title: "Stablecoin ou pas ?",
          instruction: "Swipe DROITE pour les stablecoins, GAUCHE pour les actifs volatils.",
          leftLabel: "Volatil",
          rightLabel: "Stablecoin",
          cards: [
            { id: "usdt", content: "USDT", correctDirection: "right", explanation: "Tether — le plus gros stablecoin" },
            { id: "usdc", content: "USDC", correctDirection: "right", explanation: "USD Coin par Circle" },
            { id: "dai", content: "DAI", correctDirection: "right", explanation: "Stablecoin décentralisé" },
            { id: "btc", content: "Bitcoin", correctDirection: "left", explanation: "-50% en quelques mois, c'est possible" },
            { id: "eth", content: "Ethereum", correctDirection: "left", explanation: "Très volatil malgré sa maturité" },
            { id: "sol", content: "Solana", correctDirection: "left", explanation: "A perdu 95% en bear market" }
          ],
          timeLimit: 35,
          mindyMessage: "Si tu mets ETH à droite, on reprend depuis le début."
        },
        {
          type: "info",
          title: "Les Risques des Stablecoins",
          content: "• Risque de contrepartie : USDT/USDC sont émis par des sociétés. Si elles font faillite ?\n• Risque de dépeg : un algorithme peut se casser (LUNA 2022)\n• Risque réglementaire : les gouvernements peuvent interdire certains stablecoins\n\n→ Diversifie entre plusieurs stablecoins, ne mets pas tout dans un seul.",
          mindyMessage: "Même le plus 'stable' des trucs peut crasher. Retiens ça pour la vie. 💀"
        },
        {
          type: "news_impact",
          headline: "Tether (USDT) perd brièvement son peg à 0.97$ suite à des rumeurs sur ses réserves",
          source: "CoinDesk",
          date: "2024-06-15",
          correctImpact: "bearish",
          explanation: "Un dépeg même temporaire de l'USDT crée une panique massive : c'est le stablecoin le plus utilisé au monde. Les traders fuient vers USDC ou DAI, la liquidité se tarit, et les prix de tous les actifs crypto chutent.",
          mindyMessage: "USDT qui dépeg = le marché entier qui panique. C'est le pilier de la liquidité crypto. 😱"
        },
        {
          type: "quiz",
          question: "Quelle est la différence fondamentale entre USDC et DAI en termes de collatéral ?",
          options: ["USDC est backé par des dollars réels, DAI est backé par des cryptos sur-collatéralisées", "Les deux sont backés par des dollars", "DAI est algorithmique sans collatéral", "USDC est décentralisé, DAI est centralisé"],
          correctIndex: 0,
          mindyHint: "USDC = Circle = dollars en banque. DAI = MakerDAO = ETH et autres cryptos verrouillés à 150%+."
        }
      ]
    }
  },
  {
    title: "Bull & Bear Markets",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 75,
    orderIndex: 13,
    content: {
      steps: [
        {
          type: "info",
          title: "Les Deux Faces du Marché",
          content: "• Bull Market (Taureau 🐂) : tendance haussière prolongée, euphorie générale, tout monte.\n• Bear Market (Ours 🐻) : baisse de 20%+ sur plusieurs mois, panique, ventes en cascade.\n\nLa clé : savoir dans quelle phase tu es pour ne pas acheter au sommet ni vendre au fond.",
          mindyMessage: "La majorité achète en bull et vend en bear. Ne sois pas la majorité. 📉"
        },
        {
          type: "quiz",
          question: "Un 'Bear Market' correspond à une baisse de combien par rapport au plus haut ?",
          options: ["Plus de 10%", "Plus de 20%", "Plus de 5%", "Plus de 50%"],
          correctIndex: 1,
          mindyHint: "La définition officielle des marchés traditionnels. 20% c'est le seuil."
        },
        {
          type: "swipe",
          statement: "Acheter pendant un bear market est systématiquement une mauvaise idée.",
          isCorrect: false,
          explanation: "C'est souvent le meilleur moment d'acheter — si tu as un horizon long terme. Warren Buffett : 'Sois avide quand les autres ont peur.'"
        },
        {
          type: "swipe",
          statement: "En bull market, la plupart des altcoins montent plus vite que Bitcoin.",
          isCorrect: true,
          explanation: "Oui — l'effet de levier naturel des petites caps amplifie les mouvements. Mais ils chutent aussi plus vite en bear."
        },
        {
          type: "swipe",
          statement: "Le DCA (Dollar Cost Averaging) protège contre les erreurs de timing.",
          isCorrect: true,
          explanation: "Investir un montant fixe régulièrement lisse le prix d'achat et évite de tout mettre au mauvais moment."
        },
        {
          type: "quiz",
          question: "Quelle stratégie réduit le risque de mal timer le marché ?",
          options: ["All-in au sommet", "DCA (achat régulier)", "Vendre en panique", "Ignorer le marché"],
          correctIndex: 1,
          mindyHint: "Dollar Cost Averaging. Simple, efficace, ennuyeux — exactement ce qu'il faut."
        },
        {
          type: "info",
          title: "Stratégies selon la Phase",
          content: "🐂 Bull Market :\n• Prendre des profits progressivement\n• Réduire les positions risquées\n• Ne pas FOMO sur les pompes\n\n🐻 Bear Market :\n• DCA sur les actifs solides (BTC, ETH)\n• Garder des stablecoins pour les opportunités\n• Psychologie > technique",
          mindyMessage: "Le marché récompense la patience. Pas les gens qui 'check' le prix 40 fois par jour. 🧘"
        },
        {
          type: "price_prediction",
          question: "Le marché crypto est en baisse depuis 3 mois. Analyse ce graphique bearish et prédit le prochain mouvement.",
          candles: [
            { open: 48000, high: 48500, low: 45200, close: 45800 },
            { open: 45800, high: 46900, low: 44500, close: 44800 },
            { open: 44800, high: 45100, low: 42000, close: 42500 },
            { open: 42500, high: 43800, low: 41800, close: 43500 },
            { open: 43500, high: 44200, low: 41200, close: 41500 },
            { open: 41500, high: 42000, low: 39800, close: 40200 },
            { open: 40200, high: 41500, low: 39500, close: 39800 },
            { open: 39800, high: 40100, low: 38500, close: 38900 }
          ],
          correctAnswer: "down",
          explanation: "Tendance baissière claire : lower highs et lower lows successifs. Les chandeliers rouges dominent avec de longues mèches hautes (vendeurs rejetant chaque tentative de rebond). Le momentum est bearish.",
          mindyMessage: "En bear market, chaque rebond est une opportunité de vente pour les gros. Ne confonds pas rebond technique et retournement. 🐻"
        },
        {
          type: "speed_round",
          title: "Speed Round : Bull & Bear",
          pairs: [
            { statement: "Un bear market est défini par une baisse de plus de 20%.", isTrue: true },
            { statement: "Le DCA est inefficace en bear market.", isTrue: false },
            { statement: "Les altcoins baissent généralement plus que Bitcoin en bear market.", isTrue: true },
            { statement: "Warren Buffett conseille d'être avide quand les autres ont peur.", isTrue: true },
            { statement: "Un bull market ne peut jamais durer plus de 2 ans.", isTrue: false },
            { statement: "Le volume de trading augmente généralement dans les phases de panique.", isTrue: true },
            { statement: "En bull market, tous les projets crypto sont de bons investissements.", isTrue: false },
            { statement: "Le sentiment 'Extreme Greed' signale souvent un sommet de marché.", isTrue: true }
          ],
          timeLimitSeconds: 40
        }
      ]
    }
  },
  {
    title: "Le Plan d'Épargne en Actions (PEA)",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 20,
    content: {
      steps: [
        {
          type: "info",
          title: "L'Enveloppe Fiscale Préférée des Français",
          content: "Le PEA (Plan d'Épargne en Actions) est une enveloppe fiscale française permettant d'investir en bourse avec une fiscalité avantageuse après 5 ans. Pas d'impôt sur les plus-values tant qu'on ne retire pas, et seulement 17,2% de prélèvements sociaux après 5 ans.",
          mindyMessage: "L'État te fait un cadeau fiscal. Tu le refuses ? Vraiment ? 🤦"
        },
        {
          type: "quiz",
          question: "Quel est le plafond de versements d'un PEA classique ?",
          options: ["100 000€", "150 000€", "50 000€", "200 000€"],
          correctIndex: 1,
          mindyHint: "150k€ pour le PEA, 225k€ pour le PEA-PME. Retiens le premier."
        },
        {
          type: "swipe",
          statement: "On peut retirer de l'argent d'un PEA à tout moment sans conséquences.",
          isCorrect: false,
          explanation: "Un retrait avant 5 ans entraîne la clôture du PEA et une fiscalité de 12,8% sur les plus-values. Après 5 ans, tu peux retirer librement."
        },
        {
          type: "swipe",
          statement: "Les ETF éligibles PEA permettent d'investir mondialement tout en restant dans l'enveloppe.",
          isCorrect: true,
          explanation: "Des ETF comme le Lyxor S&P 500 PEA ou le Amundi MSCI World PEA sont éligibles — investir sur le monde entier depuis un PEA français."
        },
        {
          type: "swipe",
          statement: "Un PEA peut contenir des actions américaines directement.",
          isCorrect: false,
          explanation: "Non — le PEA est réservé aux actions européennes et aux fonds éligibles (SICAV/ETF avec au moins 75% d'actions européennes)."
        },
        {
          type: "reorder",
          title: "Parcours PEA idéal",
          instruction: "Remet les étapes dans l'ordre logique.",
          words: ["Attendre 5 ans minimum", "Choisir un courtier (Fortuneo, Bourse Direct...)", "Acheter des ETF World/S&P500 éligibles", "Ouvrir le PEA en ligne", "Effectuer un versement initial", "Retrait fiscal optimisé"],
          correctOrder: [1, 3, 4, 2, 0, 5],
          mindyMessage: "Si tu sautes l'étape 'attendre', tu perds la moitié des bénéfices fiscaux."
        },
        {
          type: "info",
          title: "PEA vs CTO : Lequel Choisir ?",
          content: "PEA :\n✅ Fiscalité réduite après 5 ans (17,2%)\n❌ Plafonné à 150k€\n❌ Limité aux actions européennes + fonds éligibles\n\nCTO (Compte-Titres Ordinaire) :\n✅ Aucun plafond\n✅ Accès à tout (actions US, ETF monde, etc.)\n❌ Fiscalité pleine : flat tax 30%\n\n→ Priorité : remplir le PEA en premier, puis déborder sur le CTO.",
          mindyMessage: "Ordre : Livret A → PEA → Assurance Vie → CTO. Tatoue-toi ça si nécessaire. 💪"
        },
        {
          type: "quiz",
          question: "Que se passe-t-il fiscalement si tu retires de l'argent de ton PEA après 5 ans ?",
          options: ["Flat tax de 30% sur les plus-values", "Seulement 17,2% de prélèvements sociaux sur les plus-values", "Aucun impôt du tout", "Impôt sur le revenu au barème progressif"],
          correctIndex: 1,
          mindyHint: "Après 5 ans, tu échappes à l'impôt sur le revenu. Il reste les prélèvements sociaux : 17,2%. C'est le deal du PEA."
        },
        {
          type: "flashcard",
          front: "PEA : Les 3 règles d'or",
          back: "1. Ouvrir le plus tôt possible — le compteur des 5 ans démarre à l'ouverture, pas au premier versement.\n\n2. Ne jamais retirer avant 5 ans — sinon clôture automatique et fiscalité pleine (30%).\n\n3. Investir en ETF éligibles — Amundi MSCI World PEA ou Lyxor S&P 500 PEA pour une diversification mondiale.",
          category: "Fiscalité"
        }
      ]
    }
  },
  {
    title: "Actions & Bourse",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 85,
    orderIndex: 21,
    content: {
      steps: [
        {
          type: "info",
          title: "Devenir Propriétaire d'une Entreprise",
          content: "Une action représente une part de propriété dans une entreprise cotée en bourse. Acheter une action Apple, c'est littéralement devenir copropriétaire d'Apple — avec les droits et risques que ça implique.",
          mindyMessage: "Tu peux posséder un bout d'Apple. Même si tu utilises Android. 🍎"
        },
        {
          type: "quiz",
          question: "Que donne une action à son détenteur ?",
          options: ["Un prêt remboursable", "Une part de propriété dans l'entreprise", "Un salaire fixe mensuel", "Une garantie de remboursement"],
          correctIndex: 1,
          mindyHint: "Stock = ownership. Pas de garantie, pas de salaire fixe."
        },
        {
          type: "swipe",
          statement: "Les dividendes sont la seule façon de gagner de l'argent avec des actions.",
          isCorrect: false,
          explanation: "Non — la plus-value (hausse du cours) est souvent plus importante que les dividendes. Certaines grandes entreprises ne versent d'ailleurs aucun dividende."
        },
        {
          type: "swipe",
          statement: "Le P/E Ratio (Price/Earnings) mesure combien tu paies pour chaque euro de bénéfice.",
          isCorrect: true,
          explanation: "P/E = Prix de l'action / Bénéfice par action. Un P/E de 20 signifie que tu paies 20€ pour 1€ de bénéfice annuel."
        },
        {
          type: "swipe_sequence",
          title: "Action ou autre actif ?",
          instruction: "Swipe DROITE si c'est une action, GAUCHE sinon.",
          leftLabel: "Pas une action",
          rightLabel: "Action",
          cards: [
            { id: "apple", content: "Apple (AAPL)", correctDirection: "right", explanation: "Action cotée au NASDAQ" },
            { id: "tesla", content: "Tesla (TSLA)", correctDirection: "right", explanation: "Action cotée au NASDAQ" },
            { id: "lvmh", content: "LVMH (MC)", correctDirection: "right", explanation: "Action cotée à Paris (Euronext)" },
            { id: "btc", content: "Bitcoin", correctDirection: "left", explanation: "Cryptomonnaie, pas une action" },
            { id: "etf", content: "ETF S&P 500", correctDirection: "left", explanation: "Fonds indiciel, pas une action individuelle" },
            { id: "oblig", content: "Obligation d'État", correctDirection: "left", explanation: "Dette, pas de l'equity" }
          ],
          timeLimit: 40,
          mindyMessage: "Bitcoin = pas une action. Si tu l'oublies, recommence cette leçon."
        },
        {
          type: "info",
          title: "Lire une Fiche Action",
          content: "Les indicateurs clés :\n• Prix actuel : cours de l'action en temps réel\n• Market Cap : prix × nombre d'actions = valeur totale\n• P/E Ratio : valorisation relative\n• EPS : bénéfice par action\n• Dividende yield : rendement annuel versé\n• 52-week high/low : fourchette sur un an\n\n→ Une action bon marché n'est pas forcément une bonne affaire.",
          mindyMessage: "Une action à 1€ peut être plus chère qu'une à 500€. Le P/E, c'est tout. 📊"
        }
      ]
    }
  },
  {
    title: "L'Assurance Vie",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 22,
    content: {
      steps: [
        {
          type: "info",
          title: "Le 3ème Pilier de l'Épargne Française",
          content: "L'assurance vie n'est PAS une assurance décès. C'est une enveloppe d'épargne/investissement avec des avantages fiscaux majeurs après 8 ans. Avec 1 900 milliards d'euros, c'est le placement préféré des Français.",
          mindyMessage: "Le nom est trompeur. Personne n'assure ta vie ici. On épargne, on investit. 📄"
        },
        {
          type: "quiz",
          question: "Peut-on retirer son argent d'une assurance vie avant 8 ans ?",
          options: ["Non, c'est totalement bloqué", "Oui, mais la fiscalité est moins avantageuse avant 8 ans", "Oui, avec des frais de pénalité fixes", "Non, sauf en cas de décès"],
          correctIndex: 1,
          mindyHint: "L'argent est disponible à tout moment. C'est la fiscalité qui change après 8 ans."
        },
        {
          type: "swipe",
          statement: "L'assurance vie bénéficie d'une fiscalité avantageuse sur la succession.",
          isCorrect: true,
          explanation: "Oui — jusqu'à 152 500€ transmis hors succession par bénéficiaire (pour les versements avant 70 ans). Outil de transmission patrimoniale puissant."
        },
        {
          type: "swipe",
          statement: "Le fonds euro d'une assurance vie garantit le capital investi.",
          isCorrect: true,
          explanation: "Le fonds euro est à capital garanti (hors frais). Rendement actuel : ~2-3% en 2024. Pas extraordinaire mais sans risque de perte."
        },
        {
          type: "swipe",
          statement: "On ne peut avoir qu'une seule assurance vie.",
          isCorrect: false,
          explanation: "On peut en avoir autant qu'on veut, chez différents assureurs. Diversifier les contrats est même recommandé."
        },
        {
          type: "reorder",
          title: "Ordre de priorité épargne (France)",
          instruction: "Du plus prioritaire au moins prioritaire.",
          words: ["Assurance Vie", "Livret A (épargne de précaution)", "PEA (investissement actions)", "CTO (débordement)"],
          correctOrder: [1, 2, 0, 3],
          mindyMessage: "Livret A d'abord pour l'urgence, PEA pour les actions, AV pour le patrimoine long terme."
        },
        {
          type: "info",
          title: "Stratégie d'Allocation dans une AV",
          content: "Une assurance vie peut contenir :\n• Fonds euro : capital garanti, rendement modéré\n• Unités de compte (UC) : actions, ETF, SCPI — risqué mais potentiel élevé\n\nRègle selon l'âge :\n• Jeune (< 35 ans) : 80-90% UC, 10-20% fonds euro\n• Approche retraite : inverser progressivement\n\n→ Choisir un contrat sans frais d'entrée (Linxea, Yomoni, Boursorama).",
          mindyMessage: "100% fonds euro à 25 ans, c'est gâcher l'outil le plus puissant de ta vie. 😤"
        }
      ]
    }
  },
  // =====================================================================
  // BATCH 4 — 20 leçons supplémentaires
  // =====================================================================
  {
    title: "Cryptographie & Blockchain",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 70,
    orderIndex: 18,
    content: {
      steps: [
        { type: "info", title: "Comment ça Marche Vraiment", content: "La blockchain = un registre partagé, immuable et distribué. Chaque bloc contient :\n• Un hash des transactions\n• Le hash du bloc précédent\n• Un timestamp\n• Un nonce (pour la preuve de travail)\n\nChanger un bloc = recalculer tous les blocs suivants = impossible en pratique.", mindyMessage: "C'est juste une liste chaînée de données cryptées. Mais la magie, c'est que personne ne la contrôle. 🔗" },
        { type: "quiz", question: "Que garantit le hachage cryptographique (SHA-256) ?", options: ["L'anonymat total", "Qu'une même entrée donne toujours la même sortie unique", "La rapidité des transactions", "L'inflation contrôlée"], correctIndex: 1, mindyHint: "Hash = empreinte digitale des données. Déterministe et unique." },
        { type: "swipe", statement: "Modifier une transaction passée dans la blockchain est techniquement possible si tu contrôles 51% du réseau.", isCorrect: true, explanation: "L'attaque des 51% — théoriquement possible mais économiquement absurde sur Bitcoin (coût = milliards de dollars d'électricité)." },
        { type: "swipe", statement: "La preuve de travail (PoW) consume beaucoup d'énergie intentionnellement.", isCorrect: true, explanation: "Le coût énergétique EST la sécurité. Rendre la fraude chère protège le réseau. C'est du game theory appliqué." },
        { type: "quiz", question: "La Proof of Stake (PoS) remplace quoi dans le consensus ?", options: ["Les mineurs par des validateurs qui stakent des tokens", "Le hashage par des signatures", "Les nœuds par des serveurs centraux", "Les blocs par des arbres de Merkle"], correctIndex: 0, mindyHint: "PoS = les validateurs mettent en jeu leurs tokens au lieu de brûler de l'électricité." },
        { type: "info", title: "PoW vs PoS", content: "Proof of Work (Bitcoin) :\n✅ Ultra-sécurisé, battle-tested\n❌ Consomme énormément d'énergie\n\nProof of Stake (Ethereum 2.0, Solana, Cardano) :\n✅ 99% moins énergivore\n✅ Plus de TPS possible\n❌ Moins testé, risques de centralisation\n\nLe débat continue. Les deux ont leur place.", mindyMessage: "Bitcoin ne changera jamais son consensus. ETH l'a fait en 2022. C'est un choix philosophique autant que technique. 🤔" }
      ]
    }
  },
  {
    title: "MetaMask & Web3",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 75,
    orderIndex: 19,
    content: {
      steps: [
        { type: "info", title: "Ton Passeport vers le Web3", content: "MetaMask est un wallet non-custodial qui s'installe en extension browser ou app mobile. Il te donne :\n• Une adresse Ethereum (publique)\n• Une clé privée (secrète)\n• La seed phrase (12-24 mots = accès total)\n\nNon-custodial = personne d'autre n'a ta clé privée.", mindyMessage: "Not your keys, not your crypto. MetaMask = tu es ta propre banque. 🔐" },
        { type: "swipe", statement: "Partager sa seed phrase avec un 'support' MetaMask sur Discord est une bonne pratique.", isCorrect: false, explanation: "JAMAIS. MetaMask ne demandera JAMAIS ta seed phrase. 100% des gens qui demandent ta seed phrase veulent te voler." },
        { type: "quiz", question: "Que se passe-t-il si tu perds ta seed phrase ET ton appareil ?", options: ["MetaMask peut récupérer ton compte", "Tu perds définitivement accès à tes fonds", "Tu peux contacter Ethereum pour récupérer", "Ton wallet est automatiquement sauvegardé en cloud"], correctIndex: 1, mindyHint: "Décentralisé = personne ne peut récupérer pour toi. La seed phrase EST le compte." },
        { type: "swipe", statement: "Une adresse Ethereum est publique — n'importe qui peut voir tes transactions.", isCorrect: true, explanation: "La blockchain est publique. Toutes tes transactions sont visibles sur Etherscan. Pseudonyme ≠ anonyme." },
        { type: "swipe_sequence", title: "Sécurité MetaMask", instruction: "Bonne pratique ou erreur fatale ?", leftLabel: "❌ Erreur", rightLabel: "✅ Bonne pratique", cards: [
          { id: "hw", content: "Hardware wallet pour les gros montants", correctDirection: "right", explanation: "Ledger/Trezor = clé privée hors ligne. Meilleure sécurité." },
          { id: "share", content: "Partager sa seed sur Google Drive", correctDirection: "left", explanation: "Si Google est compromis ou hacké, tu perds tout." },
          { id: "paper", content: "Écrire sa seed sur papier, stocker en sécurité", correctDirection: "right", explanation: "Low-tech mais efficace. Le papier ne se hack pas." },
          { id: "same", content: "Utiliser le même MetaMask pour DeFi risqué et l'épargne", correctDirection: "left", explanation: "Sépare tes wallets : un pour DeFi/test, un pour l'épargne long terme." }
        ], timeLimit: 35, mindyMessage: "Un wallet piraté, c'est irréversible. Sécurise AVANT d'avoir un problème." },
        { type: "info", title: "Gas Fees : Comprendre les Frais", content: "Les gas fees sur Ethereum paient les validateurs pour exécuter tes transactions.\n\n• Gas price (Gwei) : prix par unité de calcul\n• Gas limit : max d'unités pour cette tx\n• Frais totaux = Gas price × Gas used\n\n→ Les frais varient selon la congestion. Mardi/mercredi 2-6h UTC = moins cher.", mindyMessage: "50$ pour envoyer 100$, c'est toi en 2021. Les L2 ont résolu ça. Utilise Arbitrum/Optimism. 💸" }
      ]
    }
  },
  {
    title: "Solana, Cardano & Altcoins",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 85,
    orderIndex: 20,
    content: {
      steps: [
        { type: "info", title: "Le Monde au-delà d'Ethereum", content: "L'écosystème L1 alternatif :\n• Solana (SOL) : ~65,000 TPS, frais < 0.001$, Proof of History\n• Cardano (ADA) : approche académique peer-reviewed, PoS\n• Polkadot (DOT) : interopérabilité multi-chain, parachains\n• Avalanche (AVAX) : 3 sous-réseaux, finality en 1s\n• Near Protocol : sharding, UX simplifiée", mindyMessage: "Ethereum = iPhone. Solana = Android. Les deux ont leur marché. Le reste tente de survivre. 📱" },
        { type: "quiz", question: "Quelle est la principale force de Solana ?", options: ["La décentralisation maximale", "La vitesse et les frais ultra-bas", "La compatibilité EVM", "L'anonymat des transactions"], correctIndex: 1, mindyHint: "Solana sacrifie un peu de décentralisation pour des performances extrêmes." },
        { type: "swipe", statement: "Solana a subi plusieurs pannes réseau majeures en 2021-2022.", isCorrect: true, explanation: "Vrai — Solana a eu des outages à cause de la surcharge (spam de transactions). Décentralisation vs performance : le trilemme de la blockchain." },
        { type: "swipe", statement: "Polkadot permet à différentes blockchains de communiquer entre elles nativement.", isCorrect: true, explanation: "C'est le design fondamental de Polkadot — une 'relay chain' centrale connectant des 'parachains' spécialisées." },
        { type: "swipe_sequence", title: "Quel L1 ?", instruction: "Associe la caractéristique au bon projet.", leftLabel: "Ethereum/L1 classique", rightLabel: "Solana/Alt L1", cards: [
          { id: "fast", content: "65,000 TPS natifs", correctDirection: "right", explanation: "Solana — throughput extrême via Proof of History" },
          { id: "evm", content: "Compatible EVM (Solidity)", correctDirection: "left", explanation: "Ethereum et ses forks (BSC, Polygon PoS...)" },
          { id: "rust", content: "Programmes en Rust/C", correctDirection: "right", explanation: "Solana — pas de Solidity, écosystème différent" },
          { id: "peer", content: "Développement académique peer-reviewed", correctDirection: "left", explanation: "Cardano — Haskell, papers scientifiques avant tout" }
        ], timeLimit: 40, mindyMessage: "Chaque L1 a son trade-off. Apprends-les, ne fais pas confiance aux maximalistes." },
        { type: "info", title: "Le Trilemme de la Blockchain", content: "On ne peut avoir QUE DEUX des trois à la fois :\n• Sécurité\n• Scalabilité\n• Décentralisation\n\nBitcoin : Sécurité + Décentralisation (sacrifice scalabilité)\nSolana : Sécurité + Scalabilité (sacrifice décentralisation)\nEthereum + L2 : vise les 3 via la hiérarchie L1/L2\n\n→ Il n'y a pas de solution parfaite. Contexte d'usage = choix de chain.", mindyMessage: "Personne ne résout le trilemme. Tous mentent en disant le contraire. 🎭" }
      ]
    }
  },
  {
    title: "Analyse Technique : Les Bases",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 21,
    content: {
      steps: [
        { type: "info", title: "Lire un Graphique de Prix", content: "L'analyse technique (TA) utilise les graphiques de prix pour anticiper les mouvements futurs.\n\nÉléments clés :\n• Chandelier japonais (candle) : open, high, low, close\n• Volume : nombre de transactions dans la période\n• Support : niveau où le prix a tendance à rebondir\n• Résistance : niveau où le prix a tendance à bloquer\n• Tendance (trend) : direction dominante", mindyMessage: "Les graphiques sont l'histoire du marché. Les patterns se répètent parce que les humains se répètent. 📊" },
        { type: "quiz", question: "Un chandelier vert (bullish) signifie que :", options: ["Le prix a baissé sur la période", "Le prix de clôture est supérieur au prix d'ouverture", "Le volume est élevé", "Il n'y a pas de transactions"], correctIndex: 1, mindyHint: "Vert = close > open. Rouge = close < open." },
        { type: "swipe", statement: "Un support cassé à la baisse devient généralement une résistance.", isCorrect: true, explanation: "C'est le concept de 'polarity change'. Un support brisé devient résistance parce que les anciens acheteurs veulent récupérer leur mise." },
        { type: "swipe", statement: "L'analyse technique est une science exacte qui prédit l'avenir avec certitude.", isCorrect: false, explanation: "Faux — la TA donne des probabilités, pas des certitudes. Toujours associer à un risk management (stop-loss)." },
        { type: "quiz", question: "Un pattern 'Double Top' indique généralement :", options: ["Une continuation haussière forte", "Un renversement baissier probable", "Une consolidation latérale", "Une opportunité d'achat immédiate"], correctIndex: 1, mindyHint: "Double Top = le prix a essayé de casser la résistance 2 fois et a échoué. Signal baissier." },
        { type: "info", title: "Patterns Essentiels à Connaître", content: "Patterns de continuation :\n• Flag (drapeau) : consolidation courte avant continuation\n• Triangle symétrique : convergence, breakout possible\n\nPatterns de renversement :\n• Head & Shoulders : tête entre deux épaules = baisse probable\n• Double Top/Bottom : test échoué = retournement\n\nRègle : TOUJOURS attendre la confirmation du breakout avant d'entrer.", mindyMessage: "Les patterns c'est bien. Le risk management c'est mieux. Sans stop-loss, la TA devient du gambling. 🎲" }
      ]
    }
  },
  {
    title: "RSI, MACD & Indicateurs",
    domain: "CRYPTO",
    difficulty: "ADVANCED",
    xpReward: 115,
    orderIndex: 22,
    content: {
      steps: [
        { type: "info", title: "Les Oscillateurs : Mesurer la Force du Mouvement", content: "Les indicateurs techniques mesurent l'élan (momentum) et les conditions de surachat/survente :\n\n• RSI (Relative Strength Index) : 0-100, survendu <30, suracheté >70\n• MACD : convergence/divergence de 2 moyennes mobiles\n• Bollinger Bands : volatilité autour d'une moyenne\n• Volume Profile : où se concentrent les échanges", mindyMessage: "Un indicateur seul = bruit. Deux indicateurs convergents = signal. Trois = conviction. 📡" },
        { type: "quiz", question: "Un RSI à 80 signifie :", options: ["Le marché est survendu — acheter", "Le marché est suracheté — attention", "La tendance est neutre", "Le volume est au maximum"], correctIndex: 1, mindyHint: "RSI > 70 = suracheté. Attention, pas une garantie de baisse — le RSI peut rester élevé longtemps." },
        { type: "swipe", statement: "Le MACD est utile pour identifier les changements de tendance via les croisements.", isCorrect: true, explanation: "Croisement MACD au-dessus de sa signal line = momentum haussier. Au-dessous = baissier. Plus fiable sur les timeframes élevés." },
        { type: "swipe", statement: "Une divergence RSI baissière = le prix fait un nouveau high mais le RSI non.", isCorrect: true, explanation: "Exactement. La divergence signale un affaiblissement du momentum — souvent un signe avant-coureur de retournement." },
        { type: "quiz", question: "Sur quelle timeframe les indicateurs sont-ils le plus fiables ?", options: ["1 minute", "5 minutes", "Daily/Weekly", "Peu importe"], correctIndex: 2, mindyHint: "Plus le timeframe est élevé, moins il y a de faux signaux. Daily et Weekly = signaux structurels." },
        { type: "info", title: "Stratégie de Combinaison", content: "Setup fiable :\n1. Trend-following : MA20 > MA50 (tendance haussière)\n2. RSI entre 40-60 (pas en zone extrême)\n3. MACD croisement haussier\n4. Volume en hausse sur la cassure\n\nPlus de confluences = signal plus fort. Entrée seulement si 3/4 conditions remplies.\n\n→ Toujours définir son invalidation (stop-loss) AVANT d'entrer.", mindyMessage: "Les meilleurs traders cherchent des confluences, pas des justifications. Il y a une différence. 🎯" }
      ]
    }
  },
  {
    title: "Tax Crypto en France",
    domain: "CRYPTO",
    difficulty: "BEGINNER",
    xpReward: 80,
    orderIndex: 23,
    content: {
      steps: [
        { type: "info", title: "L'État Veut sa Part", content: "En France depuis 2019 :\n• Flat tax de 30% sur les plus-values crypto (12.8% IR + 17.2% PS)\n• Imposition UNIQUEMENT lors de la conversion en euros (ou autre monnaie fiat)\n• Crypto vers crypto = pas d'imposition\n• Seuil d'exonération : moins de 305€ de plus-value par an\n\n→ Tu peux swapper BTC contre ETH sans payer d'impôts.", mindyMessage: "Crypto → crypto = pas d'impôt. Crypto → euros = flat tax 30%. Retiens ça et évite les surprises. 💶" },
        { type: "quiz", question: "Tu achètes 1 BTC à 20,000€ et le revends à 30,000€. Combien d'impôts ?", options: ["0€ (exonéré)", "3,000€ (30% de 10,000€)", "1,280€ (12.8% IR)", "10,000€"], correctIndex: 1, mindyHint: "Plus-value = 10,000€. Flat tax 30% = 3,000€." },
        { type: "swipe", statement: "Échanger BTC contre ETH sur un DEX est un événement taxable en France.", isCorrect: false, explanation: "Crypto vers crypto = PAS un fait générateur d'imposition selon l'article 150 VH bis du CGI. Seul le retrait en euros l'est." },
        { type: "swipe", statement: "Le staking est considéré comme un revenu et non une plus-value.", isCorrect: true, explanation: "Les rewards de staking sont traités comme des bénéfices non commerciaux (BNC) et imposés selon ta tranche marginale, pas la flat tax." },
        { type: "quiz", question: "Quel formulaire utiliser pour déclarer ses plus-values crypto en France ?", options: ["Formulaire 2042", "Formulaire 2086", "Formulaire 2074", "Pas de déclaration nécessaire"], correctIndex: 1, mindyHint: "Formulaire 2086 = déclaration spécifique aux actifs numériques. Obligatoire si tu as des plus-values." },
        { type: "info", title: "Outils et Astuces", content: "• Koinly, Waltio, CoinTracking : logiciels de suivi fiscal crypto\n• Déclaration obligatoire de tous les comptes étrangers (CEX étrangers = formulaire 3916-bis)\n• Conservation des historiques : 10 ans\n• Pertes : déductibles UNIQUEMENT des plus-values de la même année (pas de report)\n\n→ Déclare dès la première année, même à 0. Évite les redressements.", mindyMessage: "La crypto t'a enrichi ? Bien. L'État le sait aussi. Déclare, c'est plus simple que de stresser. 🧾" }
      ]
    }
  },
  {
    title: "Hardware Wallets & Cold Storage",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 85,
    orderIndex: 24,
    content: {
      steps: [
        { type: "info", title: "Sécurité Maximale : La Clé Hors-Ligne", content: "Un hardware wallet (Ledger, Trezor, Coldcard) stocke ta clé privée hors-ligne dans un chip sécurisé. Pour signer une transaction, l'appareil génère la signature EN INTERNE — ta clé ne quitte jamais le device.\n\nNiveaux de sécurité :\n🔴 Exchange (hot) → 🟡 MetaMask (hot) → 🟢 Ledger/Trezor → 🔵 Coldcard (air-gapped)", mindyMessage: "Mt. Gox. FTX. Celsius. Si tu laisses tes crypto sur un exchange, c'est une question de quand, pas si. 📱" },
        { type: "quiz", question: "Que se passe-t-il si ton Ledger est volé ou perdu ?", options: ["Tes crypto sont perdues", "Tu peux récupérer avec ta seed phrase sur un nouveau device", "Ledger SAS peut récupérer tes fonds", "Les fonds sont bloqués 30 jours"], correctIndex: 1, mindyHint: "La seed phrase = accès universel. Device perdu ≠ fonds perdus si tu as ta seed." },
        { type: "swipe", statement: "Il est recommandé de stocker sa seed phrase dans un gestionnaire de mots de passe en ligne.", isCorrect: false, explanation: "JAMAIS en ligne. Seed sur papier ou sur plaque métallique (Cryptosteel), dans un endroit physiquement sécurisé." },
        { type: "swipe", statement: "Un hardware wallet peut être utilisé avec plusieurs applications (MetaMask, Rabby, etc.).", isCorrect: true, explanation: "Le hardware wallet signe les transactions — compatible avec n'importe quelle interface. C'est son rôle." },
        { type: "reorder", title: "Setup sécurisé Ledger", instruction: "Ordre correct pour un setup sécurisé.", words: ["Connecter à MetaMask comme signer", "Commander sur ledger.com uniquement (pas Amazon)", "Générer la seed phrase en mode avion", "Vérifier l'intégrité du packaging", "Sauvegarder la seed phrase hors-ligne"], correctOrder: [1, 3, 2, 4, 0], mindyMessage: "Commander d'occasion ou sur Amazon = risque de compromission. Jamais." },
        { type: "info", title: "Multi-Sig & Stratégies Avancées", content: "Pour les grosses sommes :\n• Multi-signature (multi-sig) : 2/3 clés pour signer = compromission d'une clé ne suffit pas\n• Gnosis Safe : multi-sig smart contract sur Ethereum\n• Air-gapped signing : signer des transactions sur un appareil jamais connecté à internet (Coldcard + PSBT)\n\n→ Si tu as > 50k€ en crypto, multi-sig est non-négociable.", mindyMessage: "50k€+ en crypto avec juste un Ledger ? Un accident de voiture et tout est perdu. Multi-sig. 🔒" }
      ]
    }
  },
  {
    title: "Finance Comportementale",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 90,
    orderIndex: 27,
    content: {
      steps: [
        { type: "info", title: "Pourquoi les Investisseurs Prennent de Mauvaises Décisions", content: "La finance comportementale étudie comment les biais cognitifs et émotionnels influencent nos décisions financières. Ces biais sont universels — même les professionnels n'y échappent pas.\n\nEnnemis principaux :\n• Biais de confirmation : chercher des infos qui confirment nos croyances\n• Loss aversion : la douleur d'une perte est 2x celle du plaisir d'un gain\n• FOMO : Fear Of Missing Out\n• Dunning-Kruger : incompétence inconsciente", mindyMessage: "Tu penses être rationnel en finance ? Daniel Kahneman a prouvé le contraire. Nobel d'économie. 🧠" },
        { type: "quiz", question: "Selon Kahneman & Tversky, perdre 1000€ crée une souffrance équivalente à quel gain ?", options: ["500€", "1000€", "2000€", "5000€"], correctIndex: 2, mindyHint: "Loss aversion = la perte est 2x plus intense que le gain équivalent en termes de ressenti." },
        { type: "swipe", statement: "Vendre immédiatement quand un investissement perd 5% est une décision rationnelle.", isCorrect: false, explanation: "C'est souvent de la loss aversion à l'œuvre. Vendre à -5% puis regarder le rebond à +30%... c'est le scénario classique du retail." },
        { type: "swipe", statement: "L'ancrage (anchoring) pousse à trop se focaliser sur le prix d'achat pour évaluer une position.", isCorrect: true, explanation: "\"J'attends qu'il revienne à mon prix d'achat\" — ancrage classique. Le marché ne connaît pas ton prix d'entrée." },
        { type: "swipe_sequence", title: "Biais ou Bonne Pratique ?", instruction: "Identifie si c'est un biais cognitif ou une bonne pratique.", leftLabel: "Biais cognitif", rightLabel: "Bonne pratique", cards: [
          { id: "dca", content: "DCA régulier peu importe les actualités", correctDirection: "right", explanation: "Discipline systématique qui bypass les émotions" },
          { id: "news", content: "Acheter quand tout le monde est optimiste (CNBC bullish)", correctDirection: "left", explanation: "FOMO + comportement grégaire — souvent le top du marché" },
          { id: "stop", content: "Stop-loss défini avant d'entrer en position", correctDirection: "right", explanation: "Décision froide avant que les émotions s'activent" },
          { id: "revenge", content: "Doubler la mise après une perte pour 'récupérer'", correctDirection: "left", explanation: "Revenge trading — un des chemins les plus rapides vers 0" }
        ], timeLimit: 40, mindyMessage: "Les traders les plus profitables ne sont pas les plus intelligents. Ce sont les plus disciplinés. ⚙️" },
        { type: "info", title: "Système vs Émotion", content: "Comment battre ses biais :\n1. Décisions pré-définies (règles écrites avant) — investit combien, quand, dans quoi\n2. DCA automatique — enlève l'émotion du timing\n3. Journaling de trading — identifier ses patterns émotionnels\n4. Jamais d'action en état de stress ou FOMO\n5. Contre-narratif : quand tout le monde est euphorique = prudence\n\nBerkshire Hathaway a outperformé le marché 50 ans avec une règle simple : ne jamais vendre.", mindyMessage: "Être ennuyeux en finance, c'est ce qui rend riche. Safestreet Buffett l'a prouvé. 🗿" }
      ]
    }
  },
  {
    title: "Politique Monétaire & Marchés",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 28,
    content: {
      steps: [
        { type: "info", title: "La FED et la BCE : Maîtres de l'Économie Mondiale", content: "Les banques centrales contrôlent :\n• Les taux directeurs : le loyer de l'argent\n• La masse monétaire (QE/QT)\n• La stabilité du système financier\n\nFed Funds Rate élevé → emprunter coûte cher → entreprises investissent moins → marchés baissent\nTaux bas → argent abondant → marchés montent → risque d'inflation", mindyMessage: "Jerome Powell tweete pas. Il change ses taux. Et le monde entier tremble. 🏛️" },
        { type: "quiz", question: "Qu'est-ce que le 'Quantitative Easing' (QE) ?", options: ["Une augmentation des taux directeurs", "L'achat massif d'actifs par la banque centrale pour injecter des liquidités", "Une politique de réduction de la masse monétaire", "Un indicateur économique mesurant la croissance"], correctIndex: 1, mindyHint: "QE = la banque centrale 'imprime' de l'argent et achète des obligations. Inject de liquidités." },
        { type: "swipe", statement: "Une hausse de taux de la Fed est généralement négative à court terme pour les actions.", isCorrect: true, explanation: "Taux plus élevés = coût de financement plus élevé pour les entreprises + les obligations deviennent plus attractives que les actions. Rotation des capitaux." },
        { type: "swipe", statement: "L'inflation est toujours mauvaise pour tous les actifs.", isCorrect: false, explanation: "L'immobilier et les matières premières sont généralement de bonnes couvertures contre l'inflation. L'or aussi, historiquement." },
        { type: "quiz", question: "La courbe des taux 'inversée' (taux courts > taux longs) prédit généralement :", options: ["Une forte croissance économique", "Une récession dans les 12-18 mois suivants", "Une baisse de l'inflation", "Un bull market actions"], correctIndex: 1, mindyHint: "Courbe inversée = le marché anticipe une baisse de taux future = anticipation d'une récession." },
        { type: "info", title: "Macro Trading : Lire le Cycle", content: "Les 4 phases du cycle économique :\n1. Expansion : taux bas, croissance forte → actions/crypto performent\n2. Pic : inflation monte, banques centrales relèvent les taux\n3. Contraction (récession) : taux élevés, chômage monte → obligations/cash performent\n4. Reprise : banques centrales baissent les taux → actions repartent\n\n→ Identifier dans quelle phase tu es = adapter ton allocation.", mindyMessage: "2022 : phase 2→3 en accéléré. FED +500bps en 18 mois. Le portefeuille 60/40 a pris -20%. Macro, ça compte. 📉" }
      ]
    }
  },
  {
    title: "Gestion de Portefeuille Avancée",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 125,
    orderIndex: 29,
    content: {
      steps: [
        { type: "info", title: "La Théorie Moderne du Portefeuille", content: "Harry Markowitz (Nobel 1990) : le risque d'un portefeuille ≠ somme des risques individuels. La corrélation entre actifs détermine le risque réel.\n\nFrontière efficiente : pour chaque niveau de risque, il existe un portefeuille qui maximise le rendement attendu.\n\nRatio de Sharpe = (Rendement - Taux sans risque) / Volatilité → mesure le rendement par unité de risque.", mindyMessage: "Diversification = le seul 'free lunch' en finance selon Markowitz. Le reste se paie. 🍽️" },
        { type: "quiz", question: "Deux actifs parfaitement corrélés (corrélation = +1) offrent :", options: ["La meilleure diversification possible", "Aucun bénéfice de diversification", "Une réduction de moitié du risque", "Un rendement double"], correctIndex: 1, mindyHint: "Corrélation +1 = ils bougent exactement pareil. Aucune diversification. Comme avoir deux fois le même actif." },
        { type: "swipe", statement: "Ajouter des actifs non-corrélés à un portefeuille réduit le risque total sans sacrifier le rendement.", isCorrect: true, explanation: "C'est la magie de la diversification. Ajouter de l'or ou du BTC à un portefeuille 60/40 peut réduire la volatilité globale." },
        { type: "swipe", statement: "Le rebalancing régulier d'un portefeuille est une perte de temps.", isCorrect: false, explanation: "Faux — le rebalancing force à 'vendre haut, acheter bas' systématiquement. Annuellement ou lors des déviations > 5% est optimal." },
        { type: "quiz", question: "Quel portefeuille a historiquement eu le meilleur Sharpe ratio ?", options: ["100% actions", "100% obligations", "Portefeuille diversifié multi-actifs", "100% cash"], correctIndex: 2, mindyHint: "La diversification améliore toujours le Sharpe ratio car elle réduit la volatilité plus que le rendement." },
        { type: "info", title: "Allocation par Âge et Objectif", content: "Règle classique : % en actions = 100 - âge\n(À 30 ans : 70% actions, 30% obligations)\n\nModerne (avec crypto) :\n• 30 ans, horizon long : 70% actions (ETF world), 15% immo (SCPI), 10% oblig, 5% BTC\n• 50 ans, approche retraite : 50% actions, 30% obligations, 15% immo, 5% cash\n\nPortefeuille All Weather de Ray Dalio :\n30% actions, 40% obligations LT, 15% oblig MT, 7.5% or, 7.5% matières premières", mindyMessage: "Ray Dalio a géré 150 milliards avec cette allocation. C'est pas un hasard. 🌤️" }
      ]
    }
  },
  {
    title: "Le Private Equity & VC",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 120,
    orderIndex: 30,
    content: {
      steps: [
        { type: "info", title: "Le Capital Non-Coté : L'Autre Monde", content: "Le private equity (PE) investit dans des entreprises NON cotées en bourse.\n\nCatégories :\n• Venture Capital (VC) : startups early stage (pre-seed → série B)\n• Growth Equity : entreprises en croissance (série C+)\n• LBO (Leveraged Buyout) : rachat avec effet de levier\n• Distressed : entreprises en difficulté à racheter au rabais\n\nRetours historiques PE : 15-25%/an (mais illiquide, horizon 7-10 ans)", mindyMessage: "Tout ce que tu connais — Airbnb, Stripe, SpaceX — a été financé par du VC avant l'IPO. 🚀" },
        { type: "quiz", question: "Qu'est-ce qu'un LBO (Leveraged Buyout) ?", options: ["Un investissement en actions cotées avec levier", "Le rachat d'une entreprise principalement financé par de la dette", "Un fonds indiciel à effet de levier", "Une stratégie de couverture de change"], correctIndex: 1, mindyHint: "LBO = acheter une entreprise avec peu d'apport, beaucoup de dette. L'entreprise rembourse elle-même la dette avec ses cash flows." },
        { type: "swipe", statement: "Les investissements PE sont accessibles aux particuliers via des FCPR ou FPCI.", isCorrect: true, explanation: "Oui — depuis quelques années, des véhicules comme les FCPR (accessible dès 10k€ via certaines AV) ouvrent le PE aux particuliers." },
        { type: "swipe", statement: "Le VC investit principalement dans des entreprises matures et rentables.", isCorrect: false, explanation: "Le VC investit dans des startups early stage, souvent non-rentables. Le pari = croissance exponentielle future. 9/10 startups font 0 mais 1 fait 100x." },
        { type: "quiz", question: "Qu'est-ce que la 'J-curve' dans un fonds PE ?", options: ["La courbe de croissance en J d'une startup", "Les pertes initiales du fonds avant les premiers retours positifs", "La forme du bilan d'une LBO", "Un indicateur technique"], correctIndex: 1, mindyHint: "J-curve = d'abord les frais et les investissements avant les retours. En forme de J sur un graphique." },
        { type: "info", title: "Comment Accéder au PE en 2025", content: "Options particuliers :\n• FCPR (Fonds Commun de Placement à Risque) — via AV ou CTO, dès 1000€\n• Crowdfunding equity (WiSeed, Anaxago) — dès 100€, risque maximal\n• ETF PE (Invesco Listed PE ETF) — coté, liquidité quotidienne\n• Secondaries : racheter des parts de fonds déjà engagés (moins de J-curve)\n\nHorizon minimum 7 ans. Illiquidité = prime de rendement.", mindyMessage: "Warren Buffett a commencé comme VC dans les années 60. Le private equity = l'alpha qui reste pour les patients. ⏳" }
      ]
    }
  },
  {
    title: "ETF : Stratégies Avancées",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 90,
    orderIndex: 31,
    content: {
      steps: [
        { type: "info", title: "Au-delà du Simple ETF World", content: "L'univers des ETF est vaste :\n• ETF géographiques : World, US (S&P500), Europe, EM\n• ETF sectoriels : tech, santé, énergie, clean tech\n• ETF obligataires : gouvernements, entreprises, inflation-linked\n• ETF Smart Beta : facteurs value, momentum, quality, low vol\n• ETF thématiques : IA, cybersécurité, robotique\n• ETF synthétiques vs physiques", mindyMessage: "Un ETF pour tout, tout le temps. Sauf les ETF à effet de levier x3. Juste... non. ⚠️" },
        { type: "quiz", question: "Quelle est la différence principale entre un ETF physique et synthétique ?", options: ["Le coût de gestion", "L'ETF physique détient les actifs réels, le synthétique utilise des swaps", "La liquidité quotidienne", "La fiscalité applicable"], correctIndex: 1, mindyHint: "Physique = détient les actions. Synthétique = contrat swap avec une contrepartie. Risque de contrepartie vs tracking error." },
        { type: "swipe", statement: "Le Lyxor MSCI World et le iShares MSCI World donnent la même exposition.", isCorrect: true, explanation: "Oui — même indice MSCI World. Les différences = TER (frais), méthode de réplication, liquidité. Comparer sur justETF.com." },
        { type: "swipe", statement: "Les ETF sectoriels permettent de surpondérer des secteurs spécifiques dans son portefeuille.", isCorrect: true, explanation: "Exactement. Croire que la tech va surperformer ? Ajouter un ETF NASDAQ ou iShares Digitalisation en overlay de ton World." },
        { type: "swipe_sequence", title: "ETF recommandé ou à éviter ?", instruction: "Produit adapté à un investisseur long terme ou à éviter ?", leftLabel: "À éviter", rightLabel: "Recommandé", cards: [
          { id: "world", content: "iShares Core MSCI World (IWDA)", correctDirection: "right", explanation: "Référence absolue. TER 0.2%, 1500 actions, liquide." },
          { id: "lev", content: "Amundi MSCI World Leveraged 2x", correctDirection: "left", explanation: "Décroissance par volatilité = destruction de valeur long terme. Réservé aux traders intraday." },
          { id: "sp500", content: "Amundi S&P500 (PEA éligible)", correctDirection: "right", explanation: "Excellent pour le PEA. Exposition US, TER 0.15%." },
          { id: "cfd", content: "ETF thématique Métaverse/NFT/Crypto", correctDirection: "left", explanation: "Thématique pur = sur-tariffé + timing difficile + souvent créé au sommet de la hype." }
        ], timeLimit: 40, mindyMessage: "Le produit le plus simple est souvent le meilleur. Complexité = frais + risques cachés." },
        { type: "info", title: "Construire un Portefeuille ETF Optimal", content: "Portefeuille simple et efficace :\n\n Core-Satellite :\n• Core (70-80%) : MSCI World ou S&P500 + Eurozone\n• Satellite (20-30%) : ETF obligations, or, immo (REIT), sectoriels\n\nExemple concret :\n• 60% iShares MSCI World (IWDA)\n• 20% iShares Core MSCI EM (EMIM)\n• 10% iShares Euro Govt Bond\n• 10% Amundi Gold\n\nCoût total < 0.25%/an.", mindyMessage: "Ce portefeuille a battu 90% des gérants actifs sur 20 ans. La simplicité gagne. 🏆" }
      ]
    }
  },
  {
    title: "Les Obligations d'État & Corporate",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 85,
    orderIndex: 32,
    content: {
      steps: [
        { type: "info", title: "Prêter de l'Argent aux États et Entreprises", content: "Une obligation = un prêt que tu fais à un emprunteur (État ou entreprise). En échange :\n• Coupons réguliers (intérêts)\n• Remboursement du nominal à l'échéance\n\nNotation : AAA (Allemagne) → BB (High Yield) → CCC (Junk)\nPlus la note est basse → plus le taux est élevé → plus le risque est grand", mindyMessage: "Tu prêtes à la France à 3%. Tu prêtes à une startup à 15%. Comprends pourquoi la différence. 📜" },
        { type: "quiz", question: "Quand les taux d'intérêt montent, le prix des obligations existantes :", options: ["Monte proportionnellement", "Reste stable", "Baisse (relation inverse)", "Double"], correctIndex: 2, mindyHint: "Relation inverse taux/prix. Si les nouveaux bonds payent plus, les anciens valent moins. Logic." },
        { type: "swipe", statement: "Les OAT (Obligations Assimilables du Trésor) sont émises par l'État français.", isCorrect: true, explanation: "Exactement. OAT = dette souveraine française. Taux actuel visible sur le site de l'AFT (Agence France Trésor)." },
        { type: "swipe", statement: "Les obligations high yield ('junk bonds') sont plus sûres que les obligations investment grade.", isCorrect: false, explanation: "C'est l'inverse — high yield = notes BB ou moins = risque de défaut plus élevé = rendement plus élevé. High yield = high risk." },
        { type: "quiz", question: "La 'duration' d'une obligation mesure :", options: ["La durée de vie totale de l'obligation", "La sensibilité du prix aux variations de taux", "Le volume d'émission", "Le taux de coupon annuel"], correctIndex: 1, mindyHint: "Duration longue = très sensible aux taux. Une obligation 30 ans réagit beaucoup plus qu'une obligation 2 ans." },
        { type: "info", title: "Place des Obligations dans un Portefeuille", content: "Rôles des obligations :\n✅ Stabilisateur : moins volatile que les actions\n✅ Couverture en récession : flux de revenus prévisibles\n✅ Diversification : corrélation négative avec les actions (souvent)\n\nAllocation typique :\n• Jeune investisseur : 10-20% obligations\n• Retraité : 40-60% obligations\n\n→ Fuyez les fonds obligataires à frais élevés. Préférez ETF (Vanguard Global Bond, iShares Euro Govt Bond).", mindyMessage: "En 2022, obligations ET actions ont baissé en même temps. La corrélation négative n'est pas garantie. Diversifiez aussi vos stratégies. 📊" }
      ]
    }
  },
  {
    title: "Créer et Gérer son Budget",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 65,
    orderIndex: 33,
    content: {
      steps: [
        { type: "info", title: "Le Budget : L'Arme #1 de l'Indépendance Financière", content: "Sans budget, pas de richesse. Le budget = connaître exactement où va ton argent pour décider où il doit aller.\n\nMéthodes :\n• 50/30/20 : besoin/envies/épargne (vu en leçon précédente)\n• Zero-based budgeting : chaque euro a un rôle défini\n• Pay yourself first : épargner EN PREMIER avant les dépenses\n• Envelope method : enveloppes par catégorie", mindyMessage: "Les millionnaires ne deviennent pas riches par accident. Ils savent où va chaque euro. 💶" },
        { type: "quiz", question: "La méthode 'Pay Yourself First' consiste à :", options: ["Se payer un salaire avant ses impôts", "Virer l'épargne automatiquement dès le salaire reçu", "Dépenser d'abord les plaisirs avant les nécessités", "Maximiser ses revenus avant d'épargner"], correctIndex: 1, mindyHint: "Épargner AVANT de dépenser. Virement automatique le jour du salaire. Le reste = tu peux le dépenser sans culpabilité." },
        { type: "swipe", statement: "Un budget devrait être identique chaque mois pour être efficace.", isCorrect: false, explanation: "Non — un budget doit s'adapter aux réalités (vacances, impôts, réparations). La clé = une revue mensuelle et des ajustements réguliers." },
        { type: "swipe", statement: "Les petites dépenses récurrentes (abonnements, café, livraisons) peuvent représenter des centaines d'euros par mois sans qu'on le réalise.", isCorrect: true, explanation: "Netflix, Spotify, Amazon Prime, Deliveroo, Uber... 10€ par-ci, 15€ par-là = 200-400€/mois facilement. L'effet latte factor." },
        { type: "swipe_sequence", title: "Bonne ou Mauvaise Habitude Budgétaire ?", instruction: "Identifie les bonnes pratiques.", leftLabel: "❌ À éviter", rightLabel: "✅ Bonne pratique", cards: [
          { id: "auto", content: "Virement automatique épargne le jour de paie", correctDirection: "right", explanation: "Pay yourself first — automatiser l'épargne la rend non-négociable" },
          { id: "credit", content: "Payer ses courses avec carte de crédit sans rembourser le mois", correctDirection: "left", explanation: "Intérêts revolving = 15-20%/an. La dette consommation est toxique" },
          { id: "review", content: "Revue mensuelle de tous les abonnements", correctDirection: "right", explanation: "Couper ce qu'on n'utilise plus = retour immédiat sans effort" },
          { id: "emo", content: "Shopping émotionnel lors de stress", correctDirection: "left", explanation: "Dépenses émotionnelles = ennemies du budget. Règle : 24h de réflexion avant tout achat > 50€" }
        ], timeLimit: 35, mindyMessage: "Automatise tout ce qui est bon. Friction max sur tout ce qui est mauvais. 🤖" },
        { type: "info", title: "L'Effet Composé du Budget", content: "Économiser 200€/mois investi à 7%/an (ETF World) :\n• 10 ans : ~34,000€\n• 20 ans : ~104,000€\n• 30 ans : ~243,000€\n\nLa même somme sous le matelas (0%) :\n• 30 ans : 72,000€\n\nDifférence : +171,000€ générés par les intérêts composés.\n\n→ Ce n'est pas combien tu gagnes. C'est combien tu investis et depuis quand.", mindyMessage: "241,000 vs 72,000. La différence ? Juste un virement automatique vers un ETF. 🤯" }
      ]
    }
  },
  {
    title: "Comprendre les Taux d'Intérêt",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 70,
    orderIndex: 34,
    content: {
      steps: [
        { type: "info", title: "Le Prix de l'Argent", content: "Le taux d'intérêt = le prix que tu paies pour emprunter de l'argent (ou reçois pour en prêter).\n\nTypes principaux :\n• Taux fixe : stable toute la durée du prêt\n• Taux variable : évolue avec un indice (Euribor)\n• TAEG : Taux Annuel Effectif Global — le vrai coût total d'un crédit\n• APY : Annual Percentage Yield — rendement avec capitalisation", mindyMessage: "Les banques empruntent à 3% et te prêtent à 20% sur ta carte crédit. Maintenant tu comprends leur modèle. 🏦" },
        { type: "quiz", question: "Sur un prêt immobilier de 200,000€ à 3% sur 20 ans, combien paies-tu au total ?", options: ["200,000€", "~266,000€", "~400,000€", "~220,000€"], correctIndex: 1, mindyHint: "Amortissement + intérêts. Sur 20 ans à 3%, tu paies environ 66,000€ d'intérêts en plus du capital." },
        { type: "swipe", statement: "Un TAEG de 21% sur une carte de crédit revolving est parfaitement normal en France.", isCorrect: true, explanation: "Oui — légal mais extrêmement coûteux. 1000€ à 21% revolving pendant 1 an = 210€ d'intérêts. La dette consommation est un piège." },
        { type: "swipe", statement: "Rembourser un crédit par anticipation coûte toujours moins cher que le laisser courir.", isCorrect: true, explanation: "Généralement vrai — les pénalités de remboursement anticipé sont plafonnées à 3% ou 6 mois d'intérêts selon le type de crédit." },
        { type: "quiz", question: "L'effet d'un taux compound (composé) vs simple sur 10 ans à 10% sur 1000€ :", options: ["Simple : 2593€ / Composé : 2000€", "Simple : 2000€ / Composé : 2594€", "Les deux donnent le même résultat", "Simple : 1100€ / Composé : 1100€"], correctIndex: 1, mindyHint: "Composé = les intérêts génèrent des intérêts. Simple = seulement sur le capital initial." },
        { type: "info", title: "Utiliser les Taux à son Avantage", content: "Quand les taux sont HAUTS :\n✅ Livret A, fonds euros AV, obligations à taux fixe = attractifs\n❌ Emprunter est coûteux\n\nQuand les taux sont BAS :\n✅ Emprunter pour investir (immo avec levier) = optimal\n❌ L'épargne sécurisée ne rapporte rien\n\nCrédits à FUIR :\n• Crédit revolving (carte crédit, Cetelem) : 15-25%\n• Micro-crédit : jusqu'à 21%\n\nCrédits acceptables :\n• Prêt immo : 3-4% actuellement\n• Crédit auto : 4-7%", mindyMessage: "L'argent a un prix. Sache quand le payer et quand l'éviter. 💡" }
      ]
    }
  },
  {
    title: "Comprendre les Marchés Dérivés",
    domain: "FINANCE",
    difficulty: "ADVANCED",
    xpReward: 110,
    orderIndex: 35,
    content: {
      steps: [
        { type: "info", title: "Les Produits Dérivés : Instruments de Couverture et Spéculation", content: "Le marché des dérivés représente plus de 1 quadrillion de dollars en notionnel (plus que le PIB mondial combiné x10).\n\nFonction principale : transfert du risque.\nUn agriculteur vend des futures blé pour se couvrir contre la baisse des prix.\nUne compagnie aérienne achète des calls pétrole pour se couvrir contre la hausse.\n\nInstruments : Options, Futures, Forwards, Swaps, Warrants, CFDs", mindyMessage: "1 quadrillion. C'est 1000 fois le PIB mondial. Le marché des dérivés est le vrai moteur de la finance. 💥" },
        { type: "quiz", question: "Qu'est-ce qu'un 'swap de taux d'intérêt' (IRS) ?", options: ["Un échange de devises entre banques", "Un contrat échangeant des flux à taux fixe contre des flux à taux variable", "Un dérivé sur actions technologiques", "Un produit de taux pour particuliers"], correctIndex: 1, mindyHint: "IRS = une partie paie taux fixe, l'autre paie taux variable. Permet de gérer l'exposition aux taux." },
        { type: "swipe", statement: "Les futures sont des contrats standardisés négociés sur des marchés organisés.", isCorrect: true, explanation: "Oui — contrairement aux forwards (OTC, sur-mesure), les futures sont standardisés (taille, échéance) et compensés par une chambre de compensation." },
        { type: "swipe", statement: "Les CFDs permettent de prendre des positions longues et courtes sur pratiquement n'importe quel actif.", isCorrect: true, explanation: "C'est précisément leur utilité — et leur danger. AMF : 75% des comptes CFD perdent de l'argent. Les stats sont très claires." },
        { type: "quiz", question: "Qu'est-ce que le 'Greeks' Vega mesure dans les options ?", options: ["La sensibilité au temps qui passe", "La sensibilité à la volatilité implicite", "La sensibilité aux variations de prix du sous-jacent", "La sensibilité aux dividendes"], correctIndex: 1, mindyHint: "Vega = volatilité. Quand la vol implicite monte, les primes d'options augmentent. Vega mesure ça." },
        { type: "info", title: "Utilisation Responsable des Dérivés", content: "Utilisations légitimes :\n✅ Couverture de portefeuille : acheter des puts pour protéger sa position\n✅ Génération de revenus : vendre des covered calls sur ses actions\n✅ Arbitrage institutionnel\n\nUtilisations dangereuses :\n❌ Spéculation nue sans gestion du risque\n❌ Effet de levier excessif (CFDs x30)\n❌ 'Récupérer' des pertes avec des dérivés\n\n→ Règle : ne jamais engager plus que tu ne peux perdre. Les dérivés amplifient tout.", mindyMessage: "Les dérivés sont comme le feu. Contrôlé = chaleur et lumière. Incontrôlé = tout brûle. 🔥" }
      ]
    }
  },
  {
    title: "L'Or & Les Matières Premières",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 85,
    orderIndex: 36,
    content: {
      steps: [
        { type: "info", title: "Les Actifs Réels : Couverture Contre l'Inflation", content: "Les matières premières (commodities) sont des actifs physiques :\n• Métaux précieux : Or, Argent, Platine\n• Énergie : Pétrole (WTI, Brent), Gaz naturel\n• Agricoles : Blé, Maïs, Soja\n• Métaux industriels : Cuivre, Aluminium\n\nL'or est la valeur refuge historique : 5000 ans de track record en tant que réserve de valeur.", mindyMessage: "L'or n'a pas de rendement, pas de dividende. Mais 1 once en 1920 achetait un bon costume. Idem aujourd'hui. 🥇" },
        { type: "quiz", question: "Quelle est la corrélation historique entre l'or et le dollar américain ?", options: ["Fortement positive", "Négative (quand $ monte, or baisse)", "Nulle", "Variable selon les cycles"], correctIndex: 1, mindyHint: "Or = actif de couverture contre le dollar. Dollar fort = or moins attractif. Dollar faible = or monte." },
        { type: "swipe", statement: "Investir dans un ETF or physique (ETC) est plus pratique que détenir des pièces physiques.", isCorrect: true, explanation: "Oui — ETC or comme iShares Physical Gold (IGLN) détient de l'or physique, stocké en coffre. Pas de stockage personnel, frais faibles (0.12%/an)." },
        { type: "swipe", statement: "Le cuivre est un bon indicateur de la santé économique mondiale ('Doctor Copper').", isCorrect: true, explanation: "Le cuivre est dans absolument tout (construction, électronique, véhicules). Sa demande reflète l'activité économique mondiale. Indicateur avancé utilisé par les macro traders." },
        { type: "quiz", question: "Comment s'expose-t-on aux matières premières sans les détenir physiquement ?", options: ["Uniquement via le marché physique (livraison)", "Via ETF/ETC, futures, actions de producteurs (mining, pétrolières)", "Via les banques centrales uniquement", "Impossible sans avoir un entrepôt"], correctIndex: 1, mindyHint: "ETF/ETC = voie la plus simple. Actions de mineurs (Barrick pour l'or) = levier sur le prix + risque entreprise." },
        { type: "info", title: "Allocation Matières Premières", content: "Place dans un portefeuille :\n• Or : 5-10% (couverture inflation, dollar, crise)\n• Autres commodities : 0-5% (diversification, macro play)\n\nVéhicules recommandés :\n• iShares Physical Gold (IGLN) : or physique ETF\n• Invesco Bloomberg Commodity UCITS ETF : panier diversifié\n• Actions minières (Newmont, Barrick) : amplification avec risque entreprise\n\nÀ éviter : ETF leveraged commodities, contango sur futures (roulage coûteux).", mindyMessage: "L'or n'est pas un investissement, c'est une assurance. On l'espère inutile, mais on est content de l'avoir quand ça craint. 🛡️" }
      ]
    }
  },
  {
    title: "Bourse : Ouvrir son Premier Compte",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 65,
    orderIndex: 37,
    content: {
      steps: [
        { type: "info", title: "Par Où Commencer ?", content: "Pour investir en bourse, tu as besoin :\n1. D'un courtier (intermédiaire entre toi et la bourse)\n2. D'un compte (PEA ou CTO selon ta stratégie)\n3. D'un capital initial (dès 1€ sur certaines plateformes)\n\nCourtiers recommandés en France :\n• Trade Republic : 0 frais de courtage, dès 1€, PEA + CTO\n• Degiro : frais ultra-bas, accès marchés mondiaux\n• Fortuneo : interface française, PEA solide\n• Boursorama Bourse : combinable avec banque en ligne", mindyMessage: "Boursorama, Trade Republic, ou Degiro. Aucun ne te rend riche automatiquement. C'est toi qui fais le travail. 💪" },
        { type: "quiz", question: "Sur Trade Republic, investir 50€/mois en ETF World coûte combien en frais ?", options: ["5€", "1€ fixe par ordre", "0€ (gratuit)", "0.5%"], correctIndex: 2, mindyHint: "Trade Republic = 0 frais de courtage sur les plans d'investissement automatiques. Révolutionnaire." },
        { type: "swipe", statement: "Il faut au minimum 10,000€ pour commencer à investir en bourse.", isCorrect: false, explanation: "Faux — Trade Republic permet d'investir dès 1€ en fractions d'actions. Le capital initial n'est pas une barrière en 2025." },
        { type: "swipe", statement: "Un courtier agréé AMF offre une protection des dépôts jusqu'à 70,000€ par l'État.", isCorrect: true, explanation: "Oui — SIAP (Système d'Indemnisation des Actionnaires et Porteurs de titres) protège jusqu'à 70,000€ en cas de défaillance du courtier." },
        { type: "reorder", title: "Étapes pour Ouvrir son PEA", instruction: "Dans l'ordre.", words: ["Virer le capital initial", "Choisir ses ETF et passer les ordres", "Comparer les courtiers (frais, interface)", "Ouvrir le PEA en ligne (pièce d'identité + RIB)", "Valider KYC / vérification d'identité"], correctOrder: [2, 3, 4, 0, 1], mindyMessage: "Tout se fait en ligne en moins d'une heure. Plus d'excuse." },
        { type: "info", title: "Tes 3 Premiers Ordres", content: "Premier investissement recommandé :\n\n1. Ouvrir PEA chez Trade Republic ou Fortuneo\n2. Acheter ETF Amundi MSCI World PEA (CW8) ou iShares S&P500 PEA (500)\n3. Mettre en place un plan d'investissement automatique mensuel\n\n→ Ne pas checker le portefeuille chaque jour. L'oubli est une stratégie gagnante.\n\nThomas Stanley (The Millionaire Next Door) : la plupart des millionnaires investissent régulièrement dans des fonds indiciels et n'en parlent jamais.", mindyMessage: "Premier ordre passé = tu es dans les top 5% de ta génération en matière de finance personnelle. Sérieusement. 🎉" }
      ]
    }
  },
  {
    title: "S'Enrichir à 20 Ans : Le Plan",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 80,
    orderIndex: 38,
    content: { steps: [
      { type: "info", title: "L'Arme Secrète : Commencer Tôt", content: "Investis 200€/mois de 20 à 60 ans à 8%/an : 698 000€\nInvestis 200€/mois de 30 à 60 ans à 8%/an : 298 000€\n\nDifférence : +400 000€ pour exactement les mêmes efforts. La seule variable : 10 ans de plus.", mindyMessage: "400 000€ de différence pour avoir commencé 10 ans plus tôt. L'intérêt composé punit ceux qui attendent. 📈" },
      { type: "quiz", question: "À 20 ans, tu investis 100€/mois à 7%/an pendant 40 ans. Tu obtiens environ :", options: ["48 000€", "113 000€", "262 000€", "65 000€"], correctIndex: 2, mindyHint: "Intérêts composés sur 40 ans à 7% ≈ 262 000€. La magie du temps." },
      { type: "swipe", statement: "Un jeune de 20 ans devrait avoir une allocation plus agressive en actions qu'une personne de 55 ans.", isCorrect: true, explanation: "Horizon long = temps de récupérer les creux. Plus jeune = plus de risque acceptable. Le temps est l'actif le plus précieux." },
      { type: "swipe", statement: "Il faut attendre un salaire confortable pour commencer à investir.", isCorrect: false, explanation: "Faux — même 50€/mois à 20 ans bat 500€/mois à 30 ans grâce à l'effet composé. Régularité > montant." },
      { type: "reorder", title: "Priorités finances à 20 ans", instruction: "Du plus urgent au moins urgent.", words: ["Investir en ETF/PEA", "Épargne de précaution (3-6 mois)", "Augmenter ses revenus (skills, side project)", "Ouvrir un Livret A", "Rembourser les dettes à taux élevé"], correctOrder: [2, 4, 3, 1, 0], mindyMessage: "Skills d'abord. Les compétences génèrent plus de ROI que n'importe quel ETF au début." },
      { type: "info", title: "Le Plan Concret à 20 Ans", content: "Mois 1 : Ouvrir Livret A + PEA\nMois 2 : Rembourser toute dette > 5%\nMois 3 : Définir ton taux d'épargne cible (min 20%)\nEnsuite : Virement automatique ETF World le jour de paie\n\nPortefeuille simple : 80% ETF MSCI World, 20% cash/oblig.\n→ Set it and forget it.", mindyMessage: "20 ans. Un PEA. Un ETF. Un virement auto. C'est tout ce qu'il faut pour être dans le top 10% financièrement. 🎯" }
    ]}
  },
  {
    title: "Comprendre l'Inflation",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 70,
    orderIndex: 39,
    content: { steps: [
      { type: "info", title: "Pourquoi Ton Argent Vaut Moins Chaque Année", content: "L'inflation = augmentation générale et durable des prix. La BCE vise 2%/an. En 2022-2023 : 9-10% en Europe. 1000€ non investis = -20€ de valeur réelle chaque année à 2%.", mindyMessage: "L'inflation est un impôt silencieux sur ceux qui gardent du cash. 💸" },
      { type: "quiz", question: "Ton Livret A rapporte 3%, l'inflation est à 5%. Ton pouvoir d'achat :", options: ["Augmente de 3%", "Est maintenu", "Diminue de 2%", "Augmente de 8%"], correctIndex: 2, mindyHint: "Rendement réel = 3% - 5% = -2%. Tu t'appauvris quand même." },
      { type: "swipe", statement: "Les actions sont historiquement une bonne couverture contre l'inflation sur le long terme.", isCorrect: true, explanation: "Les entreprises répercutent l'inflation sur leurs prix. S&P 500 : ~10%/an nominal, ~7% réel. Bat l'inflation largement." },
      { type: "swipe", statement: "Les obligations à taux fixe sont une excellente protection contre l'inflation.", isCorrect: false, explanation: "C'est l'inverse. 2022 : obligations -20% pendant une inflation à 9%. Le taux fixe devient négatif en termes réels." },
      { type: "swipe_sequence", title: "Protège ou non contre l'inflation ?", instruction: "Swipe DROITE si l'actif protège, GAUCHE s'il est vulnérable.", leftLabel: "Vulnérable", rightLabel: "Protection", cards: [
        { id: "etf", content: "ETF World (actions)", correctDirection: "right", explanation: "+7%/an réel historiquement" },
        { id: "cash", content: "Cash sous le matelas", correctDirection: "left", explanation: "-2%/an réel en période normale" },
        { id: "immo", content: "Immobilier", correctDirection: "right", explanation: "Loyers et prix s'ajustent à l'inflation" },
        { id: "oblig", content: "Obligation taux fixe 20 ans", correctDirection: "left", explanation: "Taux figé — si inflation monte, taux réel devient négatif" }
      ], timeLimit: 35, mindyMessage: "Cash = perdant garanti contre l'inflation. Les actifs réels = gagnants sur la durée." },
      { type: "info", title: "Stratégie Anti-Inflation", content: "Ce que font les gens qui comprennent l'inflation :\n1. Garde 3-6 mois de charges en cash (sécurité)\n2. Investit le reste : actions, immo, SCPI, or\n3. Rembourse la dette à taux variable\n4. Renégocie son salaire à l'inflation chaque année\n\n→ L'inflation punit l'inaction. Elle récompense les actifs réels.", mindyMessage: "L'inflation est une taxe sur les paresseux financiers. Maintenant tu sais quoi faire. 🛡️" }
    ]}
  },
  {
    title: "Indépendance Financière : Le FIRE",
    domain: "FINANCE",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 40,
    content: { steps: [
      { type: "info", title: "Financial Independence, Retire Early", content: "Le FIRE = atteindre l'indépendance financière pour arrêter de travailler PAR OBLIGATION.\n\nLa règle des 4% (étude Trinity 1998) :\nSi ton patrimoine investi = X, tu peux retirer 4%/an indéfiniment.\nObjectif FIRE = 25x tes dépenses annuelles.\n\n30k€/an de dépenses → besoin 750k€ investis.", mindyMessage: "Arrêter de travailler par obligation à 40 ans. Pas pour ne rien faire. Pour faire ce que tu veux. C'est ça le FIRE. 🔥" },
      { type: "quiz", question: "Pour vivre avec 40 000€/an selon la règle des 4%, il faut :", options: ["400 000€", "1 000 000€", "2 000 000€", "160 000€"], correctIndex: 1, mindyHint: "40 000 / 0.04 = 1 000 000€. Règle des 4% = 25x les dépenses annuelles." },
      { type: "swipe", statement: "La règle des 4% est basée sur des études historiques des marchés sur 30 ans.", isCorrect: true, explanation: "Étude Trinity (1998) : sur 30 ans, 4%/an a survécu à tous les scénarios historiques avec 50% actions / 50% obligations." },
      { type: "swipe", statement: "Pour atteindre le FIRE, il faut être dans une profession ultra-lucrative.", isCorrect: false, explanation: "Non — le FIRE est accessible avec un taux d'épargne élevé. Épargner 60% de son salaire = FIRE possible en 12-15 ans, peu importe le salaire." },
      { type: "quiz", question: "Taux d'épargne 50% → FIRE dans combien d'années environ ?", options: ["5 ans", "17 ans", "30 ans", "40 ans"], correctIndex: 1, mindyHint: "50% d'épargne investi à ~7%/an → ~17 ans selon les calculateurs FIRE standards." },
      { type: "info", title: "Calculer Ton Numéro FIRE", content: "Lean FIRE (frugal, 25k€/an) → 625k€\nFat FIRE (confort, 80k€/an) → 2M€\nBarista FIRE (mi-temps + revenus passifs) → entre les deux\n\nTon taux d'épargne → années pour le FIRE :\n• 10% → ~40 ans\n• 25% → ~30 ans\n• 50% → ~17 ans\n• 70% → ~8 ans\n\n→ Chaque % d'épargne supplémentaire = liberté plus tôt.", mindyMessage: "Ton taux d'épargne est l'indicateur #1 de ta liberté future. Pas ton salaire. 🧮" }
    ]}
  },
  {
    title: "Credit Score & Dossier de Prêt",
    domain: "FINANCE",
    difficulty: "BEGINNER",
    xpReward: 65,
    orderIndex: 41,
    content: { steps: [
      { type: "info", title: "Comment les Banques Te Notent", content: "En France, pas de credit score officiel mais les banques t'évaluent en interne :\n• Stabilité revenus (CDI > CDD > intérim)\n• Taux d'endettement (< 35% obligatoire depuis le HCSF)\n• Historique bancaire (incidents = red flag)\n• Apport personnel\n• Épargne visible", mindyMessage: "Les banques ne prêtent pas par gentillesse. Elles calculent un score. Comprendre leurs critères = les jouer. 📊" },
      { type: "quiz", question: "Le taux d'endettement maximum accepté par les banques françaises est :", options: ["20%", "35%", "50%", "70%"], correctIndex: 1, mindyHint: "35% = règle du HCSF depuis 2022. Charges fixes / revenus nets ≤ 35%." },
      { type: "swipe", statement: "Avoir plusieurs crédits conso en cours améliore ton dossier de prêt immobilier.", isCorrect: false, explanation: "Faux — chaque crédit augmente ton taux d'endettement. Un crédit auto peut bloquer un prêt immo si le seuil 35% est dépassé." },
      { type: "swipe", statement: "Rembourser ses crédits conso avant une demande de prêt immo est une bonne stratégie.", isCorrect: true, explanation: "Oui — réduire tes charges mensuelles existantes augmente ta capacité d'emprunt immobilier directement." },
      { type: "reorder", title: "Optimiser son dossier (6 mois avant)", instruction: "Dans l'ordre de priorité.", words: ["Constituer l'apport (10-20% minimum)", "Zéro incident bancaire sur 3 mois", "Épargne visible et croissante", "Rembourser les crédits conso si possible", "Ne pas changer de banque juste avant"], correctOrder: [1, 2, 3, 0, 4], mindyMessage: "Un bon dossier de crédit se prépare comme un entretien. 12-24 mois à l'avance. 💼" },
      { type: "info", title: "La Capacité d'Emprunt : Le Calcul", content: "Formule banque :\nCapacité mensuelle = (Revenus nets × 35%) - charges fixes existantes\n\nEx : 3000€ nets × 35% = 1050€ max de mensualité\nSi crédit auto : 300€/mois → capacité immo = 750€/mois\n\n→ Rembourser le crédit auto avant la demande immo = +300€/mois de capacité = ~50 000€ d'emprunt supplémentaire.", mindyMessage: "50 000€ d'emprunt en plus juste en remboursant ton crédit auto d'abord. Passe le mot. 🏠" },
      { type: "scenario", situation: "Tu veux acheter un appartement à 250 000€. Tu gagnes 2 800€ nets/mois, tu as 20 000€ d'apport, et un crédit auto de 200€/mois qui se termine dans 8 mois. La banque te refuse le prêt. Que fais-tu ?", choices: [{ text: "J'emprunte à une autre banque immédiatement", isGood: false, explanation: "Mauvaise idée — chaque demande refusée laisse une trace. Mieux vaut optimiser ton dossier d'abord." }, { text: "J'attends 8 mois que le crédit auto soit fini, j'augmente mon apport, et je re-dépose", isGood: true, explanation: "En 8 mois : fin du crédit auto (+200€/mois de capacité), apport augmenté, historique bancaire propre. Ton dossier passe de moyen à excellent." }, { text: "Je négocie directement avec le vendeur pour baisser le prix", isGood: false, explanation: "Le prix de vente n'est pas le problème — c'est ta capacité d'emprunt. Même à prix réduit, la banque évalue tes revenus vs charges." }], mindyMessage: "Un refus n'est pas définitif. C'est un signal que ton dossier n'est pas optimisé. Reviens plus fort. 💪" },
      { type: "match_pairs", pairs: [{ term: "Taux d'endettement", definition: "Maximum 35% des revenus nets (règle HCSF)" }, { term: "Apport personnel", definition: "10-20% du prix du bien, idéalement" }, { term: "Durée d'emprunt", definition: "25 ans maximum (règle HCSF 2022)" }, { term: "Taux nominal", definition: "Le taux d'intérêt du prêt hors assurance et frais" }], mindyMessage: "Ces 4 termes = le vocabulaire minimum pour parler à ton banquier sans te faire avoir. 🏦" }
    ]}
  }
];

// ─── TRADING DOMAIN LESSONS ──────────────────────────────────────────────────
const tradingLessons = [
  {
    title: "Lire un Chandelier Japonais",
    domain: "TRADING",
    difficulty: "BEGINNER",
    xpReward: 80,
    orderIndex: 1,
    content: {
      steps: [
        { type: "info", title: "L'Écriture du Marché", content: "Les chandeliers japonais (candlesticks) ont été inventés par Munehisa Honma au XVIIIe siècle pour trader le riz. Aujourd'hui, ils sont le langage universel du trading.\n\nChaque chandelier représente une période (1m, 5m, 1h, 1j...) et contient 4 données :\n• Open (ouverture)\n• High (plus haut)\n• Low (plus bas)\n• Close (clôture)\n\nChandelier vert = clôture > ouverture (haussier)\nChandelier rouge = clôture < ouverture (baissier)", mindyMessage: "Un trader qui ne sait pas lire un chandelier, c'est comme un pilote qui ne sait pas lire ses instruments. On va pas loin. 📊" },
        { type: "fill_blank", sentence: "Un chandelier ___ signifie que le prix a clôturé PLUS HAUT que son ouverture.", answer: "vert", choices: ["rouge", "vert", "noir", "blanc"], mindyMessage: "Vert = haussier. Rouge = baissier. La base absolue. 📊" },
        { type: "swipe", statement: "Un Doji est un chandelier dont le corps est quasi-inexistant : open ≈ close.", isCorrect: true, explanation: "Exact — le Doji traduit l'indécision du marché. Les acheteurs et vendeurs sont à égalité. Souvent signe de retournement imminent." },
        { type: "swipe", statement: "La mèche haute d'un chandelier indique le prix d'ouverture.", isCorrect: false, explanation: "Non — la mèche haute (upper shadow) indique le plus haut de la période (High). Le corps représente l'open/close." },
        { type: "scenario", situation: "Tu vois un Doji apparaître après 5 chandeliers rouges consécutifs. Que fais-tu ?", choices: [{ text: "J'achète immédiatement — le Doji = signal d'achat", isGood: false, explanation: "Dangereux — le Doji indique l'indécision, pas un signal d'achat. Tu dois attendre le chandelier SUIVANT pour confirmer." }, { text: "J'attends le prochain chandelier pour confirmation", isGood: true, explanation: "Correct — un chandelier vert après le Doji confirme l'inversion. Sans confirmation, c'est du gambling." }, { text: "J'ignore, un Doji n'a pas de signification", isGood: false, explanation: "Faux — le Doji après une tendance est un signal d'alerte important. L'indécision après une baisse = les vendeurs s'épuisent." }], mindyMessage: "Un Doji sans confirmation = piège. Attends toujours le chandelier suivant. ⏳" },
        { type: "info", title: "Les 5 Patterns Clés à Retenir", content: "📌 Patterns de base à reconnaître :\n\n🟢 Marubozu vert : long corps vert sans mèches = acheteurs dominants\n🔴 Marubozu rouge : long corps rouge sans mèches = vendeurs dominants\n⚪ Doji : corps minuscule = indécision\n🔨 Hammer : corps haut + longue mèche basse = rebond potentiel\n⭐ Shooting Star : corps bas + longue mèche haute = retournement baissier\n\nRègle : toujours confirmer avec le chandelier suivant et le volume.", mindyMessage: "Les chandeliers sont ton vocabulaire de trading. Commence par ces 5, tu peux déjà lire l'essentiel du marché. 🕯️" },
        { type: "news_impact", headline: "La SEC approuve le premier ETF Bitcoin Spot aux États-Unis", source: "Bloomberg", date: "2024-01-10", correctImpact: "bullish", explanation: "L'approbation d'un ETF spot ouvre Bitcoin aux investisseurs institutionnels via Wall Street. Ça signifie des milliards de dollars potentiels entrant sur le marché — signal extrêmement bullish.", mindyMessage: "Quand Wall Street arrive, les prix suivent. L'ETF = la porte d'entrée pour les gros. 🏦" },
        { type: "flashcard", front: "Doji", back: "Chandelier dont l'ouverture et la clôture sont quasi identiques. Signale l'indécision du marché et un possible retournement de tendance.", category: "Trading" },
        { type: "price_prediction", question: "Un Doji apparaît après une longue tendance baissière. Analyse le pattern et prédit le mouvement suivant.", candles: [{ open: 52000, high: 52500, low: 50800, close: 51000 }, { open: 51000, high: 51200, low: 49500, close: 49800 }, { open: 49800, high: 50100, low: 48200, close: 48500 }, { open: 48500, high: 48800, low: 47000, close: 47200 }, { open: 47200, high: 47500, low: 46000, close: 46300 }, { open: 46300, high: 46800, low: 45500, close: 45700 }, { open: 45700, high: 46100, low: 45200, close: 45300 }, { open: 45300, high: 45500, low: 44800, close: 45300 }], correctAnswer: "up", explanation: "Le dernier chandelier est un Doji (open ≈ close) après une série baissière. Cela indique l'épuisement des vendeurs et une indécision du marché. Historiquement, un Doji en fin de tendance baissière précède souvent un retournement haussier.", mindyMessage: "Doji après une baisse = les vendeurs s'essoufflent. Signal de retournement potentiel. 🕯️" },
        { type: "match_pairs", pairs: [{ term: "Marubozu", definition: "Long corps sans mèches — domination totale acheteurs/vendeurs" }, { term: "Hammer", definition: "Petit corps en haut + longue mèche basse — rebond potentiel" }, { term: "Shooting Star", definition: "Petit corps en bas + longue mèche haute — retournement baissier" }, { term: "Engulfing", definition: "Chandelier qui 'avale' le précédent — signal de retournement" }], mindyMessage: "4 patterns. 80% des signaux de chandelier. Apprends ceux-là et tu lis le marché. 📊" }
      ]
    }
  },
  {
    title: "Supports, Résistances & Zones Clés",
    domain: "TRADING",
    difficulty: "BEGINNER",
    xpReward: 85,
    orderIndex: 2,
    content: {
      steps: [
        { type: "info", title: "Le Sol et le Plafond du Prix", content: "Les supports et résistances sont les concepts les plus fondamentaux de l'analyse technique.\n\n📍 Support : niveau de prix où la demande stoppe la baisse. Le prix 'rebondit' dessus.\n📍 Résistance : niveau où l'offre stoppe la hausse. Le prix 'casse' ou 'rebondit' dessus.\n\nPourquoi ça marche ? La psychologie humaine. Les traders mémorisent les niveaux importants (ronds, ATH, ATL) et réagissent de la même façon → prophétie auto-réalisatrice.", mindyMessage: "Un support, c'est comme un plancher. Une résistance, comme un plafond. Simple mais redoutablement efficace. 🏠" },
        { type: "swipe", statement: "Quand une résistance est cassée à la hausse, elle devient un nouveau support.", isCorrect: true, explanation: "C'est l'un des principes clés : retournement de polarité. Ex : Bitcoin casse 30k$ → 30k$ devient support. Les anciens vendeurs deviennent acheteurs." },
        { type: "scenario", situation: "BTC approche un support clé à 40 000$ (testé 5 fois). Le prix est à 40 200$. Que fais-tu ?", choices: [{ text: "J'achète maintenant avant qu'il touche le support", isGood: false, explanation: "Risqué — on n'achète pas 'avant' le support. On attend la réaction du prix au niveau pour confirmer qu'il tient." }, { text: "J'attends que le prix touche le support et montre une réaction haussière", isGood: true, explanation: "Stratégie propre — tu attends la confirmation. Un chandelier de retournement au support = setup de qualité." }, { text: "Je short (vends à découvert) en espérant que le support casse", isGood: false, explanation: "Contrariant sans raison. Un support testé 5 fois est fort. Short contre un support fort = probabilités défavorables." }], mindyMessage: "On trade CE QUI SE PASSE, pas ce qu'on imagine. Attends la réaction. 🎯" },
        { type: "quiz", question: "Qu'est-ce qu'un 'fakeout' ou 'fausse cassure' ?", options: ["Le prix casse brièvement un niveau clé puis revient à l'intérieur", "Le marché ouvre avec un gap important", "Une zone de prix sans volume", "Un chandelier vert très long"], correctIndex: 0, mindyHint: "Le fakeout piège les traders qui ont placé des ordres stop au-dessus/dessous du niveau. Outil des market makers." },
        { type: "quiz", question: "Quelle technique utilise-t-on pour identifier les zones de support/résistance clés ?", options: ["Dessiner des lignes sur les pics et creux majeurs", "Regarder uniquement les indicateurs RSI et MACD", "Suivre les cours du pétrole", "Analyser les bilans d'entreprise"], correctIndex: 0, mindyHint: "On relie les pics (résistances) et les creux (supports) sur plusieurs timeframes. Multi-timeframe analysis." },
        { type: "info", title: "Comment Tracer tes Zones", content: "Méthode professionnelle :\n\n1. Commence par le timeframe hebdomadaire (vue macro)\n2. Descends au daily pour les zones importantes\n3. Affine en 4h pour les entrées\n\nPriorité aux zones avec :\n✅ Plusieurs touches historiques\n✅ Forte réaction de prix\n✅ Volume élevé sur le niveau\n\nOutils : TradingView (gratuit). Prends l'habitude de tracer tes zones avant d'analyser les indicateurs.", mindyMessage: "Avant tout indicateur : trace tes zones. C'est la structure du marché. Tout le reste est secondaire. 📏" },
        { type: "price_prediction", question: "Triple bottom sur support ~48k. Deux rebonds déjà confirmés. Lis le dernier chandelier et prédit la suite.", candles: [{ open: 52000, high: 53200, low: 51400, close: 50200 }, { open: 50200, high: 50800, low: 47800, close: 48400 }, { open: 48400, high: 50100, low: 47600, close: 49800 }, { open: 49800, high: 51000, low: 49200, close: 50600 }, { open: 50600, high: 51200, low: 47900, close: 48500 }, { open: 48500, high: 50200, low: 47700, close: 49900 }, { open: 49900, high: 51400, low: 49500, close: 51000 }, { open: 51000, high: 52800, low: 50400, close: 52500 }], correctAnswer: "up", explanation: "Triple bottom validé : le support ~48k a tenu 3 fois. Le dernier chandelier vert avec une longue mèche basse confirme la prise de contrôle des acheteurs. Cassure haussière en cours.", mindyMessage: "Un support qui tient 3 fois, c'est du béton. Les pros achètent ici. 🧱" },
        { type: "news_impact", headline: "Binance annonce le delisting de 15 altcoins à faible liquidité", source: "CoinDesk", date: "2024-03-15", correctImpact: "bearish", explanation: "Le delisting d'une plateforme majeure comme Binance réduit drastiquement la liquidité et l'accès aux tokens concernés. Les prix de ces altcoins chutent, et ça crée un sentiment négatif général sur les small caps.", mindyMessage: "Quand Binance delist, c'est game over pour ces tokens. La liquidité disparaît. 💀" }
      ]
    }
  },
  {
    title: "RSI : Mesurer la Force du Marché",
    domain: "TRADING",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 3,
    content: {
      steps: [
        { type: "info", title: "L'Indice de Force Relative", content: "Le RSI (Relative Strength Index) est un oscillateur créé par J. Welles Wilder en 1978. Il mesure la vitesse et la magnitude des mouvements de prix.\n\nFormule simplifiée : RSI = 100 - (100 / (1 + RS))\nRS = Moyenne des gains / Moyenne des pertes sur N périodes (défaut : 14)\n\nValeurs :\n• 0 → 30 : Zone de survente (oversold) = signal haussier potentiel\n• 70 → 100 : Zone de surachat (overbought) = signal baissier potentiel\n• 50 : Ligne médiane (neutre)", mindyMessage: "RSI entre 0 et 100. En dessous de 30 = tout le monde vend. Au dessus de 70 = tout le monde achète. Ni un ni l'autre = tendance saine. 📉📈" },
        { type: "quiz", question: "Un RSI à 25 indique que l'actif est probablement :", options: ["En forte tendance haussière", "En zone de surachat", "En zone de survente (opportunité d'achat potentielle)", "À son point d'équilibre"], correctIndex: 2, mindyHint: "RSI < 30 = oversold = les vendeurs ont peut-être exagéré. Possible rebond — mais pas de certitude !" },
        { type: "calculator", question: "Sur 14 périodes, la moyenne des gains est de 8 et la moyenne des pertes est de 4. Quel est le RSI ? (formule: 100 - (100 / (1 + RS)) où RS = gains/pertes)", variables: ["Moyenne gains = 8", "Moyenne pertes = 4", "RS = 8 / 4 = 2", "RSI = 100 - (100 / (1 + 2))"], answer: 66.67, tolerance: 0.5, mindyMessage: "Un RSI à ~67 : pas encore en surachat, mais la tendance est haussière. Surveille le niveau 70." },
        { type: "quiz", question: "Qu'est-ce qu'une 'divergence baissière' sur le RSI ?", options: ["Le prix fait des plus hauts croissants mais le RSI fait des plus hauts décroissants", "Le RSI et le prix montent ensemble", "Le prix baisse mais le RSI monte", "Le RSI reste constant pendant que le prix monte"], correctIndex: 0, mindyHint: "Divergence = prix et RSI ne s'accordent pas. Prix nouveau high mais RSI plus bas = momentum s'affaiblit = signal baissier." },
        { type: "swipe", statement: "La divergence RSI est un signal plus fiable que le simple croisement de la zone 70/30.", isCorrect: true, explanation: "Oui — la divergence indique un affaiblissement du momentum avant le retournement. Beaucoup plus précis que les zones statiques 70/30." },
        { type: "info", title: "Utiliser le RSI Correctement", content: "❌ Ne pas utiliser seul : le RSI donne de faux signaux en tendance forte\n✅ Combiner avec :\n• Supports/résistances\n• Volume (confirmation)\n• Timeframe supérieur (contexte macro)\n\n📊 Setup classique :\n1. Identifier la tendance sur le timeframe supérieur\n2. Attendre RSI en survente sur timeframe inférieur\n3. Chercher rebond sur support\n4. Entrer avec stop-loss sous le support\n\nPériode recommandée : 14 (standard), 7 pour scalping, 21 pour swing.", mindyMessage: "RSI seul = danger. RSI + support + volume = setup de qualité. Le confluent, c'est la clé. 🎯" },
        { type: "calculator", question: "Sur 14 périodes, tu as 5 jours de hausse moyenne de +3% et 9 jours de baisse moyenne de -1.5%. Quel est le RS puis le RSI ? (RS = moy gains/moy pertes, RSI = 100 - 100/(1+RS))", variables: ["Moyenne gains = 3", "Moyenne pertes = 1.5", "RS = 3 / 1.5 = 2", "RSI = 100 - (100 / (1 + 2)) = 100 - 33.33"], answer: 66.67, tolerance: 0.5, mindyMessage: "RSI 66.67 : en territoire haussier mais pas encore suracheté. Zone neutre-haute. 📊" },
        { type: "price_prediction", question: "Le prix fait de nouveaux highs mais le RSI est en divergence baissière (highs décroissants). Analyse et prédit.", candles: [{ open: 40000, high: 42000, low: 39500, close: 41500 }, { open: 41500, high: 43500, low: 41200, close: 43000 }, { open: 43000, high: 44800, low: 42800, close: 44500 }, { open: 44500, high: 45200, low: 43500, close: 43800 }, { open: 43800, high: 45500, low: 43600, close: 45200 }, { open: 45200, high: 46000, low: 44200, close: 44500 }, { open: 44500, high: 46200, low: 44300, close: 45800 }, { open: 45800, high: 46500, low: 44800, close: 45000 }], correctAnswer: "down", explanation: "Divergence baissière classique : le prix atteint des sommets de plus en plus hauts mais chaque hausse est moins convaincante (longues mèches hautes, clôtures loin des plus hauts). Le momentum s'essouffle — signal de retournement baissier imminent.", mindyMessage: "Quand le prix monte mais la force s'essouffle = divergence. Le marché te prévient. Écoute-le. ⚠️" }
      ]
    }
  },
  {
    title: "MACD : La Tendance et son Momentum",
    domain: "TRADING",
    difficulty: "INTERMEDIATE",
    xpReward: 110,
    orderIndex: 4,
    content: {
      steps: [
        { type: "info", title: "Moving Average Convergence Divergence", content: "Le MACD (Gerald Appel, 1979) est l'indicateur de momentum le plus utilisé en trading. Il mesure la relation entre deux moyennes mobiles exponentielles.\n\nComposants :\n• Ligne MACD = EMA12 - EMA26 (différence des MME)\n• Ligne Signal = EMA9 de la ligne MACD\n• Histogramme = MACD - Signal (représente le momentum)\n\nParamètres standards : (12, 26, 9)\n\nLe MACD oscille autour de 0 sans bornes fixes (contrairement au RSI).", mindyMessage: "MACD = deux moyennes mobiles qui se 'parlent'. Quand elles se croisent, c'est un signal. Simple mais puissant. 📊" },
        { type: "quiz", question: "Quel est le signal d'achat classique sur le MACD ?", options: ["Quand l'histogramme est négatif", "Quand la ligne MACD croise la ligne Signal à la hausse", "Quand le MACD est au-dessus de zéro", "Quand les deux lignes divergent fortement"], correctIndex: 1, mindyHint: "Croisement haussier : MACD croise Signal vers le haut = momentum haussier s'active. Confirmation." },
        { type: "fill_blank", sentence: "Le MACD est calculé avec les paramètres ___ par défaut.", answer: "(12, 26, 9)", choices: ["(5, 10, 3)", "(12, 26, 9)", "(20, 50, 14)", "(7, 14, 7)"], mindyMessage: "12, 26, 9 — grave ça quelque part. Paramètres universels sur tous les marchés." },
        { type: "swipe", statement: "Un MACD positif (au-dessus de zéro) garantit que le prix va continuer à monter.", isCorrect: false, explanation: "Non — le MACD au-dessus de zéro indique simplement que l'EMA12 est au-dessus de l'EMA26 (tendance haussière dominante). Pas une garantie de continuation." },
        { type: "quiz", question: "Qu'est-ce qu'une 'divergence haussière' MACD ?", options: ["Le MACD fait de nouveaux plus bas alors que le prix aussi", "Le prix fait de nouveaux plus bas mais le MACD fait des plus bas moins profonds", "Le MACD et le prix montent ensemble", "L'histogramme devient positif"], correctIndex: 1, mindyHint: "Prix fait nouveau low, mais MACD se redresse = les vendeurs s'épuisent = retournement haussier possible." },
        { type: "info", title: "MACD en Pratique", content: "Le MACD excelle pour :\n✅ Identifier la direction de la tendance (au-dessus/en-dessous de 0)\n✅ Signaux de croisement (entrée/sortie)\n✅ Divergences (signaux avancés)\n\nLimites :\n❌ Indicateur retardé (lagging) — ne prédit pas, confirme\n❌ Nombreux faux signaux en marché latéral (range)\n\nSetup recommandé :\n• Tendance sur H4/Daily via MACD (au-dessus de 0 = tendance haussière)\n• Entrée sur croisement MACD + Signal combiné avec support sur timeframe inférieur\n• Volume pour confirmation", mindyMessage: "MACD pour la direction et le timing. RSI pour l'état d'épuisement. Ensemble ils sont redoutables. 💪" }
      ]
    }
  },
  {
    title: "Chart Patterns : Lire les Formations",
    domain: "TRADING",
    difficulty: "INTERMEDIATE",
    xpReward: 115,
    orderIndex: 5,
    content: {
      steps: [
        { type: "info", title: "Les Configurations Graphiques", content: "Les chart patterns sont des formations visuelles récurrentes sur les graphiques. Elles reflètent la psychologie collective des acheteurs et vendeurs.\n\nDeux familles :\n📊 Patterns de continuation : la tendance reprend après une pause\n→ Flag, Pennant, Wedge, Triangle ascendant/descendant\n\n🔄 Patterns de retournement : changement de tendance\n→ Head & Shoulders (H&S), Double Top, Double Bottom, Rounding Bottom\n\nJohn Magee & Robert Edwards ('Technical Analysis of Stock Trends', 1948) ont été les premiers à les codifier.", mindyMessage: "Les mêmes patterns se répètent depuis 1 siècle. Parce que la psychologie humaine ne change pas. Fear & Greed forever. 🧠" },
        { type: "quiz", question: "Quelle est la cible de prix théorique après la cassure d'un 'Double Bottom' ?", options: ["Identique au plus bas du pattern", "Égale à la hauteur entre le creux et la résistance (le 'neck line'), ajoutée au breakout", "Le prix double automatiquement", "Impossible à calculer"], correctIndex: 1, mindyHint: "Règle d'extension : mesure la hauteur du pattern (double creux → neckline) et projette-la depuis le breakout. C'est la target minimale." },
        { type: "swipe", statement: "Un 'Head & Shoulders' est un pattern de retournement baissier après une tendance haussière.", isCorrect: true, explanation: "Oui — l'épaule gauche, la tête (plus haut), l'épaule droite (plus basse que la tête) forment un H&S. Cassure de la neckline = signal de vente." },
        { type: "swipe", statement: "Un flag haussier (bull flag) indique généralement une continuation de la tendance baissière.", isCorrect: false, explanation: "Non — le bull flag est un pattern de CONTINUATION haussière. Après une forte hausse (mât), une consolidation en canal légèrement baissier (drapeau) se forme. Cassure à la hausse = reprise de la tendance." },
        { type: "quiz", question: "Quel volume confirme la cassure d'un triangle symétrique ?", options: ["Volume décroissant pendant la cassure", "Volume faible mais stable", "Volume croissant lors de la cassure (breakout)", "Le volume n'a pas d'importance pour les patterns"], correctIndex: 2, mindyHint: "Volume + breakout = confirmation. Breakout sans volume = fakeout probable. Toujours vérifier le volume." },
        { type: "info", title: "Appliquer les Chart Patterns", content: "Règles d'or :\n1. Ne trade que les patterns sur des timeframes significatifs (H1+)\n2. Attends la confirmation (cassure + clôture au-dessus/en-dessous)\n3. Vérifie le volume au breakout\n4. Place ton stop-loss logiquement (sous l'épaule droite pour H&S, sous le drapeau pour flag)\n5. Target = hauteur du pattern projetée\n\nPatterns les plus fiables :\n🏆 Cup & Handle (continuation haussière, long terme)\n🏆 Head & Shoulders (retournement baissier)\n🏆 Bull Flag (continuation, court terme)", mindyMessage: "Les patterns ne sont pas de la magie — ce sont des niveaux de probabilité. Avec les bons filtres, l'edge est réel. 📐" },
        { type: "price_prediction", question: "Un Head & Shoulders se forme : épaule gauche, tête, épaule droite. Le prix teste la neckline. Prédit la suite.", candles: [{ open: 42000, high: 44000, low: 41800, close: 43500 }, { open: 43500, high: 46000, low: 43200, close: 45500 }, { open: 45500, high: 48500, low: 45200, close: 48000 }, { open: 48000, high: 48200, low: 44500, close: 45000 }, { open: 45000, high: 47000, low: 44800, close: 46500 }, { open: 46500, high: 46800, low: 43800, close: 44000 }, { open: 44000, high: 44500, low: 42500, close: 42800 }, { open: 42800, high: 43200, low: 41500, close: 41800 }], correctAnswer: "down", explanation: "Head & Shoulders classique : épaule gauche (~44k), tête (~48k), épaule droite (~47k), puis cassure de la neckline (~44k). Le dernier chandelier casse sous le support — signal de continuation baissière. Target = hauteur de la tête projetée vers le bas.", mindyMessage: "Le Head & Shoulders est LE pattern de retournement le plus fiable. Quand la neckline casse, les pros shortent. 📉" },
        { type: "flashcard", front: "Bull Flag vs Bear Flag", back: "Bull Flag :\n• Apparaît après une forte hausse (le mât)\n• Consolidation en canal légèrement baissier\n• Cassure à la hausse = continuation\n\nBear Flag :\n• Apparaît après une forte baisse\n• Consolidation en canal légèrement haussier\n• Cassure à la baisse = continuation\n\nTarget dans les deux cas = hauteur du mât projetée depuis le breakout.", category: "Chart Patterns" }
      ]
    }
  },
  {
    title: "Fibonacci & Zones de Retournement",
    domain: "TRADING",
    difficulty: "ADVANCED",
    xpReward: 125,
    orderIndex: 6,
    content: {
      steps: [
        { type: "info", title: "La Suite de Fibonacci dans les Marchés", content: "Leonardo Fibonacci (1170-1250) a décrit une suite où chaque nombre = somme des deux précédents : 1, 1, 2, 3, 5, 8, 13...\n\nLe ratio d'or (φ ≈ 1.618) émerge naturellement de cette suite. On retrouve ce ratio dans la nature (spirales de coquillages, tournesols, galaxies).\n\nEn trading, les niveaux de retracement Fibonacci clés :\n• 23.6% — retracement peu profond (tendance forte)\n• 38.2% — retrace modéré\n• 50% — demi-retracement psychologique\n• 61.8% — le 'golden ratio' (zone d'achat/vente la plus surveillée)\n• 78.6% — retracement profond", mindyMessage: "Le marché est fractal. Fibonacci décrit la nature, et les marchés reflètent la nature. Coïncidence ? Je ne crois pas. 🌀" },
        { type: "quiz", question: "Comment trace-t-on un retracement de Fibonacci ?", options: ["Du plus haut au plus bas d'une tendance haussière (dans ce sens)", "Du plus bas au plus haut d'une tendance haussière (dans ce sens)", "Toujours de gauche à droite sans référence de tendance", "Sur la ligne médiane uniquement"], correctIndex: 1, mindyHint: "En tendance haussière : du swing low (creux) au swing high (pic). Les niveaux de retracement s'affichent entre les deux." },
        { type: "swipe", statement: "Le niveau 61.8% de Fibonacci est surnommé le 'golden ratio' et est le plus surveillé par les traders professionnels.", isCorrect: true, explanation: "Oui — 61.8% ≈ 1/φ. C'est le niveau où les grandes institutions placent souvent leurs ordres d'achat en pullback. Zone à forte liquidité." },
        { type: "swipe", statement: "Si le prix passe sous le niveau 100% de Fibonacci, le mouvement est invalide et il faut annuler sa position.", isCorrect: true, explanation: "En effet — une cassure sous le swing low d'origine invalide le setup. C'est souvent là que les traders professionnels placent leur stop-loss." },
        { type: "quiz", question: "Qu'est-ce qu'une 'zone Fibonacci de confluence' ?", options: ["Quand plusieurs niveaux Fibonacci de différentes dimensions se superposent avec un support/résistance", "Quand le prix atteint exactement le niveau 50%", "Quand Fibonacci et RSI donnent le même signal", "Une combinaison de 3 chandeliers autour d'un niveau Fibonacci"], correctIndex: 0, mindyHint: "Confluence = plusieurs signaux au même niveau. Fibonacci 61.8% + ancien support + RSI oversold = zone de forte probabilité." },
        { type: "info", title: "Fibonacci Extensions : Trouver les Targets", content: "Les retracements Fibonacci identifient les zones d'entrée. Les extensions identifient les zones de profit (targets).\n\nExtensions clés :\n• 127.2% — première target\n• 161.8% — target principale (golden extension)\n• 261.8% — target ambitieuse\n\nMéthode 'Fib to Fib Trading' :\n1. Identifier la tendance principale\n2. Tracer le retracement (entrée à 61.8%)\n3. Projeter l'extension (target à 161.8%)\n4. Stop sous le swing low\n\nRatio risque/récompense typique : 1:3 à 1:5", mindyMessage: "Fibonacci n'est pas de l'ésotérisme — c'est de l'auto-réalisation. Assez de traders l'utilisent pour que les niveaux deviennent vrais. 📐" }
      ]
    }
  },
  {
    title: "Risk Management & Position Sizing",
    domain: "TRADING",
    difficulty: "ADVANCED",
    xpReward: 135,
    orderIndex: 7,
    content: { steps: [
      { type: "info", title: "Le Vrai Edge des Professionnels", content: "La différence entre les traders qui survivent et ceux qui explosent n'est pas la capacité à prédire le marché. C'est le risk management.\n\nRègle d'or : ne jamais risquer plus de 1-2% de son capital sur un seul trade.\n10 000€ → Max risk par trade : 100-200€", mindyMessage: "Règle 1 de Buffett : 'Never lose money.' Règle 2 : 'Never forget rule 1.' 📌" },
      { type: "quiz", question: "Sur un compte de 5000€ avec 1% de risque par trade, montant maximum à risquer :", options: ["500€", "50€", "250€", "1000€"], correctIndex: 1, mindyHint: "1% × 5000€ = 50€. Pas de compromis sur ce calcul." },
      { type: "swipe", statement: "Le position sizing consiste à calculer la taille de position selon le risque acceptable et la distance au stop-loss.", isCorrect: true, explanation: "Formule : Taille = Risque max / Distance stop-loss. Ex: 100€ risk, stop 5% → position 2000€." },
      { type: "swipe", statement: "Un trader avec 30% de trades gagnants peut être profitable sur le long terme.", isCorrect: true, explanation: "Oui, si le Risk/Reward ratio est suffisant. 30% winrate avec RR 1:3 = très profitable. Les mathématiques ne mentent pas." },
      { type: "quiz", question: "Ratio Risk/Reward de 1:3 signifie :", options: ["3x plus de pertes que de gains", "Pour chaque 1€ risqué, on vise 3€ de gain", "Stop à 3x la taille du take profit", "Taille de position divisée par 3"], correctIndex: 1, mindyHint: "1:3 = risque 1 pour gagner 3. Un trade perdant compensé par 2 gagnants." },
      { type: "reorder", title: "Processus d'un trade professionnel", instruction: "Dans l'ordre.", words: ["Gérer activement (trailing stop)", "Identifier le setup technique", "Calculer la taille de position", "Définir stop-loss et take-profit", "Entrer en position"], correctOrder: [1, 3, 2, 4, 0], mindyMessage: "Les amateurs calculent la taille après être entrés. Les pros avant. Grosse différence. ⚙️" },
      { type: "calculator", question: "Capital: 10 000€, risque max: 2%, stop-loss à 5% du prix d'entrée. Quelle taille de position ? (Formule: risque max € / distance stop %)", variables: ["Capital: 10 000€", "Risque max: 2% = 200€", "Distance stop-loss: 5%", "Taille position = 200 / 0.05"], answer: 4000, tolerance: 0, unit: "€", mindyMessage: "4 000€ de position pour risquer maximum 200€. C'est ça le position sizing professionnel. ⚙️" },
      { type: "scenario", situation: "Tu es en position long sur ETH. Le trade va contre toi : -3% depuis ton entrée. Ton stop-loss est à -5%. Tu commences à douter de ton analyse. Que fais-tu ?", choices: [{ text: "Je déplace mon stop-loss plus bas pour 'donner de l'air' au trade", isGood: false, explanation: "Déplacer son stop = augmenter son risque après coup. C'est la recette pour des pertes catastrophiques." }, { text: "Je respecte mon stop-loss et j'attends — le plan reste valide tant que le stop n'est pas touché", isGood: true, explanation: "Le stop-loss a été calculé AVANT l'entrée pour une bonne raison. Le respecter = discipline. Si tu doutes de tous tes trades, revois ta stratégie, pas tes stops." }, { text: "Je ferme immédiatement pour limiter la perte à -3%", isGood: false, explanation: "Couper avant le stop par peur = laisser le gain potentiel sur la table. Si ton analyse était bonne, le trade peut encore revenir." }], mindyMessage: "Ton stop-loss est ton meilleur ami. Ne le trahis jamais — sinon il ne te protègera plus. 🛡️" }
    ]}
  },
  {
    title: "Psychologie du Trading",
    domain: "TRADING",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 8,
    content: { steps: [
      { type: "info", title: "Pourquoi 80% des Traders Perdent", content: "70-80% des traders retail perdent de l'argent. Pas par manque de stratégie. Par manque de discipline émotionnelle.\n\nLes 4 ennemis :\n• FOMO : entrer trop tard sur un move\n• Revenge trading : doubler après une perte\n• Overconfidence : over-trader après une série gagnante\n• Paralysie : ne pas entrer par peur après plusieurs pertes", mindyMessage: "Tu peux avoir la meilleure stratégie du monde. Les émotions la sabotent en 3 trades. 🧠" },
      { type: "swipe", statement: "Fermer un trade gagnant trop tôt par peur de 'perdre les gains' est un biais courant.", isCorrect: true, explanation: "Loss aversion appliquée au trading. On prend les gains trop vite, on laisse courir les pertes en espérant un retournement. L'exact opposé de la bonne stratégie." },
      { type: "quiz", question: "Tu viens de perdre 3 trades de suite. Quelle est la meilleure action ?", options: ["Augmenter les tailles pour récupérer", "Pause + analyser les trades", "Switcher sur un autre actif", "Baisser son stop-loss"], correctIndex: 1, mindyHint: "Pause + analyse. Jamais de décision émotionnelle après une série de pertes." },
      { type: "swipe_sequence", title: "Décision rationnelle ou erreur émotionnelle ?", instruction: "Catégorise chaque comportement.", leftLabel: "❌ Émotionnel", rightLabel: "✅ Rationnel", cards: [
        { id: "journal", content: "Logger chaque trade avec sa raison d'entrée/sortie", correctDirection: "right", explanation: "Trade journal = discipline et amélioration continue" },
        { id: "revenge", content: "Multiplier la taille après une perte pour récupérer", correctDirection: "left", explanation: "Revenge trading = chemin rapide vers 0" },
        { id: "plan", content: "Respecter son plan même quand inconfortable", correctDirection: "right", explanation: "L'edge vient de la consistance, pas des décisions ad-hoc" },
        { id: "fomo", content: "Entrer parce que 'ça monte vite'", correctDirection: "left", explanation: "FOMO = acheter l'euphorie = acheter le top" }
      ], timeLimit: 40, mindyMessage: "Les pros tradent des règles, pas des sentiments. C'est boring. C'est rentable. Pick one. ⚙️" },
      { type: "info", title: "Construire la Discipline", content: "Avant chaque session :\n☑️ Vérifier les news macro importantes\n☑️ Identifier les niveaux clés\n☑️ Définir les setups valides du jour\n\nRègles non-négociables :\n- Stop-loss posé AVANT d'entrer\n- Maximum X trades/jour\n- Pause 24h après 3 pertes consécutives\n\n→ La discipline est un muscle. Ça s'entraîne.", mindyMessage: "Les traders les plus profitables ont des journées ennuyeuses. C'est exactement l'objectif. 🎯" },
      { type: "scenario", situation: "Bitcoin monte de 15% en 2 heures. Twitter explose de posts '🚀🚀🚀'. Tu n'as pas de position. Ton plan de trading ne prévoyait pas ce mouvement. Que fais-tu ?", choices: [{ text: "J'achète immédiatement — je ne veux pas rater le move", isGood: false, explanation: "FOMO classique. Acheter après +15% sans plan = acheter l'euphorie. Les whales vendent quand tu achètes dans ces moments." }, { text: "Je respecte mon plan : pas de setup = pas de trade. Je note le mouvement et j'attends un pullback", isGood: true, explanation: "Discipline exemplaire. Un mouvement de +15% est souvent suivi d'un retracement. Attendre un pullback sur un niveau clé = meilleur entry." }, { text: "J'ouvre un short pour profiter du retournement", isGood: false, explanation: "Shorter un mouvement parabolique sans confirmation = aussi risqué que le FOMO à l'achat. Le marché peut continuer à monter." }], mindyMessage: "Le FOMO a ruiné plus de comptes que n'importe quel bear market. Si tu n'as pas de plan, tu es le plan de quelqu'un d'autre. 🎭" },
      { type: "speed_round", title: "Speed Round : Biais Cognitifs", pairs: [{ statement: "Le biais de confirmation nous pousse à chercher des infos qui confirment notre position.", isTrue: true }, { statement: "Le revenge trading est une stratégie efficace pour récupérer ses pertes.", isTrue: false }, { statement: "L'aversion à la perte fait qu'on ressent 2x plus une perte qu'un gain équivalent.", isTrue: true }, { statement: "L'overconfidence après une série de gains est un biais dangereux.", isTrue: true }, { statement: "Le biais d'ancrage n'affecte pas les traders expérimentés.", isTrue: false }, { statement: "Un trade journal aide à identifier ses biais émotionnels.", isTrue: true }, { statement: "Suivre les influenceurs crypto est une stratégie de trading fiable.", isTrue: false }, { statement: "La paralysie d'analyse (analysis paralysis) empêche de prendre des décisions.", isTrue: true }], timeLimitSeconds: 40 }
    ]}
  },
  {
    title: "Swing Trading : Stratégies",
    domain: "TRADING",
    difficulty: "INTERMEDIATE",
    xpReward: 105,
    orderIndex: 9,
    content: { steps: [
      { type: "info", title: "Le Trading entre Day Trading et Buy & Hold", content: "Le swing trading = capturer des mouvements sur 2 jours à quelques semaines.\n\nAvantages :\n✅ Pas besoin de surveiller les marchés H24\n✅ Décisions moins stressantes\n✅ Timeframes plus fiables (daily/4h)\n✅ Accessible avec un travail à côté\n\nOutils : EMA 20/50, RSI, supports/résistances, volume.", mindyMessage: "Le swing trading est le style des traders qui ont aussi une vie. 🌊" },
      { type: "quiz", question: "Sur quelle timeframe les swingtraders prennent leurs décisions principales ?", options: ["1 minute", "5 minutes", "Daily / 4 heures", "Tick par tick"], correctIndex: 2, mindyHint: "Daily et 4h pour les signaux. 1m-15m uniquement pour l'entrée précise." },
      { type: "swipe", statement: "En swing trading, il est normal de laisser des trades ouverts du vendredi au lundi.", isCorrect: true, explanation: "Oui — et c'est le 'gap risk'. Les marchés peuvent ouvrir loin du cours de vendredi. Adapter la taille en conséquence." },
      { type: "swipe", statement: "Le principe 'buy the dip' est toujours gagnant en swing trading.", isCorrect: false, explanation: "Faux — 'buy the dip' dans un downtrend fort = attraper un couteau qui tombe. Dip = opportunité seulement dans un uptrend confirmé." },
      { type: "quiz", question: "Le setup 'pullback on EMA20 in uptrend' = :", options: ["Vendre quand le prix touche la EMA20", "Acheter quand le prix revient sur la EMA20 en uptrend", "Attendre le croisement EMA20/EMA50", "Fermer les positions si la EMA20 est touchée"], correctIndex: 1, mindyHint: "Pullback sur EMA20 en uptrend = zone d'achat pour rejoindre la tendance principale." },
      { type: "info", title: "Setup : Break & Retest", content: "Le setup swing le plus fiable :\n1. Prix consolide sous une résistance\n2. Breakout avec volume\n3. Retour tester l'ancien niveau (devenu support)\n4. Entrée sur le retest, stop sous le niveau\n\nPourquoi ça marche :\n- Niveau validé deux fois\n- Institutions défendent l'ancien niveau\n- Volume confirme la validité\n\n→ Applicable sur tous les marchés.", mindyMessage: "Break & Retest. Retiens ce pattern. Tu vas le voir partout maintenant. 🎯" }
    ]}
  }
];

// ─── CRYPTO ADVANCED LESSONS ──────────────────────────────────────────────────
const cryptoAdvancedLessons = [
  {
    title: "Tokenomics : L'Économie d'un Token",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 34,
    content: {
      steps: [
        { type: "info", title: "Tokenomics : L'Économie Codée", content: "Tokenomics = Token + Economics. C'est l'ensemble des règles économiques qui régissent un token : son offre, sa distribution, son utilité, ses mécanismes d'émission et de destruction.\n\nPourquoi c'est crucial ? Un projet avec une technologie brillante peut échouer à cause de mauvaises tokenomics (inflation excessive, concentration des tokens, pas d'utilité réelle).\n\nCritères à analyser :\n• Supply totale et circulante\n• Distribution initiale (équipe, VCs, public)\n• Vesting schedule (quand les tokens sont débloqués)\n• Utilité du token (à quoi ça sert ?)\n• Mécanismes déflationnaires (burn)", mindyMessage: "Un token sans vraie utilité, c'est un billet de tombola pour un restaurant qui n'a pas encore ouvert. 🎟️" },
        { type: "quiz", question: "Ethereum brûle des frais de transaction depuis EIP-1559. Quel impact sur ETH ?", options: ["Augmente l'offre circulante", "Crée un mécanisme déflationniste potentiel (moins d'ETH en circulation)", "N'a aucun effet sur le prix", "Réduit la sécurité du réseau"], correctIndex: 1, mindyHint: "Burn = destruction de tokens = moins d'offre. Si plus d'ETH brûlé que créé = ETH devient déflationniste." },
        { type: "swipe", statement: "Un token avec 90% de la supply alloué à l'équipe et aux VCs est un signal d'alarme (red flag).", isCorrect: true, explanation: "Oui — concentration massive = risque de dump. Quand le vesting se termine, l'équipe peut vendre massivement, crashant le prix. Token Unlock ≈ vente imminente." },
        { type: "swipe", statement: "Une offre de tokens 'infinie' (comme ETH) est toujours un signe négatif pour l'investisseur.", isCorrect: false, explanation: "Faux — l'inflationnisme peut être compensé par des mécanismes de burn (ETH post-EIP1559 est parfois déflationniste). C'est la balance émission/destruction qui compte." },
        { type: "quiz", question: "Qu'est-ce que le 'fully diluted valuation' (FDV) d'un token ?", options: ["La capitalisation boursière actuelle (supply circulante × prix)", "La capitalisation boursière si TOUS les tokens étaient en circulation", "Le prix du token divisé par le nombre d'utilisateurs", "La valeur des smart contracts déployés"], correctIndex: 1, mindyHint: "FDV = prix × supply totale. Si FDV >> Market Cap actuelle, beaucoup de tokens vont arriver sur le marché = pression vendeuse future." },
        { type: "info", title: "Comment Évaluer des Tokenomics", content: "Checklist investisseur :\n\n✅ Utilité claire et nécessaire (le token est-il VRAIMENT utile ?)\n✅ Supply totale raisonnable et connue\n✅ Distribution équitable (team < 20%, pas de gros VCs cachés)\n✅ Vesting long (team lockée 2-4 ans = alignement d'intérêts)\n✅ Mécanisme de burn/deflation\n✅ Token unlock calendar (site : token.unlocks.app)\n\n🚩 Red flags :\n• Supply non plafonnée sans mécanisme déflationniste\n• Équipe anonyme + tokens concentrés\n• Vesting < 1 an\n• Pas d'utilité on-chain réelle", mindyMessage: "Avant d'acheter un token, lis ses tokenomics. Si tu n'as pas 20 minutes, tu n'as pas l'edge. 📖" }
      ]
    }
  },
  {
    title: "Gouvernance & DAO : La Démocratie On-chain",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 35,
    content: {
      steps: [
        { type: "info", title: "Qu'est-ce qu'une DAO ?", content: "DAO = Decentralized Autonomous Organization.\nUne organisation dont les règles sont codées dans des smart contracts et les décisions prises par vote des membres (token holders).\n\nExemples réels :\n• MakerDAO : gère le DAI (stablecoin), vote sur les paramètres de risque\n• Uniswap DAO : gère le protocole Uniswap avec 200M+ de TVL\n• Compound : gouvernance du protocole de lending\n• Gitcoin : finance des projets open-source Web3\n\nUne DAO remplace un conseil d'administration par un smart contract.", mindyMessage: "Une DAO, c'est une entreprise sans PDG, sans RH, sans bureau. Juste du code et des votes. Révolutionnaire... et chaotique. ⚡" },
        { type: "quiz", question: "Comment fonctionne le vote dans la plupart des DAOs ?", options: ["1 personne = 1 voix (comme une démocratie classique)", "1 token = 1 voix (proportionnel à la détention)", "Vote aléatoire parmi les membres", "Le fondateur a le droit de veto final"], correctIndex: 1, mindyHint: "Token-weighted voting : plus tu détiens de tokens de gouvernance, plus tu as de pouvoir de vote. Avantage des gros holders = 'baleine'." },
        { type: "swipe", statement: "Les DAOs éliminent totalement les risques de corruption car tout est transparent on-chain.", isCorrect: false, explanation: "En théorie oui, en pratique non. Les gros holders (whales) peuvent voter dans leur intérêt. Les propositions complexes ne sont pas lues par la plupart des holders. La participation est souvent faible (<5%)." },
        { type: "swipe", statement: "Un 'quorum' dans une DAO est le pourcentage minimum de tokens devant voter pour qu'une décision soit valide.", isCorrect: true, explanation: "Oui — sans quorum minimum, un petit groupe pourrait voter des changements majeurs à très faible participation. Le quorum protège contre ça." },
        { type: "quiz", question: "Qu'est-ce qu'une 'governance attack' (attaque de gouvernance) ?", options: ["Un hack du smart contract de vote", "Acquérir assez de tokens pour contrôler les votes et voter des changements malveillants", "Un DDoS sur les serveurs de vote", "Un vote frauduleux sans tokens"], correctIndex: 1, mindyHint: "Beanstalk (2022) : flash loan pour emprunter assez de tokens, voter un drainage du trésor, rembourser. 180M$ volés en 1 transaction." },
        { type: "info", title: "L'Avenir de la Gouvernance On-chain", content: "Innovations en cours :\n\n🗳️ Delegate Voting : déléguer son pouvoir de vote à un expert (comme une démocratie représentative)\n\n🔒 Vetoken (ve) : verrouiller ses tokens pour plus de pouvoir de vote (veCRV, veBAL)\n\n🧮 Gouvernance quadratique : 1 personne = racine carrée de ses tokens en votes (réduit l'influence des whales)\n\n🤖 Governance minimisation : limiter la surface de gouvernance pour réduire les risques d'attaque\n\nDAOs à surveiller : MakerDAO, Optimism, Uniswap, Arbitrum, ENS.", mindyMessage: "La gouvernance décentralisée, c'est dur. Mais c'est la seule alternative à 'faites confiance à notre équipe'. 🏛️" }
      ]
    }
  },
  {
    title: "Web3 & Identité On-chain",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 90,
    orderIndex: 36,
    content: {
      steps: [
        { type: "info", title: "Web1, Web2, Web3 : L'Évolution", content: "🌐 Web1 (1990-2004) : pages statiques, lecture seule. Tu consommes.\n📱 Web2 (2004-present) : réseaux sociaux, UGC, lecture-écriture. Tu produis mais tu es le produit.\n🔗 Web3 (émergent) : ownership, décentralisation. Tu possèdes.\n\nDifférence fondamentale :\n• Web2 : tes données sur les serveurs de Google/Meta → ils vendent tes données\n• Web3 : tes assets dans ton wallet → clés privées = propriété réelle\n\nPiliers Web3 : blockchain, smart contracts, tokens, wallets, DApps, NFTs (ownership tokens).", mindyMessage: "Web2 : tu es l'utilisateur. Web3 : tu es le propriétaire. C'est une différence philosophique massive. 🔑" },
        { type: "quiz", question: "Qu'est-ce que l'ENS (Ethereum Name Service) ?", options: ["Un service de mailing Ethereum", "Un système de noms de domaine décentralisé (ex: satoshi.eth)", "Un outil de monitoring des gas fees", "Un bridge entre Ethereum et d'autres chains"], correctIndex: 1, mindyHint: "ENS = DNS du Web3. 'satoshi.eth' pointe vers ton adresse 0x... Lisible, mémorisable, décentralisé." },
        { type: "swipe", statement: "Une adresse Ethereum (0x...) est ton identité permanente et publique sur la blockchain.", isCorrect: true, explanation: "Oui — toutes tes transactions sont publiquement associées à cette adresse. C'est la pseudonymité (pas anonymat). Des outils comme Etherscan permettent d'analyser toute l'activité d'un wallet." },
        { type: "swipe", statement: "Les NFTs ne peuvent servir qu'à représenter des images digitales.", isCorrect: false, explanation: "Les NFTs sont des tokens non-fongibles qui peuvent représenter : ownership d'assets physiques, tickets d'événements, domaines ENS, achievements dans des jeux, identité (Soulbound Tokens), droits d'accès..." },
        { type: "quiz", question: "Qu'est-ce qu'un 'Soulbound Token' (SBT) ?", options: ["Un NFT rare lié à un personnage de jeu vidéo", "Un token non-transférable lié à une identité (diplômes, certifications, réputation)", "Un token qui brûle après utilisation", "Un NFT de collection ultra rare"], correctIndex: 1, mindyHint: "Vitalik Buterin a proposé les SBTs pour l'identité décentralisée. Non-transférables = liés à la personne, pas à un wallet." },
        { type: "info", title: "Ton Identité Web3", content: "Construire son identité on-chain :\n\n1. 📛 ENS Domain : acheter ton nom.eth (ens.domains)\n2. 🎯 Lens Protocol : profil social décentralisé (tu possèdes tes followers)\n3. 🏆 Poaps (Proof of Attendance Protocol) : NFTs de présence aux événements\n4. 🔗 Gitcoin Passport : agrège tes preuves d'humanité/réputation\n5. 📊 Wallet Reputation : historique on-chain = track record public\n\nL'identité Web3 est portable, interopérable, et ne dépend d'aucune plateforme centralisée.", mindyMessage: "Dans 10 ans, ton wallet sera ton CV, ton identité, ton compte bancaire. Commence à construire ton identité on-chain maintenant. 🚀" }
      ]
    }
  },
  {
    title: "Ethereum Staking & Liquid Staking",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 100,
    orderIndex: 35,
    content: { steps: [
      { type: "info", title: "Faire Travailler ses ETH", content: "Depuis 'The Merge' (sept 2022), Ethereum = Proof of Stake. Staker ses ETH = sécuriser le réseau et recevoir ~4% APY.\n\nOptions :\n1. Solo staking : 32 ETH minimum (~80k€), nœud propre\n2. Staking poolé : Lido, Rocket Pool, Coinbase — dès 0.01 ETH\n3. Liquid staking : reçois des tokens liquides (stETH, rETH)", mindyMessage: "Staker ETH = être payé pour sécuriser Internet. Littéralement. 🌐" },
      { type: "quiz", question: "Minimum requis pour être validateur solo sur Ethereum :", options: ["1 ETH", "10 ETH", "32 ETH", "100 ETH"], correctIndex: 2, mindyHint: "32 ETH = ~80-100k€. La majorité utilise le staking poolé." },
      { type: "swipe", statement: "Le liquid staking permet de staker ET d'utiliser la valeur de ses ETH dans la DeFi simultanément.", isCorrect: true, explanation: "Stake 10 ETH chez Lido → reçois 10 stETH → utilise stETH comme collatéral sur Aave. Double rendement potentiel." },
      { type: "swipe", statement: "Les rewards de staking ETH sont garantis à 4% fixes.", isCorrect: false, explanation: "Faux — les rewards varient selon le nombre de validateurs. Plus de validateurs = reward individuel plus faible." },
      { type: "swipe_sequence", title: "Avantage ou risque du staking ?", instruction: "Identifie chaque caractéristique.", leftLabel: "Risque/Inconvénient", rightLabel: "Avantage", cards: [
        { id: "passive", content: "Revenus passifs en ETH (~4% APY)", correctDirection: "right", explanation: "Rendement passif pour sécuriser le réseau" },
        { id: "slash", content: "Slashing si validateur malveillant", correctDirection: "left", explanation: "Pénalité sur les ETH stakés si comportement malhonnête" },
        { id: "liquid", content: "stETH utilisable dans la DeFi", correctDirection: "right", explanation: "Liquidité maintenue grâce au liquid staking" },
        { id: "lock", content: "File d'attente pour unstaker (quelques jours)", correctDirection: "left", explanation: "Pas de retrait instantané — délai variable" }
      ], timeLimit: 35, mindyMessage: "4% APY en ETH sur ses ETH. Pas de raison de laisser dormir ses ETH. 📈" },
      { type: "info", title: "Lido vs Rocket Pool", content: "Lido (stETH) :\n✅ Plus gros liquidity pool\n✅ stETH intégré partout dans la DeFi\n❌ Centralisation (>30% du staking Ethereum)\n\nRocket Pool (rETH) :\n✅ Plus décentralisé\n✅ Moins de risque contrepartie\n❌ Moindre liquidité\n\n→ Pour la décentralisation : Rocket Pool. Pour la liquidité DeFi : Lido.", mindyMessage: "Ton choix dit quelque chose sur tes valeurs. Centralisation vs décentralisation. 🤝" }
    ]}
  },
  {
    title: "CBDCs : La Crypto des États",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 90,
    orderIndex: 36,
    content: { steps: [
      { type: "info", title: "La Réponse des Gouvernements à Bitcoin", content: "Une CBDC (Central Bank Digital Currency) = monnaie numérique émise directement par une banque centrale.\n\n• L'État contrôle totalement l'émission\n• Transactions programmables\n• En cours : e-yuan (Chine), e-euro (BCE), e-dollar (Fed)\n• 2024 : +130 pays explorent les CBDCs", mindyMessage: "L'État veut sa propre crypto. Mais contrôlée. Par lui. 🏛️" },
      { type: "quiz", question: "Principale différence entre CBDC et Bitcoin :", options: ["Le CBDC est plus rapide", "Le CBDC est centralisé et contrôlé par l'État", "Le CBDC est plus rare", "Le CBDC est anonyme"], correctIndex: 1, mindyHint: "CBDC = centralisé par nature. Bitcoin = décentralisé par design. Philosophies opposées." },
      { type: "swipe", statement: "Un CBDC pourrait théoriquement permettre à un gouvernement de bloquer certains types d'achats.", isCorrect: true, explanation: "Techniquement possible avec la 'monnaie programmable'. C'est précisément ce que craignent les défenseurs de la vie privée." },
      { type: "swipe", statement: "Le e-yuan chinois est déjà en circulation et utilisé par des millions de personnes.", isCorrect: true, explanation: "Oui — testé dans plusieurs villes depuis 2021, utilisé aux Jeux Olympiques de Pékin 2022. La Chine est en avance." },
      { type: "quiz", question: "Principal risque des CBDCs selon les partisans de la vie privée :", options: ["L'inflation incontrôlable", "La surveillance financière totale par l'État", "L'instabilité technique", "La concurrence aux banques"], correctIndex: 1, mindyHint: "CBDC = toutes tes transactions visibles par l'État. Fin de la vie privée financière." },
      { type: "info", title: "Bitcoin vs CBDC", content: "Bitcoin :\n✅ Personne ne contrôle\n✅ Anonymat possible\n✅ Résistant à la censure\n❌ Volatil\n\nCBDC :\n✅ Stable (parité monnaie nationale)\n✅ Adopté légalement par les États\n❌ 100% surveillé\n❌ Programmable par l'État\n\n→ Les deux peuvent coexister. Le choix est politique autant que financier.", mindyMessage: "CBDC et Bitcoin coexisteront. La question c'est dans quel équilibre. 🗳️" }
    ]}
  },
  {
    title: "Construire sa Stratégie Crypto",
    domain: "CRYPTO",
    difficulty: "INTERMEDIATE",
    xpReward: 95,
    orderIndex: 37,
    content: { steps: [
      { type: "info", title: "Du Chaos à la Stratégie", content: "La plupart des gens en crypto :\n• Achètent ce qui monte\n• Vendent dans la panique\n• Recommencent\n\nUne vraie stratégie inclut :\n• Thèse d'investissement pour chaque actif\n• Allocation définie (% BTC/ETH/alts)\n• Règles de prise de profit\n• Stop-loss mentaux\n• Horizon temporel défini", mindyMessage: "Un plan mauvais est meilleur qu'aucun plan. Sans plan en crypto, tu deviens market maker involontaire. 🎲" },
      { type: "quiz", question: "Une 'thèse d'investissement' c'est :", options: ["Un diplôme en finance", "La raison fondamentale pour laquelle on investit dans un actif", "Une analyse technique avancée", "Un rapport officiel"], correctIndex: 1, mindyHint: "Si tu ne peux pas expliquer pourquoi tu investis en 2 phrases, tu spécules." },
      { type: "swipe", statement: "Diversifier entre 50 altcoins réduit significativement le risque crypto.", isCorrect: false, explanation: "Faux — en crypto la corrélation est très haute. BTC -50% = 90% des alts -70 à -90%. La diversification intra-crypto protège peu." },
      { type: "swipe", statement: "Définir ses règles de sortie AVANT d'acheter améliore les résultats.", isCorrect: true, explanation: "Décider à froid quand vendre. 'Si +100%, je vends 50%.' Ce type de règle bat les décisions émotionnelles en temps réel." },
      { type: "reorder", title: "Construction d'une stratégie crypto", instruction: "Dans l'ordre logique.", words: ["Définir les règles de sortie (TP/SL)", "Choisir les actifs selon la thèse", "Définir son allocation globale (% en crypto)", "Écrire la thèse pour chaque actif", "Exécuter et suivre le plan"], correctOrder: [2, 3, 1, 0, 4], mindyMessage: "Allouer d'abord. Choisir ensuite. Pas l'inverse." },
      { type: "info", title: "Exemple de Stratégie Solide", content: "Profil intermédiaire :\n\n📊 Allocation : 60% BTC, 30% ETH, 10% 2-3 alts max\n\nAchat : DCA mensuel sur BTC+ETH. Alts uniquement après analyse.\n\nSortie : Prendre 25% profits tous les x2. Stop mental -40% = réévaluer.\n\nHorizon : 3-5 ans minimum. Revue trimestrielle.", mindyMessage: "Cette stratégie bat 80% des traders crypto par la seule vertu de la discipline. 📋" }
    ]}
  }
];

async function main() {
  console.log('🌱 Seeding lessons...');

  // Delete existing lessons
  await prisma.lesson.deleteMany();
  console.log('🗑️  Deleted existing lessons');

  const allLessons = [...lessons, ...tradingLessons, ...cryptoAdvancedLessons];

  // Create new lessons with shuffled content
  for (const lesson of allLessons) {
    const processedLesson = processLesson(lesson);
    await prisma.lesson.create({
      data: {
        title: processedLesson.title,
        domain: processedLesson.domain as 'CRYPTO' | 'FINANCE' | 'TRADING',
        difficulty: processedLesson.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        xpReward: processedLesson.xpReward,
        orderIndex: processedLesson.orderIndex,
        content: processedLesson.content as any,
      },
    });
    console.log(`✅ Created: ${lesson.title}`);
  }

  console.log(`\n🎉 Successfully seeded ${allLessons.length} lessons!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
