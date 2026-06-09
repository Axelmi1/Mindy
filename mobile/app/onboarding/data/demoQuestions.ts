export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type Base = { id: string; question: string; explanation: string; difficulty: Difficulty };

/** Option à symbole (image_choice) : `color` colore le glyphe pour qu'il ressorte sur fond sombre. */
type SymbolOption = { id: string; label: string; isCorrect: boolean; color?: string };
type TextOption = { id: string; label: string; isCorrect: boolean };

export type DemoQuestion =
  | (Base & { type: 'image_choice'; options: SymbolOption[] })
  | (Base & { type: 'true_false'; correctAnswer: boolean })
  | (Base & { type: 'choice'; options: TextOption[] });

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

const CRYPTO: DemoQuestion[] = [
  {
    id: 'crypto-b1', type: 'image_choice', difficulty: 'beginner',
    question: 'Lequel est le Bitcoin ?',
    options: [
      { id: 'btc', label: '₿', isCorrect: true, color: '#F7931A' },   // orange Bitcoin
      { id: 'eth', label: 'Ξ', isCorrect: false, color: '#7B8CFF' },  // bleu Ethereum
      { id: 'dollar', label: '$', isCorrect: false, color: '#5FD08A' }, // vert dollar
    ],
    explanation: '₿ est le symbole du Bitcoin.',
  },
  {
    id: 'crypto-b2', type: 'true_false', difficulty: 'beginner',
    question: '« HODL » signifie garder sa crypto sur le long terme',
    correctAnswer: true,
    explanation: 'HODL vient d’une faute de frappe de « HOLD » devenue un classique de la crypto.',
  },
  {
    id: 'crypto-i1', type: 'choice', difficulty: 'intermediate',
    question: 'Que veut dire « acheter le creux » (buy the dip) ?',
    options: [
      { id: 'a', label: 'Acheter quand le prix chute', isCorrect: true },
      { id: 'b', label: 'Tout revendre', isCorrect: false },
      { id: 'c', label: 'Acheter un snack', isCorrect: false },
    ],
    explanation: '« Acheter le creux », c’est acheter quand les prix baissent.',
  },
  {
    id: 'crypto-i2', type: 'true_false', difficulty: 'intermediate',
    question: 'Une blockchain est un registre public et partagé',
    correctAnswer: true,
    explanation: 'Une blockchain enregistre les transactions sur un registre public et distribué.',
  },
  {
    id: 'crypto-a1', type: 'choice', difficulty: 'advanced',
    question: 'À quoi sert une « clé privée » ?',
    options: [
      { id: 'a', label: 'À signer et contrôler tes fonds', isCorrect: true },
      { id: 'b', label: 'À te connecter aux plateformes seulement', isCorrect: false },
      { id: 'c', label: 'À miner de nouvelles pièces', isCorrect: false },
    ],
    explanation: 'Ta clé privée signe les transactions — qui la détient contrôle les fonds.',
  },
];

const FINANCE: DemoQuestion[] = [
  {
    id: 'finance-b1', type: 'image_choice', difficulty: 'beginner',
    question: 'Quel symbole est l’Euro ?',
    options: [
      { id: 'eur', label: '€', isCorrect: true, color: '#5B8DEF' },   // bleu Euro
      { id: 'gbp', label: '£', isCorrect: false, color: '#C9A0FF' },  // violet Livre
      { id: 'yen', label: '¥', isCorrect: false, color: '#FF9F6B' },  // orange Yen
    ],
    explanation: '€ est le symbole de l’Euro, utilisé par plus de 20 pays.',
  },
  {
    id: 'finance-b2', type: 'true_false', difficulty: 'beginner',
    question: 'Un « marché haussier » (bull market) veut dire que les prix baissent',
    correctAnswer: false,
    explanation: 'Un marché haussier, c’est quand les prix montent — un marché baissier, quand ils baissent.',
  },
  {
    id: 'finance-i1', type: 'choice', difficulty: 'intermediate',
    question: 'Que sont les intérêts composés ?',
    options: [
      { id: 'a', label: 'Des intérêts sur tes intérêts', isCorrect: true },
      { id: 'b', label: 'Une taxe bancaire', isCorrect: false },
      { id: 'c', label: 'Un type de prêt', isCorrect: false },
    ],
    explanation: 'Les intérêts composés te rapportent des intérêts sur tes intérêts précédents.',
  },
  {
    id: 'finance-i2', type: 'true_false', difficulty: 'intermediate',
    question: 'Diversifier répartit ton risque sur plusieurs actifs',
    correctAnswer: true,
    explanation: 'La diversification réduit l’impact de la chute d’un seul actif.',
  },
  {
    id: 'finance-a1', type: 'choice', difficulty: 'advanced',
    question: 'Que fait l’inflation à de l’argent qui dort ?',
    options: [
      { id: 'a', label: 'Elle érode son pouvoir d’achat', isCorrect: true },
      { id: 'b', label: 'Elle augmente sa valeur', isCorrect: false },
      { id: 'c', label: 'Rien du tout', isCorrect: false },
    ],
    explanation: 'Avec l’inflation, chaque euro achète moins avec le temps : l’argent qui dort perd de la valeur.',
  },
];

const BOTH: DemoQuestion[] = [
  CRYPTO[0],          // beginner
  FINANCE[2],         // intermediate (intérêts composés)
  {
    id: 'both-a1', type: 'choice', difficulty: 'advanced',
    question: 'Pourquoi diversifier tes investissements ?',
    options: [
      { id: 'a', label: 'Pour réduire le risque', isCorrect: true },
      { id: 'b', label: 'Pour avoir l’air malin', isCorrect: false },
      { id: 'c', label: 'Il n’y a aucune raison', isCorrect: false },
    ],
    explanation: 'Diversifier répartit le risque — si un actif s’effondre, les autres peuvent tenir.',
  },
  CRYPTO[2],          // intermediate (acheter le creux)
  FINANCE[1],         // beginner (marché haussier)
];

export const demoQuestions: Record<Domain, DemoQuestion[]> = { CRYPTO, FINANCE, BOTH };
