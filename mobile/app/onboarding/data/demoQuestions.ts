export type DemoQuestion =
  | {
      id: string;
      type: 'image_choice';
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
      explanation: string;
    }
  | {
      id: string;
      type: 'true_false';
      question: string;
      correctAnswer: boolean;
      explanation: string;
    }
  | {
      id: string;
      type: 'choice';
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
      explanation: string;
    };

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

const CRYPTO: DemoQuestion[] = [
  {
    id: 'crypto-1',
    type: 'image_choice',
    question: 'Which one is Bitcoin?',
    options: [
      { id: 'btc', label: '₿', isCorrect: true },
      { id: 'eth', label: 'Ξ', isCorrect: false },
      { id: 'dollar', label: '$', isCorrect: false },
    ],
    explanation: '₿ is the symbol for Bitcoin.',
  },
  {
    id: 'crypto-2',
    type: 'true_false',
    question: '"HODL" means to hold your crypto long-term',
    correctAnswer: true,
    explanation: 'HODL originated from a typo of "HOLD" and became crypto slang.',
  },
  {
    id: 'crypto-3',
    type: 'choice',
    question: 'What happens when you "buy the dip"?',
    options: [
      { id: 'a', label: 'Buy when price drops', isCorrect: true },
      { id: 'b', label: 'Sell everything', isCorrect: false },
      { id: 'c', label: 'Buy a snack', isCorrect: false },
    ],
    explanation: '"Buy the dip" means purchasing when prices drop.',
  },
];

const FINANCE: DemoQuestion[] = [
  {
    id: 'finance-1',
    type: 'image_choice',
    question: 'Which symbol is the Euro?',
    options: [
      { id: 'eur', label: '€', isCorrect: true },
      { id: 'gbp', label: '£', isCorrect: false },
      { id: 'yen', label: '¥', isCorrect: false },
    ],
    explanation: '€ is the symbol of the Euro, used by 20+ countries.',
  },
  {
    id: 'finance-2',
    type: 'true_false',
    question: 'A "bull market" means prices are going down',
    correctAnswer: false,
    explanation: 'A bull market is when prices are rising — a bear market is falling.',
  },
  {
    id: 'finance-3',
    type: 'choice',
    question: 'What is compound interest?',
    options: [
      { id: 'a', label: 'Interest on your interest', isCorrect: true },
      { id: 'b', label: 'A bank tax', isCorrect: false },
      { id: 'c', label: 'A type of loan', isCorrect: false },
    ],
    explanation: 'Compound interest earns you interest on your previous interest — the 8th wonder of the world.',
  },
];

const BOTH: DemoQuestion[] = [
  CRYPTO[0],
  FINANCE[1],
  {
    id: 'both-3',
    type: 'choice',
    question: 'Why diversify your investments?',
    options: [
      { id: 'a', label: 'To reduce risk', isCorrect: true },
      { id: 'b', label: 'To look smart', isCorrect: false },
      { id: 'c', label: "There's no reason", isCorrect: false },
    ],
    explanation: 'Diversification spreads risk — if one asset tanks, others might hold up.',
  },
];

export const demoQuestions: Record<Domain, DemoQuestion[]> = { CRYPTO, FINANCE, BOTH };
