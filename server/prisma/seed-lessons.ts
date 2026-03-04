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
          type: "swipe",
          statement: "Bitcoin est contrôlé par le gouvernement américain.",
          isCorrect: false,
          explanation: "Bitcoin est décentralisé, personne ne possède les clés du réseau."
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
          type: "info",
          title: "À retenir",
          content: "Bitcoin est rare, sécurisé et appartient à ses utilisateurs. C'est la base de tout l'écosystème crypto.",
          mindyMessage: "Pas mal pour un débutant. Ne prends pas trop la confiance. 😎"
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
          type: "quiz",
          question: "Qui est le co-fondateur principal d'Ethereum ?",
          options: ["Elon Musk", "Vitalik Buterin", "Satoshi Nakamoto", "Mark Zuckerberg"],
          correctIndex: 1,
          mindyHint: "Il porte souvent des t-shirts bizarres."
        },
        {
          type: "swipe",
          statement: "Les Smart Contracts peuvent s'exécuter automatiquement sans intervention humaine.",
          isCorrect: true,
          explanation: "C'est leur force : une fois déployés, ils fonctionnent selon leur code."
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
          type: "quiz",
          question: "Où devez-vous stocker votre seed phrase ?",
          options: ["Sur une note iPhone", "Dans un email", "Sur un papier caché en lieu sûr", "Sur votre profil Facebook"],
          correctIndex: 2,
          mindyHint: "Si c'est en ligne, c'est déjà trop tard."
        },
        {
          type: "swipe",
          statement: "Le support client d'un wallet peut vous demander votre seed phrase pour résoudre un problème.",
          isCorrect: false,
          explanation: "JAMAIS ! C'est toujours une arnaque. Personne de légitime ne vous demandera votre seed."
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
          type: "quiz",
          question: "Quel pourcentage devrait aller à l'épargne selon la règle 50/30/20 ?",
          options: ["50%", "30%", "20%", "10%"],
          correctIndex: 2,
          mindyHint: "C'est le dernier chiffre de la règle..."
        },
        {
          type: "info",
          title: "L'automatisation",
          content: "Le secret est de se payer en premier : programmez un virement automatique vers votre épargne dès que le salaire arrive.",
          mindyMessage: "Devenir riche en étant fainéant, c'est ça le but. 🏦"
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
          type: "quiz",
          question: "Combien de mois de dépenses devrait-on avoir de côté ?",
          options: ["1 semaine", "1 mois", "3 à 6 mois", "5 ans"],
          correctIndex: 2,
          mindyHint: "Assez pour dormir tranquille sans cauchemarder sur ton banquier."
        },
        {
          type: "swipe",
          statement: "L'épargne de précaution devrait être investie en bourse pour la faire fructifier.",
          isCorrect: false,
          explanation: "Non ! Elle doit rester disponible immédiatement et sans risque de perte."
        },
        {
          type: "info",
          title: "Où le placer ?",
          content: "Cet argent doit rester accessible immédiatement sur un Livret A ou LDDS. Pas sous le matelas !",
          mindyMessage: "Sous le matelas, les mites ne sont pas de bons conseillers financiers. 🦗"
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
          type: "info",
          title: "Conclusion",
          content: "Pour battre l'inflation, il faut investir dans des actifs qui rapportent plus de 2% par an.",
          mindyMessage: "Félicitations, tu viens de comprendre pourquoi l'investissement est obligatoire. 🎓"
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
          type: "quiz",
          question: "Avec 10 000€ à 7% par an, combien aurez-vous après 30 ans ?",
          options: ["31 000€", "52 000€", "76 000€", "21 000€"],
          correctIndex: 2,
          mindyHint: "C'est bien plus que 10 000 + (7% × 30 ans).",
          showCalculator: true
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
          type: "quiz",
          question: "Quel est le principal avantage d'un ETF par rapport à une action seule ?",
          options: ["Pas de frais", "La diversification", "C'est garanti par l'État", "Gains illimités"],
          correctIndex: 1,
          mindyHint: "Ne mets pas tous tes œufs dans le même panier."
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
  }
];

async function main() {
  console.log('🌱 Seeding lessons...');

  // Delete existing lessons
  await prisma.lesson.deleteMany();
  console.log('🗑️  Deleted existing lessons');

  // Create new lessons with shuffled content
  for (const lesson of lessons) {
    const processedLesson = processLesson(lesson);
    await prisma.lesson.create({
      data: {
        title: processedLesson.title,
        domain: processedLesson.domain as 'CRYPTO' | 'FINANCE',
        difficulty: processedLesson.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        xpReward: processedLesson.xpReward,
        orderIndex: processedLesson.orderIndex,
        content: processedLesson.content as any,
      },
    });
    console.log(`✅ Created: ${lesson.title}`);
  }

  console.log(`\n🎉 Successfully seeded ${lessons.length} lessons!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
