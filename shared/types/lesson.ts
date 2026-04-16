/**
 * MINDY Lesson Content Types
 * Shared between server and mobile for type safety
 */

// ============================================================================
// Step Types
// ============================================================================

export type StepType = 'info' | 'quiz' | 'swipe' | 'swipe_sequence' | 'reorder' | 'visual_pick' | 'match_pairs' | 'fill_blank' | 'calculator' | 'scenario' | 'price_prediction' | 'speed_round' | 'budget_allocator' | 'news_impact' | 'flashcard' | 'word_scramble' | 'drag_sort' | 'spot_the_scam' | 'connect_dots' | 'timeline_builder';

/**
 * Informational step - displays content with optional Mindy message
 */
export interface InfoStep {
  type: 'info';
  title: string;
  content: string;
  mindyMessage?: string;
}

/**
 * Quiz step - multiple choice question
 */
export interface QuizStep {
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
  mindyHint?: string;
  showCalculator?: boolean; // Show calculator for calculation questions
}

/**
 * Swipe step - true/false statement validation
 */
export interface SwipeStep {
  type: 'swipe';
  statement: string;
  isCorrect: boolean;
  explanation: string;
}

/**
 * Swipe Sequence step - rapid fire swipe cards (Trading Swipe)
 * User swipes cards left or right to categorize them quickly
 */
export interface SwipeSequenceStep {
  type: 'swipe_sequence';
  title: string;
  instruction: string;
  leftLabel: string;   // e.g., "SCAM", "BEARISH", "SELL"
  rightLabel: string;  // e.g., "SAFE", "BULLISH", "BUY"
  cards: SwipeCard[];
  timeLimit?: number;  // Optional time limit in seconds
  mindyMessage?: string;
}

export interface SwipeCard {
  id: string;
  content: string;
  correctDirection: 'left' | 'right';
  explanation?: string;
}

/**
 * Reorder step - drag and drop words to form correct sequence
 * User rearranges words/tokens to build a phrase or code line
 */
export interface ReorderStep {
  type: 'reorder';
  title: string;
  instruction: string;
  words: string[];           // Words in shuffled order
  correctOrder: number[];    // Indices representing correct order
  hint?: string;
  mindyMessage?: string;
}

/**
 * Visual Pick step - tap on correct area of an image (Chart Analyzer)
 * User must identify a specific point on a visual
 */
export interface VisualPickStep {
  type: 'visual_pick';
  title: string;
  instruction: string;
  imageUrl: string;
  hotspots: Hotspot[];       // Clickable areas
  correctHotspotId: string;  // ID of the correct hotspot
  explanation: string;
  mindyMessage?: string;
}

export interface Hotspot {
  id: string;
  label: string;
  x: number;      // Percentage from left (0-100)
  y: number;      // Percentage from top (0-100)
  radius?: number; // Tap radius in percentage (default 10)
}

/**
 * Match Pairs step - connect terms to definitions (2-column tap matching)
 */
export interface MatchPairItem {
  term: string;
  definition: string;
}

export interface MatchPairsStep {
  type: 'match_pairs';
  pairs: MatchPairItem[];
  mindyMessage?: string;
}

/**
 * Fill Blank step - complete a sentence by choosing from options
 */
export interface FillBlankStep {
  type: 'fill_blank';
  sentence: string;     // Use ___ as placeholder
  answer: string;       // Correct answer text
  choices: string[];    // 3-4 options including the correct answer
  mindyMessage?: string;
}

/**
 * Calculator step - numeric calculation with guided variables
 */
export interface CalculatorStep {
  type: 'calculator';
  question: string;
  variables: string[];  // Context lines shown to user (e.g. "Achat: 0.5 ETH × 2000$ = 1000$")
  answer: number;
  tolerance?: number;   // Acceptable delta (default 0)
  unit?: string;        // e.g. "$", "%"
  mindyMessage?: string;
}

/**
 * Scenario step - real-life situation with multiple choices and explanations
 */
export interface ScenarioChoice {
  text: string;
  isGood: boolean;
  explanation: string;
}

export interface ScenarioStep {
  type: 'scenario';
  situation: string;
  choices: ScenarioChoice[];
  mindyMessage?: string;
}

/**
 * Price Prediction step - sparkline chart, user predicts up or down
 */
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PricePredictionStep {
  type: 'price_prediction';
  question: string;
  /** OHLC candlestick data — the last candle is hidden, user predicts next direction */
  candles: Candle[];
  correctAnswer: 'up' | 'down';
  explanation: string;
  mindyMessage: string;
}

/**
 * Speed Round step - rapid-fire true/false statements with combo multiplier
 */
export interface SpeedRoundPair {
  statement: string;
  isTrue: boolean;
}

export interface SpeedRoundStep {
  type: 'speed_round';
  title: string;
  pairs: SpeedRoundPair[];
  timeLimitSeconds: number;
}

/**
 * Budget Allocator step - slider-based budget distribution
 */
export interface BudgetCategory {
  label: string;
  icon: string;
  targetPercent: number;
  minPercent: number;
  maxPercent: number;
}

export interface BudgetAllocatorStep {
  type: 'budget_allocator';
  totalBudget: number;
  categories: BudgetCategory[];
  explanation: string;
}

/**
 * News Impact step - headline analysis: bullish/bearish/neutral
 */
export interface NewsImpactStep {
  type: 'news_impact';
  headline: string;
  source: string;
  date: string;
  correctImpact: 'bullish' | 'bearish' | 'neutral';
  explanation: string;
  mindyMessage: string;
}

/**
 * Flashcard step - 3D flip card with term/definition
 */
export interface FlashcardStep {
  type: 'flashcard';
  front: string;
  back: string;
  category: string;
}

/**
 * Word Scramble step - unscramble letters to form a financial term
 */
export interface WordScrambleStep {
  type: 'word_scramble';
  word: string;
  hint: string;
  scrambled: string[];
  mindyMessage: string;
}

/**
 * Drag Sort step - sort cards in the correct logical order
 */
export interface DragSortItem {
  id: string;
  label: string;
  emoji: string;
  value?: string;
  /** Items with the same group can be in any order relative to each other */
  group?: string;
}

export interface DragSortStep {
  type: 'drag_sort';
  question: string;
  items: DragSortItem[];
  correctOrder: number[];
  explanation: string;
  mindyMessage: string;
}

/**
 * Spot the Scam step - identify the fraudulent card among 4
 */
export interface ScamCard {
  id: string;
  type: 'tweet' | 'email' | 'site';
  content: string;
  sender: string;
  isScam: boolean;
  redFlags?: string[];
}

export interface SpotTheScamStep {
  type: 'spot_the_scam';
  question: string;
  cards: ScamCard[];
  explanation: string;
  mindyMessage: string;
}

/**
 * Connect Dots step - match terms to definitions by drawing connections
 */
export interface ConnectDotsPair {
  term: string;
  definition: string;
}

export interface ConnectDotsStep {
  type: 'connect_dots';
  pairs: ConnectDotsPair[];
  mindyMessage: string;
}

/**
 * Timeline Builder step - place historical events in chronological order
 */
export interface TimelineEvent {
  id: string;
  label: string;
  year: string;
  emoji: string;
}

export interface TimelineBuilderStep {
  type: 'timeline_builder';
  title: string;
  events: TimelineEvent[];
  explanation: string;
  mindyMessage: string;
}

/**
 * Union type for all lesson step variants
 */
export type LessonStep =
  | InfoStep
  | QuizStep
  | SwipeStep
  | SwipeSequenceStep
  | ReorderStep
  | VisualPickStep
  | MatchPairsStep
  | FillBlankStep
  | CalculatorStep
  | ScenarioStep
  | PricePredictionStep
  | SpeedRoundStep
  | BudgetAllocatorStep
  | NewsImpactStep
  | FlashcardStep
  | WordScrambleStep
  | DragSortStep
  | SpotTheScamStep
  | ConnectDotsStep
  | TimelineBuilderStep;

/**
 * Complete lesson content structure
 */
export interface LessonContent {
  steps: LessonStep[];
}

// ============================================================================
// Enums
// ============================================================================

export type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// ============================================================================
// Full Lesson Type (as returned from API)
// ============================================================================

export interface Lesson {
  id: string;
  title: string;
  domain: Domain;
  difficulty: Difficulty;
  content: LessonContent;
  xpReward: number;
  orderIndex: number;
  createdAt: string;
  /** True for the domain Master Quiz — unlocked only when all regular lessons are done */
  isMasterQuiz?: boolean;
}
