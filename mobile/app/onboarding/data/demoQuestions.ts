export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type Base = { id: string; question: string; explanation: string; difficulty: Difficulty };

export type DemoQuestion =
  | (Base & { type: 'image_choice'; options: { id: string; label: string; isCorrect: boolean }[] })
  | (Base & { type: 'true_false'; correctAnswer: boolean })
  | (Base & { type: 'choice'; options: { id: string; label: string; isCorrect: boolean }[] });

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

const CRYPTO: DemoQuestion[] = [
  {
    id: 'crypto-b1', type: 'image_choice', difficulty: 'beginner',
    question: 'Which one is Bitcoin?',
    options: [
      { id: 'btc', label: '₿', isCorrect: true },
      { id: 'eth', label: 'Ξ', isCorrect: false },
      { id: 'dollar', label: '$', isCorrect: false },
    ],
    explanation: '₿ is the symbol for Bitcoin.',
  },
  {
    id: 'crypto-b2', type: 'true_false', difficulty: 'beginner',
    question: '"HODL" means to hold your crypto long-term',
    correctAnswer: true,
    explanation: 'HODL originated from a typo of "HOLD" and became crypto slang.',
  },
  {
    id: 'crypto-i1', type: 'choice', difficulty: 'intermediate',
    question: 'What happens when you "buy the dip"?',
    options: [
      { id: 'a', label: 'Buy when price drops', isCorrect: true },
      { id: 'b', label: 'Sell everything', isCorrect: false },
      { id: 'c', label: 'Buy a snack', isCorrect: false },
    ],
    explanation: '"Buy the dip" means purchasing when prices drop.',
  },
  {
    id: 'crypto-i2', type: 'true_false', difficulty: 'intermediate',
    question: 'A blockchain is a public, shared ledger',
    correctAnswer: true,
    explanation: 'A blockchain records transactions on a distributed, public ledger.',
  },
  {
    id: 'crypto-a1', type: 'choice', difficulty: 'advanced',
    question: 'What is a "private key" used for?',
    options: [
      { id: 'a', label: 'Signing & controlling your funds', isCorrect: true },
      { id: 'b', label: 'Logging into exchanges only', isCorrect: false },
      { id: 'c', label: 'Mining new coins', isCorrect: false },
    ],
    explanation: 'Your private key signs transactions — whoever holds it controls the funds.',
  },
];

const FINANCE: DemoQuestion[] = [
  {
    id: 'finance-b1', type: 'image_choice', difficulty: 'beginner',
    question: 'Which symbol is the Euro?',
    options: [
      { id: 'eur', label: '€', isCorrect: true },
      { id: 'gbp', label: '£', isCorrect: false },
      { id: 'yen', label: '¥', isCorrect: false },
    ],
    explanation: '€ is the symbol of the Euro, used by 20+ countries.',
  },
  {
    id: 'finance-b2', type: 'true_false', difficulty: 'beginner',
    question: 'A "bull market" means prices are going down',
    correctAnswer: false,
    explanation: 'A bull market is when prices are rising — a bear market is falling.',
  },
  {
    id: 'finance-i1', type: 'choice', difficulty: 'intermediate',
    question: 'What is compound interest?',
    options: [
      { id: 'a', label: 'Interest on your interest', isCorrect: true },
      { id: 'b', label: 'A bank tax', isCorrect: false },
      { id: 'c', label: 'A type of loan', isCorrect: false },
    ],
    explanation: 'Compound interest earns you interest on your previous interest.',
  },
  {
    id: 'finance-i2', type: 'true_false', difficulty: 'intermediate',
    question: 'Diversifying spreads your risk across assets',
    correctAnswer: true,
    explanation: 'Diversification reduces the impact of any single asset falling.',
  },
  {
    id: 'finance-a1', type: 'choice', difficulty: 'advanced',
    question: 'What does inflation do to cash sitting idle?',
    options: [
      { id: 'a', label: 'Erodes its purchasing power', isCorrect: true },
      { id: 'b', label: 'Increases its value', isCorrect: false },
      { id: 'c', label: 'Nothing at all', isCorrect: false },
    ],
    explanation: 'Inflation means each euro buys less over time, so idle cash loses value.',
  },
];

const BOTH: DemoQuestion[] = [
  CRYPTO[0],          // beginner
  FINANCE[2],         // intermediate (compound interest)
  {
    id: 'both-a1', type: 'choice', difficulty: 'advanced',
    question: 'Why diversify your investments?',
    options: [
      { id: 'a', label: 'To reduce risk', isCorrect: true },
      { id: 'b', label: 'To look smart', isCorrect: false },
      { id: 'c', label: "There's no reason", isCorrect: false },
    ],
    explanation: 'Diversification spreads risk — if one asset tanks, others might hold up.',
  },
  CRYPTO[2],          // intermediate (buy the dip)
  FINANCE[1],         // beginner (bull market)
];

export const demoQuestions: Record<Domain, DemoQuestion[]> = { CRYPTO, FINANCE, BOTH };
